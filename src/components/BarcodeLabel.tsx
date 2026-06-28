import { useEffect, useRef, useState, useCallback } from 'react'
import { encodeContainerBarcode, renderDataMatrix } from '../lib/barcode'
import type { Container } from '../types'

interface BarcodeLabelProps {
  container: Container
  eventName: string
  size?: 'sm' | 'lg'
  onReady?: () => void
  onError?: (message: string) => void
}

export function BarcodeLabel({
  container,
  eventName,
  size = 'lg',
  onReady,
  onError,
}: BarcodeLabelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [errorMsg, setErrorMsg] = useState('')

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return false

    try {
      const barcodeText = encodeContainerBarcode(container.code)
      renderDataMatrix(canvas, barcodeText, { scale: size === 'lg' ? 5 : 4 })
      setStatus('ready')
      setErrorMsg('')
      onReady?.()
      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : '바코드 생성 실패'
      setStatus('error')
      setErrorMsg(message)
      onError?.(message)
      console.error('Data Matrix render error:', err)
      return false
    }
  }, [container.code, size, onReady, onError])

  useEffect(() => {
    setStatus('loading')
    let retryTimer: ReturnType<typeof setTimeout> | undefined

    const frame = requestAnimationFrame(() => {
      const ok = draw()
      if (!ok) {
        retryTimer = setTimeout(draw, 100)
      }
    })

    return () => {
      cancelAnimationFrame(frame)
      if (retryTimer) clearTimeout(retryTimer)
    }
  }, [draw])

  return (
    <div className={`barcode-label bg-white text-black rounded-lg ${size === 'lg' ? 'p-6' : 'p-4'}`}>
      <div className="text-center">
        <p className={`font-bold ${size === 'lg' ? 'text-2xl' : 'text-lg'}`}>{container.name}</p>
        <p className={`text-gray-500 ${size === 'lg' ? 'text-sm' : 'text-xs'} mt-1`}>{eventName}</p>
      </div>

      <div className="flex justify-center my-4 min-h-[120px] items-center">
        {status === 'loading' && (
          <div className="flex flex-col items-center gap-2 text-gray-400">
            <div className="w-8 h-8 border-2 border-gray-300 border-t-brand-500 rounded-full animate-spin" />
            <span className="text-sm">생성 중...</span>
          </div>
        )}
        {status === 'error' && (
          <div className="text-center text-red-500 px-4">
            <p className="text-sm font-medium">바코드 로딩 실패</p>
            <p className="text-xs mt-1 text-gray-500">{errorMsg}</p>
            <button
              onClick={draw}
              className="mt-3 px-4 py-2 text-sm bg-gray-100 rounded-lg hover:bg-gray-200 text-gray-700"
            >
              다시 시도
            </button>
          </div>
        )}
        <canvas
          ref={canvasRef}
          className={`max-w-full ${status === 'ready' ? 'block' : 'hidden'}`}
          style={{ imageRendering: 'pixelated' }}
        />
      </div>

      <p className={`text-center font-mono text-gray-600 ${size === 'lg' ? 'text-lg' : 'text-sm'}`}>
        {container.code}
      </p>

    </div>
  )
}