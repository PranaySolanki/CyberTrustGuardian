import { Link } from "expo-router";
import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function Index() {
  return (
    <View style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.headerRow}>
          <View style={styles.appBadge}>
            <Text style={styles.appBadgeEmoji}>🛡️</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.appTitle}>CyberTrust</Text>
            <Text style={styles.appSubtitle}>Guardian</Text>
          </View>
          <TouchableOpacity style={styles.themeToggle}>
            <Text style={{ fontSize: 28 }}>◐</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.statusCard}>
          <View style={styles.statusContent}>
            <Text style={styles.statusTitle}>System Secure</Text>
            <Text style={styles.statusSubtitle}>
              Your device is protected. 47 threats blocked this week.
            </Text>
          </View>
          <View style={styles.riskPill}>
            <Text style={styles.riskText} numberOfLines={1}>Low Risk</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Today's Activity</Text>

        <View style={styles.activityGrid}>
          <View style={styles.activityCard}>
            <Text style={styles.activityIcon}>📈</Text>
            <Text style={styles.activityNumber}>12</Text>
            <Text style={styles.activityLabel}>Scans Today</Text>
          </View>
          <View style={styles.activityCard}>
            <Text style={styles.activityIcon}>⚠️</Text>
            <Text style={styles.activityNumber}>47</Text>
            <Text style={styles.activityLabel}>Threats Blocked</Text>
          </View>
          <View style={styles.activityCard}>
            <Text style={styles.activityIcon}>🧾</Text>
            <Text style={styles.activityNumber}>23</Text>
            <Text style={styles.activityLabel}>Apps Analyzed</Text>
          </View>
          <View style={styles.activityCard}>
            <Text style={styles.activityIcon}>✔️</Text>
            <Text style={styles.activityNumber}>98%</Text>
            <Text style={styles.activityLabel}>Safety Score</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Security Tools</Text>

        <View style={styles.toolList}>
          <Link href="/pages/phishing" style={{ textDecorationLine: "none" }}>
            <View style={styles.toolItem}>
              <View style={[styles.toolIcon, { backgroundColor: "#ff6b6b" }]}>
                <Text style={styles.toolIconEmoji}>✉️</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.toolTitle}>Phishing Detector</Text>
                <Text style={styles.toolSub}>Scan emails, SMS & links for threats</Text>
              </View>
              <Text style={styles.chev}>›</Text>
            </View>
          </Link>

          <Link href="/pages/qr_scanner" style={{ textDecorationLine: "none" }}>
            <View style={styles.toolItem}>
              <View style={[styles.toolIcon, { backgroundColor: "#4d9cff" }]}>
                <Text style={styles.toolIconEmoji}>📸</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.toolTitle}>QR Safety Checker</Text>
                <Text style={styles.toolSub}>Verify QR codes before scanning</Text>
              </View>
              <Text style={styles.chev}>›</Text>
            </View>
          </Link>

          <Link href="/pages/app_detection" style={{ textDecorationLine: "none" }}>
            <View style={styles.toolItem}>
              <View style={[styles.toolIcon, { backgroundColor: "#a77bff" }]}>
                <Text style={styles.toolIconEmoji}>🔒</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.toolTitle}>App Permissions</Text>
                <Text style={styles.toolSub}>Analyze installed app security</Text>
              </View>
              <Text style={styles.chev}>›</Text>
            </View>
          </Link>
        </View>

        <View style={styles.tipCard}>
            <Text style={styles.tipTitle}>🛡️ Security Tip</Text>
            <Text style={styles.tipText}>
              Always verify sender email addresses before clicking links. Hover over links to preview the destination URL.
            </Text>
          </View>

        <Text style={styles.sectionTitle}>Recent Scans</Text>

        <View style={styles.recentList}>
          <View style={styles.recentItem}>
            <View>
              <Text style={styles.recentLabel}>Email</Text>
              <Text style={styles.recentTime}>2 min ago</Text>
            </View>
            <View style={styles.recentStatusSafe}>
              <Text style={styles.recentStatusText}>Safe</Text>
            </View>
          </View>

          <View style={styles.recentItem}>
            <View>
              <Text style={styles.recentLabel}>QR Code</Text>
              <Text style={styles.recentTime}>15 min ago</Text>
            </View>
            <View style={styles.recentStatusSusp}>
              <Text style={styles.recentStatusText}>Suspicious</Text>
            </View>
          </View>

          <View style={styles.recentItem}>
            <View>
              <Text style={styles.recentLabel}>App</Text>
              <Text style={styles.recentTime}>1 hour ago</Text>
            </View>
            <View style={styles.recentStatusSafe}>
              <Text style={styles.recentStatusText}>Safe</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f7f9fa" },
  container: { padding: 16, paddingBottom: 40 },
  headerRow: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  appBadge: { width: 48, height: 48, borderRadius: 12, backgroundColor: "#e6f5ff", justifyContent: "center", alignItems: "center", marginRight: 12 },
  appBadgeEmoji: { fontSize: 20 },
  appTitle: { fontSize: 18, fontWeight: "700" },
  appSubtitle: { color: "#6b7280" },
  themeToggle: { padding: 8 },

  statusCard: { backgroundColor: "#0f9d58", borderRadius: 12, padding: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16, paddingRight: 20, overflow: 'hidden' },
  statusTitle: { color: "#fff", fontSize: 18, fontWeight: "700" },
  statusSubtitle: { marginTop: 7, color: "rgba(255,255,255,0.9)" },
  statusContent: { flex: 1, marginRight: -60 },
  riskPill: { backgroundColor: "rgba(255,255,255,0.2)", marginBottom: 42.5, paddingHorizontal: 8, paddingVertical: 6, borderRadius: 50, alignSelf: "center", maxWidth: 110, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  riskText: { color: "#fff", fontWeight: "600", fontSize: 13 },

  sectionTitle: { fontSize: 17, fontWeight: "700", marginLeft: 16, marginBottom: 8, marginTop: 4, color: "#272d3b" },

  activityGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", marginBottom: 5 },
  activityCard: { width: "45%", marginLeft: 9, marginRight: 9, height: 145, backgroundColor: "#fff", borderRadius: 12, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: "#f1f5f9" },
  activityIcon: { marginTop: 5, fontSize: 25, marginBottom: 6 },
  activityNumber: { marginTop: 12, fontSize: 30, fontWeight: "700" },
  activityLabel: { fontSize: 15, color: "#6b7280" },

  toolList: { marginBottom: 16 },
  toolItem: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", paddingTop: 14, paddingBottom: 15, paddingLeft: 10, paddingRight: 10, borderRadius: 22, marginBottom: 10, borderWidth: 1, borderColor: "#f1f5f9" },
  toolIcon: { width: 62, height: 62, borderRadius: 19, justifyContent: "center", alignItems: "center", marginRight: 12 },
  toolIconEmoji: { fontSize: 40 },
  toolTitle: { fontWeight: "700", fontSize: 16 },
  toolSub: { marginTop: 4, color: "#6b7280" },
  chev: { color: "#9ca3af", fontSize: 20, marginLeft: 8 },

  recentList: { marginBottom: 1 },
  recentItem: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#fff", padding: 12, borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: "#f1f5f9" },
  recentLabel: { color: "#272d3b", fontWeight: "700" },
  recentTime: { color: "#9ca3af" },
  recentStatusSafe: { backgroundColor: "#e6f9ef", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
  recentStatusSusp: { backgroundColor: "#fff1f0", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
  recentStatusText: { color: "#065f46", fontWeight: "700" },

  tipCard: { backgroundColor: "#c8dcfa", padding: 12, borderRadius: 12, marginTop: 1, marginBottom: 10 },
  tipTitle: { color: "#367cec", fontWeight: "800", marginBottom: 6 },
  tipText: { color: "#475569" },
});
