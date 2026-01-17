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
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="auth" />
          <Stack.Screen name="index" />
          <Stack.Screen name="pages/phishing/phishing" />
          <Stack.Screen name="pages/phishing/scan_result" />

          <Stack.Screen name="pages/qr_scanner/qr_scanner" />
          <Stack.Screen name="pages/qr_scanner/scan_result" />

          <Stack.Screen name="pages/app_detection/app_detection" />
          <Stack.Screen name="pages/app_detection/scan_result" />

          <Stack.Screen name="pages/device_health/device_health" />
          <Stack.Screen name="pages/breach_check/breach" />
          <Stack.Screen name="pages/breach_check/breach_result" />
        </Stack>
        <StatusBar style="dark" />
      </SecurityProvider>
    </AuthProvider>
  );
}
