import { useTheme } from '@/context/ThemeContext';
import { router } from 'expo-router';
import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function AuthIndex() {
  const { colors, isDarkMode } = useTheme();

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: colors.background }]}>
      {/* Logo Section */}
      <View style={[styles.heroSection, { backgroundColor: isDarkMode ? colors.surface : '#EFF6FF', borderBottomColor: colors.border }]}>
        <Text style={styles.heroBadge}>🛡️</Text>
        <Text style={[styles.heroTitle, { color: colors.accent }]}>CyberTrust Guardian</Text>
        <Text style={[styles.heroSubtitle, { color: colors.textSecondary }]}>Protect Yourself from Digital Threats</Text>
      </View>

      {/* Features Section */}
      <View style={styles.featuresSection}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Why CyberGuardian?</Text>

        <View style={[styles.featureCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={styles.featureIcon}>✉️</Text>
          <Text style={[styles.featureTitle, { color: colors.textPrimary }]}>Phishing Detection</Text>
          <Text style={[styles.featureDescription, { color: colors.textSecondary }]}>
            AI-powered analysis to detect phishing emails, SMS, and links in real-time
          </Text>
        </View>

        <View style={[styles.featureCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={styles.featureIcon}>📸</Text>
          <Text style={[styles.featureTitle, { color: colors.textPrimary }]}>QR Code Safety</Text>
          <Text style={[styles.featureDescription, { color: colors.textSecondary }]}>
            Scan QR codes safely and verify URLs before visiting them
          </Text>
        </View>

        <View style={[styles.featureCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={styles.featureIcon}>🔒</Text>
          <Text style={[styles.featureTitle, { color: colors.textPrimary }]}>App Permissions</Text>
          <Text style={[styles.featureDescription, { color: colors.textSecondary }]}>
            Analyze installed apps for excessive permissions and security risks
          </Text>
        </View>

        <View style={[styles.featureCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={styles.featureIcon}>📱</Text>
          <Text style={[styles.featureTitle, { color: colors.textPrimary }]}>Device Integrity</Text>
          <Text style={[styles.featureDescription, { color: colors.textSecondary }]}>
            Verify your system's health with root, emulator, and integrity check diagnostics
          </Text>
        </View>

        <View style={[styles.featureCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={styles.featureIcon}>🔐</Text>
          <Text style={[styles.featureTitle, { color: colors.textPrimary }]}>Breach Checker</Text>
          <Text style={[styles.featureDescription, { color: colors.textSecondary }]}>
            Check if your email or password has appeared in known data breaches
          </Text>
        </View>
      </View>

      {/* Stats Section */}
      <View style={styles.statsSection}>
        <View style={[styles.statCard, { backgroundColor: colors.accent }]}>
          <Text style={[styles.statNumber, { color: colors.background }]}>1M+</Text>
          <Text style={[styles.statLabel, { color: colors.background }]}>Threats Detected</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.accent }]}>
          <Text style={[styles.statNumber, { color: colors.background }]}>500K+</Text>
          <Text style={[styles.statLabel, { color: colors.background }]}>Users Protected</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.accent }]}>
          <Text style={[styles.statNumber, { color: colors.background }]}>24/7</Text>
          <Text style={[styles.statLabel, { color: colors.background }]}>Active Monitoring</Text>
        </View>
      </View>

      {/* CTA Section */}
      <View style={styles.ctaSection}>
        <TouchableOpacity
          style={[styles.signUpButton, { backgroundColor: colors.accent }]}
          onPress={() => router.push('/auth/sign-up' as any)}
          activeOpacity={0.8}
        >
          <Text style={[styles.signUpButtonText, { color: colors.background }]}>Create Account</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.signInButton, {
            borderColor: colors.accent,
            backgroundColor: isDarkMode ? 'rgba(0, 242, 254, 0.05)' : colors.surface
          }]}
          onPress={() => router.push('/auth/sign-in' as any)}
          activeOpacity={0.8}
        >
          <Text style={[styles.signInButtonText, { color: colors.accent }]}>Sign In</Text>
        </TouchableOpacity>
      </View>

      {/* Trust Section */}
      <View style={[styles.trustSection, { backgroundColor: isDarkMode ? colors.surface : '#F0FDF4', borderLeftColor: colors.success }]}>
        <Text style={[styles.trustTitle, { color: isDarkMode ? colors.textPrimary : '#166534' }]}>We Take Your Security Seriously</Text>
        <View style={styles.trustFeature}>
          <Text style={[styles.trustIcon, { color: colors.success }]}>✓</Text>
          <Text style={[styles.trustText, { color: isDarkMode ? colors.textSecondary : '#166534' }]}>Military-grade encryption for all data</Text>
        </View>
        <View style={styles.trustFeature}>
          <Text style={[styles.trustIcon, { color: colors.success }]}>✓</Text>
          <Text style={[styles.trustText, { color: isDarkMode ? colors.textSecondary : '#166534' }]}>No ads or data selling</Text>
        </View>
        <View style={styles.trustFeature}>
          <Text style={[styles.trustIcon, { color: colors.success }]}>✓</Text>
          <Text style={[styles.trustText, { color: isDarkMode ? colors.textSecondary : '#166534' }]}>Regular security audits</Text>
        </View>
      </View>
    </ScrollView >
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  heroSection: {
    alignItems: 'center',
    paddingVertical: 50,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  heroBadge: {
    fontSize: 64,
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: '800',
    marginBottom: 8,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center',
  },
  featuresSection: {
    paddingHorizontal: 20,
    paddingVertical: 30,
  },
  featureCard: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 20,
    marginBottom: 16,
    borderWidth: 1,
  },
  featureIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 13,
    lineHeight: 19,
  },
  statsSection: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 20,
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 20,
    alignItems: 'center',
    marginHorizontal: 6,
  },
  statNumber: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    textAlign: 'center',
    fontWeight: '600',
  },
  ctaSection: {
    paddingHorizontal: 20,
    paddingVertical: 30,
    alignItems: 'center',
  },
  signUpButton: {
    width: '100%',
    borderRadius: 28,
    paddingVertical: 18,
    alignItems: 'center',
    marginBottom: 16,
    // Add shadow for visibility
    shadowColor: "#00F2FE",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  signUpButtonText: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  signInButton: {
    width: '100%',
    borderRadius: 28,
    paddingVertical: 18,
    alignItems: 'center',
    borderWidth: 2,
  },
  signInButtonText: {
    fontSize: 18,
    fontWeight: '700',
  },
  trustSection: {
    paddingHorizontal: 20,
    paddingVertical: 30,
    marginHorizontal: 20,
    borderRadius: 12,
    borderLeftWidth: 4,
  },
  trustTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  trustFeature: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  trustIcon: {
    fontSize: 18,
    marginRight: 12,
    fontWeight: '700',
  },
  trustText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 20,
  },
});
