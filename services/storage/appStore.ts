export type AppResult = {
    package_name: string
    permissions: string[]
    appName?: string
    analysis?: {
        risk: 'HIGH' | 'MEDIUM' | 'LOW'
        score: number
        reason: string
        official_comparison?: string
        recommendation?: string
    }
}

let lastAppResult: AppResult | null = null

export const setLastAppResult = (r: AppResult) => {
    lastAppResult = r
}

export const getLastAppResult = (): AppResult | null => lastAppResult

export const clearLastAppResult = () => {
    lastAppResult = null
}
