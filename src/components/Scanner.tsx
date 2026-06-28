import { useEffect, useRef, useState, useCallback } from 'react'
import { BrowserMultiFormatReader } from '@zxing/browser'
import type { IScannerControls } from '@zxing/browser/esm/common/IScannerControls'
import { NotFoundException } from '@zxing/library'
import { parseContainerBarcode } from '../lib/barcode'
import { vibrate } from '../lib/utils'

interface ScannerProps {
  stream: MediaStream
  onScan: (containerCode: string) => void
  onClose: () => void
}

export function Scanner({ stream, onScan, onClose }: ScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const controlsRef = useRef<IScannerControls | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [scanning, setScanning] = useState(true)
  const lastScanRef = useRef<string>('')
  const lastScanTimeRef = useRef(0)

  const handleResult = useCallback((text: string) => {
    const now = Date.now()
    if (text === lastScanRef.current && now - lastScanTimeRef.current < 2000) return

    const code = parseContainerBarcode(text)
    if (code) {
      lastScanRef.current = text
      lastScanTimeRef.current = now
      vibrate(30)
      setScanning(false)
      onScan(code)
    }
  }, [onScan])

  useEffect(() => {
    const reader = new BrowserMultiFormatReader()
    let cancelled = false

    const startScan = async () => {
      const video = videoRef.current
      if (!video || cancelled) return

      try {
        video.setAttribute('playsinline', 'true')
        video.setAttribute('webkit-playsinline', 'true')
        video.muted = true
        video.srcObject = stream

        await video.play()

        const controls = await reader.decodeFromStream(
          stream,
          video,
          (result, err) => {
            if (result) {
              handleResult(result.getText())
            }
            if (err && !(err instanceof NotFoundException)) {
              console.debug('Scan error:', err)
            }
          }
        )
        if (!cancelled) {
          controlsRef.current = controls
        } else {
          controls.stop()
        }
      } catch (e) {
        if (!cancelled) {
          console.error(e)
          setError('카메라를 시작할 수 없습니다.')
        }
      }
    }

    startScan()

    return () => {
      cancelled = true
      controlsRef.current?.stop()
      controlsRef.current = null
      if (videoRef.current) {
        videoRef.current.srcObject = null
      }
    }
  }, [stream, handleResult])

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col safe-top safe-bottom">
      <div className="flex items-center justify-between px-4 py-3 bg-black/80">
        <h2 className="text-lg font-bold text-white">스캔</h2>
        <button
          onClick={onClose}
          className="touch-target w-10 h-10 flex items-center justify-center rounded-full bg-white/10 text-white"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="flex-1 relative overflow-hidden">
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
          playsInline
          muted
          autoPlay
        />

        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="relative w-64 h-64">
            <div
              className="absolute inset-0 border-2 border-white/60 rounded-2xl"
              style={{ animation: scanning ? 'pulse-ring 2s ease-in-out infinite' : 'none' }}
            />
            <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white rounded-tl-lg" />
            <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white rounded-tr-lg" />
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white rounded-bl-lg" />
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white rounded-br-lg" />
          </div>
        </div>

        {error && (
          <div className="absolute bottom-8 left-0 right-0 text-center px-6">
            <p className="text-danger text-sm bg-black/60 rounded-lg px-4 py-2">{error}</p>
          </div>
        )}
      </div>
    </div>
  )
}