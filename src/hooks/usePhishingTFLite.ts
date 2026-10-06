import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';
import { preprocessText } from '../utils/preprocessText';
import { extractFlaggedWords } from '@/services/utils/phishingKeywords';

const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient || Constants.appOwnership === 'expo';

// Only load useTensorflowModel on native platforms and outside Expo Go
const useTensorflowModel =
  Platform.OS !== 'web' && !isExpoGo
    ? (() => {
        try {
          // eslint-disable-next-line @typescript-eslint/no-require-imports
          return require('react-native-fast-tflite').useTensorflowModel;
        } catch (e) {
          console.warn('[usePhishingTFLite] TFLite module not available in native binary:', e);
          return null;
        }
      })()
    : null;

const THRESHOLD_HIGH   = 0.7;
const THRESHOLD_MEDIUM = 0.4;

export type RiskLevel = 'HIGH' | 'MEDIUM' | 'LOW';

export interface PhishingResult {
  risk:        RiskLevel;
  safetyScore: number;
  probability: number;
  isPhishing:  boolean;
}

export function usePhishingTFLite() {
  let pluginState: 'loading' | 'loaded' | 'error' | 'not-available' = 'not-available';
  let model: any = null;

  try {
    if (useTensorflowModel) {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const plugin = useTensorflowModel(
        require('../../assets/models/phishing_detector.tflite')
      );
      if (plugin) {
        pluginState = plugin.state;
        model = plugin.model;
      }
    }
  } catch (e) {
    console.warn('[usePhishingTFLite] Error initializing TFLite model:', e);
  }

  const isReady = pluginState === 'loaded';

  const analyze = (text: string): PhishingResult => {
    if (isReady && model) {
      try {
        const inputTensor = preprocessText(text);
        const output = model.runSync([inputTensor]);
        const scoreArray = output[0] as Float32Array;
        const probability = scoreArray[0];

        let risk: RiskLevel;
        if (probability > THRESHOLD_HIGH) {
          risk = 'HIGH';
        } else if (probability > THRESHOLD_MEDIUM) {
          risk = 'MEDIUM';
        } else {
          risk = 'LOW';
        }

        return {
          risk,
          safetyScore: Math.round((1 - probability) * 100),
          probability,
          isPhishing: risk === 'HIGH',
        };
      } catch (error) {
        console.error('[PhishingTFLite] Inference error, switching to fallback:', error);
      }
    }

    // ── Rule-Based Fallback when TFLite module/model is not loaded in binary ──
    const flagged = extractFlaggedWords(text);
    let prob = 0.1;
    if (flagged.length >= 3) {
      prob = 0.85;
    } else if (flagged.length >= 1) {
      prob = 0.5;
    }

    let fallbackRisk: RiskLevel = 'LOW';
    if (prob > THRESHOLD_HIGH) fallbackRisk = 'HIGH';
    else if (prob > THRESHOLD_MEDIUM) fallbackRisk = 'MEDIUM';

    return {
      risk: fallbackRisk,
      safetyScore: Math.round((1 - prob) * 100),
      probability: prob,
      isPhishing: fallbackRisk === 'HIGH',
    };
  };

  return { analyze, isReady, modelState: pluginState };
}