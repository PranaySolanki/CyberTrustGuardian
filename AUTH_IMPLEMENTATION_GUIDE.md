# Authentication Implementation Guide

## Quick Start

### 1. Testing the Auth System

Start the app and you'll see the auth landing page. Follow this flow:

```
1. Tap "Create Account"
2. Fill in:
   - Full Name: "John Doe"
   - Email: "john@example.com"
   - Password: "SecurePass123!"
   - Confirm Password: "SecurePass123!"
   - Accept Terms ✓
3. Tap "Create Account" button
4. You'll be redirected to the home page with your user info displayed
```

### 2. Sign In
```
1. From auth landing page, tap "Sign In"
2. Fill in:
   - Email: "john@example.com"
   - Password: "SecurePass123!"
   - Remember me (optional) ✓
3. Tap "Sign In" button
4. Redirected to home page
```

### 3. Sign Out
```
1. From home page, tap the "↥" button in top right
2. Confirm in the dialog
3. Redirected back to auth landing page
```

## Code Examples

### Example 1: Using Auth in a Component

```tsx
import { useAuth } from '@/services/auth/authContext';
import { TouchableOpacity, Text, View } from 'react-native';

export default function UserProfile() {
  const { user, signOut } = useAuth();

  if (!user) {
    return <Text>No user logged in</Text>;
  }

  return (
    <View>
      <Text>Name: {user.fullName}</Text>
      <Text>Email: {user.email}</Text>
      <TouchableOpacity onPress={signOut}>
        <Text>Sign Out</Text>
      </TouchableOpacity>
    </View>
  );
}
```

### Example 2: Custom Sign In Component

```tsx
import { useAuth } from '@/services/auth/authContext';
import { useState } from 'react';
import { TextInput, TouchableOpacity, Text, Alert } from 'react-native';

export default function LoginForm() {
  const { signIn, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    const result = await signIn(email, password);
    
    if (!result.success) {
      Alert.alert('Error', result.error || 'Login failed');
      return;
    }
    
    // Navigation handled by root layout automatically
  };

  return (
    <>
      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        editable={!isLoading}
      />
      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        editable={!isLoading}
      />
      <TouchableOpacity 
        onPress={handleLogin} 
        disabled={isLoading}
      >
        <Text>{isLoading ? 'Signing in...' : 'Sign In'}</Text>
      </TouchableOpacity>
    </>
  );
}
```

### Example 3: Protected Route

```tsx
import { useAuth } from '@/services/auth/authContext';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { Text, View } from 'react-native';

export default function ProtectedScreen() {
  const { isSignedIn, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isSignedIn) {
      router.replace('/(auth)/index');
    }
  }, [isSignedIn, isLoading]);

  if (isLoading) {
    return <Text>Loading...</Text>;
  }

  if (!isSignedIn) {
    return null;
  }

  return (
    <View>
      <Text>This content is only visible to signed-in users</Text>
    </View>
  );
}
```

### Example 4: Form Validation Example

```tsx
import { 
  validateEmail, 
  validatePassword,
  validateFullName,
  validateSignUpForm 
} from '@/services/auth/validation';

// Single field validation
const emailResult = validateEmail('test@example.com');
console.log(emailResult); 
// { isValid: true }

const passwordResult = validatePassword('weak');
console.log(passwordResult);
// { 
//   isValid: false, 
//   error: 'Password must contain: uppercase letter, number, special character (!@#$%...)',
//   strength: 'weak'
// }

// Full form validation
const errors = validateSignUpForm(
  'john@example.com',
  'SecurePass123!',
  'SecurePass123!',
  'John Doe',
  true // terms accepted
);
console.log(errors); 
// [] - empty array means form is valid
```

## Backend Integration Examples

### Example 1: Firebase Authentication

```tsx
// authContext.tsx - updated signUp
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';

const firebaseApp = initializeApp(FIREBASE_CONFIG);
const firebaseAuth = getAuth(firebaseApp);

const signUp = useCallback(
  async (email: string, password: string, fullName: string) => {
    try {
      const result = await createUserWithEmailAndPassword(
        firebaseAuth, 
        email, 
        password
      );
      
      // Update profile with fullName
      await updateProfile(result.user, { displayName: fullName });
      
      const newUser: User = {
        id: result.user.uid,
        email: result.user.email!,
        fullName: fullName,
      };
      
      setUser(newUser);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
  []
);
```

### Example 2: Custom Node.js Backend

```tsx
// authContext.tsx - updated signIn with token
const signIn = useCallback(
  async (email: string, password: string, rememberMe: boolean = false) => {
    try {
      const response = await fetch('https://api.example.com/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }

      const { user, token } = await response.json();

      // Store token securely
      if (rememberMe) {
        await SecureStorage.setItem('authToken', token);
      }

      setUser(user);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
  []
);
```

### Example 3: JWT Token Management

```tsx
// Add this to authContext.tsx
import * as SecureStore from 'expo-secure-store';

const getAuthToken = async () => {
  try {
    return await SecureStore.getItemAsync('authToken');
  } catch {
    return null;
  }
};

const setAuthToken = async (token: string) => {
  try {
    await SecureStore.setItemAsync('authToken', token);
  } catch {
    // Error storing token
  }
};

const clearAuthToken = async () => {
  try {
    await SecureStore.deleteItemAsync('authToken');
  } catch {
    // Error clearing token
  }
};

// Add to signOut
const signOut = useCallback(async () => {
  setIsLoading(true);
  try {
    await clearAuthToken();
    setUser(null);
  } finally {
    setIsLoading(false);
  }
}, []);
```

## Password Reset Backend Integration

```tsx
// authContext.tsx - updated resetPassword
const resetPassword = useCallback(async (email: string) => {
  setIsLoading(true);
  try {
    const response = await fetch(
      'https://api.example.com/auth/reset-password',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message);
    }

    // Backend sends password reset email
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  } finally {
    setIsLoading(false);
  }
}, []);
```

## Common Patterns

### Pattern 1: Auto-Login with Saved Credentials

```tsx
// Add to useEffect in AuthProvider
useEffect(() => {
  const checkStoredToken = async () => {
    const token = await SecureStore.getItemAsync('authToken');
    if (token) {
      // Verify token with backend
      try {
        const response = await fetch('https://api.example.com/auth/verify', {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        if (response.ok) {
          const user = await response.json();
          setUser(user);
        }
      } catch {
        // Token invalid or expired
      }
    }
  };
  
  checkStoredToken();
}, []);
```

### Pattern 2: Session Timeout

```tsx
// Add to authContext.tsx
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes

useEffect(() => {
  if (!user) return;
  
  const timeoutId = setTimeout(() => {
    Alert.alert(
      'Session Expired',
      'Your session has expired. Please sign in again.',
      [{ text: 'OK', onPress: () => signOut() }]
    );
  }, SESSION_TIMEOUT);
  
  return () => clearTimeout(timeoutId);
}, [user]);
```

### Pattern 3: Handle Network Errors Gracefully

```tsx
const signIn = useCallback(
  async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await fetch('https://api.example.com/auth/signin', {
        // ... request config
        timeout: 10000, // 10 second timeout
      });
      
      // ... handle response
    } catch (error) {
      if (error.code === 'NETWORK_ERROR') {
        return { 
          success: false, 
          error: 'Network error. Please check your connection.' 
        };
      }
      
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  },
  []
);
```

## Testing Checklist

- [ ] Sign up with valid credentials
- [ ] Sign up with invalid email (missing @)
- [ ] Sign up with weak password (missing uppercase)
- [ ] Sign up with mismatched passwords
- [ ] Sign up with name too short (< 2 chars)
- [ ] Sign up without accepting terms
- [ ] Sign in with valid credentials
- [ ] Sign in with wrong password
- [ ] Sign in with non-existent email
- [ ] Sign in with "Remember Me" checked
- [ ] Reset password flow
- [ ] Sign out from home page
- [ ] Verify user info displays on home page
- [ ] Test form validation error messages
- [ ] Test loading states on buttons
- [ ] Test navigation between auth screens
- [ ] Test redirect to auth when not signed in
- [ ] Test redirect to home when signed in

## Debugging Tips

1. **Check Auth State:**
   ```tsx
   const { user, isSignedIn, isLoading } = useAuth();
   console.log({ user, isSignedIn, isLoading });
   ```

2. **Enable Navigation Logs:**
   ```tsx
   const router = useRouter();
   console.log('Navigating to:', router.canGoBack());
   ```

3. **Validate Form Input:**
   ```tsx
   const errors = validateSignUpForm(...);
   console.log('Validation errors:', errors);
   ```

4. **Check Context:**
   ```tsx
   // At app start, verify context is wrapping all screens
   // Should see no "useAuth must be used within AuthProvider" errors
   ```

