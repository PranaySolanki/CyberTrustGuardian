import { analyzeQrCode } from '@/services/calls/gemini';
import { setLastQrResult } from '@/services/storage/qrStore';
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
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

export default function QRScanner() {
  const [permission, requestPermission] = useCameraPermissions();
  const [loading, setLoading] = useState(false);
  const [scannedData, setScannedData] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [manualUrl, setManualUrl] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  
  // FIX: Use refs to track lifecycle and prevent multiple triggers
  const isMounted = useRef(true);
  const isProcessingScan = useRef(false);
  const cameraRef = useRef<CameraView>(null);
  const router = useRouter();

  // FIX: Memoize safety checker to prevent recreation on every render

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


  }

  // const sentToGemini = async () => {
  //   if (!url.trim()) {
  //     Alert.alert('Error', 'Please enter a valid URL');
  //     return;
  //   }

  //   try {
  //     setLoading(true);
  //     const result = await analyzeQrCode(url);
  //     if (result) {
  //       // Save to shared store and navigate without params (previous behaviour)
  //       setLastQrResult({ ...result, content: url });
  //       router.push('/pages/qr_scanner/scan_result');
  //     }
  //   } catch (error) {
  //     console.error('Analysis error:', error);
  //     Alert.alert('Error', 'Failed to analyze the URL');
  //   } finally {
  //     if (isMounted.current) setLoading(false);
  //   }
  // };

  const handleBarcodeScanned = async ({ data }: { data: string }) => {
    // FIX: Comprehensive check to prevent multiple fires and ensure camera is active
    if (!cameraActive || isProcessingScan.current) return;
    
    isProcessingScan.current = true;
    setCameraActive(false); // FIX: Immediately disable camera view
    
    setScannedData(data);
    setManualUrl(data);


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
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 1,
      });

      if (!result.canceled && result.assets.length > 0) {
        const imageUri = result.assets[0].uri;
        setSelectedImage(imageUri);
        scanImageForBarcode(imageUri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image from gallery');
    }
  };

  const scanImageForBarcode = async (imageUri: string) => {
    setLoading(true);
    try {
      // Manual QR decoding from images logic would go here
      if (isMounted.current) setLoading(false);
      Alert.alert('Image Selected', 'Please manually enter the URL from the QR code, or use the Camera to scan it directly.');
    } catch (error) {
      console.error('Error with image:', error);
      if (isMounted.current) {
        setLoading(false);
        setSelectedImage(null);
      }
      Alert.alert('Error', 'Unable to process image');
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
        <Text style={styles.loadingText}>Analyzing URL Safety...</Text>
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
        >
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
        </CameraView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>QR Safety Scanner</Text>
          <Text style={styles.headerSubtitle}>Scan codes securely before visiting</Text>
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
                  setScannedData(null);
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
              style={styles.activateCameraButton}
              onPress={() => setCameraActive(true)}
            >
              <Ionicons name="camera" size={20} color="#fff" style={styles.buttonIcon} />
              <Text style={styles.activateCameraButtonText}>Camera</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.galleryButton}
              onPress={pickImageFromGallery}
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
              style={styles.analyzeButton}
              onPress={() => safeBrowsingApi(manualUrl)}
            >
              <Text style={styles.analyzeButtonText}>Analyze URL</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
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
    backgroundColor: '#F8FAFF',
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFF',
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
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
  header: {
    marginBottom: 30,
    marginTop: 10,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 6,
  },
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
    fontSize: 14,
    color: '#2563EB',
    fontWeight: '600',
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