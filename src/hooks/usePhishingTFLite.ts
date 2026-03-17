import { useTensorflowModel } from 'react-native-fast-tflite';
import { preprocessText } from '../utils/preprocessText';

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
  const plugin = useTensorflowModel(
    require('../../assets/models/phishing_detector.tflite')
  );

  const isReady = plugin.state === 'loaded';

  const analyze = (text: string): PhishingResult | null => {
    if (!isReady || !plugin.model) {
      console.warn('[PhishingTFLite] Model not loaded yet');
      return null;
    }

    try {
      const inputTensor = preprocessText(text);
      const output = plugin.model.runSync([inputTensor]);
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
      console.error('[PhishingTFLite] Inference error:', error);
      return null;
    }
  };

  return { analyze, isReady, modelState: plugin.state };
}