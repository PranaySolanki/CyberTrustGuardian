import { auth, db } from '@/services/calls/firebase';
import {
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import React, { createContext, ReactNode, useCallback, useContext, useEffect, useRef, useState } from 'react';

const mapAuthError = (error: any) => {
  const code = error.code;
  switch (code) {
    case 'auth/user-not-found':
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
      return 'Invalid email or password.';
    case 'auth/email-already-in-use':
      return 'This email is already registered.';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/too-many-requests':
      return 'Too many failed attempts. Please try again later.';
    case 'auth/network-request-failed':
      return 'Network error. Please check your internet connection.';
    default:
      return error.message ? error.message.replace('Firebase: ', '') : 'Authentication failed. Please try again.';
  }
};

export type User = {
  id: string;
  email: string;
  fullName: string;
};

export type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  isInitializing: boolean;
  isSignedIn: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<{ success: boolean; error?: string }>;
  signIn: (email: string, password: string, rememberMe?: boolean) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
};

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [rememberMeEmail, setRememberMeEmail] = useState<string | null>(null);

  const isSigningUpRef = useRef(false);

  // Persistence check (handled by Firebase auth persistence, but we can do a secondary check if needed)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (isSigningUpRef.current) return;

      if (firebaseUser) {
        // Map Firebase user to our User type
        const newUser: User = {
          id: firebaseUser.uid,
          email: firebaseUser.email || '',
          fullName: firebaseUser.displayName || 'User',
        };
        setUser(newUser);
      } else {
        setUser(null);
      }
      setIsInitializing(false);
    });

    return () => unsubscribe();
  }, []);

  const signUp = useCallback(
    async (email: string, password: string, fullName: string) => {
      setIsLoading(true);
      isSigningUpRef.current = true;
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Update profile with full name
        if (user) {
          // Update profile and create Firestore document in parallel
          await Promise.all([
            updateProfile(user, { displayName: fullName }),
            setDoc(doc(db, "users", user.uid), {
              id: user.uid,
              email: email,
              fullName: fullName,
              createdAt: serverTimestamp(),
              role: 'user', // Default role
              stats: {
                scansToday: 0,
                threatsBlocked: 0,
                appsAnalyzed: 0,
                safetyScore: 100
              }
            })
          ]);

          await firebaseSignOut(auth);
        }

        return { success: true };
      } catch (error: any) {
        console.error("Sign Up Error:", error);
        return { success: false, error: mapAuthError(error) };
      } finally {
        isSigningUpRef.current = false;
        setIsLoading(false);
      }
    },
    []
  );

  const signIn = useCallback(
    async (email: string, password: string, rememberMe: boolean = false) => {
      setIsLoading(true);
      try {
        await signInWithEmailAndPassword(auth, email, password);
        if (rememberMe) {
          setRememberMeEmail(email);
        }
        return { success: true };
      } catch (error: any) {
        console.error("Sign In Error:", error);
        return { success: false, error: mapAuthError(error) };
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const signOutUser = useCallback(async () => {
    setIsLoading(true);
    try {
      await firebaseSignOut(auth);
      // onAuthStateChanged will handle setUser(null)
    } catch (error: any) {
      console.error("Sign out error", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    setIsLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: mapAuthError(error) };
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isInitializing,
        isSignedIn: user !== null,
        signUp,
        signIn,
        signOut: signOutUser,
        resetPassword,
        // Expose remember me email for sign in page
        ...(rememberMeEmail && { rememberMeEmail }),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
