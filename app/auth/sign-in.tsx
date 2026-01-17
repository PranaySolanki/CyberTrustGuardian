import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/services/auth/authContext';
import { validateSignInForm } from '@/services/auth/validation';
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

export default function SignIn() {
  const { signIn, isLoading } = useAuth();
  const { colors, isDarkMode } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{
    [key: string]: string;
  }>({});
  const [apiError, setApiError] = useState<string | null>(null);

  const handleSignIn = async () => {
    // Validate form
    const errors = validateSignInForm(email, password);

    if (errors.length > 0) {
      const errorMap: { [key: string]: string } = {};
      errors.forEach((err) => {
        errorMap[err.field] = err.message;
      });
      setFieldErrors(errorMap);

      // Show first error as alert
      Alert.alert('Validation Error', errors[0].message);
      return;
    }

    setFieldErrors({});
    setApiError(null);

    try {
      const result = await signIn(email, password, rememberMe);

      if (result.success) {
        Alert.alert('Success', 'Signed in successfully!', [
          {
            text: 'OK',
            onPress: () => router.replace('/'),
          },
        ]);
        // Router replace happens in callback, but we can also just let the state update if needed
      } else {
        setApiError(result.error || 'Invalid email or password');
      }
    } catch (error) {
      setApiError('An unexpected error occurred');
    }
  };

  const isFormValid = email.trim() !== '' && password !== '';

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.headerSection}>
        <Text style={styles.logo}>🛡️</Text>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Sign In</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Welcome back to CyberGuardian</Text>
      </View>

      <View style={styles.formSection}>
        {apiError && (
          <View style={[styles.errorBanner, { backgroundColor: isDarkMode ? 'rgba(255, 126, 95, 0.1)' : '#FEF2F2', borderColor: colors.danger }]}>
            <Text style={[styles.errorBannerText, { color: colors.danger }]}>{apiError}</Text>
          </View>
        )}

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

        {/* Password Input */}
        <View style={styles.inputGroup}>
          <View style={styles.labelRow}>
            <Text style={[styles.label, { color: colors.textPrimary }]}>Password</Text>
            <TouchableOpacity onPress={() => router.push('/auth/forgot-password')} disabled={isLoading}>
              <Text style={[styles.forgotLink, { color: colors.accent }]}>Forgot?</Text>
            </TouchableOpacity>
          </View>
          <View style={[styles.passwordInputContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <TextInput
              style={[
                styles.passwordInput,
                fieldErrors.password && styles.inputError,
                { color: colors.textPrimary }
              ]}
              placeholder="Enter your password"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
              editable={!isLoading}
              placeholderTextColor={colors.textSecondary}
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              disabled={isLoading}
            >
              <Text style={styles.eyeIcon}>{showPassword ? '👁️' : '👁️‍🗨️'}</Text>
            </TouchableOpacity>
          </View>
          {fieldErrors.password && (
            <Text style={[styles.errorText, { color: colors.danger }]}>⚠️ {fieldErrors.password}</Text>
          )}
        </View>

        {/* Remember Me */}
        <View style={styles.rememberMeContainer}>
          <TouchableOpacity
            style={styles.checkbox}
            onPress={() => setRememberMe(!rememberMe)}
            disabled={isLoading}
          >
            <Text style={[styles.checkboxText, { color: colors.accent }]}>{rememberMe ? '☑️' : '☐'}</Text>
          </TouchableOpacity>
          <Text style={[styles.rememberMeText, { color: colors.textSecondary }]}>Remember me on this device</Text>
        </View>

        {/* Sign In Button */}
        <TouchableOpacity
          style={[styles.signInButton, (!isFormValid || isLoading) && styles.buttonDisabled, { backgroundColor: colors.accent }]}
          onPress={handleSignIn}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color={colors.background} />
          ) : (
            <Text style={[styles.signInButtonText, { color: colors.background }]}>Sign In</Text>
          )}
        </TouchableOpacity>

        {/* Security Tips */}
        <View style={[styles.tipsCard, { backgroundColor: isDarkMode ? colors.surface : '#EFF6FF', borderLeftColor: colors.accent }]}>
          <Text style={[styles.tipsTitle, { color: colors.accent }]}>🔐 Security Tip</Text>
          <Text style={[styles.tipsText, { color: colors.textSecondary }]}>
            Never share your password with anyone. CyberGuardian will never ask for your password via email.
          </Text>
        </View>

        {/* Sign Up Link */}
        <View style={styles.signUpContainer}>
          <Text style={[styles.signUpText, { color: colors.textSecondary }]}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => router.push('/auth/sign-up')} disabled={isLoading}>
            <Text style={[styles.signUpLink, { color: colors.accent }]}>Create one</Text>
          </TouchableOpacity>
        </View>
      </View>
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
  },
  formSection: {
    paddingHorizontal: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  forgotLink: {
    fontSize: 12,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
  },
  inputError: {
    borderColor: '#FF7E5F', // Use Coral for error
  },
  passwordInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingRight: 12,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
  },
  eyeIcon: {
    fontSize: 18,
    marginLeft: 8,
  },
  errorText: {
    fontSize: 12,
    marginTop: 6,
    fontWeight: '500',
  },
  rememberMeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  checkbox: {
    marginRight: 10,
  },
  checkboxText: {
    fontSize: 18,
  },
  rememberMeText: {
    fontSize: 13,
  },
  signInButton: {
    borderRadius: 28,
    paddingVertical: 18,
    alignItems: 'center',
    marginBottom: 20,
    // Add shadow for premium feel
    shadowColor: "#00F2FE",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  signInButtonText: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  tipsCard: {
    borderLeftWidth: 4,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 20,
  },
  tipsTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 4,
  },
  tipsText: {
    fontSize: 12,
    lineHeight: 18,
  },
  signUpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signUpText: {
    fontSize: 14,
  },
  signUpLink: {
    fontSize: 14,
    fontWeight: '600',
  },
  errorBanner: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    alignItems: 'center',
  },
  errorBannerText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
});
