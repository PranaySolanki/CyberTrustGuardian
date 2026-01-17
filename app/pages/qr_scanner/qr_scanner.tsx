import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/services/auth/authContext';
import { analyzeQrCode } from '@/services/calls/gemini';
import { safeBrowsingCheck } from '@/services/calls/safeBrowsing';
import { setLastQrResult } from '@/services/storage/qrStore';
import { recordScan } from '@/services/storage/scanHistory';
import { validateAndNormalizeUrl } from '@/services/utils/urlValidator';
import { Ionicons } from '@expo/vector-icons';
import BarcodeScanner from '@react-native-ml-kit/barcode-scanning';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Clipboard from 'expo-clipboard';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

export default function QRScanner() {
  const { colors, isDarkMode } = useTheme();
  const [permission, requestPermission] = useCameraPermissions();
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Analyzing URL Safety...');
  const [cameraActive, setCameraActive] = useState(false);
  const [manualUrl, setManualUrl] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const isMounted = useRef(true);
  const isProcessingScan = useRef(false);
  const isAnalyzing = useRef(false);
  const cameraRef = useRef<CameraView>(null);
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    isMounted.current = true;
    if (!permission?.granted) {
      requestPermission();
    }
    return () => {
      isMounted.current = false;
    };
  }, [permission, requestPermission]);


  const safeBrowsingApi = async (url: string) => {
    if (isAnalyzing.current) {
      Alert.alert('Analysis in Progress', 'Please wait for the current analysis to complete.');
      return;
    }

    const validation = validateAndNormalizeUrl(url);

    if (!validation.isValid) {
      Alert.alert(
        'Invalid URL',
        validation.error || 'Please enter a valid URL format.\n\nExample: https://example.com',
        [{ text: 'OK' }]
      );
      return;
    }

    const validatedUrl = validation.normalizedUrl!;

    try {
      isAnalyzing.current = true;
      setLoading(true);
      setLoadingMessage('Validating URL...');

      await new Promise(resolve => setTimeout(resolve, 300));

      setLoadingMessage('Checking Google Safe Browsing database...');

      const [safeBrowsingResult, geminiResult] = await Promise.allSettled([
        (async () => {
          setLoadingMessage('Checking Google Safe Browsing database...');
          return await safeBrowsingCheck(validatedUrl);
        })(),
        (async () => {
          setLoadingMessage('Analyzing with AI security engine...');
          return await analyzeQrCode(validatedUrl);
        })()
      ]);

      setLoadingMessage('Combining results...');

      let hasThreats = false;
      let threatDetails = '';
      let safeBrowsingSkipped = false;

      if (safeBrowsingResult.status === 'fulfilled') {
        const sbData = safeBrowsingResult.value;
        if (sbData === null) {
          safeBrowsingSkipped = true;
        } else if (sbData.matches && sbData.matches.length > 0) {
          hasThreats = true;
          const threats = sbData.matches.map((match: any) =>
            `${match.threatType} (${match.platformType})`
          ).join(', ');
          threatDetails = `Google Safe Browsing detected: ${threats}. `;
        }
      }

      let finalRisk: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
      let finalScore = 0;
      let finalReason = '';

      if (geminiResult.status === 'fulfilled') {
        const geminiData = geminiResult.value;
        finalRisk = geminiData.risk || 'LOW';
        finalScore = geminiData.score || 0;
        finalReason = geminiData.reason || 'No specific threats detected.';
      } else {
        console.error('Gemini analysis failed:', geminiResult.reason);
        finalReason = 'AI analysis unavailable. ';
      }

      if (hasThreats) {
        finalRisk = 'HIGH';
        finalScore = Math.min(finalScore, 10);
        finalReason = threatDetails + finalReason;
      }

      let safeBrowsingText = 'Not checked';
      if (safeBrowsingSkipped || (safeBrowsingResult.status === 'fulfilled' && safeBrowsingResult.value === null)) {
        safeBrowsingText = 'API key not configured - check skipped';
      } else if (safeBrowsingResult.status === 'fulfilled') {
        const sbData = safeBrowsingResult.value;
        if (sbData && sbData.matches && sbData.matches.length > 0) {
          const threats = sbData.matches.map((match: any) => `${match.threatType}`).join(', ');
          safeBrowsingText = `⚠️ THREATS DETECTED: ${threats}`;
        } else {
          safeBrowsingText = '✓ No threats detected';
        }
      } else if (safeBrowsingResult.status === 'rejected') {
        safeBrowsingText = 'Check failed - Gemini analysis used instead';
      }

      const geminiText = finalReason.trim() || 'Analysis completed.';

      const result = {
        risk: finalRisk,
        score: finalScore,
        reason: finalReason.trim() || 'Analysis completed.',
        content: validatedUrl,
        safeBrowsingResult: safeBrowsingText,
        geminiResult: geminiText
      };

      setLastQrResult(result);

      if (user) {
        const status = finalRisk === 'HIGH' ? 'Dangerous' : finalRisk === 'MEDIUM' ? 'Suspicious' : 'Safe';
        recordScan(user.id, 'QR', status, `${validatedUrl.substring(0, 30)}...`, result);
      }

      setLoadingMessage('Analysis complete!');
      await new Promise(resolve => setTimeout(resolve, 500));

      router.push('/pages/qr_scanner/scan_result');
    } catch (error) {
      console.error('Analysis error:', error);
      Alert.alert('Error', 'Failed to analyze the URL. Please try again.');
    } finally {
      if (isMounted.current) {
        setLoading(false);
        setLoadingMessage('Analyzing URL Safety...');
      }
      isAnalyzing.current = false;
    }
  }


  const handleBarcodeScanned = async ({ data }: { data: string }) => {
    if (!cameraActive || isProcessingScan.current) return;

    isProcessingScan.current = true;
    setCameraActive(false);

    const validation = validateAndNormalizeUrl(data);

    if (validation.isValid) {
      setManualUrl(validation.normalizedUrl!);
    } else {
      setManualUrl(data);

      if (user) {
        recordScan(user.id, 'QR', 'Safe', data.substring(0, 30));
      }

      Alert.alert(
        'QR Code Scanned',
        `Scanned content: ${data.substring(0, 50)}${data.length > 50 ? '...' : ''}\n\n${validation.error || 'This QR code does not contain a valid URL.'}\n\nYou can edit it manually if needed.`,
        [{ text: 'OK' }]
      );
    }

    setTimeout(() => {
      isProcessingScan.current = false;
    }, 1000);
  };



  const handleCopyToClipboard = async () => {
    if (manualUrl) {
      await Clipboard.setStringAsync(manualUrl);
      Alert.alert('Copied', 'URL copied to clipboard');
    }
  };

  const pickImageFromGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 1,
        base64: true,
      });

      if (!result.canceled && result.assets.length > 0) {
        const imageAsset = result.assets[0];
        const imageUri = imageAsset.uri;
        setSelectedImage(imageUri);
        scanImageForBarcode(imageUri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image from gallery');
    }
  };

  const scanImageForBarcode = async (imageUri: string) => {
    if (isAnalyzing.current) {
      Alert.alert('Processing in Progress', 'Please wait for the current image processing to complete.');
      return;
    }

    try {
      isAnalyzing.current = true;
      setLoading(true);
      setLoadingMessage('Processing image...');

      setLoadingMessage('Scanning for QR codes...');
      const barcodes = await BarcodeScanner.scan(imageUri);

      if (!barcodes || barcodes.length === 0) {
        if (isMounted.current) {
          setLoading(false);
          setLoadingMessage('Analyzing URL Safety...');
        }
        isAnalyzing.current = false;
        Alert.alert(
          'No QR Code Found',
          'No QR code was detected in the selected image. Please try another image or use the camera to scan directly.',
          [{ text: 'OK' }]
        );
        return;
      }

      const qrData = barcodes[0].value;

      if (!qrData) {
        throw new Error('Could not read QR code data');
      }

      const qrValidation = validateAndNormalizeUrl(qrData);

      if (!qrValidation.isValid) {
        setManualUrl(qrData);

        if (isMounted.current) {
          setLoading(false);
          setLoadingMessage('Analyzing URL Safety...');
        }
        isAnalyzing.current = false;

        Alert.alert(
          'QR Code Detected (Not a URL)',
          `Found QR code content: ${qrData.substring(0, 50)}${qrData.length > 50 ? '...' : ''}\n\n${qrValidation.error || 'This QR code does not contain a valid URL.'}\n\nYou can edit it manually if needed.`,
          [{ text: 'OK' }]
        );
        return;
      }

      setManualUrl(qrValidation.normalizedUrl!);

      if (isMounted.current) {
        setLoading(false);
      }
    } catch (error) {
      console.error('Error scanning image for QR code:', error);
      if (isMounted.current) {
        setLoading(false);
        setLoadingMessage('Analyzing URL Safety...');
        setSelectedImage(null);
      }
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Unable to process image. Please try again.'
      );
    } finally {
      isAnalyzing.current = false;
    }
  };

  if (!permission) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={[styles.permissionContainer, { backgroundColor: colors.background }]}>
        <Ionicons name="camera-outline" size={60} color={colors.accent} />
        <Text style={[styles.permissionTitle, { color: colors.textPrimary }]}>Camera Permission Required</Text>
        <Text style={[styles.permissionText, { color: colors.textSecondary }]}>
          We need camera access to scan QR codes
        </Text>
        <TouchableOpacity
          style={[styles.permissionButton, { backgroundColor: colors.accent }]}
          onPress={requestPermission}
        >
          <Text style={[styles.permissionButtonText, { color: colors.background }]}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={[styles.loadingText, { color: colors.accent }]}>{loadingMessage}</Text>
        <Text style={[styles.loadingSubtext, { color: colors.textSecondary }]}>This may take a few seconds...</Text>
      </View>
    );
  }

  if (cameraActive) {
    return (
      <View style={styles.container}>
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          barcodeScannerSettings={{
            barcodeTypes: ['qr'],
          }}
          onBarcodeScanned={cameraActive ? handleBarcodeScanned : undefined}
        />
        <View style={styles.cameraOverlay}>
          <View style={[styles.cornerTopLeft, { borderColor: colors.accent }]} />
          <View style={[styles.cornerTopRight, { borderColor: colors.accent }]} />
          <View style={[styles.cornerBottomLeft, { borderColor: colors.accent }]} />
          <View style={[styles.cornerBottomRight, { borderColor: colors.accent }]} />

          <Ionicons
            name="camera-outline"
            size={50}
            color={colors.textSecondary}
            style={styles.cameraIcon}
          />
          <Text style={[styles.cameraText, { color: colors.textSecondary }]}>Point camera at a QR code</Text>

          <TouchableOpacity
            style={styles.closeCameraButton}
            onPress={() => setCameraActive(false)}
          >
            <Ionicons name="close" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

      </View >
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.content, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>QR Safety Scanner</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>Scan codes securely before visiting</Text>
        </View>

        <View style={[styles.cameraSection, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.corner, styles.cornerTL, { borderColor: colors.accent }]} />
          <View style={[styles.corner, styles.cornerTR, { borderColor: colors.accent }]} />
          <View style={[styles.corner, styles.cornerBL, { borderColor: colors.accent }]} />
          <View style={[styles.corner, styles.cornerBR, { borderColor: colors.accent }]} />

          {selectedImage ? (
            <>
              <Image
                source={{ uri: selectedImage }}
                style={styles.selectedImage}
              />
              <TouchableOpacity
                style={styles.clearImageButton}
                onPress={() => {
                  setSelectedImage(null);
                  setManualUrl('');
                }}
              >
                <Ionicons name="close" size={20} color="#fff" />
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Ionicons name="camera-outline" size={48} color={isDarkMode ? colors.textSecondary : '#999'} />
              <Text style={[styles.cameraPrompt, { color: colors.textSecondary }]}>Point camera at a QR code</Text>
            </>
          )}

          <View style={styles.buttonGroup}>
            <TouchableOpacity
              style={[styles.activateCameraButton, { backgroundColor: colors.accent }, (loading || isAnalyzing.current) && styles.buttonDisabled]}
              onPress={() => setCameraActive(true)}
              disabled={loading || isAnalyzing.current}
            >
              <Ionicons name="camera" size={20} color={colors.background} style={styles.buttonIcon} />
              <Text style={[styles.activateCameraButtonText, { color: colors.background }]}>Camera</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.galleryButton, { backgroundColor: colors.accent }, (loading || isAnalyzing.current) && styles.buttonDisabled]}
              onPress={pickImageFromGallery}
              disabled={loading || isAnalyzing.current}
            >
              <Ionicons name="image" size={20} color={colors.background} style={styles.buttonIcon} />
              <Text style={[styles.galleryButtonText, { color: colors.background }]}>Gallery</Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.orText, { color: colors.textSecondary }]}>OR ENTER MANUALLY</Text>
        </View>

        <View style={styles.urlInputSection}>
          <View style={[styles.urlInputWrapper, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <TextInput
              style={[styles.urlInput, { color: colors.textPrimary }]}
              placeholder="https://example.com"
              placeholderTextColor={colors.textSecondary}
              value={manualUrl}
              onChangeText={setManualUrl}
              editable={true}
            />
            {manualUrl && (
              <TouchableOpacity
                style={styles.copyButton}
                onPress={handleCopyToClipboard}
              >
                <Ionicons name="copy" size={20} color={colors.accent} />
              </TouchableOpacity>
            )}
          </View>
          {manualUrl && (
            <TouchableOpacity
              style={[styles.analyzeButton, { backgroundColor: colors.accent }, loading && styles.analyzeButtonDisabled]}
              onPress={() => safeBrowsingApi(manualUrl)}
              disabled={loading || isAnalyzing.current}
            >
              {loading ? (
                <ActivityIndicator size="small" color={colors.background} style={{ marginRight: 8 }} />
              ) : null}
              <Text style={[styles.analyzeButtonText, { color: colors.background }]}>
                {loading ? 'Analyzing...' : 'Analyze URL'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={[styles.footer, { borderTopColor: colors.border }]}>
          <Text style={[styles.footerText, { color: colors.textSecondary }]}>
            We analyze the destination URL for phishing and malware before you visit.
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'space-between',
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cornerTopLeft: {
    position: 'absolute',
    top: 60,
    left: 30,
    width: 40,
    height: 40,
    borderTopWidth: 3,
    borderLeftWidth: 3,
  },
  cornerTopRight: {
    position: 'absolute',
    top: 60,
    right: 30,
    width: 40,
    height: 40,
    borderTopWidth: 3,
    borderRightWidth: 3,
  },
  cornerBottomLeft: {
    position: 'absolute',
    bottom: 60,
    left: 30,
    width: 40,
    height: 40,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
  },
  cornerBottomRight: {
    position: 'absolute',
    bottom: 60,
    right: 30,
    width: 40,
    height: 40,
    borderBottomWidth: 3,
    borderRightWidth: 3,
  },
  cameraIcon: {
    marginBottom: 10,
  },
  cameraText: {
    fontSize: 14,
    marginBottom: 20,
    fontWeight: '500',
  },
  closeCameraButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    marginBottom: 30,
    marginTop: 10,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 6,
  },
  headerSubtitle: {
    fontSize: 14,
    fontWeight: '400',
  },
  cameraSection: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 30,
    alignItems: 'center',
    position: 'relative',
    marginBottom: 24,
  },
  corner: {
    position: 'absolute',
    width: 20,
    height: 20,
  },
  cornerTL: {
    top: 12,
    left: 12,
    borderTopWidth: 2,
    borderLeftWidth: 2,
  },
  cornerTR: {
    top: 12,
    right: 12,
    borderTopWidth: 2,
    borderRightWidth: 2,
  },
  cornerBL: {
    bottom: 12,
    left: 12,
    borderBottomWidth: 2,
    borderLeftWidth: 2,
  },
  cornerBR: {
    bottom: 12,
    right: 12,
    borderBottomWidth: 2,
    borderRightWidth: 2,
  },
  cameraPrompt: {
    fontSize: 14,
    marginTop: 16,
    marginBottom: 24,
    fontWeight: '500',
  },
  selectedImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 20,
    resizeMode: 'contain',
  },
  clearImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  activateCameraButton: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  galleryButton: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonIcon: {
    marginRight: 8,
  },
  activateCameraButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },
  galleryButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },
  orText: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  urlInputSection: {
    marginBottom: 24,
  },
  urlInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  urlInput: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 14,
    fontWeight: '500',
  },
  copyButton: {
    padding: 8,
  },
  analyzeButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  analyzeButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },
  footer: {
    paddingTop: 20,
    borderTopWidth: 1,
  },
  footerText: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '400',
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  loadingSubtext: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: '400',
    textAlign: 'center',
  },
  analyzeButtonDisabled: {
    opacity: 0.6,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  permissionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 8,
  },
  permissionText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
  },
  permissionButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  permissionButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
