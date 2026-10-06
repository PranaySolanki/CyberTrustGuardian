import { useCallback } from 'react';
import {
  evaluateAppOnDevice,
  MultiModelAnalysisResult,
  AlgorithmVerdict,
  AnalysisResult,
} from './utils/mlKit';

export type { MultiModelAnalysisResult, AlgorithmVerdict, AnalysisResult };

export function useMultiModelClassifier() {
  const predict = useCallback((
    permissions: string[],
    isSystemApp: boolean = false,
    packageName: string = ''
  ): MultiModelAnalysisResult => {
    return evaluateAppOnDevice(permissions, isSystemApp, packageName);
  }, []);

  return {
    predict,
    isReady: true as const,
  };
}

export default useMultiModelClassifier;
