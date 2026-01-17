import { clearLastBreachResult, getLastBreachResult } from '@/services/storage/breachStore';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function BreachResult() {
  const router = useRouter();
  const [data, setData] = useState<{ risk?: string; score?: number; reason?: string; content?: string } | null>(null);

  useEffect(() => {
    const last = getLastBreachResult();
    if (last) {
      setData(last);
      clearLastBreachResult();
    }
  }, []);

  const maskContent = (c?: string) => {
    if (!c) return '';
    if (c.toString().includes('Password (hidden')) return c;
    const s = c.toString().trim();
    if (s.includes('@')) {
      // Simple email mask
      const parts = s.split('@');
      return parts[0].substring(0, 2) + '***@' + parts[1];
    }
    const take = Math.min(3, s.length);
    return s.slice(0, take) + '***';
  };

  if (!data) {
    return (
      <SafeAreaView style={[styles.container, styles.center]}>
        <Text style={styles.errorText}>No result available</Text>
        <TouchableOpacity onPress={() => router.dismiss()} style={styles.backButton}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const { risk, score, reason, content } = data;
  const isHighRisk = risk === 'HIGH';
  const isMediumRisk = risk === 'MEDIUM';

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
          <Text style={styles.headerTitle}>Breach Report</Text>
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

        {/* Content Details */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>ANALYZED IDENTITY</Text>
          <View style={styles.pkgContainer}>
            <Text style={styles.pkgLabel}>Credential</Text>
            <Text style={styles.pkgValue}>{maskContent(content)}</Text>
          </View>
        </View>

        {/* Recommendations */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>RECOMMENDATIONS</Text>
          {isHighRisk ? (
            <View style={[styles.recCard, { borderLeftColor: "#EF4444" }]}>
              <Text style={styles.recTitle}>Change Password Now</Text>
              <Text style={styles.recDesc}>Your data was found in a known breach. Change your password immediately and enable 2FA.</Text>
            </View>
          ) : isMediumRisk ? (
            <View style={[styles.recCard, { borderLeftColor: "#F59E0B" }]}>
              <Text style={styles.recTitle}>Monitor Activity</Text>
              <Text style={styles.recDesc}>Suspicious activity detected. Review your recent logins.</Text>
            </View>
          ) : (
            <View style={[styles.recCard, { borderLeftColor: "#10B981" }]}>
              <Text style={styles.recTitle}>All Clear</Text>
              <Text style={styles.recDesc}>No public breaches found for this identity.</Text>
            </View>
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC", paddingHorizontal: 16 },
  center: { justifyContent: "center", alignItems: "center" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  iconBtn: { padding: 8, backgroundColor: "#FFF", borderRadius: 12, borderWidth: 1, borderColor: "#E2E8F0" },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#0F172A", letterSpacing: 0.5 },
  heroSection: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 30,
    backgroundColor: "#fff",
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 4,
    marginBottom: 24,
  },
  scoreCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 8,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    backgroundColor: "#FAFAFA",
  },
  scoreValue: {
    fontSize: 36,
    fontWeight: "800",
  },
  scoreLabel: {
    fontSize: 12,
    color: "#94A3B8",
    fontWeight: "600",
    marginTop: 4,
  },
  riskBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  riskText: {
    color: "#fff",
    fontWeight: "700",
    marginLeft: 6,
    textTransform: "uppercase",
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: "700",
    color: "#94A3B8",
    marginBottom: 12,
    letterSpacing: 1,
  },
  verdictCard: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 8,
  },
  verdictText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#334155",
    lineHeight: 24,
  },
  pkgContainer: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  pkgLabel: {
    fontSize: 12,
    color: "#64748B",
    marginBottom: 4,
  },
  pkgValue: {
    fontSize: 15,
    fontWeight: "600",
    color: "#0F172A",
  },
  recCard: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 8,
  },
  recTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 4,
  },
  recDesc: {
    fontSize: 14,
    color: "#475569",
    lineHeight: 20,
  },
  errorText: {
    fontSize: 16,
    color: "#64748B",
    marginBottom: 16,
    fontWeight: "500",
  },
  backButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: "#2563EB",
    borderRadius: 10,
  },
  backButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
});