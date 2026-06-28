const CAMERA_GRANTED_KEY = 'packtrack_camera_granted'

export async function requestCameraStream(): Promise<MediaStream> {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new DOMException('Camera not supported', 'NotSupportedError')
  }

  const stream = await navigator.mediaDevices.getUserMedia({
    video: {
      facingMode: { ideal: 'environment' },
      width: { ideal: 1280 },
      height: { ideal: 720 },
    },
    audio: false,
  })

  markCameraGranted()
  return stream
}

export function markCameraGranted(): void {
  try {
    localStorage.setItem(CAMERA_GRANTED_KEY, '1')
  } catch { /* ignore */ }
}

export function isCameraGranted(): boolean {
  try {
    return localStorage.getItem(CAMERA_GRANTED_KEY) === '1'
  } catch {
    return false
  }
}

export function clearCameraGranted(): void {
  try {
    localStorage.removeItem(CAMERA_GRANTED_KEY)
  } catch { /* ignore */ }
}

export function stopCameraStream(stream: MediaStream | null | undefined): void {
  stream?.getTracks().forEach((track) => track.stop())
}

export function getCameraErrorMessage(error: unknown): string {
  if (error instanceof DOMException) {
    if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
      clearCameraGranted()
      return '카메라 권한이 필요합니다. 설정 → Safari → 카메라에서 이 사이트를 허용해주세요.'
    }
    if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
      return '카메라를 찾을 수 없습니다.'
    }
    if (error.name === 'NotReadableError') {
      return '카메라가 다른 앱에서 사용 중입니다.'
    }
  }
  return '카메라를 사용할 수 없습니다.'
}