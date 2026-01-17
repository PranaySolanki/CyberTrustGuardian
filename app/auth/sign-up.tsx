import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/services/auth/authContext';
import {
  validateEmail,
  validateFullName,
  validatePassword,
  validatePasswordMatch,
  validateSignUpForm,
} from '@/services/auth/validation';
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

export default function SignUp() {
  const { signUp, isLoading } = useAuth();
  const { colors, isDarkMode } = useTheme();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Real-time validation feedback
  const [fieldErrors, setFieldErrors] = useState<{
    [key: string]: string;
  }>({});

  const fullNameValidation = validateFullName(fullName);
  const passwordValidation = validatePassword(password);
  const passwordMatchValidation = validatePasswordMatch(password, confirmPassword);
  const emailValidation = validateEmail(email);

  const handleSignUp = async () => {
    // Validate form
    const errors = validateSignUpForm(
      email,
      password,
      confirmPassword,
      fullName,
      termsAccepted
    );

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

    try {
      const result = await signUp(email, password, fullName);

      if (result.success) {
        Alert.alert('Success', 'Account created successfully! Please sign in.', [
          {
            text: 'OK',
            onPress: () => router.replace('/auth/sign-in'),
          },
        ]);
      } else {
        Alert.alert('Sign Up Failed', result.error || 'An error occurred during sign up');
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred');
    }
  };

  const isFormValid =
    passwordValidation.isValid &&
    passwordMatchValidation.isValid &&
    emailValidation.isValid &&
    termsAccepted;

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.headerSection}>
        <Text style={styles.logo}>🛡️</Text>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Create Account</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Join CyberGuardian to protect yourself online</Text>
      </View>

      <View style={styles.formSection}>
        {/* Full Name Input */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.textPrimary }]}>Full Name</Text>
          <TextInput
            style={[styles.input, fieldErrors.fullName && styles.inputError, { backgroundColor: colors.surface, color: colors.textPrimary, borderColor: colors.border }]}
            placeholder="Enter your full name"
            value={fullName}
            onChangeText={setFullName}
            editable={!isLoading}
            placeholderTextColor={colors.textSecondary}
          />
          {fieldErrors.fullName && (
            <Text style={[styles.errorText, { color: colors.danger }]}>⚠️ {fieldErrors.fullName}</Text>
          )}
          {fullNameValidation.isValid && !fieldErrors.fullName && (
            <Text style={[styles.successText, { color: colors.success }]}>✓ Valid name</Text>
          )}
        </View>

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
          {emailValidation.isValid && !fieldErrors.email && (
            <Text style={[styles.successText, { color: colors.success }]}>✓ Valid email</Text>
          )}
        </View>

        {/* Password Input */}
        <View style={styles.inputGroup}>
          <View style={styles.labelRow}>
            <Text style={[styles.label, { color: colors.textPrimary }]}>Password</Text>
            {password && (
              <Text
                style={[
                  styles.strengthBadge,
                  passwordValidation.strength === 'weak' && styles.strengthWeak,
                  passwordValidation.strength === 'medium' && styles.strengthMedium,
                  passwordValidation.strength === 'strong' && styles.strengthStrong,
                ]}
              >
                {passwordValidation.strength.toUpperCase()}
              </Text>
            )}
          </View>
          <View style={[styles.passwordInputContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <TextInput
              style={[
                styles.passwordInput,
                fieldErrors.password && styles.inputError,
                { color: colors.textPrimary }
              ]}
              placeholder="Enter password"
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
          {password && !fieldErrors.password && (
            <View style={[styles.passwordRequirements, { backgroundColor: isDarkMode ? colors.surface : '#ECFDF5' }]}>
              <Text style={[styles.requirementText, { color: colors.success }]}>✓ At least 8 characters</Text>
              <Text style={[styles.requirementText, { color: colors.success }]}>✓ Contains uppercase & lowercase</Text>
              <Text style={[styles.requirementText, { color: colors.success }]}>✓ Contains number & special character</Text>
            </View>
          )}
        </View>

        {/* Confirm Password Input */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.textPrimary }]}>Confirm Password</Text>
          <View style={[styles.passwordInputContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <TextInput
              style={[
                styles.passwordInput,
                fieldErrors.confirmPassword && styles.inputError,
                { color: colors.textPrimary }
              ]}
              placeholder="Re-enter password"
              secureTextEntry={!showConfirmPassword}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              editable={!isLoading}
              placeholderTextColor={colors.textSecondary}
            />
            <TouchableOpacity
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              disabled={isLoading}
            >
              <Text style={styles.eyeIcon}>{showConfirmPassword ? '👁️' : '👁️‍🗨️'}</Text>
            </TouchableOpacity>
          </View>
          {fieldErrors.confirmPassword && (
            <Text style={[styles.errorText, { color: colors.danger }]}>⚠️ {fieldErrors.confirmPassword}</Text>
          )}
          {confirmPassword && !fieldErrors.confirmPassword && (
            <Text style={[styles.successText, { color: colors.success }]}>✓ Passwords match</Text>
          )}
        </View>

        {/* Terms & Conditions */}
        <View style={styles.termsContainer}>
          <TouchableOpacity
            style={styles.checkbox}
            onPress={() => setTermsAccepted(!termsAccepted)}
            disabled={isLoading}
          >
            <Text style={[styles.checkboxText, { color: colors.accent }]}>{termsAccepted ? '☑️' : '☐'}</Text>
          </TouchableOpacity>
          <View style={styles.termsTextContainer}>
            <Text style={[styles.termsText, { color: colors.textSecondary }]}>I agree to the </Text>
            <Text style={[styles.termsText, styles.termsLink, { color: colors.accent }]}>Terms of Service</Text>
            <Text style={[styles.termsText, { color: colors.textSecondary }]}> and </Text>
            <Text style={[styles.termsText, styles.termsLink, { color: colors.accent }]}>Privacy Policy</Text>
          </View>
        </View>
        {fieldErrors.terms && (
          <Text style={[styles.errorText, { color: colors.danger }]}>⚠️ {fieldErrors.terms}</Text>
        )}

        {/* Sign Up Button */}
        <TouchableOpacity
          style={[styles.signUpButton, (!isFormValid || isLoading) && styles.buttonDisabled, { backgroundColor: colors.accent }]}
          onPress={handleSignUp}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color={colors.background} />
          ) : (
            <Text style={[styles.signUpButtonText, { color: colors.background }]}>Create Account</Text>
          )}
        </TouchableOpacity>

        {/* Sign In Link */}
        <View style={styles.signInContainer}>
          <Text style={[styles.signInText, { color: colors.textSecondary }]}>Already have an account? </Text>
          <TouchableOpacity onPress={() => router.push('/auth/sign-in')} disabled={isLoading}>
            <Text style={[styles.signInLink, { color: colors.accent }]}>Sign In</Text>
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
    paddingVertical: 30,
    paddingTop: 20,
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
  strengthBadge: {
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  strengthWeak: {
    backgroundColor: '#FFE2E2',
    color: '#DC2626',
  },
  strengthMedium: {
    backgroundColor: '#FFF3CD',
    color: '#F59E0B',
  },
  strengthStrong: {
    backgroundColor: '#D1FAE5',
    color: '#059669',
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
  successText: {
    fontSize: 12,
    marginTop: 6,
    fontWeight: '500',
  },
  passwordRequirements: {
    marginTop: 10,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  requirementText: {
    fontSize: 12,
    marginVertical: 2,
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  checkbox: {
    marginRight: 10,
    marginTop: 4,
  },
  checkboxText: {
    fontSize: 18,
  },
  termsTextContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    flex: 1,
  },
  termsText: {
    fontSize: 13,
    lineHeight: 20,
  },
  termsLink: {
    fontWeight: '600',
  },
  signUpButton: {
    borderRadius: 28,
    paddingVertical: 18,
    alignItems: 'center',
    marginBottom: 16,
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
  signUpButtonText: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  signInContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signInText: {
    fontSize: 14,
  },
  signInLink: {
    fontSize: 14,
    fontWeight: '600',
  },
});
