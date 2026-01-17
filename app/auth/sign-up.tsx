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
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.headerSection}>
        <Text style={styles.logo}>🛡️</Text>
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Join CyberGuardian to protect yourself online</Text>
      </View>

      <View style={styles.formSection}>
        {/* Full Name Input */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Full Name</Text>
          <TextInput
            style={[styles.input, fieldErrors.fullName && styles.inputError]}
            placeholder="Enter your full name"
            value={fullName}
            onChangeText={setFullName}
            editable={!isLoading}
            placeholderTextColor="#A0AEC0"
          />
          {fieldErrors.fullName && (
            <Text style={styles.errorText}>⚠️ {fieldErrors.fullName}</Text>
          )}
          {fullNameValidation.isValid && !fieldErrors.fullName && (
            <Text style={styles.successText}>✓ Valid name</Text>
          )}
        </View>

        {/* Email Input */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email Address</Text>
          <TextInput
            style={[styles.input, fieldErrors.email && styles.inputError]}
            placeholder="Enter your email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!isLoading}
            placeholderTextColor="#A0AEC0"
          />
          {fieldErrors.email && (
            <Text style={styles.errorText}>⚠️ {fieldErrors.email}</Text>
          )}
          {emailValidation.isValid && !fieldErrors.email && (
            <Text style={styles.successText}>✓ Valid email</Text>
          )}
        </View>

        {/* Password Input */}
        <View style={styles.inputGroup}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>Password</Text>
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
          <View style={styles.passwordInputContainer}>
            <TextInput
              style={[
                styles.passwordInput,
                fieldErrors.password && styles.inputError,
              ]}
              placeholder="Enter password"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
              editable={!isLoading}
              placeholderTextColor="#A0AEC0"
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              disabled={isLoading}
            >
              <Text style={styles.eyeIcon}>{showPassword ? '👁️' : '👁️‍🗨️'}</Text>
            </TouchableOpacity>
          </View>

          {fieldErrors.password && (
            <Text style={styles.errorText}>⚠️ {fieldErrors.password}</Text>
          )}
          {password && !fieldErrors.password && (
            <View style={styles.passwordRequirements}>
              <Text style={styles.requirementText}>✓ At least 8 characters</Text>
              <Text style={styles.requirementText}>✓ Contains uppercase & lowercase</Text>
              <Text style={styles.requirementText}>✓ Contains number & special character</Text>
            </View>
          )}
        </View>

        {/* Confirm Password Input */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Confirm Password</Text>
          <View style={styles.passwordInputContainer}>
            <TextInput
              style={[
                styles.passwordInput,
                fieldErrors.confirmPassword && styles.inputError,
              ]}
              placeholder="Re-enter password"
              secureTextEntry={!showConfirmPassword}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              editable={!isLoading}
              placeholderTextColor="#A0AEC0"
            />
            <TouchableOpacity
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              disabled={isLoading}
            >
              <Text style={styles.eyeIcon}>{showConfirmPassword ? '👁️' : '👁️‍🗨️'}</Text>
            </TouchableOpacity>
          </View>
          {fieldErrors.confirmPassword && (
            <Text style={styles.errorText}>⚠️ {fieldErrors.confirmPassword}</Text>
          )}
          {confirmPassword && !fieldErrors.confirmPassword && (
            <Text style={styles.successText}>✓ Passwords match</Text>
          )}
        </View>

        {/* Terms & Conditions */}
        <View style={styles.termsContainer}>
          <TouchableOpacity
            style={styles.checkbox}
            onPress={() => setTermsAccepted(!termsAccepted)}
            disabled={isLoading}
          >
            <Text style={styles.checkboxText}>{termsAccepted ? '☑️' : '☐'}</Text>
          </TouchableOpacity>
          <View style={styles.termsTextContainer}>
            <Text style={styles.termsText}>I agree to the </Text>
            <Text style={[styles.termsText, styles.termsLink]}>Terms of Service</Text>
            <Text style={styles.termsText}> and </Text>
            <Text style={[styles.termsText, styles.termsLink]}>Privacy Policy</Text>
          </View>
        </View>
        {fieldErrors.terms && (
          <Text style={styles.errorText}>⚠️ {fieldErrors.terms}</Text>
        )}

        {/* Sign Up Button */}
        <TouchableOpacity
          style={[styles.signUpButton, (!isFormValid || isLoading) && styles.buttonDisabled]}
          onPress={handleSignUp}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.signUpButtonText}>Create Account</Text>
          )}
        </TouchableOpacity>

        {/* Sign In Link */}
        <View style={styles.signInContainer}>
          <Text style={styles.signInText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => router.push('/auth/sign-in')} disabled={isLoading}>
            <Text style={styles.signInLink}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#F8FAFF',
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
    color: '#1A202C',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#718096',
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
    color: '#2D3748',
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
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    backgroundColor: '#FFFFFF',
    color: '#2D3748',
  },
  inputError: {
    borderColor: '#DC2626',
    backgroundColor: '#FEF2F2',
  },
  passwordInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingRight: 12,
    backgroundColor: '#FFFFFF',
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#2D3748',
  },
  eyeIcon: {
    fontSize: 18,
    marginLeft: 8,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 12,
    marginTop: 6,
    fontWeight: '500',
  },
  successText: {
    color: '#059669',
    fontSize: 12,
    marginTop: 6,
    fontWeight: '500',
  },
  passwordRequirements: {
    marginTop: 10,
    backgroundColor: '#ECFDF5',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  requirementText: {
    fontSize: 12,
    color: '#047857',
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
    color: '#4A5568',
    lineHeight: 20,
  },
  termsLink: {
    color: '#2563EB',
    fontWeight: '600',
  },
  signUpButton: {
    backgroundColor: '#2563EB',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  signUpButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  signInContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signInText: {
    fontSize: 14,
    color: '#4A5568',
  },
  signInLink: {
    fontSize: 14,
    color: '#2563EB',
    fontWeight: '600',
  },
});
