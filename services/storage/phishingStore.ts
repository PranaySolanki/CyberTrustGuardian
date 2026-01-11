export type PhishingResult = {
  risk: 'LOW' | 'MEDIUM' | 'HIGH'
  score: number
  reason: string
  content: string
}

let lastPhishingResult: PhishingResult | null = null

export const setLastPhishingResult = (r: PhishingResult) => {
  lastPhishingResult = r
}

export const getLastPhishingResult = (): PhishingResult | null => lastPhishingResult

export const clearLastPhishingResult = () => {
  lastPhishingResult = null
}
