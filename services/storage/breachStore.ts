export type BreachResult = {
  risk: 'LOW' | 'MEDIUM' | 'HIGH'
  score: number
  reason: string
  content: string
}

let lastBreachResult: BreachResult | null = null

export const setLastBreachResult = (r: BreachResult) => {
  lastBreachResult = r
}

export const getLastBreachResult = (): BreachResult | null => lastBreachResult

export const clearLastBreachResult = () => {
  lastBreachResult = null
}
