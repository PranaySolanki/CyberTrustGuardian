import { AuthProvider } from "@/services/auth/authContext";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { LogBox } from 'react-native';
import { SecurityProvider } from "../context/SecurityContext";

// Ignore all log notifications
LogBox.ignoreAllLogs();

export default function RootLayout() {
  return (
    <AuthProvider>
      <SecurityProvider>
        <Stack>
          <Stack.Screen name="auth" options={{ headerShown: false }} />
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="pages" options={{ headerShown: false }} />
        </Stack>
        <StatusBar style="dark" />
      </SecurityProvider>
    </AuthProvider>
  );
}
