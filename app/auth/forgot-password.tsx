import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/services/auth/authContext';
import { validateEmail } from '@/services/auth/validation';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

export default function ForgotPassword() {
  const { resetPassword, isLoading } = useAuth();
  const { colors, isDarkMode } = useTheme();
  const [email, setEmail] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{
    [key: string]: string;
  }>({});

  const handleResetPassword = async () => {
    const emailValidation = validateEmail(email);

    if (!emailValidation.isValid) {
      setFieldErrors({ email: emailValidation.error! });
      Alert.alert('Validation Error', emailValidation.error);
      return;
    }

    setFieldErrors({});

    try {
      const result = await resetPassword(email);

      if (result.success) {
        setEmailSent(true);
        Alert.alert(
          'Password Reset Link Sent',
          `We've sent a password reset link to ${email}. Please check your email.`,
          [
            {
              text: 'Back to Sign In',
              onPress: () => router.push('/auth/sign-in'),
            },
          ]
        );
      } else {
        Alert.alert('Error', result.error || 'Failed to send reset link');
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred');
    }
  };

  const isFormValid = email.trim() !== '';

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.headerSection}>
        <Text style={styles.logo}>🔐</Text>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Reset Password</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Enter your email address and we'll send you a link to reset your password
        </Text>
      </View>

      {!emailSent ? (
        <View style={styles.formSection}>
          {/* Email Input */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textPrimary }]}>Email Address</Text>
            <TextInput
              style={[styles.input, fieldErrors.email && styles.inputError, { backgroundColor: colors.surface, color: colors.textPrimary, borderColor: colors.border }]}
              placeholder="Enter your email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!isLoading}
              placeholderTextColor={colors.textSecondary}
            />
            {fieldErrors.email && (
              <Text style={[styles.errorText, { color: colors.danger }]}>⚠️ {fieldErrors.email}</Text>
            )}
          </View>

          {/* Reset Button */}
          <TouchableOpacity
            style={[styles.resetButton, (!isFormValid || isLoading) && styles.buttonDisabled, { backgroundColor: colors.accent }]}
            onPress={handleResetPassword}
            disabled={!isFormValid || isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={colors.background} />
            ) : (
              <Text style={[styles.resetButtonText, { color: colors.background }]}>Send Reset Link</Text>
            )}
          </TouchableOpacity>

          {/* Back to Sign In */}
          <View style={styles.backContainer}>
            <TouchableOpacity onPress={() => router.push('/auth/sign-in')} disabled={isLoading}>
              <Text style={[styles.backLink, { color: colors.accent }]}>← Back to Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.successSection}>
          <View style={[styles.successIcon, { backgroundColor: isDarkMode ? colors.surface : '#D1FAE5' }]}>
            <Text style={[styles.successEmoji, { color: colors.success }]}>✓</Text>
          </View>
          <Text style={[styles.successTitle, { color: colors.textPrimary }]}>Check Your Email</Text>
          <Text style={[styles.successMessage, { color: colors.textSecondary }]}>
            We've sent a password reset link to {email}. Please check your email and follow the instructions.
          </Text>

          <View style={[styles.infoCard, { backgroundColor: isDarkMode ? colors.surface : '#EFF6FF', borderLeftColor: colors.accent }]}>
            <Text style={[styles.infoTitle, { color: colors.accent }]}>Didn't receive an email?</Text>
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>
              • Check your spam or junk folder{'\n'}
              • Wait a few minutes and try again{'\n'}
              • Make sure you entered the correct email address
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.backToSignInButton, { backgroundColor: colors.accent }]}
            onPress={() => router.push('/auth/sign-in')}
          >
            <Text style={[styles.backToSignInButtonText, { color: colors.background }]}>Back to Sign In</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingBottom: 30,
  },
  headerSection: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingTop: 40,
  },
  logo: {
    fontSize: 48,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 20,
  },
  formSection: {
    paddingHorizontal: 20,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
  },
  inputError: {
    borderColor: '#FF7E5F',
  },
  errorText: {
    fontSize: 12,
    marginTop: 6,
    fontWeight: '500',
  },
  resetButton: {
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  backContainer: {
    alignItems: 'center',
  },
  backLink: {
    fontSize: 14,
    fontWeight: '600',
  },
  successSection: {
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  successEmoji: {
    fontSize: 40,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 12,
  },
  successMessage: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
  },
  infoCard: {
    borderRadius: 8,
    borderLeftWidth: 4,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 28,
    width: '100%',
  },
  infoTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 12,
    lineHeight: 20,
  },
  backToSignInButton: {
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center',
    width: '100%',
  },
  backToSignInButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
});
