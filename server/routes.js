import { Router } from 'express'
import { randomUUID } from 'crypto'
import { rowToEvent, parseJsonArray } from './db.js'
import { generateContainerCode } from './utils.js'

const DEFAULT_ORIGINS = [
  { name: '기관 물품', color: '#3b82f6', isSystem: true },
  { name: '개인 물품', color: '#a855f7', isSystem: true },
  { name: '대여 물품', color: '#f59e0b', isSystem: true },
]

const DEFAULT_STAGES = [
  '있는지 확인', '적재', '현장 출발 전 확인', '현장에서 확인', '도착 이후 확인',
]

export function createRouter(db) {
  const router = Router()

  function getEventData(eventId) {
    const event = rowToEvent(db.prepare('SELECT * FROM events WHERE id = ?').get(eventId))
    if (!event) return null

    const tags = db.prepare('SELECT * FROM tags WHERE event_id = ?').all(eventId)
      .map((r) => ({ id: r.id, eventId: r.event_id, name: r.name, color: r.color }))

    const origins = db.prepare('SELECT * FROM origins WHERE event_id = ?').all(eventId)
      .map((r) => ({ id: r.id, eventId: r.event_id, name: r.name, color: r.color, isSystem: !!r.is_system }))

    const stages = db.prepare('SELECT * FROM check_stages WHERE event_id = ? ORDER BY sort_order').all(eventId)
      .map((r) => ({
        id: r.id, eventId: r.event_id, name: r.name, order: r.sort_order,
        excludedOriginIds: parseJsonArray(r.excluded_origin_ids),
      }))

    const containers = db.prepare('SELECT * FROM containers WHERE event_id = ?').all(eventId)
      .map((r) => ({
        id: r.id, eventId: r.event_id, name: r.name, code: r.code,
        description: r.description ?? undefined, createdAt: r.created_at,
      }))

    const items = db.prepare('SELECT * FROM items WHERE event_id = ?').all(eventId)
      .map((r) => ({
        id: r.id, eventId: r.event_id, name: r.name, quantity: r.quantity,
        notes: r.notes ?? undefined, originId: r.origin_id ?? undefined,
        tagIds: parseJsonArray(r.tag_ids), containerId: r.container_id ?? undefined,
        createdAt: r.created_at, updatedAt: r.updated_at,
      }))

    const itemIds = items.map((i) => i.id)
    const checks = itemIds.length === 0 ? [] : db.prepare(
      `SELECT * FROM item_checks WHERE item_id IN (${itemIds.map(() => '?').join(',')})`
    ).all(...itemIds).map((r) => ({
      id: r.id, itemId: r.item_id, stageId: r.stage_id, checked: !!r.checked,
      missingCount: r.missing_count, missingReason: r.missing_reason,
      checkedAt: r.checked_at ?? undefined,
    }))

    return { event, tags, origins, stages, containers, items, checks }
  }

  function uniqueContainerCode() {
    let code = generateContainerCode()
    while (db.prepare('SELECT 1 FROM containers WHERE code = ?').get(code)) {
      code = generateContainerCode()
    }
    return code
  }

  // --- Events ---
  router.post('/events', (req, res) => {
    const { name, location, startDate, endDate } = req.body
    if (!name?.trim()) return res.status(400).json({ error: 'name required' })

    const now = Date.now()
    const id = randomUUID()
    const inviteCode = randomUUID()

    const tx = db.transaction(() => {
      db.prepare(`INSERT INTO events (id, invite_code, name, location, start_date, end_date, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run(
        id, inviteCode, name.trim(), location?.trim() || null,
        startDate || null, endDate || null, now, now
      )
      for (const o of DEFAULT_ORIGINS) {
        db.prepare('INSERT INTO origins (id, event_id, name, color, is_system) VALUES (?, ?, ?, ?, ?)')
          .run(randomUUID(), id, o.name, o.color, o.isSystem ? 1 : 0)
      }
      DEFAULT_STAGES.forEach((stageName, i) => {
        db.prepare('INSERT INTO check_stages (id, event_id, name, sort_order, excluded_origin_ids) VALUES (?, ?, ?, ?, ?)')
          .run(randomUUID(), id, stageName, i, '[]')
      })
    })
    tx()

    res.status(201).json(rowToEvent(db.prepare('SELECT * FROM events WHERE id = ?').get(id)))
  })

  router.post('/events/lookup', (req, res) => {
    const ids = req.body?.ids
    if (!Array.isArray(ids)) return res.status(400).json({ error: 'ids array required' })
    if (ids.length === 0) return res.json([])

    const placeholders = ids.map(() => '?').join(',')
    const rows = db.prepare(`SELECT * FROM events WHERE id IN (${placeholders}) ORDER BY updated_at DESC`).all(...ids)
    const result = rows.map((row) => {
      const event = rowToEvent(row)
      const items = db.prepare('SELECT COUNT(*) as c FROM items WHERE event_id = ?').get(row.id).c
      const containers = db.prepare('SELECT COUNT(*) as c FROM containers WHERE event_id = ?').get(row.id).c
      return { ...event, itemCount: items, containerCount: containers }
    })
    res.json(result)
  })

  router.get('/events/invite/:code', (req, res) => {
    const code = req.params.code.trim()
    const row = db.prepare('SELECT * FROM events WHERE invite_code = ? OR id = ?').get(code, code)
    if (!row) return res.status(404).json({ error: '행사를 찾을 수 없습니다' })
    res.json(rowToEvent(row))
  })

  router.get('/events/:id/data', (req, res) => {
    const data = getEventData(req.params.id)
    if (!data) return res.status(404).json({ error: 'not found' })
    res.json(data)
  })

  router.get('/events/:id', (req, res) => {
    const event = rowToEvent(db.prepare('SELECT * FROM events WHERE id = ?').get(req.params.id))
    if (!event) return res.status(404).json({ error: 'not found' })
    res.json(event)
  })

  router.patch('/events/:id', (req, res) => {
    const { name, location, startDate, endDate } = req.body
    const existing = db.prepare('SELECT * FROM events WHERE id = ?').get(req.params.id)
    if (!existing) return res.status(404).json({ error: 'not found' })

    db.prepare(`UPDATE events SET name = ?, location = ?, start_date = ?, end_date = ?, updated_at = ? WHERE id = ?`)
      .run(
        name ?? existing.name,
        location !== undefined ? (location || null) : existing.location,
        startDate !== undefined ? (startDate || null) : existing.start_date,
        endDate !== undefined ? (endDate || null) : existing.end_date,
        Date.now(), req.params.id
      )
    res.json(rowToEvent(db.prepare('SELECT * FROM events WHERE id = ?').get(req.params.id)))
  })

  router.delete('/events/:id', (req, res) => {
    const r = db.prepare('DELETE FROM events WHERE id = ?').run(req.params.id)
    if (r.changes === 0) return res.status(404).json({ error: 'not found' })
    res.status(204).end()
  })

  // --- Items ---
  router.post('/events/:eventId/items', (req, res) => {
    const { name, quantity, notes, originId, tagIds, containerId } = req.body
    if (!name?.trim()) return res.status(400).json({ error: 'name required' })
    const now = Date.now()
    const id = randomUUID()
    db.prepare(`INSERT INTO items (id, event_id, name, quantity, notes, origin_id, tag_ids, container_id, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
      id, req.params.eventId, name.trim(), quantity ?? 1, notes || null,
      originId || null, JSON.stringify(tagIds ?? []), containerId || null, now, now
    )
    db.prepare('UPDATE events SET updated_at = ? WHERE id = ?').run(now, req.params.eventId)
    const row = db.prepare('SELECT * FROM items WHERE id = ?').get(id)
    res.status(201).json({
      id: row.id, eventId: row.event_id, name: row.name, quantity: row.quantity,
      notes: row.notes ?? undefined, originId: row.origin_id ?? undefined,
      tagIds: parseJsonArray(row.tag_ids), containerId: row.container_id ?? undefined,
      createdAt: row.created_at, updatedAt: row.updated_at,
    })
  })

  router.patch('/items/:id', (req, res) => {
    const row = db.prepare('SELECT * FROM items WHERE id = ?').get(req.params.id)
    if (!row) return res.status(404).json({ error: 'not found' })
    const b = req.body
    const now = Date.now()
    db.prepare(`UPDATE items SET name=?, quantity=?, notes=?, origin_id=?, tag_ids=?, container_id=?, updated_at=? WHERE id=?`)
      .run(
        b.name ?? row.name, b.quantity ?? row.quantity,
        b.notes !== undefined ? (b.notes || null) : row.notes,
        b.originId !== undefined ? (b.originId || null) : row.origin_id,
        b.tagIds !== undefined ? JSON.stringify(b.tagIds) : row.tag_ids,
        b.containerId !== undefined ? (b.containerId || null) : row.container_id,
        now, req.params.id
      )
    db.prepare('UPDATE events SET updated_at = ? WHERE id = ?').run(now, row.event_id)
    res.status(204).end()
  })

  router.delete('/items/:id', (req, res) => {
    db.prepare('DELETE FROM item_checks WHERE item_id = ?').run(req.params.id)
    const r = db.prepare('DELETE FROM items WHERE id = ?').run(req.params.id)
    if (r.changes === 0) return res.status(404).json({ error: 'not found' })
    res.status(204).end()
  })

  // --- Item checks ---
  router.put('/items/:itemId/checks/:stageId', (req, res) => {
    const { checked, missingCount, missingReason } = req.body
    const id = `${req.params.itemId}::${req.params.stageId}`
    const existing = db.prepare('SELECT * FROM item_checks WHERE id = ?').get(id)
    const now = Date.now()

    if (existing) {
      let newMissing = missingCount !== undefined ? missingCount : existing.missing_count
      let newReason = missingReason !== undefined ? missingReason : existing.missing_reason
      let newChecked = checked !== undefined ? (checked ? 1 : 0) : existing.checked
      let newCheckedAt = checked !== undefined ? (checked ? now : null) : existing.checked_at

      if (checked === true) {
        newMissing = 0
        newReason = ''
        newChecked = 1
        newCheckedAt = now
      }
      if (missingCount !== undefined && missingCount > 0) {
        newChecked = 0
        newCheckedAt = null
      }

      db.prepare(`UPDATE item_checks SET checked=?, missing_count=?, missing_reason=?, checked_at=? WHERE id=?`)
        .run(newChecked, newMissing, newReason, newCheckedAt, id)
    } else {
      const initMissing = missingCount ?? 0
      const initChecked = initMissing > 0 ? 0 : (checked ? 1 : 0)
      db.prepare(`INSERT INTO item_checks (id, item_id, stage_id, checked, missing_count, missing_reason, checked_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)`).run(
        id, req.params.itemId, req.params.stageId,
        initChecked, initMissing, missingReason ?? '',
        initChecked ? now : null
      )
    }

    const row = db.prepare('SELECT * FROM item_checks WHERE id = ?').get(id)
    res.json({
      id: row.id, itemId: row.item_id, stageId: row.stage_id, checked: !!row.checked,
      missingCount: row.missing_count, missingReason: row.missing_reason,
      checkedAt: row.checked_at ?? undefined,
    })
  })

  // --- Containers ---
  router.post('/events/:eventId/containers', (req, res) => {
    const { name, description } = req.body
    if (!name?.trim()) return res.status(400).json({ error: 'name required' })
    const id = randomUUID()
    const code = uniqueContainerCode()
    const now = Date.now()
    db.prepare('INSERT INTO containers (id, event_id, name, code, description, created_at) VALUES (?, ?, ?, ?, ?, ?)')
      .run(id, req.params.eventId, name.trim(), code, description || null, now)
    db.prepare('UPDATE events SET updated_at = ? WHERE id = ?').run(now, req.params.eventId)
    res.status(201).json({ id, eventId: req.params.eventId, name: name.trim(), code, description, createdAt: now })
  })

  router.patch('/containers/:id', (req, res) => {
    const row = db.prepare('SELECT * FROM containers WHERE id = ?').get(req.params.id)
    if (!row) return res.status(404).json({ error: 'not found' })
    const { name, description } = req.body
    db.prepare('UPDATE containers SET name = ?, description = ? WHERE id = ?')
      .run(name ?? row.name, description !== undefined ? (description || null) : row.description, req.params.id)
    res.status(204).end()
  })

  router.delete('/containers/:id', (req, res) => {
    db.prepare('UPDATE items SET container_id = NULL WHERE container_id = ?').run(req.params.id)
    const r = db.prepare('DELETE FROM containers WHERE id = ?').run(req.params.id)
    if (r.changes === 0) return res.status(404).json({ error: 'not found' })
    res.status(204).end()
  })

  router.get('/containers/code/:code', (req, res) => {
    const row = db.prepare('SELECT * FROM containers WHERE code = ?').get(req.params.code)
    if (!row) return res.status(404).json({ error: 'not found' })
    res.json({
      id: row.id, eventId: row.event_id, name: row.name, code: row.code,
      description: row.description ?? undefined, createdAt: row.created_at,
    })
  })

  // --- Tags ---
  router.post('/events/:eventId/tags', (req, res) => {
    const { name, color } = req.body
    if (!name?.trim()) return res.status(400).json({ error: 'name required' })
    const id = randomUUID()
    db.prepare('INSERT INTO tags (id, event_id, name, color) VALUES (?, ?, ?, ?)')
      .run(id, req.params.eventId, name.trim(), color)
    res.status(201).json({ id, eventId: req.params.eventId, name: name.trim(), color })
  })

  router.delete('/tags/:id', (req, res) => {
    const tag = db.prepare('SELECT * FROM tags WHERE id = ?').get(req.params.id)
    if (!tag) return res.status(404).json({ error: 'not found' })
    const items = db.prepare('SELECT id, tag_ids FROM items WHERE event_id = ?').all(tag.event_id)
    for (const item of items) {
      const ids = parseJsonArray(item.tag_ids).filter((t) => t !== req.params.id)
      db.prepare('UPDATE items SET tag_ids = ? WHERE id = ?').run(JSON.stringify(ids), item.id)
    }
    db.prepare('DELETE FROM tags WHERE id = ?').run(req.params.id)
    res.status(204).end()
  })

  // --- Origins ---
  router.post('/events/:eventId/origins', (req, res) => {
    const { name, color } = req.body
    if (!name?.trim()) return res.status(400).json({ error: 'name required' })
    const id = randomUUID()
    db.prepare('INSERT INTO origins (id, event_id, name, color, is_system) VALUES (?, ?, ?, ?, 0)')
      .run(id, req.params.eventId, name.trim(), color)
    res.status(201).json({ id, eventId: req.params.eventId, name: name.trim(), color })
  })

  router.delete('/origins/:id', (req, res) => {
    const origin = db.prepare('SELECT * FROM origins WHERE id = ?').get(req.params.id)
    if (!origin) return res.status(404).json({ error: 'not found' })
    const stages = db.prepare('SELECT * FROM check_stages WHERE event_id = ?').all(origin.event_id)
    for (const s of stages) {
      const excluded = parseJsonArray(s.excluded_origin_ids).filter((x) => x !== req.params.id)
      db.prepare('UPDATE check_stages SET excluded_origin_ids = ? WHERE id = ?').run(JSON.stringify(excluded), s.id)
    }
    db.prepare('UPDATE items SET origin_id = NULL WHERE origin_id = ?').run(req.params.id)
    db.prepare('DELETE FROM origins WHERE id = ?').run(req.params.id)
    res.status(204).end()
  })

  // --- Check stages ---
  router.post('/events/:eventId/stages', (req, res) => {
    const { name } = req.body
    if (!name?.trim()) return res.status(400).json({ error: 'name required' })
    const maxOrder = db.prepare('SELECT MAX(sort_order) as m FROM check_stages WHERE event_id = ?').get(req.params.eventId)?.m ?? -1
    const id = randomUUID()
    db.prepare('INSERT INTO check_stages (id, event_id, name, sort_order, excluded_origin_ids) VALUES (?, ?, ?, ?, ?)')
      .run(id, req.params.eventId, name.trim(), maxOrder + 1, '[]')
    res.status(201).json({ id, eventId: req.params.eventId, name: name.trim(), order: maxOrder + 1, excludedOriginIds: [] })
  })

  router.patch('/stages/:id', (req, res) => {
    const row = db.prepare('SELECT * FROM check_stages WHERE id = ?').get(req.params.id)
    if (!row) return res.status(404).json({ error: 'not found' })
    const { name, excludedOriginIds } = req.body
    db.prepare('UPDATE check_stages SET name = ?, excluded_origin_ids = ? WHERE id = ?')
      .run(
        name ?? row.name,
        excludedOriginIds !== undefined ? JSON.stringify(excludedOriginIds) : row.excluded_origin_ids,
        req.params.id
      )
    res.status(204).end()
  })

  router.delete('/stages/:id', (req, res) => {
    const stage = db.prepare('SELECT * FROM check_stages WHERE id = ?').get(req.params.id)
    if (!stage) return res.status(404).json({ error: 'not found' })
    db.prepare('DELETE FROM item_checks WHERE stage_id = ?').run(req.params.id)
    db.prepare('DELETE FROM check_stages WHERE id = ?').run(req.params.id)
    const siblings = db.prepare('SELECT id FROM check_stages WHERE event_id = ? ORDER BY sort_order').all(stage.event_id)
    siblings.forEach((s, i) => db.prepare('UPDATE check_stages SET sort_order = ? WHERE id = ?').run(i, s.id))
    res.status(204).end()
  })

  return router
}