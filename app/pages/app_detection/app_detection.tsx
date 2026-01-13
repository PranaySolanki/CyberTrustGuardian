import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
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

  const [selectedApk, setSelectedApk] = useState<{ name: string; uri: string } | null>(null);
  const [loading, setLoading] = useState(false); 
  const router = useRouter();

  const pickApk = async () => {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: "application/vnd.android.package-archive",
    });

    // Check if the user didn't cancel and assets exist
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setSelectedApk({
        name: result.assets[0].name,
        uri: result.assets[0].uri,
      });
    }
  } catch (error) {
    console.log("APK selection error:", error);
  }
};
const handleScan = () =>{
  router.push("/pages/app_detection/scan_result");
}
const [analysisResult, setAnalysisResult] = useState<{
  package_name: string;
  permissions: string[];
} | null>(null);

const apkHandleScan = async () => {
  if (!selectedApk) return;

  setLoading(true);
  const formData = new FormData();
  formData.append("file", {
    uri: selectedApk.uri,
    name: selectedApk.name,
    type: "application/vnd.android.package-archive",
  } as any);

  try {
    const response = await fetch("http://192.168.1.34:5000/analyze", {
      method: "POST",
      body: formData,
    });

    const data = await response.json();

    if (response.ok) {
      // SET THE RESULT LOCALLY INSTEAD OF JUST NAVIGATING
      setAnalysisResult(data);
      
      // Optional: You can still navigate if you want the full report
      // router.push({ pathname: "/pages/app_detection/scan_result", params: { data: JSON.stringify(data) } });
    } else {
      Alert.alert("Error", data.error);
    }
  } catch (error) {
    Alert.alert("Connection Failed", "Check backend server.");
  } finally {
    setLoading(false);
  }
};

  const renderItem = ({ item }: { item: AppItem }) => {
    return (
      <View style={styles.card}>
        <View style={styles.left}>
          <View style={styles.iconBox}>
            <Ionicons name={item.icon} size={20} color="#2563EB" />
          </View>
          <Text style={styles.appName}>{item.name}</Text>
        </View>
          <TouchableOpacity style={styles.scanBtn} onPress={handleScan}>
          <Text style={styles.scanText}>Scan</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>App Permission Analyzer</Text>
      <Text style={styles.subtitle}>
        Identify apps with excessive permissions
      </Text>

      {/* ✅ APK SELECTOR BLOCK */}
      <View style={styles.apkBlock}>
        <View style={styles.apkTextBox}>
        <Text style={styles.apkText}>
          {selectedApk ? selectedApk.name : "No APK Selected"}
          </Text>
        </View>

        <TouchableOpacity style={styles.apkButton} onPress={pickApk}>
          <Text style={styles.apkButtonText}>
            {selectedApk ? "Change APK" : "Select APK"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* ✅ SCAN BUTTON - Appears after APK is selected */}
      {selectedApk && (
        <TouchableOpacity style={styles.scanApkButton} onPress={apkHandleScan}>
          <Ionicons name="shield-checkmark" size={20} color="#FFFFFF" />
          <Text style={styles.scanApkButtonText}>Scan Selected APK</Text>
        </TouchableOpacity>
      )}
      {/* --- PERMISSIONS DISPLAY SECTION --- */}
{analysisResult && (
  <View style={styles.resultContainer}>
    <View style={styles.resultHeader}>
      <Ionicons name="apps" size={20} color="#2563EB" />
      <Text style={styles.resultPkgName}>{analysisResult.package_name}</Text>
    </View>

    <Text style={styles.permissionTitle}>
      Requested Permissions ({analysisResult.permissions.length})
    </Text>

    <View style={styles.permissionList}>
      {analysisResult.permissions.map((perm, index) => {
        // Clean the permission name (e.g., android.permission.CAMERA -> CAMERA)
        const shortPerm = perm.split('.').pop();
        const isDangerous = ["CAMERA", "RECORD_AUDIO", "READ_SMS", "ACCESS_FINE_LOCATION"].includes(shortPerm || "");

        return (
          <View key={index} style={[styles.permBadge, isDangerous && styles.dangerBadge]}>
            <Text style={[styles.permText, isDangerous && styles.dangerText]}>
              {shortPerm}
            </Text>
            {isDangerous && <Ionicons name="alert-circle" size={12} color="#DC2626" style={{marginLeft: 4}} />}
          </View>
        );
      })}
    </View>
    
  </View>
)}

      {/* ✅ APP LIST */}
      <FlatList
        data={mockApps}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 30 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFF",
    paddingHorizontal: 16,
    paddingTop: 12,
  },

  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#0F172A",
  },

  subtitle: {
    color: "#475569",
    marginBottom: 12,
  },

  // ✅ APK BLOCK
  apkBlock: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
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

  // ✅ SCAN APK BUTTON
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

  // ✅ CARD UI
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
  },resultContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 17,
    marginTop: 15,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    elevation: 2,
    marginBottom:12
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
  permissionList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
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
