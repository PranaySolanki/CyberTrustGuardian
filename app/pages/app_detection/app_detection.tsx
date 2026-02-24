import { useAuth } from "@/services/auth/authContext";
import { API_BASE_URL } from "@/services/config";
import { clearLastAppResult } from "@/services/storage/appStore";
import useAppScanner, { AppResult } from "@/services/useAppScanner";
import { useTFLiteClassifier } from "@/services/useTFLiteModel";
import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type AppItem = AppResult;

export default function AppDetection() {
  // ✅ STATE MUST BE HERE (before return)

  /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
  const { apps, loading: appsLoading, error: appsError, getAppPermissions, getAppIcon } = useAppScanner();

  const { user } = useAuth();
  const { predict, isReady } = useTFLiteClassifier();
  const [selectedApk, setSelectedApk] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const router = useRouter();



  const handleScan = async (item: AppItem) => {
    try {
      setIsScanning(true);

      // Fetch permissions from native module
      const permissions = await getAppPermissions(item.packageName);

      // Run on-device TFLite inference with app context for Trust Dampener
      const analysis = predict(permissions, item.isSystemApp ?? false, item.packageName);

      // Clear any stale store data so scan_result uses our fresh params
      clearLastAppResult();

      router.push({
        pathname: "/pages/app_detection/scan_result",
        params: {
          package_name: item.packageName,
          appName: item.appName,
          status: analysis.risk === 'HIGH' ? 'Dangerous' : analysis.risk === 'MEDIUM' ? 'Suspicious' : 'Safe',
          score: Math.max(5, 100 - (isNaN(analysis.riskScore) ? 0 : analysis.riskScore)),
          reason: analysis.reason,
          recommendation: analysis.recommendation,
          details: item.appName,
        }
      });
    } catch (e: any) {
      console.error("Scan error details:", e);
      Alert.alert("Scan Failed", `Error: ${e.message || JSON.stringify(e)}`);
    } finally {
      setIsScanning(false);
    }
  };

  const [analysisResult, setAnalysisResult] = useState<{
    package_name: string;
    permissions: string[];
  } | null>(null);

  const apkLoadPermissions = async (asset?: DocumentPicker.DocumentPickerAsset | any) => {
    const isAsset = asset && asset.uri;
    const targetApk = isAsset ? asset : selectedApk;

    if (!targetApk) return;

    setIsScanning(true);
    setAnalysisResult(null);

    const formData = new FormData();
    // @ts-ignore
    formData.append("apk", {
      uri: targetApk.uri,
      name: targetApk.name,
      type: "application/vnd.android.package-archive",
    });

    try {
      const response = await fetch(`${API_BASE_URL}/upload`, {
        method: "POST",
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setAnalysisResult(data);
        if (data.permissions && data.permissions.length === 0) {
          Alert.alert("Scan Complete", "No permissions found.");
        }
      } else {
        Alert.alert("Error", data.error || "Server error");
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Connection Failed", "Check backend server.");
    } finally {
      setIsScanning(false);
    }

  };

  const pickApk = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "application/vnd.android.package-archive",
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setSelectedApk(asset);
        await apkLoadPermissions(asset);
      }
    } catch (error) {
      console.log("APK selection error:", error);
    }
  };


  const apkHandleScan = async () => {
    if (!selectedApk || !analysisResult) {
      Alert.alert("No Data", "Please select an APK first.");
      return;
    }

    try {
      setIsScanning(true);
      const appName = selectedApk.name || "Unknown App";

      

      // Navigate to result
      router.push("/pages/app_detection/scan_result");

    } catch (error) {
      console.error("Scan error:", error);
      Alert.alert("Scan Failed", "Could not analyze the selected APK.");
    } finally {
      setIsScanning(false);
    }
  };

  const AppItemRow = ({ item, onScan, getIcon }: { item: AppItem, onScan: (item: AppItem) => void, getIcon: (pkg: string) => Promise<string | null> }) => {
    const [iconUri, setIconUri] = useState<string | null>(null);

    useEffect(() => {
      let mounted = true;
      getIcon(item.packageName).then(uri => {
        if (mounted && uri) setIconUri(uri);
      });
      return () => { mounted = false; };
    }, [item.packageName, getIcon]);

    return (
      <View style={styles.card}>
        <View style={[styles.left, { flex: 1 }]}>
          <View style={styles.iconBox}>
            {iconUri ? (
              <Image source={{ uri: iconUri }} style={{ width: 32, height: 32 }} borderRadius={8} />
            ) : (
              <Ionicons name="logo-android" size={20} color="#2563EB" />
            )}
          </View>
          <View style={{ minWidth: 0 }}>
            <Text style={styles.appName} numberOfLines={1} ellipsizeMode="tail">{item.appName}</Text>
            <Text style={{ fontSize: 10, color: '#64748B' }} numberOfLines={1} ellipsizeMode="tail">{item.packageName}</Text>
          </View>
        </View>
        <TouchableOpacity
          style={[styles.scanBtn, (!isReady || isScanning) && { opacity: 0.5 }]}
          onPress={() => onScan(item)}
          disabled={!isReady || isScanning}
        >
          <Text style={styles.scanText}>{isReady ? 'Scan' : '...'}</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Standard Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
            <Ionicons name="arrow-back" size={24} color="#1E293B" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>App Analyzer</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* ✅ APK SELECTOR BLOCK */}
        <View style={styles.apkBlock}>
          <View style={styles.apkTextBox}>
            <Text style={styles.apkText}>
              {selectedApk ? selectedApk.name : "No APK Selected"}
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.apkButton, isScanning && { opacity: 0.7 }]}
            onPress={pickApk}
            disabled={isScanning}
          >
            {isScanning ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.apkButtonText}>
                {selectedApk ? "Change APK" : "Select APK"}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* ✅ SCAN BUTTON */}
        {selectedApk && (
          <TouchableOpacity style={styles.scanApkButton} onPress={apkHandleScan} disabled={isScanning}>
            {isScanning ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="shield-checkmark" size={20} color="#FFFFFF" />
                <Text style={styles.scanApkButtonText}>Scan Selected APK</Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {/* --- SCROLLABLE PERMISSIONS DISPLAY SECTION --- */}
        {analysisResult && (
          <View style={styles.resultContainer}>
            <View style={styles.resultHeader}>
              <Ionicons name="apps" size={20} color="#2563EB" />
              <Text style={styles.resultPkgName}>{analysisResult.package_name}</Text>
            </View>

            <Text style={styles.permissionTitle}>
              Requested Permissions ({analysisResult.permissions.length})
            </Text>

            {/* Nested ScrollView for permissions */}
            <View style={styles.scrollArea}>
              <ScrollView
                nestedScrollEnabled={true}
                contentContainerStyle={styles.permissionList}
                showsVerticalScrollIndicator={true}
              >
                {analysisResult.permissions.map((perm, index) => {
                  const shortPerm = perm.split('.').pop();
                  const isDangerous = ["BIND_ACCESSIBILITY_SERVICE", "READ_CONTACTS", "USE_BIOMETRIC", "BIND_NOTIFICATION_LISTENER_SERVICE", "WRITE_EXTERNAL_STORAGE", "READ_EXTERNAL_STORAGE", "RECORD_AUDIO", "READ_SMS", "ACCESS_FINE_LOCATION"].includes(shortPerm || "");

                  return (
                    <View key={index} style={[styles.permBadge, isDangerous && styles.dangerBadge]}>
                      <Text style={[styles.permText, isDangerous && styles.dangerText]}>
                        {shortPerm}
                      </Text>
                      {isDangerous && <Ionicons name="alert-circle" size={12} color="#DC2626" style={{ marginLeft: 4 }} />}
                    </View>
                  );
                })}
              </ScrollView>
            </View>
          </View>
        )}


        {/* ✅ APP LIST */}
        <View style={{ marginTop: 10 }}>
          <Text style={{ fontSize: 16, fontWeight: '700', color: '#0F172A', marginBottom: 12, marginLeft: 4 }}>
            Installed Applications
          </Text>

          {appsLoading && (
            <View style={{ padding: 20, alignItems: "center" }}>
              <ActivityIndicator size="large" color="#2563EB" />
              <Text style={{ marginTop: 10, color: '#64748B' }}>Scanning installed apps...</Text>
            </View>
          )}

          {appsError && (
            <View style={{ padding: 16, backgroundColor: '#FEF2F2', borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: '#FECACA' }}>
              <Text style={{ color: '#DC2626', fontWeight: '600' }}>Unable to load apps</Text>
              <Text style={{ color: '#EF4444', fontSize: 12, marginTop: 4 }}>{appsError}</Text>
            </View>
          )}

          {!appsLoading && !appsError && apps.length === 0 && (
            <Text style={{ textAlign: "center", color: '#64748B', marginTop: 20 }}>No apps found.</Text>
          )}

          {apps.map((item, index) => (
            <AppItemRow key={`${item.packageName}-${index}`} item={item} onScan={handleScan} getIcon={getAppIcon} />
          ))}
        </View>


        {/* Spacer for bottom padding */}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFF",
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#0F172A", letterSpacing: 0.5 },
  iconBtn: { padding: 8, backgroundColor: "#FFF", borderRadius: 12, borderWidth: 1, borderColor: "#E2E8F0" },
  apkBlock: {
    flexDirection: "row",
    alignItems: "center",
  },
  apkTextBox: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginRight: 10,
  },
  apkText: {
    color: "#334155",
    fontSize: 13,
  },
  apkButton: {
    backgroundColor: "#2563EB",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  apkButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 13,
  },
  scanApkButton: {
    backgroundColor: "#10B981",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 18,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  scanApkButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 16,
    marginLeft: 8,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  left: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#E0ECFF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  appName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#0F172A",
  },
  scanBtn: {
    backgroundColor: "#2563EB",
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  scanText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 13,
  },
  resultContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 17,
    marginTop: 5,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    elevation: 2,
    marginBottom: 12
  },
  resultHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  resultPkgName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1E40AF",
    marginLeft: 8,
  },
  permissionTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#64748B",
    marginBottom: 10,
    textTransform: "uppercase",
  },
  scrollArea: {
    maxHeight: 200, // Limits the height of the permission block
    borderRadius: 8,
    backgroundColor: "#F9FBFF",
    padding: 5,
  },
  permissionList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    paddingBottom: 10,
  },
  permBadge: {
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#CBD5E1",
  },
  dangerBadge: {
    backgroundColor: "#FEF2F2",
    borderColor: "#FECACA",
  },
  permText: {
    fontSize: 11,
    fontWeight: "500",
    color: "#475569",
  },
  dangerText: {
    color: "#DC2626",
    fontWeight: "700",
  },
});