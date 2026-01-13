import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
// import { getGeminiAnalysis } from "../../utils/geminiApi"; 

export default function ScanResult() {
  const router = useRouter();
  const { data } = useLocalSearchParams();
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(true);

  const report = data ? JSON.parse(data as string) : null;

  useEffect(() => {
    if (report) {
      generateAiReport();
    }
  }, [report]);

  const generateAiReport = async () => {
    try {
      setLoadingAi(true);
      // Example prompt for Gemini:
      const prompt = `Analyze this Android APK report:
      Package: ${report.package_name}
      Permissions: ${report.permissions.join(", ")}
      Found Secrets: ${JSON.stringify(report.secrets)}
      Provide a security analysis and specific recommendations.`;

      // Call your integrated Gemini function here
      // const response = await getGeminiAnalysis(prompt);
      // setAiAnalysis(response);

      // MOCK for UI testing:
      setTimeout(() => {
        setAiAnalysis("This app requests sensitive permissions like CAMERA and SMS which are often used in surveillance or phishing apps. The presence of hardcoded URLs suggests external data communication.");
        setLoadingAi(false);
      }, 1500);
    } catch (error) {
      setAiAnalysis("Failed to load AI analysis.");
      setLoadingAi(false);
    }
  };

  if (!report) return <View style={styles.center}><Text>No data</Text></View>;

  const isHighRisk = report.permissions.some((p: string) => 
    p.includes("SMS") || p.includes("CAMERA") || p.includes("LOCATION")
  );

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Scan Results</Text>
      </View>

      {/* Risk Banner */}
      <View style={styles.card}>
        <Text style={styles.cardLabel}>Analysis Outcome</Text>
        <Text style={styles.pkgText}>{report.package_name}</Text>
        <View style={[styles.riskButton, isHighRisk ? styles.bgRed : styles.bgGreen]}>
          <Ionicons name={isHighRisk ? "shield-alert" : "checkmark-circle"} size={20} color="#FFF" />
          <Text style={styles.riskButtonText}>{isHighRisk ? "HIGH RISK" : "SAFE"}</Text>
        </View>
      </View>

      {/* AI Analysis Section */}
      <View style={styles.card}>
        <View style={styles.row}>
          <Ionicons name="sparkles-outline" size={20} color="#2563EB" />
          <Text style={styles.sectionTitle}>AI Analysis</Text>
        </View>
        {loadingAi ? (
          <ActivityIndicator color="#2563EB" style={{ marginTop: 10 }} />
        ) : (
          <Text style={styles.aiText}>{aiAnalysis}</Text>
        )}
      </View>

      {/* Recommendations */}
      <View style={styles.card}>
        <View style={styles.row}>
          <Ionicons name="bulb-outline" size={20} color="#2563EB" />
          <Text style={styles.sectionTitle}>Recommendations</Text>
        </View>
        <View style={styles.recList}>
          {["Do not grant SMS permissions.", "Check for suspicious background activity.", "Verify the developer identity."].map((item, i) => (
            <View key={i} style={styles.recItem}>
              <Ionicons name="checkmark" size={16} color="#475569" />
              <Text style={styles.recText}>{item}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Actions */}
      <TouchableOpacity style={styles.btnPrimary}>
        <Text style={styles.btnPrimaryText}>Secure App</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.btnSecondary} onPress={() => router.back()}>
        <Text style={styles.btnSecondaryText}>Back</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF", padding: 20 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { flexDirection: "row", alignItems: "center", marginBottom: 25, marginTop: 20 },
  headerTitle: { fontSize: 18, fontWeight: "700", marginLeft: "25%" },
  card: { backgroundColor: "#FFF", borderRadius: 12, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: "#F1F5F9" },
  cardLabel: { fontSize: 14, fontWeight: "600", color: "#64748B", marginBottom: 4 },
  pkgText: { fontSize: 13, color: "#94A3B8", marginBottom: 15 },
  riskButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", padding: 12, borderRadius: 10 },
  bgRed: { backgroundColor: "#EF4444" },
  bgGreen: { backgroundColor: "#10B981" },
  riskButtonText: { color: "#FFF", fontWeight: "700", marginLeft: 8 },
  row: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  sectionTitle: { fontSize: 16, fontWeight: "700", marginLeft: 8 },
  aiText: { fontSize: 14, color: "#475569", lineHeight: 22 },
  recList: { marginTop: 10 },
  recItem: { flexDirection: "row", marginBottom: 12, alignItems: "flex-start" },
  recText: { marginLeft: 10, fontSize: 14, color: "#475569", flex: 1 },
  btnPrimary: { backgroundColor: "#2563EB", padding: 16, borderRadius: 12, alignItems: "center", marginBottom: 12 },
  btnPrimaryText: { color: "#FFF", fontWeight: "700" },
  btnSecondary: { backgroundColor: "#F8FAFF", padding: 16, borderRadius: 12, alignItems: "center", borderWidth: 1, borderColor: "#E2E8F0" },
  btnSecondaryText: { color: "#64748B", fontWeight: "600" },
});