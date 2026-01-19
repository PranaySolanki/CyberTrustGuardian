import { getLastAppResult } from "@/services/storage/appStore";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ScanResult() {
  const params = useLocalSearchParams();
  const [report, setReport] = useState<any>(null);

  useEffect(() => {
    if (report) return;
    const data = getLastAppResult();
    if (data) {
      setReport(data);
    } else if (params && params.status) {
      // Fallback to params from history
      setReport({
        appName: params.details as string,
        package_name: params.package_name as string,
        analysis: {
          risk: params.status === 'Dangerous' ? 'HIGH' : params.status === 'Suspicious' ? 'MEDIUM' : 'LOW',
          score: typeof params.score === 'string' ? parseInt(params.score, 10) : params.score as unknown as number,
          reason: params.reason as string || params.details as string,
          recommendation: params.recommendation as string
        }
      });
    }
  }, [params, report]);

  const analysis = report?.analysis || null;

  if (!report) return (
    <SafeAreaView style={[styles.container, styles.center]}>
      <Text style={styles.errorText}>No scan data provided</Text>
      <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
        <Text style={styles.backButtonText}>Go Back</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );

  const isHighRisk = analysis?.risk === "HIGH";
  const isMediumRisk = analysis?.risk === "MEDIUM";
  const isSafe = analysis?.risk === "LOW";

  // Dynamic Theme Colors
  const themeColor = isHighRisk ? "#EF4444" : isMediumRisk ? "#F59E0B" : "#10B981";
  const bgTheme = isHighRisk ? "#FEF2F2" : isMediumRisk ? "#FFFBEB" : "#ECFDF5";
  const iconName = isHighRisk ? "shield-outline" : isMediumRisk ? "alert-circle-outline" : "checkmark-circle-outline";

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Premium Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
            <Ionicons name="arrow-back" size={24} color="#1E293B" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Security Report</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Hero Score Section */}
        <View style={styles.heroSection}>
          <View style={[styles.scoreCircle, { borderColor: themeColor }]}>
            <Text style={[styles.scoreValue, { color: themeColor }]}>{analysis?.score || 0}%</Text>
            <Text style={styles.scoreLabel}>Safety Score</Text>
          </View>
          <View style={[styles.riskBadge, { backgroundColor: themeColor }]}>
            <Ionicons name={isHighRisk ? "warning" : "shield-checkmark"} size={16} color="#FFF" />
            <Text style={styles.riskText}>{analysis?.risk || "UNKNOWN"}</Text>
          </View>
        </View>

        {/* Security Verdict Card */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>SECURITY VERDICT</Text>
          <View style={styles.verdictCard}>
            <Text style={styles.verdictText}>
              {analysis?.reason || "Analysis unavailable."}
            </Text>
          </View>
        </View>

        {/* App Details Grid */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>APP DETAILS</Text>
          <View style={styles.gridContainer}>
            <View style={styles.gridItem}>
              <Text style={styles.gridLabel}>App Name</Text>
              <Text style={styles.gridValue} numberOfLines={1}>{report.appName || "Unknown"}</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.gridLabel}>Permissions</Text>
              <Text style={styles.gridValue}>{report.permissions?.length || 0}</Text>
            </View>
          </View>
          <View style={styles.pkgContainer}>
            <Text style={styles.pkgLabel}>Package Name</Text>
            <Text style={styles.pkgValue}>{report.package_name}</Text>
          </View>
        </View>

        {/* Recommendations */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>RECOMMENDATIONS</Text>
          <View style={[styles.recCard, { borderLeftColor: themeColor }]}>
            <Text style={styles.recTitle}>Recommended Action</Text>
            <Text style={styles.recDesc}>
              {analysis?.recommendation || "No specific recommendation available."}
            </Text>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC", paddingHorizontal: 20 },
  center: { justifyContent: "center", alignItems: "center" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 30 },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#0F172A", letterSpacing: 0.5 },
  iconBtn: { padding: 8, backgroundColor: "#FFF", borderRadius: 12, borderWidth: 1, borderColor: "#E2E8F0" },

  heroSection: { alignItems: "center", marginBottom: 32 },
  scoreCircle: {
    width: 140, height: 140, borderRadius: 70, borderWidth: 8,
    justifyContent: "center", alignItems: "center", backgroundColor: "#FFF",
    shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 10, elevation: 4
  },
  scoreValue: { fontSize: 48, fontWeight: "800", letterSpacing: -1 },
  scoreLabel: { fontSize: 12, color: "#64748B", textTransform: "uppercase", fontWeight: "600", marginTop: -4 },

  riskBadge: {
    flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 20, marginTop: -20, borderWidth: 4, borderColor: "#F8FAFC"
  },
  riskText: { color: "#FFF", fontWeight: "700", marginLeft: 6, fontSize: 14 },

  section: { marginBottom: 24 },
  sectionHeader: { fontSize: 12, fontWeight: "700", color: "#94A3B8", marginBottom: 12, letterSpacing: 1 },

  verdictCard: { backgroundColor: "#FFF", padding: 20, borderRadius: 16, borderWidth: 1, borderColor: "#E2E8F0" },
  verdictText: { fontSize: 15, color: "#334155", lineHeight: 24, fontWeight: "500" },

  gridContainer: { flexDirection: "row", gap: 12, marginBottom: 12 },
  gridItem: { flex: 1, backgroundColor: "#FFF", padding: 16, borderRadius: 16, borderWidth: 1, borderColor: "#E2E8F0" },
  gridLabel: { fontSize: 12, color: "#64748B", marginBottom: 4 },
  gridValue: { fontSize: 16, fontWeight: "700", color: "#0F172A" },

  pkgContainer: { backgroundColor: "#FFF", padding: 16, borderRadius: 16, borderWidth: 1, borderColor: "#E2E8F0" },
  pkgLabel: { fontSize: 12, color: "#64748B", marginBottom: 4 },
  pkgValue: { fontSize: 13, color: "#334155", fontFamily: "monospace" },

  recCard: { backgroundColor: "#FFF", padding: 16, borderRadius: 12, borderLeftWidth: 4, shadowColor: "#000", shadowOpacity: 0.03, elevation: 2 },
  recTitle: { fontSize: 15, fontWeight: "700", color: "#0F172A", marginBottom: 4 },
  recDesc: { fontSize: 13, color: "#475569", lineHeight: 20 },

  errorText: { marginBottom: 16, color: "#64748B" },
  backButton: { padding: 12, backgroundColor: "#e2e8f0", borderRadius: 8 },
  backButtonText: { fontWeight: "600" }
});