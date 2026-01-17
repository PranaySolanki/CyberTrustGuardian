import { useAuth } from "@/services/auth/authContext";
import { db } from "@/services/firebase/firebase";
import { Ionicons } from "@expo/vector-icons";
import { Link, Redirect, router } from "expo-router";
import { collection, doc, limit, onSnapshot, orderBy, query } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Simple helper for time ago
const formatTimeAgo = (date: any) => {
  if (!date) return '';
  const now = new Date();
  const diff = (now.getTime() - date.toMillis()) / 1000; // diff in seconds

  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} h ago`;
  return `${Math.floor(diff / 86400)} d ago`;
};

export default function Index() {
  const { width } = useWindowDimensions();
  const { user, signOut, isSignedIn, isInitializing } = useAuth();

  const [stats, setStats] = useState({ scansToday: 0, threatsBlocked: 0, appsAnalyzed: 0, safetyScore: 100 });
  const [recentScans, setRecentScans] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;

    // Listen to User Stats
    const userUnsub = onSnapshot(doc(db, 'users', user.id), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setStats(data.stats || { scansToday: 0, threatsBlocked: 0, appsAnalyzed: 0, safetyScore: 100 });
      }
    });

    // Listen to History (Last 3)
    const historyRef = collection(db, 'users', user.id, 'history');
    const q = query(historyRef, orderBy('timestamp', 'desc'), limit(3));
    const historyUnsub = onSnapshot(q, (snapshot) => {
      const scans = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setRecentScans(scans);
    });

    return () => {
      userUnsub();
      historyUnsub();
    }
  }, [user]);
  const isWeb = Platform.OS === "web";
  const toolItemWidth = isWeb && width > 900 ? "48%" : "100%";
  const toolItemMarginBottom = isWeb ? 12 : 18;
  const toolListStyle = isWeb ? { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" } : {};

  if (isInitializing) return null;

  if (!isSignedIn) {
    return <Redirect href={"/auth" as any} />;
  }

  const handleSignOut = () => {
    if (Platform.OS === 'web') {
      if (window.confirm("Are you sure you want to sign out?")) {
        signOut().then(() => {
          router.replace("/auth" as any);
        });
      }
    } else {
      Alert.alert("Sign Out", "Are you sure you want to sign out?", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sign Out",
          style: "destructive",
          onPress: async () => {
            await signOut();
            router.replace("/auth" as any);
          },
        },
      ]);
    }
  };

  const handleRecentPress = (scan: any) => {
    let pathname = "" as any;
    if (scan.type === "QR") {
      pathname = "/pages/qr_scanner/scan_result";
    } else if (["Email", "SMS", "URL"].includes(scan.type)) {
      pathname = "/pages/phishing/scan_result";
    } else if (scan.type === "Breach") {
      pathname = "/pages/breach_check/breach_result";
    }

    if (pathname) {
      // Serialize timestamp and other non-string data
      const params = { ...scan };
      if (scan.timestamp?.toDate) {
        params.timestamp = scan.timestamp.toDate().toISOString();
      }

      router.push({
        pathname,
        params
      });
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.headerRow}>
          <View style={styles.appBadge}>
            <Text style={styles.appBadgeEmoji}>🛡️</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.appTitle}>CyberTrust</Text>
            <Text style={styles.appSubtitle}>Guardian</Text>
          </View>
          <TouchableOpacity style={styles.headerButton} onPress={handleSignOut}>
            <Ionicons name="log-out-outline" size={24} color="#2563EB" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.themeToggle}>
            <Text style={{ fontSize: 28 }}>◐</Text>
          </TouchableOpacity>
        </View>

        {user && (
          <View style={styles.userCard}>
            <Text style={styles.userGreeting}>Welcome back, {user.fullName}!</Text>
            <Text style={styles.userEmail}>{user.email}</Text>
          </View>
        )}

        <View style={styles.statusCard}>
          <View style={styles.statusContent}>
            <Text style={styles.statusTitle}>System Secure</Text>
            <Text style={styles.statusSubtitle}>
              Your device is protected. {stats.threatsBlocked} threats blocked.
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
            <Text style={styles.activityNumber}>{stats.scansToday}</Text>
            <Text style={styles.activityLabel}>Scans Today</Text>
          </View>
          <View style={styles.activityCard}>
            <Text style={styles.activityIcon}>⚠️</Text>
            <Text style={styles.activityNumber}>{stats.threatsBlocked}</Text>
            <Text style={styles.activityLabel}>Threats Blocked</Text>
          </View>
          <View style={styles.activityCard}>
            <Text style={styles.activityIcon}>🧾</Text>
            <Text style={styles.activityNumber}>{stats.appsAnalyzed}</Text>
            <Text style={styles.activityLabel}>Apps Analyzed</Text>
          </View>
          <View style={styles.activityCard}>
            <Text style={styles.activityIcon}>✔️</Text>
            <Text style={styles.activityNumber}>{stats.safetyScore}%</Text>
            <Text style={styles.activityLabel}>Safety Score</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Security Tools</Text>

        <View style={styles.toolList}>
          <Link href="/pages/phishing/phishing" style={{ textDecorationLine: "none" }}>
            <View style={[styles.toolItem, { width: toolItemWidth, marginBottom: toolItemMarginBottom }]}>
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

          <Link href="/pages/qr_scanner/qr_scanner" style={{ textDecorationLine: "none" }}>
            <View style={[styles.toolItem, { width: toolItemWidth, marginBottom: toolItemMarginBottom }]}>
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

          <Link href="/pages/app_detection/app_detection" style={{ textDecorationLine: "none" }}>
            <View style={[styles.toolItem, { width: toolItemWidth, marginBottom: toolItemMarginBottom }]}>
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

          <Link href="/pages/device_health/device_health" style={{ textDecorationLine: "none" }}>
            <View style={styles.toolItem}>
              <View style={[styles.toolIcon, { backgroundColor: "#FFB020" }]}>
                <Text style={styles.toolIconEmoji}>📱</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.toolTitle}>Device Integrity Check</Text>
                <Text style={styles.toolSub}>Root & emulator detection</Text>
              </View>
              <Text style={styles.chev}>›</Text>
            </View>
          </Link>

          <Link href="/pages/breach_check/breach" style={{ textDecorationLine: "none" }}>
            <View style={[styles.toolItem, { width: toolItemWidth, marginBottom: toolItemMarginBottom }]}>
              <View style={[styles.toolIcon, { backgroundColor: "#ffd166" }]}>
                <Text style={styles.toolIconEmoji}>🔐</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.toolTitle}>Breach Exposure Checker</Text>
                <Text style={styles.toolSub}>Check emails and passwords against breach databases</Text>
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
          {recentScans.length === 0 ? (
            <View style={{ padding: 20, alignItems: 'center' }}>
              <Text style={{ color: '#9ca3af' }}>No recent activity</Text>
            </View>
          ) : (
            recentScans.map((scan) => (
              <TouchableOpacity key={scan.id} style={styles.recentItem} onPress={() => handleRecentPress(scan)}>
                <View>
                  <Text style={styles.recentLabel}>{scan.type || 'Unknown Scan'}</Text>
                  <Text style={styles.recentTime}>{formatTimeAgo(scan.timestamp)}</Text>
                </View>
                <View style={scan.status === 'Safe' ? styles.recentStatusSafe : styles.recentStatusSusp}>
                  <Text style={[styles.recentStatusText, scan.status !== 'Safe' && { color: '#DC2626' }]}>
                    {scan.status || 'Unknown'}
                  </Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
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
  headerButton: { padding: 8, marginRight: 8 },
  headerButtonText: { fontSize: 20, color: "#2563EB", fontWeight: "600" },
  themeToggle: { padding: 8 },

  userCard: { backgroundColor: "#EFF6FF", borderRadius: 12, padding: 14, marginBottom: 16, borderLeftWidth: 4, borderLeftColor: "#2563EB" },
  userGreeting: { fontSize: 16, fontWeight: "700", color: "#1E40AF", marginBottom: 4 },
  userEmail: { fontSize: 13, color: "#1E40AF" },

  statusCard: { backgroundColor: "#0f9d58", borderRadius: 12, padding: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16, paddingRight: 20, overflow: 'hidden' },
  statusTitle: { color: "#fff", fontSize: 18, fontWeight: "700" },
  statusSubtitle: { marginTop: 7, color: "rgba(255,255,255,0.9)" },
  statusContent: { flex: 1, marginRight: -60 },
  riskPill: { backgroundColor: "rgba(255,255,255,0.2)", marginBottom: 42.5, paddingHorizontal: 8, paddingVertical: 6, borderRadius: 50, alignSelf: "center", maxWidth: 110, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  riskText: { color: "#fff", fontWeight: "600", fontSize: 13 },

  sectionTitle: { fontSize: 17, fontWeight: "700", marginLeft: 16, marginBottom: 8, marginTop: 4, color: "#272d3b" },

  activityGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", marginBottom: 5 },
  activityCard: { width: "48%", height: 145, backgroundColor: "#fff", borderRadius: 12, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: "#f1f5f9" },
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
