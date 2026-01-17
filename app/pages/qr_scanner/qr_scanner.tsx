import { useAuth } from '@/services/auth/authContext';
import { analyzeQrCode, extractQrCodeFromImage } from '@/services/calls/gemini';
import { safeBrowsingCheck } from '@/services/calls/safeBrowsing';
import { setLastQrResult } from '@/services/storage/qrStore';
import { recordScan } from '@/services/storage/scanHistory';
import { validateAndNormalizeUrl } from '@/services/utils/urlValidator';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Clipboard from 'expo-clipboard';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function QRScanner() {
  const [permission, requestPermission] = useCameraPermissions();
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Analyzing URL Safety...');
  // Removed scannedData state as it's not used - manualUrl serves the same purpose
  const [cameraActive, setCameraActive] = useState(false);
  const [manualUrl, setManualUrl] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // FIX: Use refs to track lifecycle and prevent multiple triggers
  const isMounted = useRef(true);
  const isProcessingScan = useRef(false);
  const isAnalyzing = useRef(false); // Prevent multiple simultaneous API calls
  const cameraRef = useRef<CameraView>(null);
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    isMounted.current = true;
    // Alert.alert('Debug User', user ? `Logged in: ${user.id}` : 'No User Found');
    if (!permission?.granted) {
      requestPermission();
    }
    return () => {
      isMounted.current = false;
    };
  }, [permission, requestPermission]);


  const safeBrowsingApi = async (url: string) => {
    // Prevent multiple simultaneous requests
    if (isAnalyzing.current) {
      Alert.alert('Analysis in Progress', 'Please wait for the current analysis to complete.');
      return;
    }

    // Comprehensive URL validation
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

      // Small delay to show validation message
      await new Promise(resolve => setTimeout(resolve, 300));

      setLoadingMessage('Checking Google Safe Browsing database...');

      // Run both checks in parallel for better performance
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

      // Check Safe Browsing results
      let hasThreats = false;
      let threatDetails = '';
      let safeBrowsingSkipped = false;

      if (safeBrowsingResult.status === 'fulfilled') {
        const sbData = safeBrowsingResult.value;
        if (sbData === null) {
          // API key not configured - skip silently
          safeBrowsingSkipped = true;
        } else if (sbData.matches && sbData.matches.length > 0) {
          hasThreats = true;
          const threats = sbData.matches.map((match: any) =>
            `${match.threatType} (${match.platformType})`
          ).join(', ');
          threatDetails = `Google Safe Browsing detected: ${threats}. `;
        }
      }

      // Get Gemini analysis results
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

      // Combine results: Safe Browsing threats override Gemini analysis
      if (hasThreats) {
        finalRisk = 'HIGH';
        finalScore = Math.min(finalScore, 10); // Ensure low safety score if threats found
        finalReason = threatDetails + finalReason;
      }

      // Combine Safe Browsing failure info if applicable
      // Note: We don't add Safe Browsing status to conclusion - Gemini analysis is sufficient
      if (safeBrowsingSkipped || (safeBrowsingResult.status === 'fulfilled' && safeBrowsingResult.value === null)) {
        // API key not configured or invalid - silently skip
        // Analysis continues with Gemini only, which is sufficient
      } else if (safeBrowsingResult.status === 'rejected') {
        // This should rarely happen now since we return null instead of throwing
        // But handle it gracefully if it does
        const error = safeBrowsingResult.reason;
        // Only log if it's not an API key related error
        if (!(error && typeof error === 'object' && 'isApiKeyError' in error)) {
          console.warn('Safe Browsing check failed:', error);
        }
        // Don't add to conclusion - Gemini analysis is sufficient
      }

      // Format Safe Browsing result for display
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

      // Format Gemini result for display
      const geminiText = finalReason.trim() || 'Analysis completed.';

      // Save result and navigate
      const result = {
        risk: finalRisk,
        score: finalScore,
        reason: finalReason.trim() || 'Analysis completed.',
        content: validatedUrl,
        safeBrowsingResult: safeBrowsingText,
        geminiResult: geminiText
      };

      setLastQrResult(result);

      // Record scan in history
      if (user) {
        // Map risk to status
        const status = finalRisk === 'HIGH' ? 'Dangerous' : finalRisk === 'MEDIUM' ? 'Suspicious' : 'Safe';
        recordScan(user.id, 'QR', status, `${validatedUrl.substring(0, 30)}...`, result);
      }

      // Small delay before navigation to show completion
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
    // FIX: Comprehensive check to prevent multiple fires and ensure camera is active
    if (!cameraActive || isProcessingScan.current) return;

    isProcessingScan.current = true;
    setCameraActive(false); // FIX: Immediately disable camera view



    // Validate the scanned QR code data
    const validation = validateAndNormalizeUrl(data);

    if (validation.isValid) {
      // Valid URL - set normalized version
      setManualUrl(validation.normalizedUrl!);

      // Auto analyze
      safeBrowsingApi(validation.normalizedUrl!);
    } else {
      // Not a valid URL, but still show the raw data so user can edit it
      setManualUrl(data);

      // Record as Safe/Unknown since it's just text
      if (user) {
        recordScan(user.id, 'QR', 'Safe', data.substring(0, 30));
      }

      // Show validation error but don't block the user
      Alert.alert(
        'QR Code Scanned',
        `Scanned content: ${data.substring(0, 50)}${data.length > 50 ? '...' : ''}\n\n${validation.error || 'This QR code does not contain a valid URL.'}\n\nYou can edit it manually if needed.`,
        [{ text: 'OK' }]
      );
    }

    // Reset processing lock after a delay to allow future scans
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
        // Using array format for new API (MediaTypeOptions deprecated)
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 1,
        base64: true, // Get base64 for easier processing
      });

      if (!result.canceled && result.assets.length > 0) {
        const imageAsset = result.assets[0];
        const imageUri = imageAsset.uri;
        setSelectedImage(imageUri);
        scanImageForBarcode(imageUri, imageAsset.base64 || undefined);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image from gallery');
    }
  };

  const scanImageForBarcode = async (imageUri: string, base64Data?: string) => {
    // Prevent multiple simultaneous image scans
    if (isAnalyzing.current) {
      Alert.alert('Processing in Progress', 'Please wait for the current image processing to complete.');
      return;
    }

    try {
      isAnalyzing.current = true;
      setLoading(true);
      setLoadingMessage('Processing image...');

      // Use base64 if available, otherwise use URI
      const imageData = base64Data
        ? `data:image/jpeg;base64,${base64Data}`
        : imageUri;

      setLoadingMessage('Extracting QR code from image...');
      const qrData = await extractQrCodeFromImage(imageData);

      if (!qrData) {
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

      // Validate the extracted QR code data
      const qrValidation = validateAndNormalizeUrl(qrData);

      if (!qrValidation.isValid) {
        // QR code found but not a valid URL - still show it to user
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

      // Valid URL found - set it in the input field
      setManualUrl(qrValidation.normalizedUrl!);

      if (isMounted.current) {
        setLoading(false);
      }

      // Optionally auto-analyze the QR code
      Alert.alert(
        'QR Code Detected',
        `Found QR code: ${qrValidation.normalizedUrl!.substring(0, 50)}${qrValidation.normalizedUrl!.length > 50 ? '...' : ''}\n\nWould you like to analyze it now?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Analyze',
            onPress: () => safeBrowsingApi(qrValidation.normalizedUrl!)
          }
        ]
      );
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
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Ionicons name="camera-outline" size={60} color="#2563EB" />
        <Text style={styles.permissionTitle}>Camera Permission Required</Text>
        <Text style={styles.permissionText}>
          We need camera access to scan QR codes
        </Text>
        <TouchableOpacity
          style={styles.permissionButton}
          onPress={requestPermission}
        >
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>{loadingMessage}</Text>
        <Text style={styles.loadingSubtext}>This may take a few seconds...</Text>
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
          // FIX: Only pass handler if camera is logically active
          onBarcodeScanned={cameraActive ? handleBarcodeScanned : undefined}
        />
        <View style={styles.cameraOverlay}>
          <View style={styles.cornerTopLeft} />
          <View style={styles.cornerTopRight} />
          <View style={styles.cornerBottomLeft} />
          <View style={styles.cornerBottomRight} />

          <Ionicons
            name="camera-outline"
            size={50}
            color="#999"
            style={styles.cameraIcon}
          />
          <Text style={styles.cameraText}>Point camera at a QR code</Text>

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
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={[
            styles.content,
            { flexGrow: 1, justifyContent: 'space-between' } // Ensure space-between works with ScrollView
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Standard Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
              <Ionicons name="arrow-back" size={24} color="#1E293B" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>QR Scanner</Text>
            <View style={{ width: 40 }} />
          </View>

          <View style={styles.cameraSection}>
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} />
            <View style={[styles.corner, styles.cornerBR]} />

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
                <Ionicons name="camera-outline" size={48} color="#999" />
                <Text style={styles.cameraPrompt}>Point camera at a QR code</Text>
              </>
            )}

            <View style={styles.buttonGroup}>
              <TouchableOpacity
                style={[styles.activateCameraButton, (loading || isAnalyzing.current) && styles.buttonDisabled]}
                onPress={() => setCameraActive(true)}
                disabled={loading || isAnalyzing.current}
              >
                <Ionicons name="camera" size={20} color="#fff" style={styles.buttonIcon} />
                <Text style={styles.activateCameraButtonText}>Camera</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.galleryButton, (loading || isAnalyzing.current) && styles.buttonDisabled]}
                onPress={pickImageFromGallery}
                disabled={loading || isAnalyzing.current}
              >
                <Ionicons name="image" size={20} color="#fff" style={styles.buttonIcon} />
                <Text style={styles.galleryButtonText}>Gallery</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.orText}>OR ENTER MANUALLY</Text>
          </View>

          <View style={styles.urlInputSection}>
            <View style={styles.urlInputWrapper}>
              <TextInput
                style={styles.urlInput}
                placeholder="https://example.com"
                placeholderTextColor="#666"
                value={manualUrl}
                onChangeText={setManualUrl}
                editable={true}
              />
              {manualUrl && (
                <TouchableOpacity
                  style={styles.copyButton}
                  onPress={handleCopyToClipboard}
                >
                  <Ionicons name="copy" size={20} color="#2563EB" />
                </TouchableOpacity>
              )}
            </View>
            {manualUrl && (
              <TouchableOpacity
                style={[styles.analyzeButton, loading && styles.analyzeButtonDisabled]}
                onPress={() => safeBrowsingApi(manualUrl)}
                disabled={loading || isAnalyzing.current}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#fff" style={{ marginRight: 8 }} />
                ) : null}
                <Text style={styles.analyzeButtonText}>
                  {loading ? 'Analyzing...' : 'Analyze URL'}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              We analyze the destination URL for phishing and malware before you visit.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFF',
  },
  content: {
    flex: 1,
    padding: 16,
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFF',
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
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
    borderColor: '#2563EB',
  },
  cornerTopRight: {
    position: 'absolute',
    top: 60,
    right: 30,
    width: 40,
    height: 40,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderColor: '#2563EB',
  },
  cornerBottomLeft: {
    position: 'absolute',
    bottom: 60,
    left: 30,
    width: 40,
    height: 40,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderColor: '#2563EB',
  },
  cornerBottomRight: {
    position: 'absolute',
    bottom: 60,
    right: 30,
    width: 40,
    height: 40,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderColor: '#2563EB',
  },
  cameraIcon: {
    marginBottom: 10,
  },
  cameraText: {
    color: '#999',
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
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#0F172A", letterSpacing: 0.5 },
  iconBtn: { padding: 8, backgroundColor: "#FFF", borderRadius: 12, borderWidth: 1, borderColor: "#E2E8F0" },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '400',
  },
  cameraSection: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    padding: 30,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    position: 'relative',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  corner: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderColor: '#2563EB',
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
    color: '#6B7280',
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
  imageLoadedText: {
    color: '#2563EB',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  instructionText: {
    color: '#6B7280',
    fontSize: 12,
    marginBottom: 20,
    fontWeight: '400',
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
    backgroundColor: '#2563EB',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  galleryButton: {
    flex: 1,
    backgroundColor: '#2563EB',
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
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  galleryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  orText: {
    color: '#9CA3AF',
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
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  urlInput: {
    flex: 1,
    color: '#0F172A',
    fontSize: 14,
    paddingVertical: 14,
    fontWeight: '500',
  },
  copyButton: {
    padding: 8,
  },
  analyzeButton: {
    backgroundColor: '#2563EB',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  analyzeButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  footer: {
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  footerText: {
    color: '#64748B',
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '400',
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#F8FAFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#2563EB',
    fontWeight: '600',
    textAlign: 'center',
  },
  loadingSubtext: {
    marginTop: 8,
    fontSize: 12,
    color: '#6B7280',
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
    backgroundColor: '#F8FAFF',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  permissionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 16,
    marginBottom: 8,
  },
  permissionText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  permissionButton: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  permissionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
});