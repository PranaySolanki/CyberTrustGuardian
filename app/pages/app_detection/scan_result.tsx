import { useTheme } from '@/context/ThemeContext';
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function ScanResult() {
  const { colors, isDarkMode } = useTheme();
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
      const prompt = `Analyze this Android APK report:
      Package: ${report.package_name}
      Permissions: ${report.permissions.join(", ")}
      Found Secrets: ${JSON.stringify(report.secrets)}
      Provide a security analysis and specific recommendations.`;

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

  if (!report) return <View style={[styles.center, { backgroundColor: colors.background }]}><Text style={{ color: colors.textPrimary }}>No data</Text></View>;

  const isHighRisk = report.permissions.some((p: string) =>
    p.includes("SMS") || p.includes("CAMERA") || p.includes("LOCATION")
  );

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Scan Results</Text>
      </View>

      {/* Risk Banner */}
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.cardLabel, { color: colors.textSecondary }]}>Analysis Outcome</Text>
        <Text style={[styles.pkgText, { color: colors.accent }]}>{report.package_name}</Text>
        <View style={[styles.riskButton, { backgroundColor: isHighRisk ? colors.danger : colors.success }]}>
          <Ionicons name={isHighRisk ? "alert-circle" : "checkmark-circle"} size={20} color={colors.background} />
          <Text style={[styles.riskButtonText, { color: colors.background }]}>{isHighRisk ? "HIGH RISK" : "SAFE"}</Text>
        </View>
      </View>

      {/* AI Analysis Section */}
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.row}>
          <Ionicons name="sparkles-outline" size={20} color={colors.accent} />
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>AI Analysis</Text>
        </View>
        {loadingAi ? (
          <ActivityIndicator color={colors.accent} style={{ marginTop: 10 }} />
        ) : (
          <Text style={[styles.aiText, { color: colors.textSecondary }]}>{aiAnalysis}</Text>
        )}
      </View>

      {/* Recommendations */}
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.row}>
          <Ionicons name="bulb-outline" size={20} color={colors.accent} />
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Recommendations</Text>
        </View>
        <View style={styles.recList}>
          {["Do not grant SMS permissions.", "Check for suspicious background activity.", "Verify the developer identity."].map((item, i) => (
            <View key={i} style={styles.recItem}>
              <Ionicons name="checkmark" size={16} color={colors.accent} />
              <Text style={[styles.recText, { color: colors.textSecondary }]}>{item}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Actions */}
      <TouchableOpacity style={[styles.btnPrimary, { backgroundColor: colors.accent }]}>
        <Text style={[styles.btnPrimaryText, { color: colors.background }]}>Secure App</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.btnSecondary, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={() => router.back()}>
        <Text style={[styles.btnSecondaryText, { color: colors.textSecondary }]}>Back</Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { flexDirection: "row", alignItems: "center", marginBottom: 25, marginTop: 20 },
  headerTitle: { fontSize: 18, fontWeight: "700", marginLeft: "25%" },
  card: { borderRadius: 12, padding: 16, marginBottom: 20, borderWidth: 1 },
  cardLabel: { fontSize: 13, fontWeight: "600", marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5 },
  pkgText: { fontSize: 14, fontWeight: "600", marginBottom: 15 },
  riskButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", padding: 12, borderRadius: 10 },
  riskButtonText: { fontWeight: "700", marginLeft: 8 },
  row: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  sectionTitle: { fontSize: 16, fontWeight: "700", marginLeft: 8 },
  aiText: { fontSize: 14, lineHeight: 22 },
  recList: { marginTop: 10 },
  recItem: { flexDirection: "row", marginBottom: 12, alignItems: "flex-start" },
  recText: { marginLeft: 10, fontSize: 14, flex: 1 },
  btnPrimary: { padding: 16, borderRadius: 28, alignItems: "center", marginBottom: 12 },
  btnPrimaryText: { fontWeight: "700", fontSize: 16 },
  btnSecondary: { padding: 16, borderRadius: 28, alignItems: "center", borderWidth: 1 },
  btnSecondaryText: { fontWeight: "600", fontSize: 16 },
});
