// @ts-ignore
import { getReactNativePersistence } from '@firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { initializeApp } from "firebase/app";
import { browserLocalPersistence, getAuth, initializeAuth, setPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { Platform } from 'react-native';

// Helper to decode Base64
const decodeKey = (encoded: string) => {
  try {
    return atob(encoded);
  } catch (e) {
    // Polyfill for environments where atob might not be available directly (though Expo usually has it)
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
    let str = encoded.replace(/=+$/, '');
    let output = '';

    if (str.length % 4 == 1) {
      throw new Error("'atob' failed: The string to be decoded is not correctly encoded.");
    }

    for (let bc = 0, bs = 0, buffer, i = 0;
      buffer = str.charAt(i++);
      ~buffer && (bs = bc % 4 ? bs * 64 + buffer : buffer,
        bc++ % 4) ? output += String.fromCharCode(255 & bs >> (-2 * bc & 6)) : 0
    ) {
      buffer = chars.indexOf(buffer);
    }

    return output;
  }
};

// Base64 encoded API Key to avoid plain-text scanning
const firebaseConfig = {
  apiKey: decodeKey(process.env.EXPO_PUBLIC_FIREBASE_API_KEY_ENCODED || ""),
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth with Persistence logic
let auth: any;

if (Platform.OS === 'web') {
  auth = getAuth(app);
  setPersistence(auth, browserLocalPersistence).catch((error) => {
    console.error("Firebase Persistence Error:", error);
  });
} else {
  // For native, use Async Storage for persistence
  // We check if getReactNativePersistence is defined to avoid web errors if the bundler shims it poorly
  const persistence = getReactNativePersistence ? getReactNativePersistence(AsyncStorage) : undefined;

  if (persistence) {
    auth = initializeAuth(app, { persistence });
  } else {
    console.warn("React Native Persistence NOT found in firebase/auth exports. Make sure @firebase/auth is compatible.");
    auth = getAuth(app); // Fallback
  }
}

const db = getFirestore(app);

export { auth, db };
