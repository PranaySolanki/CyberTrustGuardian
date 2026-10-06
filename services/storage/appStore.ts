export type AppResult = {
    package_name: string
    permissions: string[]
    appName?: string
    isSystemApp?: boolean
    analysis?: {
        risk: 'HIGH' | 'MEDIUM' | 'LOW'
        score: number
        safetyScore?: number
        reason: string
        official_comparison?: string
        recommendation?: string
        svmVerdict?: { isMalware: boolean; confidence: number }
        naiveBayesVerdict?: { isMalware: boolean; confidence: number }
        randomForestVerdict?: { isMalware: boolean; confidence: number }
        detectedCapabilities?: string[]
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
