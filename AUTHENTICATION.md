# CyberGuardian Authentication System

## Overview
A complete authentication system has been added to the CyberGuardian application with sign up, sign in, and password reset functionality. The system uses React Context for state management and includes comprehensive form validation.

## File Structure

```
services/auth/
├── authContext.tsx           # Authentication context and hooks
├── validation.ts             # Email, password, form validation utilities

app/auth/
├── _layout.tsx              # Auth stack navigation layout
├── index.tsx                # Auth landing page with features overview
├── sign-up.tsx              # User registration page
├── sign-in.tsx              # User login page
├── forgot-password.tsx       # Password reset page

app/_layout.tsx              # Updated root layout with auth integration
app/index.tsx                # Updated home page with user info & sign out
```

## Authentication Flow

### 1. **Initial Load**
- App checks `isSignedIn` state from `useAuth()` hook
- If not signed in: Shows auth stack (landing page, sign up, sign in)
- If signed in: Shows main app stack (home, tools, pages)

### 2. **Sign Up Flow**
```
Landing Page → Sign Up Form → Validation → Create Account → Home
```

**Sign Up Requirements:**
- Full Name: 2-100 characters
- Email: Valid format (RFC 5322)
- Password: Min 8 chars, uppercase, lowercase, number, special char
- Confirm Password: Must match
- Terms: Must accept

**Password Strength Indicators:**
- 🔴 Weak: Missing requirements
- 🟡 Medium: Meets minimum requirements
- 🟢 Strong: 12+ chars with all varieties

### 3. **Sign In Flow**
```
Landing Page → Sign In Form → Validation → Authenticate → Home
```

**Sign In Features:**
- Email & Password validation
- "Remember Me" option
- "Forgot Password" link
- Demo mode: Any email/password combo works

### 4. **Password Reset Flow**
```
Sign In → Forgot Password → Enter Email → Success Screen → Back to Sign In
```

## API Reference

### useAuth Hook

```typescript
const { 
  user,           // Current user object or null
  isLoading,      // Loading state
  isSignedIn,     // Boolean: user authenticated
  signUp,         // Function: (email, password, fullName) => Promise
  signIn,         // Function: (email, password, rememberMe?) => Promise
  signOut,        // Function: () => Promise
  resetPassword   // Function: (email) => Promise
} = useAuth();
```

### AuthContext Type

```typescript
type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  isSignedIn: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<Result>;
  signIn: (email: string, password: string, rememberMe?: boolean) => Promise<Result>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<Result>;
};

type User = {
  id: string;
  email: string;
  fullName: string;
};
```

## Validation Functions

### Email Validation
```typescript
const result = validateEmail(email: string);
// Returns: { isValid: boolean, error?: string }
```

### Password Validation
```typescript
const result = validatePassword(password: string);
// Returns: { isValid: boolean, error?: string, strength: 'weak' | 'medium' | 'strong' }
```

### Password Match Validation
```typescript
const result = validatePasswordMatch(password: string, confirmPassword: string);
// Returns: { isValid: boolean, error?: string }
```

### Full Name Validation
```typescript
const result = validateFullName(fullName: string);
// Returns: { isValid: boolean, error?: string }
```

### Full Form Validation
```typescript
const errors = validateSignUpForm(
  email: string,
  password: string,
  confirmPassword: string,
  fullName: string,
  termsAccepted: boolean
);
// Returns: ValidationError[]
```

## UI Components

### Authentication Pages

#### 1. **Landing Page (auth/index.tsx)**
- Features overview with 4 security tools
- Statistics cards (1M+ threats, 500K+ users, 24/7 monitoring)
- Trust indicators (encryption, no ads, security audits)
- Dual CTAs: Sign Up & Sign In

#### 2. **Sign Up Page (auth/sign-up.tsx)**
- Full Name input with validation feedback
- Email input with format checking
- Password input with strength indicator and requirements preview
- Confirm Password input with match validation
- Terms & Conditions checkbox
- Real-time validation error messages
- Link to Sign In page

**Visual Feedback:**
- ✅ Green checkmarks for valid fields
- ⚠️ Red errors for invalid fields
- Color-coded password strength (weak/medium/strong)
- Requirements list for password

#### 3. **Sign In Page (auth/sign-in.tsx)**
- Email input with validation
- Password input with show/hide toggle
- "Remember Me" checkbox
- "Forgot Password?" link
- Sign In button with loading state
- Security tip card
- Demo mode notice
- Link to Sign Up page

#### 4. **Forgot Password Page (auth/forgot-password.tsx)**
- Email input for account recovery
- Two-state view: Form or Success message
- Success state shows:
  - Confirmation message with email
  - Troubleshooting tips (spam folder, retry, check email)
  - Back to Sign In button

### Updated Home Page
- User greeting card with name and email
- Sign out button (↥) in header
- Confirmation dialog before signing out
- Welcome message personalized with user data

## Password Requirements

✅ **Must Include:**
- At least 8 characters
- One uppercase letter (A-Z)
- One lowercase letter (a-z)
- One number (0-9)
- One special character (!@#$%^&*)

## Integration Points

### 1. **Wrapping App with AuthProvider**
The root layout wraps the entire app with `<AuthProvider>`:
```tsx
<AuthProvider>
  <RootLayoutContent />
</AuthProvider>
```

### 2. **Conditional Rendering**
Based on `isSignedIn` state:
```tsx
{!isSignedIn ? (
  <Stack.Group> {/* Auth screens */} </Stack.Group>
) : (
  <Stack.Group> {/* App screens */} </Stack.Group>
)}
```

### 3. **Using Auth in Components**
```tsx
import { useAuth } from '@/services/auth/authContext';

export default function MyComponent() {
  const { user, signOut } = useAuth();
  
  return (
    <View>
      <Text>Hello {user?.fullName}</Text>
      <Button onPress={signOut} title="Sign Out" />
    </View>
  );
}
```

## Backend Integration (TODO)

Currently, the auth system uses mock authentication (simulated API delays). To integrate with a real backend:

### 1. **Update SignUp**
```typescript
// In authContext.tsx - signUp function
// Replace the mock logic with:
const response = await fetch('https://api.example.com/auth/signup', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password, fullName })
});
```

### 2. **Update SignIn**
```typescript
// Similar fetch to /auth/signin endpoint
// Store JWT token for subsequent requests
```

### 3. **Update ResetPassword**
```typescript
// POST to /auth/reset-password endpoint
// Send password reset email via backend
```

### 4. **Add Token Management**
```typescript
// Store JWT in secure storage
// Add to request headers
// Handle token refresh
// Clear on sign out
```

## Security Considerations

✅ **Current Implementation:**
- ROT13 encoding for API keys (similar pattern to Gemini/SafeBrowsing)
- Password strength validation
- Email format validation
- Form validation before submission
- No sensitive data in logs

⚠️ **For Production:**
- Use HTTPS only
- Implement JWT token management
- Store tokens in secure storage (AsyncStorage encrypted, Keychain)
- Add CSRF protection
- Implement rate limiting
- Use HTTP-only cookies
- Add two-factor authentication (2FA)
- Implement password hashing on backend (bcrypt)
- Add email verification
- Implement account lockout after failed attempts

## Styling

All auth pages use a consistent design system:
- **Primary Blue:** `#2563EB` (buttons, links, accents)
- **Background:** `#F8FAFF` (light blue-gray)
- **Text:** `#1A202C` (dark gray)
- **Success Green:** `#059669`
- **Error Red:** `#DC2626`
- **Border:** `#E2E8F0` (light gray)

### Responsive Design
- Mobile-first approach
- Full width inputs and buttons
- Adequate spacing for touch targets
- Scrollable on small screens

## Testing

To test the authentication system:

1. **Sign Up Flow:**
   - Fill all fields with valid data
   - Try invalid emails (missing @, domain)
   - Try weak passwords (missing uppercase, number, etc.)
   - Try mismatched passwords
   - Uncheck terms and try to submit
   - Submit valid form → navigate to home

2. **Sign In Flow:**
   - Try empty fields
   - Try invalid email
   - Try with "Remember Me" checked
   - Submit valid form → navigate to home
   - Verify user card displays

3. **Sign Out:**
   - Click sign out button (↥)
   - Confirm in dialog
   - Should navigate back to auth landing page

4. **Password Reset:**
   - Click "Forgot Password?"
   - Enter email
   - See success message
   - Return to Sign In

## Future Enhancements

- [ ] Email verification on sign up
- [ ] Two-factor authentication (2FA)
- [ ] Social login (Google, Apple)
- [ ] Biometric authentication
- [ ] Session persistence
- [ ] Account recovery codes
- [ ] Device management
- [ ] Login history
- [ ] Password strength meter improvements
- [ ] Multi-language support

## Troubleshooting

**"useAuth must be used within AuthProvider"**
- Ensure root layout wraps app with `<AuthProvider>`
- Check that component is inside auth context

**Sign in always succeeds with any credentials**
- This is demo mode behavior (expected)
- Backend validation will be added in production

**User not persisting after app reload**
- In-memory state is lost on reload
- Add AsyncStorage or similar for persistence

**Routes not loading correctly**
- Check file structure matches exactly
- Ensure `_layout.tsx` files are in correct folders
- Verify file names match route references

