import { Image } from 'expo-image';
import { Link } from 'expo-router';
import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AuthIndex() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFF' }}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Logo Section */}
        <View style={styles.heroSection}>
          <Image
            source={require('../../assets/images/logo.png')}
            style={{ width: 100, height: 100, marginBottom: 20 }}
            resizeMode="contain"
          />
          <Text style={styles.heroTitle}>CyberTrust Guardian</Text>
          <Text style={styles.heroSubtitle}>Protect Yourself from Digital Threats</Text>
        </View>

        {/* Features Section */}
        <View style={styles.featuresSection}>
          <Text style={styles.sectionTitle}>Why CyberGuardian?</Text>

          <View style={styles.featureCard}>
            <Text style={styles.featureIcon}>✉️</Text>
            <Text style={styles.featureTitle}>Phishing Detection</Text>
            <Text style={styles.featureDescription}>
              AI-powered analysis to detect phishing emails, SMS, and links in real-time
            </Text>
          </View>

          <View style={styles.featureCard}>
            <Text style={styles.featureIcon}>📸</Text>
            <Text style={styles.featureTitle}>QR Code Safety</Text>
            <Text style={styles.featureDescription}>
              Scan QR codes safely and verify URLs before visiting them
            </Text>
          </View>

          <View style={styles.featureCard}>
            <Text style={styles.featureIcon}>🔒</Text>
            <Text style={styles.featureTitle}>App Permissions</Text>
            <Text style={styles.featureDescription}>
              Analyze installed apps for excessive permissions and security risks
            </Text>
          </View>

          <View style={styles.featureCard}>
            <Text style={styles.featureIcon}>🔐</Text>
            <Text style={styles.featureTitle}>Breach Checker</Text>
            <Text style={styles.featureDescription}>
              Check if your email or password has appeared in known data breaches
            </Text>
          </View>

          <View style={styles.featureCard}>
            <Text style={styles.featureIcon}>📱</Text>
            <Text style={styles.featureTitle}>Device Integrity</Text>
            <Text style={styles.featureDescription}>
              Detect root access, emulators, and system tampering to ensure your device environment is safe
            </Text>
          </View>
        </View>

        {/* Stats Section */}
        <View style={styles.statsSection}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>1M+</Text>
            <Text style={styles.statLabel}>Threats Detected</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>500K+</Text>
            <Text style={styles.statLabel}>Users Protected</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>24/7</Text>
            <Text style={styles.statLabel}>Active Monitoring</Text>
          </View>
        </View>

        {/* CTA Section */}
        <View style={styles.ctaSection}>
          <Link href="/auth/sign-up" asChild>
            <TouchableOpacity style={styles.signUpButton}>
              <Text style={styles.signUpButtonText}>Create Account</Text>
            </TouchableOpacity>
          </Link>

          <Link href="/auth/sign-in" asChild>
            <TouchableOpacity style={styles.signInButton}>
              <Text style={styles.signInButtonText}>Sign In</Text>
            </TouchableOpacity>
          </Link>
        </View>

        {/* Trust Section */}
        <View style={styles.trustSection}>
          <Text style={styles.trustTitle}>We Take Your Security Seriously</Text>
          <View style={styles.trustFeature}>
            <Text style={styles.trustIcon}>✓</Text>
            <Text style={styles.trustText}>Military-grade encryption for all data</Text>
          </View>
          <View style={styles.trustFeature}>
            <Text style={styles.trustIcon}>✓</Text>
            <Text style={styles.trustText}>No ads or data selling</Text>
          </View>
          <View style={styles.trustFeature}>
            <Text style={styles.trustIcon}>✓</Text>
            <Text style={styles.trustText}>Regular security audits</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#F8FAFF',
    paddingBottom: 40,
  },
  heroSection: {
    alignItems: 'center',
    paddingVertical: 50,
    paddingHorizontal: 20,
    backgroundColor: '#EFF6FF',
    borderBottomWidth: 1,
    borderBottomColor: '#DBEAFE',
  },
  heroBadge: {
    fontSize: 64,
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1E40AF',
    marginBottom: 8,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: 16,
    color: '#1E3A8A',
    textAlign: 'center',
    lineHeight: 24,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1A202C',
    marginBottom: 16,
    textAlign: 'center',
  },
  featuresSection: {
    paddingHorizontal: 20,
    paddingVertical: 30,
  },
  featureCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  featureIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A202C',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 13,
    color: '#4A5568',
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
    backgroundColor: '#2563EB',
    borderRadius: 12,
    paddingVertical: 20,
    alignItems: 'center',
    marginHorizontal: 6,
  },
  statNumber: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: '#DBEAFE',
    textAlign: 'center',
    fontWeight: '600',
  },
  ctaSection: {
    paddingHorizontal: 20,
    paddingVertical: 30,
  },
  signUpButton: {
    backgroundColor: '#2563EB',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  signUpButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  signInButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#2563EB',
  },
  signInButtonText: {
    color: '#2563EB',
    fontSize: 16,
    fontWeight: '700',
  },
  trustSection: {
    paddingHorizontal: 20,
    paddingVertical: 30,
    backgroundColor: '#F0FDF4',
    marginHorizontal: 20,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#059669',
  },
  trustTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#166534',
    marginBottom: 16,
  },
  trustFeature: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  trustIcon: {
    fontSize: 18,
    color: '#059669',
    marginRight: 12,
    fontWeight: '700',
  },
  trustText: {
    flex: 1,
    fontSize: 13,
    color: '#166534',
    lineHeight: 20,
  },
});
