import { useTheme } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import * as Device from 'expo-device';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSecurity } from '../../../context/SecurityContext';

export default function DeviceHealth() {
  const { colors, isDarkMode } = useTheme();
  const { securityState } = useSecurity();
  const [loading, setLoading] = useState(true);

  // Local state for standard checks (Expo Device)
  const [localHealth, setLocalHealth] = useState({
    isRooted: false,
    isEmulator: false,
    hasTestKeys: false,
  });

  const runChecks = async () => {
    setLoading(true);

    // 1. Root Check (Expo Device - complementary)
    const rooted = await Device.isRootedExperimentalAsync();

    // 2. Emulator Check Check (Expo Device - complementary)
    const emulator = !Device.isDevice;

    // 3. Test Keys Check 
    const hasTestKeys = Platform.OS === 'android' &&
      (Device.osBuildFingerprint?.includes('test-keys') ?? false);

    setLocalHealth({
      isRooted: rooted,
      isEmulator: emulator,
      hasTestKeys: hasTestKeys,
    });

    // Artificial delay to allow context sync or just for UX
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  };

  useEffect(() => {
    runChecks();
  }, []);

  const isRooted = localHealth.isRooted || securityState.isRooted;
  const isEmulator = localHealth.isEmulator || securityState.isEmulator;

  const isTampered = localHealth.hasTestKeys || securityState.isTampered;


  const isSafe = !isRooted && !isEmulator && !isTampered && securityState.status === 'GREEN';

  if (loading && !securityState.status) return (
    <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
      <ActivityIndicator size="large" color={colors.accent} />
      <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Running System Diagnostics...</Text>
    </View>
  );

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={runChecks} tintColor={colors.accent} />}
    >
      {/* Risk Banner */}
      <View style={[styles.banner, isSafe ? { backgroundColor: colors.success } : { backgroundColor: colors.danger }]}>
        <Ionicons name={isSafe ? "shield-checkmark" : "alert-circle"} size={64} color="#FFF" />
        <Text style={styles.bannerTitle}>{isSafe ? "System Secure" : "Security Risk Detected"}</Text>
        <Text style={styles.bannerSub}>
          {isSafe ? "No root access or anomalies found." : "Your device environment is compromised."}
        </Text>
      </View>

      {/* Detailed Diagnostics */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Security Checks</Text>

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <HealthItem
            label="Root Access (SU Binaries)"
            value={isRooted ? "Detected" : "Not Found"}
            safe={!isRooted}
            icon="key"
            colors={colors}
            isDarkMode={isDarkMode}
          />
          <HealthItem
            label="Build Signature (Test Keys/Tampering)"
            value={isTampered ? "Anomalies Found" : "Official Build"}
            safe={!isTampered}
            icon="finger-print"
            colors={colors}
            isDarkMode={isDarkMode}
          />
          <HealthItem
            label="Environment"
            value={isEmulator ? "Emulator" : "Physical Device"}
            safe={!isEmulator}
            icon="hardware-chip"
            colors={colors}
            isDarkMode={isDarkMode}
          />
        </View>
      </View>

      {/* Recommendation Section */}
      {!isSafe && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Recommendations</Text>
          <View style={[styles.card, styles.warningCard, { backgroundColor: isDarkMode ? 'rgba(255, 77, 79, 0.1)' : '#FEF2F2', borderColor: colors.danger }]}>
            <Text style={[styles.warningText, { color: isDarkMode ? colors.danger : '#991B1B' }]}>
              • Rooted devices are vulnerable to data theft.
            </Text>
            <Text style={[styles.warningText, { color: isDarkMode ? colors.danger : '#991B1B' }]}>
              • Emulators may not accurately reflect real-world security.
            </Text>
            <Text style={[styles.warningText, { color: isDarkMode ? colors.danger : '#991B1B' }]}>
              • Tampered apps or test keys indicate a compromised version.
            </Text>
          </View>
        </View>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

interface HealthItemProps {
  label: string;
  value: string;
  safe: boolean;
  icon: keyof typeof Ionicons.glyphMap;
  colors: any;
  isDarkMode: boolean;
}

const HealthItem = ({ label, value, safe, icon, colors, isDarkMode }: HealthItemProps) => (
  <View style={[styles.item, { borderBottomColor: colors.border }]}>
    <View style={styles.itemLeft}>
      <View style={[styles.iconBox, { backgroundColor: isDarkMode ? (safe ? 'rgba(46, 204, 113, 0.1)' : 'rgba(255, 77, 79, 0.1)') : (safe ? '#ECFDF5' : '#FEF2F2') }]}>
        <Ionicons name={icon} size={20} color={safe ? colors.success : colors.danger} />
      </View>
      <View>
        <Text style={[styles.itemLabel, { color: colors.textSecondary }]}>{label}</Text>
        <Text style={[styles.itemValue, { color: colors.textPrimary }]}>{value}</Text>
      </View>
    </View>
    <Ionicons
      name={safe ? "checkmark-circle" : "close-circle"}
      size={24}
      color={safe ? colors.success : colors.danger}
    />
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, fontSize: 16 },

  banner: { paddingVertical: 50, paddingHorizontal: 20, alignItems: 'center', justifyContent: 'center', borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  bannerTitle: { color: '#FFF', fontSize: 24, fontWeight: '800', marginTop: 16 },
  bannerSub: { color: '#FFF', fontSize: 14, opacity: 0.9, marginTop: 4, textAlign: 'center' },

  section: { paddingHorizontal: 20, marginTop: 24 },
  sectionTitle: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', marginBottom: 12, marginLeft: 4, letterSpacing: 1 },

  card: { borderRadius: 20, padding: 20, borderWidth: 1 },
  warningCard: { borderLeftWidth: 4 },
  warningText: { fontSize: 14, marginBottom: 6, lineHeight: 20 },

  item: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1 },
  itemLeft: { flexDirection: 'row', alignItems: 'center' },
  iconBox: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  itemLabel: { fontSize: 13, fontWeight: '600' },
  itemValue: { fontSize: 15, fontWeight: '700', marginTop: 2 }
});
