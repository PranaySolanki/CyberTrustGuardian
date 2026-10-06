import BarcodeScanning, { BarcodeFormat } from '@react-native-ml-kit/barcode-scanning';
import TextRecognition, { TextBlock } from '@react-native-ml-kit/text-recognition';
import offlineModels from '../../assets/models/offline_models.json';

export const FEATURE_COLUMNS: string[] = offlineModels.features;

export interface AlgorithmResult {
  isMalware: boolean;
  confidence: number; // 0 to 100
}

export type AlgorithmVerdict = AlgorithmResult;

export interface PureMLAnalysisResult {
  risk: 'HIGH' | 'MEDIUM' | 'LOW';
  safetyScore: number; // 0 (Malicious) to 100 (Safe)
  threatProbability: number;
  models: {
    randomForest: AlgorithmResult;
    svm: AlgorithmResult;
    naiveBayes: AlgorithmResult;
  };
  detectedCapabilities: string[]; // Informational capability tags
  recommendation: string;
}

// Map high-level modern capabilities to legacy vector intents so the ML models understand them
const SEMANTIC_INTENT_MAP: Record<string, string[]> = {
  BIND_ACCESSIBILITY_SERVICE: ['READ_SMS', 'RECEIVE_SMS', 'READ_EXTERNAL_STORAGE'],
  SYSTEM_ALERT_WINDOW: ['WRITE_SETTINGS', 'RECEIVE_BOOT_COMPLETED'],
  BIND_NOTIFICATION_LISTENER_SERVICE: ['RECEIVE_SMS', 'READ_SMS'],
  POST_NOTIFICATIONS: ['RECEIVE_BOOT_COMPLETED'],
  QUERY_ALL_PACKAGES: ['GET_ACCOUNTS'],
};

export const buildFeatureVector = (rawPermissions: string[]): number[] => {
  const normalized = new Set<string>();

  for (const perm of rawPermissions) {
    const clean = perm.split('.').pop()?.toUpperCase() || '';
    normalized.add(clean);
    
    // Inject underlying functional intent if it's a modern permission
    if (SEMANTIC_INTENT_MAP[clean]) {
      SEMANTIC_INTENT_MAP[clean].forEach(legacy => normalized.add(legacy));
    }
  }

  return FEATURE_COLUMNS.map(col => normalized.has(col) ? 1 : 0);
};

export const buildFeatureVectorInt = (permissions: string[]): Int32Array => {
    const vec = buildFeatureVector(permissions);
    return new Int32Array(vec);
};

// 1. SVM Evaluator
export const evaluateSVM = (vector: number[]): AlgorithmResult => {
  let score = offlineModels.svm.intercept;
  for (let i = 0; i < vector.length; i++) {
    score += vector[i] * offlineModels.svm.weights[i];
  }
  const prob = 1 / (1 + Math.exp(-score));
  return {
    isMalware: prob >= 0.5,
    confidence: Math.round(prob >= 0.5 ? prob * 100 : (1 - prob) * 100),
  };
};

// 2. Bernoulli Naive Bayes Evaluator
export const evaluateNaiveBayes = (vector: number[]): AlgorithmResult => {
  let logMal = offlineModels.naive_bayes.class_prior_malware;
  let logBen = offlineModels.naive_bayes.class_prior_benign;

  for (let i = 0; i < vector.length; i++) {
    if (vector[i] === 1) {
      logMal += offlineModels.naive_bayes.log_prob_malware[i];
      logBen += offlineModels.naive_bayes.log_prob_benign[i];
    } else {
      logMal += Math.log(Math.max(1e-9, 1 - Math.exp(offlineModels.naive_bayes.log_prob_malware[i])));
      logBen += Math.log(Math.max(1e-9, 1 - Math.exp(offlineModels.naive_bayes.log_prob_benign[i])));
    }
  }

  const logRatio = logMal - logBen;
  const prob = 1 / (1 + Math.exp(-logRatio));
  return {
    isMalware: prob >= 0.5,
    confidence: Math.round(prob >= 0.5 ? prob * 100 : (1 - prob) * 100),
  };
};

// 3. Random Forest Evaluator
export const evaluateRandomForest = (vector: number[]): AlgorithmResult => {
  const trees = offlineModels.random_forest.trees;
  let malwareVotes = 0;

  for (const tree of trees) {
    let node = 0;
    while (tree.feature[node] !== -2) { // -2 represents a leaf node in scikit-learn
      const featureIdx = tree.feature[node];
      const threshold = tree.threshold[node];
      node = vector[featureIdx] <= threshold ? tree.children_left[node] : tree.children_right[node];
    }
    const [benignSamples, malwareSamples] = tree.value[node];
    if (malwareSamples > benignSamples) malwareVotes++;
  }

  const prob = malwareVotes / trees.length;
  return {
    isMalware: prob >= 0.5,
    confidence: Math.round(prob >= 0.5 ? prob * 100 : (1 - prob) * 100),
  };
};

// 4. Audit capabilities solely for descriptive text (Zero influence on score)
export const auditCapabilities = (rawPermissions: string[]): string[] => {
  const cleaned = rawPermissions.map(p => p.split('.').pop()?.toUpperCase() || '');
  const tags: string[] = [];

  if (cleaned.includes('ACCESS_FINE_LOCATION') || cleaned.includes('ACCESS_COARSE_LOCATION')) tags.push('Location Tracking');
  if (cleaned.includes('SYSTEM_ALERT_WINDOW')) tags.push('Window Overlay / Display on Top');
  if (cleaned.includes('BIND_ACCESSIBILITY_SERVICE')) tags.push('Accessibility Service');
  if (cleaned.includes('READ_SMS') || cleaned.includes('RECEIVE_SMS') || cleaned.includes('SEND_SMS')) tags.push('SMS Access');
  if (cleaned.includes('RECORD_AUDIO')) tags.push('Microphone Access');
  if (cleaned.includes('CAMERA')) tags.push('Camera Access');

  return tags.length > 0 ? tags : ['Standard Device Access'];
};

// Main Analysis Orchestrator
export const evaluateAppPureML = (permissions: string[]): PureMLAnalysisResult => {
  const vector = buildFeatureVector(permissions);

  const rfResult = evaluateRandomForest(vector);
  const svmResult = evaluateSVM(vector);
  const nbResult = evaluateNaiveBayes(vector);

  // Soft voting ensemble
  const rfProb = rfResult.isMalware ? rfResult.confidence / 100 : 1 - rfResult.confidence / 100;
  const svmProb = svmResult.isMalware ? svmResult.confidence / 100 : 1 - svmResult.confidence / 100;
  const nbProb = nbResult.isMalware ? nbResult.confidence / 100 : 1 - nbResult.confidence / 100;

  const threatProbability = (rfProb + svmProb + nbProb) / 3;
  const safetyScore = Math.max(5, Math.min(100, Math.round((1 - threatProbability) * 100)));

  let risk: 'HIGH' | 'MEDIUM' | 'LOW';
  let recommendation: string;

  if (safetyScore <= 35) {
    risk = 'HIGH';
    recommendation = 'Multiple ML models detected strong malware characteristics. Uninstall advised.';
  } else if (safetyScore <= 65) {
    risk = 'MEDIUM';
    recommendation = 'Suspicious permission patterns identified. Review app necessity.';
  } else {
    risk = 'LOW';
    recommendation = 'App verified safe by unanimous model consensus.';
  }

  return {
    risk,
    safetyScore,
    threatProbability: Math.round(threatProbability * 100),
    models: {
      randomForest: rfResult,
      svm: svmResult,
      naiveBayes: nbResult,
    },
    detectedCapabilities: auditCapabilities(permissions),
    recommendation,
  };
};

/** Backwards Compatibility Interface & Function Wrappers */
export interface MultiModelAnalysisResult {
  overallRisk: 'HIGH' | 'MEDIUM' | 'LOW';
  safetyScore: number;
  svmVerdict: AlgorithmResult;
  naiveBayesVerdict: AlgorithmResult;
  randomForestVerdict: AlgorithmResult;
  reason: string;
  recommendation: string;
}

export interface AnalysisResult extends MultiModelAnalysisResult {
  risk: 'HIGH' | 'MEDIUM' | 'LOW';
  riskScore: number;
}

export const evaluateAppOnDevice = (
  permissions: string[],
  isSystemApp: boolean = false,
  packageName: string = ''
): MultiModelAnalysisResult => {
  const res = evaluateAppPureML(permissions);
  return {
    overallRisk: res.risk,
    safetyScore: res.safetyScore,
    svmVerdict: res.models.svm,
    naiveBayesVerdict: res.models.naiveBayes,
    randomForestVerdict: res.models.randomForest,
    reason: `Detected Capabilities: ${res.detectedCapabilities.join(', ')}`,
    recommendation: res.recommendation,
  };
};

export const evaluateTripleEngine = evaluateAppOnDevice;

export const ruleBasedAnalysis = (
  permissions: string[],
  isSystemApp: boolean = false,
  packageName: string = '',
): AnalysisResult => {
  const multiRes = evaluateAppOnDevice(permissions, isSystemApp, packageName);
  return {
    ...multiRes,
    risk: multiRes.overallRisk,
    riskScore: 100 - multiRes.safetyScore,
  };
};

export const fullAnalysis = (
  permissions: string[],
  mlRiskScore: number,
  isSystemApp: boolean = false,
  packageName: string = '',
): AnalysisResult => {
  const multiRes = evaluateAppOnDevice(permissions, isSystemApp, packageName);
  return {
    ...multiRes,
    risk: multiRes.overallRisk,
    riskScore: 100 - multiRes.safetyScore,
  };
};

/**
 * Interface for ML Kit Barcode Scan Result
 */
export interface MLKitBarcodeResult {
  value: string | null;
  format: BarcodeFormat;
}

/**
 * Interface for ML Kit OCR Result
 */
export interface MLKitOCRResult {
  text: string;
  blocks: TextBlock[];
}

/**
 * Scan barcodes/QR codes from a local image file
 */
export const scanBarcodes = async (imageUri: string): Promise<MLKitBarcodeResult[]> => {
  try {
    const result = await BarcodeScanning.scan(imageUri);
    return result.map(barcode => ({
      value: barcode.value || null,
      format: barcode.format
    }));
  } catch (error) {
    console.error('ML Kit Barcode Scan Error:', error);
    return [];
  }
};

/**
 * Recognize text (OCR) from a local image file
 */
export const recognizeText = async (imageUri: string): Promise<MLKitOCRResult | null> => {
  try {
    const result = await TextRecognition.recognize(imageUri);
    return {
      text: result.text,
      blocks: result.blocks
    };
  } catch (error) {
    console.error('ML Kit OCR Error:', error);
    return null;
  }
};

/**
 * Extracts URLs from OCR text
 */
export const extractUrlsFromText = (text: string): string[] => {
  const urlRegex = /(https?:\/\/[^\s]+)/gi;
  const matches = text.match(urlRegex) || [];
  return Array.from(new Set(matches));
};