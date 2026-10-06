/**
 * useTFLiteModel.ts
 * On-device multi-algorithm malware detection engine (SVM, Naive Bayes & Random Forest).
 */
import { useMultiModelClassifier } from './useMultiModelClassifier';
import { AnalysisResult, evaluateAppOnDevice, MultiModelAnalysisResult } from './utils/mlKit';

export type { AnalysisResult, MultiModelAnalysisResult };

export function useTFLiteClassifier() {
  const multiModel = useMultiModelClassifier();

  return {
    predict: (
      permissions: string[],
      isSystemApp: boolean = false,
      packageName: string = ''
    ) => {
      const res = evaluateAppOnDevice(permissions, isSystemApp, packageName);
      return {
        ...res,
        risk: res.overallRisk,
        riskScore: 100 - res.safetyScore,
      };
    },
    isReady: true,
    modelState: 'loaded' as const,
  };
}

export { useMultiModelClassifier };
