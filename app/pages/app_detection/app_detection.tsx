import { useAuth } from "@/services/auth/authContext";
import useAppScanner, { AppResult } from "@/services/useAppScanner";
import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import { cacheDirectory, deleteAsync, moveAsync } from 'expo-file-system/legacy';
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import ApkParser from "../../../modules/apk-parser";

type AppItem = AppResult;

const AppItemRow = React.memo(({ item, onScan, getIcon }: { item: AppItem, onScan: (item: AppItem) => void, getIcon: (pkg: string) => Promise<string | null> }) => {
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
      <TouchableOpacity style={styles.scanBtn} onPress={() => onScan(item)}>
        <Text style={styles.scanText}>Scan</Text>
      </TouchableOpacity>
    </View>
  );
});

export default function AppDetection() {
  // ✅ STATE MUST BE HERE (before return)

  const { apps, loading: appsLoading, error: appsError, getAppPermissions, getAppIcon } = useAppScanner();

  const { user } = useAuth();
  const [selectedApk, setSelectedApk] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const router = useRouter();



  const handleScan = React.useCallback(async (item: AppItem) => {
    try {
      //setIsScanning(true);

      // Fetch permissions fresh from native module
      //const permissions = await getAppPermissions(item.packageName);


      //  router.push("/pages/app_detection/scan_result");

    } catch (e) {
      console.error("Scan error:", e);
      Alert.alert("Scan Failed", "Could not analyze this app.");
    } finally {
      // setIsScanning(false);
    }
  }, []);

  const [analysisResult, setAnalysisResult] = useState<{
    package_name: string;
    permissions: string[];
  } | null>(null);

  const apkLoadPermissions = async (asset?: any) => {
    const targetApk = asset || selectedApk;
    if (!targetApk) return;

    setIsScanning(true);
    setAnalysisResult(null);

    // Small delay to let the loading spinner render on screen
    setTimeout(async () => {
      try {
        const localUri = `${cacheDirectory}temp_analysis.apk`;

        // Copying the file is often what causes the freeze if the file is large
        await moveAsync({
          from: targetApk.uri,
          to: localUri
        });

        const cleanPath = localUri.replace('file://', '');

        // This is now calling the fixed AsyncFunction
        const data = await ApkParser.parseApk(cleanPath);

        if (data) {
          setAnalysisResult({
            package_name: data.package_name,
            permissions: data.permissions,
          });
          setShowAllPermissions(false);
          setIsScanning(false);
        }

        await deleteAsync(localUri, { idempotent: true });
      } catch (error) {
        console.error("Analysis Error:", error);
        Alert.alert("Scan Failed", "Local analysis encountered an error.");
      } finally {
        setIsScanning(false);
      }
    }, 100);
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

  /* Search State */
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchingApps, setIsSearchingApps] = useState(false);
  const [showAllPermissions, setShowAllPermissions] = useState(false);

  // Filter apps based on search query
  const filteredApps = React.useMemo(() => {
    if (!searchQuery) return apps;
    return apps.filter(app =>
      app.appName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.packageName.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [apps, searchQuery]);

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

            {/* Expandable Permissions List */}
            <View style={styles.permissionListContainer}>
              <View style={styles.permissionList}>
                {(showAllPermissions ? analysisResult.permissions : analysisResult.permissions.slice(0, 8)).map((perm, index) => {
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
              </View>

              {analysisResult.permissions.length > 8 && (
                <TouchableOpacity
                  onPress={() => setShowAllPermissions(!showAllPermissions)}
                  style={{ alignSelf: 'flex-start', marginTop: 8, paddingVertical: 4, paddingHorizontal: 2 }}
                >
                  <Text style={{ color: '#2563EB', fontWeight: '600', fontSize: 13 }}>
                    {showAllPermissions ? "Show Less" : `Show More (+${analysisResult.permissions.length - 8})`}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}


        {/* ✅ APP LIST */}
        <View style={{ marginTop: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, paddingRight: 4 }}>
            {isSearchingApps ? (
              <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 8, borderWidth: 1, borderColor: '#2563EB', paddingHorizontal: 10, height: 40 }}>
                <Ionicons name="search" size={18} color="#64748B" style={{ marginRight: 8 }} />
                <TextInput
                  style={{ flex: 1, color: '#0F172A', fontSize: 14 }}
                  placeholder="Search apps..."
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  autoFocus
                />
                <TouchableOpacity onPress={() => { setIsSearchingApps(false); setSearchQuery(""); }}>
                  <Ionicons name="close-circle" size={18} color="#94A3B8" />
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <Text style={{ fontSize: 16, fontWeight: '700', color: '#0F172A', marginLeft: 4 }}>
                  Installed Applications
                </Text>
                <TouchableOpacity
                  style={{ padding: 6, backgroundColor: '#EFF6FF', borderRadius: 8 }}
                  onPress={() => setIsSearchingApps(true)}
                >
                  <Ionicons name="search" size={20} color="#2563EB" />
                </TouchableOpacity>
              </>
            )}
          </View>

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

          {!appsLoading && !appsError && filteredApps.length === 0 && (
            <Text style={{ textAlign: "center", color: '#64748B', marginTop: 20 }}>
              {searchQuery ? "No apps match your search." : "No apps found."}
            </Text>
          )}

          {filteredApps.map((item, index) => (
            <AppItemRow key={`${item.packageName}`} item={item} onScan={handleScan} getIcon={getAppIcon} />
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
  permissionListContainer: {
    backgroundColor: "#F9FBFF",
    padding: 8,
    borderRadius: 8,
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