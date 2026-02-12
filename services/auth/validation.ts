/**
 * Authentication Form Validation Utilities
 */

export interface ValidationError {
  field: string;
  message: string;
}

export interface EmailValidationResult {
  isValid: boolean;
  error?: string;
}

export interface PasswordValidationResult {
  isValid: boolean;
  error?: string;
  strength: 'weak' | 'medium' | 'strong';
}

/**
 * Validates email format
 */
export const validateEmail = (email: string): EmailValidationResult => {
  const trimmed = email.trim();

  if (!trimmed) {
    return { isValid: false, error: 'Email is required' };
  }

  // RFC 5322 simplified email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmed)) {
    return { isValid: false, error: 'Please enter a valid email address' };
  }

  return { isValid: true };
};

/**
 * Validates password strength
 * Requires: min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char
 */
export const validatePassword = (password: string): PasswordValidationResult => {
  if (!password) {
    return { isValid: false, error: 'Password is required', strength: 'weak' };
  }

  if (password.length < 8) {
    return {
      isValid: false,
      error: 'Password must be at least 8 characters',
      strength: 'weak',
    };
  }

  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

  let strength: 'weak' | 'medium' | 'strong' = 'weak';
  let error: string | undefined;

  const meetsRequirements =
    hasUppercase && hasLowercase && hasNumber && hasSpecialChar;

  if (!meetsRequirements) {
    const missing: string[] = [];
    if (!hasUppercase) missing.push('uppercase letter');
    if (!hasLowercase) missing.push('lowercase letter');
    if (!hasNumber) missing.push('number');
    if (!hasSpecialChar) missing.push('special character (!@#$%...)');

    error = `Password must contain: ${missing.join(', ')}`;
    strength = 'weak';
  } else {
    // Calculate strength based on length and character variety
    const varietyScore = [hasUppercase, hasLowercase, hasNumber, hasSpecialChar].filter(Boolean).length;
    if (password.length >= 12 && varietyScore === 4) {
      strength = 'strong';
    } else if (password.length >= 10 && varietyScore >= 3) {
      strength = 'medium';
    } else {
      strength = 'medium';
    }
  }

  return {
    isValid: !error,
    error,
    strength,
  };
};

/**
 * Validates that two passwords match
 */
export const validatePasswordMatch = (
  password: string,
  confirmPassword: string
): { isValid: boolean; error?: string } => {
  if (!confirmPassword) {
    return { isValid: false, error: 'Please confirm your password' };
  }

  if (password !== confirmPassword) {
    return { isValid: false, error: 'Passwords do not match' };
  }

  return { isValid: true };
};

/**
 * Validates full name
 */
export const validateFullName = (fullName: string): { isValid: boolean; error?: string } => {
  const trimmed = fullName.trim();

  if (!trimmed) {
    return { isValid: false, error: 'Full name is required' };
  }

  if (trimmed.length < 2) {
    return { isValid: false, error: 'Full name must be at least 2 characters' };
  }

  if (trimmed.length > 100) {
    return { isValid: false, error: 'Full name must be less than 100 characters' };
  }

  return { isValid: true };
};

/**
 * Validates sign up form
 */
export const validateSignUpForm = (
  email: string,
  password: string,
  confirmPassword: string,
  fullName: string,
  termsAccepted: boolean
): ValidationError[] => {
  const errors: ValidationError[] = [];

  const emailValidation = validateEmail(email);
  if (!emailValidation.isValid) {
    errors.push({ field: 'email', message: emailValidation.error! });
  }

  const fullNameValidation = validateFullName(fullName);
  if (!fullNameValidation.isValid) {
    errors.push({ field: 'fullName', message: fullNameValidation.error! });
  }

  const passwordValidation = validatePassword(password);
  if (!passwordValidation.isValid) {
    errors.push({ field: 'password', message: passwordValidation.error! });
  }

  const matchValidation = validatePasswordMatch(password, confirmPassword);
  if (!matchValidation.isValid) {
    errors.push({ field: 'confirmPassword', message: matchValidation.error! });
  }

  if (!termsAccepted) {
    errors.push({
      field: 'terms',
      message: 'You must accept the terms and conditions',
    });
  }

  return errors;
};

/**
 * Validates sign in form
 */
export const validateSignInForm = (
  email: string,
  password: string
): ValidationError[] => {
  const errors: ValidationError[] = [];

  const emailValidation = validateEmail(email);
  if (!emailValidation.isValid) {
    errors.push({ field: 'email', message: emailValidation.error! });
  }

  if (!password) {
    errors.push({ field: 'password', message: 'Password is required' });
  }

  return errors;
};
