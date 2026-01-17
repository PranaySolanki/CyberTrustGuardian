import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/services/auth/authContext";
import { db } from "@/services/firebase/firebase";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from 'expo-linear-gradient';
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
  View,
} from "react-native";

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
  const { colors, toggleTheme, isDarkMode } = useTheme();

  const [stats, setStats] = useState({ scansToday: 0, threatsBlocked: 0, appsAnalyzed: 0, safetyScore: 100 });
  const [recentScans, setRecentScans] = useState<any[]>([]);
  const [showGreeting, setShowGreeting] = useState(true);

  useEffect(() => {
    // Hide greeting after 15 seconds
    const timer = setTimeout(() => {
      setShowGreeting(false);
    }, 15000);

    return () => clearTimeout(timer);
  }, []);

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
    <View style={[styles.safe, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.headerRow}>
          <View style={[styles.appBadge, { backgroundColor: isDarkMode ? colors.surface : '#e6f5ff' }]}>
            <Text style={styles.appBadgeEmoji}>🛡️</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.appTitle, { color: colors.textPrimary }]}>CyberTrust</Text>
            <Text style={[styles.appSubtitle, { color: colors.textSecondary }]}>Guardian</Text>
          </View>
          <TouchableOpacity style={styles.headerButton} onPress={handleSignOut}>
            <Ionicons name="log-out-outline" size={24} color={colors.accent} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.themeToggle} onPress={toggleTheme}>
            <Ionicons name={isDarkMode ? "sunny-outline" : "moon-outline"} size={22} color={colors.accent} />
          </TouchableOpacity>
        </View>

        {user && showGreeting && (
          <View style={[styles.userCard, { backgroundColor: isDarkMode ? colors.surface : "#EFF6FF", borderLeftColor: colors.accent }]}>
            <Text style={[styles.userGreeting, { color: isDarkMode ? colors.textPrimary : "#1E40AF" }]}>Welcome back, {user.fullName}!</Text>
            <Text style={[styles.userEmail, { color: isDarkMode ? colors.textSecondary : "#1E40AF" }]}>{user.email}</Text>
          </View>
        )}

        <LinearGradient
          colors={isDarkMode ? [colors.accent, colors.accentDesaturated] : ['#E2E8F0', '#CBD5E1']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.statusCard, !isDarkMode && { backgroundColor: '#E2E8F0' }]}
        >
          <View style={styles.statusContent}>
            <Text style={[styles.statusTitle, { color: isDarkMode ? colors.background : colors.textPrimary }]}>System Secure</Text>
            <Text style={[styles.statusSubtitle, { color: isDarkMode ? colors.background : colors.textSecondary, opacity: 0.9 }]}>
              Device is protected. {stats.threatsBlocked} threats blocked.
            </Text>
            <View style={[
              styles.integritySummary,
              {
                backgroundColor: isDarkMode ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.5)',
                borderColor: isDarkMode ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.1)',
                borderWidth: 1
              }
            ]}>
              <Ionicons name="shield-checkmark" size={14} color={isDarkMode ? colors.background : colors.textPrimary} />
              <Text style={[styles.integrityText, { color: isDarkMode ? colors.background : colors.textPrimary }]}>Device Integrity: Verified</Text>
            </View>
          </View>
          <View style={[styles.riskPill, { backgroundColor: isDarkMode ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.3)' }]}>
            <Text style={[styles.riskText, { color: isDarkMode ? colors.background : colors.textPrimary }]} numberOfLines={1}>Low Risk</Text>
          </View>
        </LinearGradient>

        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Today's Activity</Text>

        <View style={styles.activityGrid}>
          {[
            { label: 'Scans Today', value: stats.scansToday, emoji: '📈' },
            { label: 'Threats Blocked', value: stats.threatsBlocked, emoji: '⚠️' },
            { label: 'Apps Analyzed', value: stats.appsAnalyzed, emoji: '🧾' },
            { label: 'Safety Score', value: `${stats.safetyScore}%`, emoji: '✔️' }
          ].map((item, idx) => (
            <View key={idx} style={[styles.activityCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={styles.activityIcon}>{item.emoji}</Text>
              <Text style={[styles.activityNumber, { color: colors.textPrimary }]}>{item.value}</Text>
              <Text style={[styles.activityLabel, { color: colors.textSecondary }]}>{item.label}</Text>
            </View>
          ))}
        </View>

        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Security Tools</Text>

        <View style={styles.toolList}>
          {[
            { href: '/pages/phishing/phishing', title: 'Phishing Detector', sub: 'Scan emails, SMS & links for threats', emoji: '✉️', color: colors.danger },
            { href: '/pages/qr_scanner/qr_scanner', title: 'QR Safety Checker', sub: 'Verify QR codes before scanning', emoji: '📸', color: colors.accentDesaturated },
            { href: '/pages/app_detection/app_detection', title: 'App Permissions', sub: 'Analyze installed app security', emoji: '🔒', color: colors.purple },
            { href: '/pages/device_health/device_health', title: 'Device Integrity Check', sub: 'Root & emulator detection', emoji: '📱', color: colors.warning },
            { href: '/pages/breach_check/breach', title: 'Breach Exposure Checker', sub: 'Check emails and passwords against breach databases', emoji: '🔐', color: '#ffd166' }
          ].map((tool, idx) => (
            <Link key={idx} href={tool.href as any} style={{ textDecorationLine: "none" }}>
              <View style={[styles.toolItem, { width: toolItemWidth, marginBottom: toolItemMarginBottom, backgroundColor: colors.surface, borderColor: colors.border }]}>
                {/* Replaced BlurView with a standard View for better compatibility until rebuild */}
                <View style={[styles.toolIcon, { backgroundColor: isDarkMode ? tool.color + '33' : tool.color }]}>
                  <Text style={[styles.toolIconEmoji, { fontSize: isDarkMode ? 32 : 40 }]}>{tool.emoji}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.toolTitle, { color: colors.textPrimary }]}>{tool.title}</Text>
                  <Text style={[styles.toolSub, { color: colors.textSecondary }]}>{tool.sub}</Text>
                </View>
                <Text style={styles.chev}>›</Text>
              </View>
            </Link>
          ))}
        </View>

        <View style={[styles.tipCard, { backgroundColor: isDarkMode ? colors.surfaceLighter : "#c8dcfa" }]}>
          <Text style={[styles.tipTitle, { color: isDarkMode ? colors.accent : "#367cec" }]}>🛡️ Security Tip</Text>
          <Text style={[styles.tipText, { color: colors.textPrimary }]}>
            Always verify sender email addresses before clicking links. Hover over links to preview the destination URL.
          </Text>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Recent Scans</Text>

        <View style={styles.recentList}>
          {recentScans.length === 0 ? (
            <View style={{ padding: 20, alignItems: 'center' }}>
              <Text style={{ color: colors.textSecondary }}>No recent activity</Text>
            </View>
          ) : (
            recentScans.map((scan) => (
              <TouchableOpacity key={scan.id} style={[styles.recentItem, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={() => handleRecentPress(scan)}>
                <View>
                  <Text style={[styles.recentLabel, { color: colors.textPrimary }]}>{scan.type || 'Unknown Scan'}</Text>
                  <Text style={[styles.recentTime, { color: colors.textSecondary }]}>{formatTimeAgo(scan.timestamp)}</Text>
                </View>
                <View style={[
                  scan.status === 'Safe' ? styles.recentStatusSafe : styles.recentStatusSusp,
                  { backgroundColor: scan.status === 'Safe' ? (isDarkMode ? '#064e3b40' : '#e6f9ef') : (isDarkMode ? '#D6555540' : '#fff1f0') }
                ]}>
                  <Text style={[
                    styles.recentStatusText,
                    { color: scan.status === 'Safe' ? colors.success : colors.danger }
                  ]}>
                    {scan.status || 'Unknown'}
                  </Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f7f9fa" },
  container: { padding: 16, paddingBottom: 40 },
  headerRow: { flexDirection: "row", alignItems: "center", marginBottom: 12, marginTop: 30 },
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
  statusSubtitle: { marginTop: 4, color: "rgba(255,255,255,0.9)", fontSize: 13 },
  statusContent: { flex: 1, marginRight: -60 },
  integritySummary: { flexDirection: 'row', alignItems: 'center', marginTop: 8, backgroundColor: 'rgba(255,255,255,0.2)', alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  integrityText: { color: '#fff', fontSize: 11, fontWeight: '700', marginLeft: 4 },
  riskPill: { backgroundColor: "rgba(255,255,255,0.2)", marginBottom: 42.5, paddingHorizontal: 8, paddingVertical: 6, borderRadius: 50, alignSelf: "center", maxWidth: 110, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  riskText: { color: "#fff", fontWeight: "600", fontSize: 13 },

  sectionTitle: { fontSize: 13, fontWeight: "800", marginLeft: 8, marginBottom: 12, marginTop: 20, textTransform: 'uppercase', letterSpacing: 1 },

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
