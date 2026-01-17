import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/services/auth/authContext";
import { API_BASE_URL } from "@/services/config/apiConfig";
import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";

type AppItem = {
  id: string;
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
};

const mockApps: AppItem[] = [
  { id: "1", name: "Flashlight Pro", icon: "flash" },
  { id: "2", name: "Social Connect", icon: "people" },
  { id: "3", name: "Super Cleaner", icon: "trash" },
  { id: "4", name: "Weather Today", icon: "sunny" },
  { id: "5", name: "PDF Reader", icon: "document" },
  { id: "6", name: "Music Player", icon: "musical-notes" },
  { id: "7", name: "Notes App", icon: "create" },
];

export default function AppDetection() {
  const { colors, isDarkMode } = useTheme();
  const { user } = useAuth();
  const [selectedApk, setSelectedApk] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const router = useRouter();

  const handleScan = () => {
    router.push("/pages/app_detection/scan_result");
  };

  const [analysisResult, setAnalysisResult] = useState<{
    package_name: string;
    permissions: string[];
  } | null>(null);

  const apkHandleScan = async (asset?: DocumentPicker.DocumentPickerAsset | any) => {
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
        await apkHandleScan(asset);
      }
    } catch (error) {
      console.log("APK selection error:", error);
    }
  };

  const renderItem = ({ item }: { item: AppItem }) => {
    return (
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.left}>
          <View style={[styles.iconBox, { backgroundColor: isDarkMode ? 'rgba(0, 242, 254, 0.1)' : '#E0ECFF' }]}>
            <Ionicons name={item.icon} size={20} color={colors.accent} />
          </View>
          <Text style={[styles.appName, { color: colors.textPrimary }]}>{item.name}</Text>
        </View>
        <TouchableOpacity style={[styles.scanBtn, { backgroundColor: colors.accent }]} onPress={handleScan}>
          <Text style={[styles.scanText, { color: colors.background }]}>Scan</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false}>
      <Text style={[styles.title, { color: colors.textPrimary }]}>App Permission Analyzer</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        Identify apps with excessive permissions
      </Text>

      <View style={styles.apkBlock}>
        <View style={[styles.apkTextBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.apkText, { color: colors.textPrimary }]}>
            {selectedApk ? selectedApk.name : "No APK Selected"}
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.apkButton, { backgroundColor: colors.accent }, isScanning && { opacity: 0.7 }]}
          onPress={pickApk}
          disabled={isScanning}
        >
          {isScanning ? (
            <ActivityIndicator size="small" color={colors.background} />
          ) : (
            <Text style={[styles.apkButtonText, { color: colors.background }]}>
              {selectedApk ? "Change APK" : "Select APK"}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {selectedApk && (
        <TouchableOpacity style={[styles.scanApkButton, { backgroundColor: colors.success }]} onPress={handleScan} disabled={isScanning}>
          {isScanning ? (
            <ActivityIndicator color={colors.background} />
          ) : (
            <>
              <Ionicons name="shield-checkmark" size={20} color={colors.background} />
              <Text style={[styles.scanApkButtonText, { color: colors.background }]}>Scan Selected APK</Text>
            </>
          )}
        </TouchableOpacity>
      )}

      {analysisResult && (
        <View style={[styles.resultContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.resultHeader}>
            <Ionicons name="apps" size={20} color={colors.accent} />
            <Text style={[styles.resultPkgName, { color: colors.accent }]}>{analysisResult.package_name}</Text>
          </View>

          <Text style={[styles.permissionTitle, { color: colors.textSecondary }]}>
            Requested Permissions ({analysisResult.permissions.length})
          </Text>

          <View style={[styles.scrollArea, { backgroundColor: isDarkMode ? colors.background : '#F9FBFF' }]}>
            <ScrollView
              nestedScrollEnabled={true}
              contentContainerStyle={styles.permissionList}
              showsVerticalScrollIndicator={true}
            >
              {analysisResult.permissions.map((perm, index) => {
                const shortPerm = perm.split('.').pop();
                const isDangerous = ["CAMERA", "RECORD_AUDIO", "READ_SMS", "ACCESS_FINE_LOCATION"].includes(shortPerm || "");

                return (
                  <View key={index} style={[styles.permBadge, { backgroundColor: isDarkMode ? colors.surface : '#F1F5F9', borderColor: colors.border }, isDangerous && (isDarkMode ? { backgroundColor: 'rgba(255, 77, 79, 0.1)', borderColor: colors.danger } : styles.dangerBadge)]}>
                    <Text style={[styles.permText, { color: colors.textSecondary }, isDangerous && { color: colors.danger, fontWeight: '700' }]}>
                      {shortPerm}
                    </Text>
                    {isDangerous && <Ionicons name="alert-circle" size={12} color={colors.danger} style={{ marginLeft: 4 }} />}
                  </View>
                );
              })}
            </ScrollView>
          </View>
        </View>
      )}

      <View style={{ marginTop: 10 }}>
        {mockApps.map((item) => (
          <View key={item.id}>
            {renderItem({ item })}
          </View>
        ))}
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
  },
  subtitle: {
    marginBottom: 12,
  },
  apkBlock: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
  },
  apkTextBox: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    marginRight: 10,
  },
  apkText: {
    fontSize: 13,
  },
  apkButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  apkButtonText: {
    fontWeight: "600",
    fontSize: 13,
  },
  scanApkButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 18,
  },
  scanApkButtonText: {
    fontWeight: "700",
    fontSize: 16,
    marginLeft: 8,
  },
  card: {
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
  },
  left: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  appName: {
    fontSize: 15,
    fontWeight: "600",
  },
  scanBtn: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  scanText: {
    fontWeight: "600",
    fontSize: 13,
  },
  resultContainer: {
    borderRadius: 16,
    padding: 17,
    marginTop: 5,
    borderWidth: 1,
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
    marginLeft: 8,
  },
  permissionTitle: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 10,
    textTransform: "uppercase",
  },
  scrollArea: {
    maxHeight: 200,
    borderRadius: 8,
    padding: 5,
  },
  permissionList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    paddingBottom: 10,
  },
  permBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
  },
  dangerBadge: {
    backgroundColor: "#FEF2F2",
    borderColor: "#FECACA",
  },
  permText: {
    fontSize: 11,
    fontWeight: "500",
  },
});
