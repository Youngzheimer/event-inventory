import { toCanvas } from '@bwip-js/browser'
import { BARCODE_PREFIX } from '../types'

export function encodeContainerBarcode(containerCode: string): string {
  return `${BARCODE_PREFIX}:${containerCode}`
}

export function parseContainerBarcode(text: string): string | null {
  const trimmed = text.trim()
  if (trimmed.startsWith(`${BARCODE_PREFIX}:`)) {
    return trimmed.slice(BARCODE_PREFIX.length + 1)
  }
  return null
}

export function renderDataMatrix(
  canvas: HTMLCanvasElement,
  text: string,
  options?: { scale?: number }
): void {
  toCanvas(canvas, {
    bcid: 'datamatrix',
    text,
    scale: options?.scale ?? 4,
    includetext: false,
    paddingwidth: 4,
    paddingheight: 4,
    backgroundcolor: 'ffffff',
  })
}

export function generateContainerCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}