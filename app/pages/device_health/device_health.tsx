import { Ionicons } from '@expo/vector-icons';
import * as Device from 'expo-device';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSecurity } from '../../../context/SecurityContext';

export default function DeviceHealth() {
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
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#2563EB" />
      <Text style={styles.loadingText}>Running System Diagnostics...</Text>
    </View>
  );

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={runChecks} />}
    >
      {/* Risk Banner */}
      <View style={[styles.banner, isSafe ? styles.bgGreen : styles.bgRed]}>
        <Ionicons name={isSafe ? "shield-checkmark" : "alert-circle"} size={64} color="#FFF" />
        <Text style={styles.bannerTitle}>{isSafe ? "System Secure" : "Security Risk Detected"}</Text>
        <Text style={styles.bannerSub}>
          {isSafe ? "No root access or anomalies found." : "Your device environment is compromised."}
        </Text>
      </View>

      {/* Detailed Diagnostics */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Security Checks</Text>

        <View style={styles.card}>
          <HealthItem
            label="Root Access (SU Binaries)"
            value={isRooted ? "Detected" : "Not Found"}
            safe={!isRooted}
            icon="key"
          />
          <HealthItem
            label="Build Signature (Test Keys/Tampering)"
            value={isTampered ? "Anomalies Found" : "Official Build"}
            safe={!isTampered}
            icon="finger-print"
          />
          <HealthItem
            label="Environment"
            value={isEmulator ? "Emulator" : "Physical Device"}
            safe={!isEmulator}
            icon="hardware-chip"
          />
        </View>
      </View>

      {/* Recommendation Section */}
      {!isSafe && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recommendations</Text>
          <View style={[styles.card, styles.warningCard]}>
            <Text style={styles.warningText}>
              • Rooted devices are vulnerable to data theft.
            </Text>
            <Text style={styles.warningText}>
              • Emulators may not accurately reflect real-world security.
            </Text>
            <Text style={styles.warningText}>
              • Tampered apps or test keys indicate a compromised version.
            </Text>
          </View>
        </View>
      )}

    </ScrollView>
  );
}

interface HealthItemProps {
  label: string;
  value: string;
  safe: boolean;
  icon: keyof typeof Ionicons.glyphMap;
}

const HealthItem = ({ label, value, safe, icon }: HealthItemProps) => (
  <View style={styles.item}>
    <View style={styles.itemLeft}>
      <View style={[styles.iconBox, { backgroundColor: safe ? '#ECFDF5' : '#FEF2F2' }]}>
        <Ionicons name={icon} size={20} color={safe ? "#10B981" : "#EF4444"} />
      </View>
      <View>
        <Text style={styles.itemLabel}>{label}</Text>
        <Text style={styles.itemValue}>{value}</Text>
      </View>
    </View>
    <Ionicons
      name={safe ? "checkmark-circle" : "close-circle"}
      size={24}
      color={safe ? "#10B981" : "#EF4444"}
    />
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFF' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFF' },
  loadingText: { marginTop: 12, color: '#64748B', fontSize: 16 },

  banner: { paddingVertical: 50, paddingHorizontal: 20, alignItems: 'center', justifyContent: 'center', borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  bgGreen: { backgroundColor: '#10B981' },
  bgRed: { backgroundColor: '#EF4444' },
  bannerTitle: { color: '#FFF', fontSize: 24, fontWeight: '800', marginTop: 16 },
  bannerSub: { color: '#FFF', fontSize: 14, opacity: 0.9, marginTop: 4, textAlign: 'center' },

  section: { paddingHorizontal: 20, marginTop: 24 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#64748B', textTransform: 'uppercase', marginBottom: 12, marginLeft: 4 },

  card: { backgroundColor: '#FFF', borderRadius: 20, padding: 20, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10 },
  warningCard: { backgroundColor: '#FEF2F2', borderLeftWidth: 4, borderLeftColor: '#EF4444' },
  warningText: { color: '#991B1B', fontSize: 14, marginBottom: 6, lineHeight: 20 },

  item: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  itemLeft: { flexDirection: 'row', alignItems: 'center' },
  iconBox: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  itemLabel: { fontSize: 13, color: '#64748B', fontWeight: '600' },
  itemValue: { fontSize: 15, color: '#0F172A', fontWeight: '700', marginTop: 2 }
});