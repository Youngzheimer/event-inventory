import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Scanner } from '../components/Scanner'
import { getContainerByCode } from '../services/containerService'
import { requestCameraStream, stopCameraStream, getCameraErrorMessage, isCameraGranted } from '../lib/camera'
import { Button } from '../components/ui/Button'

export function ScanPage() {
  const { eventId } = useParams<{ eventId: string }>()
  const navigate = useNavigate()
  const [scanning, setScanning] = useState(false)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [autoStarted, setAutoStarted] = useState(false)

  const closeScanner = useCallback(() => {
    stopCameraStream(stream)
    setStream(null)
    setScanning(false)
  }, [stream])

  const handleStartScan = useCallback(async () => {
    setError(null)
    setLoading(true)
    try {
      const mediaStream = await requestCameraStream()
      setStream(mediaStream)
      setScanning(true)
    } catch (e) {
      setError(getCameraErrorMessage(e))
      setScanning(false)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (autoStarted || !isCameraGranted()) return
    setAutoStarted(true)
    handleStartScan()
  }, [autoStarted, handleStartScan])

  const handleScan = async (code: string) => {
    closeScanner()
    setError(null)

    const container = await getContainerByCode(code)
    if (!container) {
      setError(`"${code}" 상자를 찾을 수 없습니다`)
      return
    }
    if (container.eventId !== eventId) {
      setError('이 행사에 속하지 않은 상자입니다')
      return
    }

    navigate(`/events/${eventId}/containers/${container.id}`)
  }

  if (scanning && stream) {
    return (
      <Scanner
        stream={stream}
        onScan={handleScan}
        onClose={closeScanner}
      />
    )
  }

  return (
    <div className="safe-top min-h-[80vh] flex flex-col">
      <header className="px-5 md:px-8 pt-6 pb-4">
        <h1 className="text-xl font-bold">상자 스캔</h1>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center px-5 md:px-8 pb-8 max-w-md mx-auto w-full">
        {loading ? (
          <div className="flex flex-col items-center gap-3 text-slate-400">
            <div className="w-10 h-10 border-2 border-slate-600 border-t-brand-500 rounded-full animate-spin" />
            <p className="text-sm">카메라 시작 중...</p>
          </div>
        ) : (
          <Button size="lg" fullWidth onClick={handleStartScan}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            카메라로 스캔
          </Button>
        )}

        {error && (
          <div className="mt-4 w-full p-4 rounded-xl bg-danger/10 border border-danger/30 text-danger text-sm text-center animate-slide-up">
            {error}
          </div>
        )}
      </div>
    </div>
  )
}