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
  // ✅ STATE MUST BE HERE (before return)
  const [selectedApk, setSelectedApk] = useState<string | null>(null);
  const router = useRouter();

  const pickApk = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "application/vnd.android.package-archive",
      });

      if (result.assets && result.assets.length > 0) {
        setSelectedApk(result.assets[0].name);
      }
    } catch (error) {
      console.log("APK selection error:", error);
    }
  };
const handleScan = () =>{
  router.push("/pages/app_detection/scan_result");
}

  const apkHandleScan = () => {
    if (!selectedApk) {
      Alert.alert("APK Required", "Please add APK first ⚠️");
      return;
    }
    router.push("/pages/app_detection/scan_result");
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
            {selectedApk ? selectedApk : "No APK Selected"}
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
  },
});
