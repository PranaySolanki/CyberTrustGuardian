export type QRResult = {
  risk: 'LOW' | 'MEDIUM' | 'HIGH'
  score: number
  reason: string
  content: string
}

let lastQrResult: QRResult | null = null

export const setLastQrResult = (r: QRResult) => {
  lastQrResult = r
}

export const getLastQrResult = (): QRResult | null => lastQrResult

export const clearLastQrResult = () => {
  lastQrResult = null
}
