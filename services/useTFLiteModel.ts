/**
 * useTFLiteModel.ts
 * On-device malware detection — delegates all ML logic to mlKit.ts.
 */
import { useCallback, useEffect } from 'react';
import { useTensorflowModel } from 'react-native-fast-tflite';
import {
  AnalysisResult,
  buildFeatureVector,
  buildFeatureVectorInt,
  fullAnalysis,
  interpretModelOutput,
  ruleBasedAnalysis,
} from './utils/mlKit';

export type { AnalysisResult };

export function useTFLiteClassifier() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const plugin = useTensorflowModel(require('../assets/models/apps_detection.tflite'));

  useEffect(() => {
    if (plugin.state === 'error') {
      console.error('[TFLite] Model error:', (plugin as any).error);
    }
  }, [plugin.state]);

  const predict = useCallback((
    permissions: string[],
    isSystemApp: boolean = false,
    packageName: string = '',
  ): AnalysisResult => {
    // ── Fallback: rule-based multi-factor scoring while TFLite initializes ──
    if (plugin.state !== 'loaded' || !plugin.model) {
      console.log('[TFLite] Not ready — using rule-based fallback.');
      return ruleBasedAnalysis(permissions, isSystemApp, packageName);
    }

    // ── TFLite on-device inference (40%) + rule-based factors (60%) ─────────
    try {
      let outputData: Float32Array | undefined;
      try {
        const f32Input = buildFeatureVector(permissions);
        const outputs = plugin.model.runSync([f32Input]);
        outputData = outputs[0] as Float32Array;
      } catch {
        console.warn('[TFLite] Float32 failed, retrying with Int32...');
        const i32Input = buildFeatureVectorInt(permissions);
        const outputs = plugin.model.runSync([i32Input]);
        outputData = outputs[0] as Float32Array;
      }

      if (!outputData || outputData.length === 0) {
        console.warn('[TFLite] Empty output — falling back to rules.');
        return ruleBasedAnalysis(permissions, isSystemApp, packageName);
      }

      const mlRiskScore = interpretModelOutput(outputData);
      return fullAnalysis(permissions, mlRiskScore, isSystemApp, packageName);
    } catch (err) {
      console.error('[TFLite] Inference error — falling back to rules:', err);
      return ruleBasedAnalysis(permissions, isSystemApp, packageName);
    }
  }, [plugin]);

  return {
    predict,
    isReady: plugin.state === 'loaded',
    modelState: plugin.state,
  };
}
