import { clearLastPhishingResult, getLastPhishingResult } from '@/services/storage/phishingStore';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function PhishingScanResult() {
  const params = useLocalSearchParams()
  const [data, setData] = useState<{ risk?: string; score?: number; reason?: string; content?: string } | null>(null)

  useEffect(() => {
    // Strictly load from store as requested
    const last = getLastPhishingResult()
    if (last) {
      setData(last)
      clearLastPhishingResult()
    }
  }, [])

  if (!data) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>No result available</Text>
        <TouchableOpacity onPress={() => router.dismiss()} style={styles.backButton}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    )
  }

  const { risk, score, reason, content } = data;
  const isHighRisk = risk === 'HIGH';
  const isMediumRisk = risk === 'MEDIUM';
  const isSafe = risk === 'LOW' || risk === 'SAFE';

  // Dynamic Theme Colors
  const themeColor = isHighRisk ? "#EF4444" : isMediumRisk ? "#F59E0B" : "#10B981";

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Premium Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.dismiss()} style={styles.iconBtn}>
            <Ionicons name="arrow-back" size={24} color="#1E293B" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Analysis Report</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Hero Score Section */}
        <View style={styles.heroSection}>
          <View style={[styles.scoreCircle, { borderColor: themeColor }]}>
            <Text style={[styles.scoreValue, { color: themeColor }]}>{score}%</Text>
            <Text style={styles.scoreLabel}>Safety Score</Text>
          </View>
          <View style={[styles.riskBadge, { backgroundColor: themeColor }]}>
            <Ionicons name={isHighRisk ? "warning" : "shield-checkmark"} size={16} color="#FFF" />
            <Text style={styles.riskText}>{risk || "UNKNOWN"}</Text>
          </View>
        </View>

        {/* Security Verdict Card */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>SECURITY VERDICT</Text>
          <View style={styles.verdictCard}>
            <Text style={styles.verdictText}>
              {reason || "Analysis unavailable."}
            </Text>
          </View>
        </View>

        {/* Recommendations */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>RECOMMENDATIONS</Text>
          {isHighRisk ? (
            <View style={[styles.recCard, { borderLeftColor: "#EF4444" }]}>
              <Text style={styles.recTitle}>Danger Detected</Text>
              <Text style={styles.recDesc}>Do not click any links or reply to this message. Block the sender immediately.</Text>
            </View>
          ) : isMediumRisk ? (
            <View style={[styles.recCard, { borderLeftColor: "#F59E0B" }]}>
              <Text style={styles.recTitle}>Proceed with Caution</Text>
              <Text style={styles.recDesc}>This content looks suspicious. Verify the sender's identity before interacting.</Text>
            </View>
          ) : (
            <View style={[styles.recCard, { borderLeftColor: "#10B981" }]}>
              <Text style={styles.recTitle}>Safe to View</Text>
              <Text style={styles.recDesc}>No threats were detected in the text content.</Text>
            </View>
          )}
        </View>

        {/* Content Details */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>ANALYZED CONTENT</Text>
          <View style={styles.pkgContainer}>
            <Text style={styles.pkgLabel}>Content Preview</Text>
            <Text style={styles.pkgValue} numberOfLines={4}>{content}</Text>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC", paddingHorizontal: 16 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
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