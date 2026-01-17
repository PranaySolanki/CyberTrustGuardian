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



          <Stack.Screen name="index" options={{ title: "Home", headerShown: false }} />
          <Stack.Screen name="pages/phishing/phishing" options={{ title: "Phishing Detector" }} />
          <Stack.Screen name="pages/phishing/scan_result" options={{ title: "Scan Result" }} />

          <Stack.Screen name="pages/qr_scanner/qr_scanner" options={{ title: "QR Code Detector" }} />
          <Stack.Screen name="pages/qr_scanner/scan_result" options={{ title: "Scan Result" }} />

          <Stack.Screen name="pages/app_detection/app_detection" options={{ title: "App Permission Analyzer" }} />
          <Stack.Screen name="pages/app_detection/scan_result" options={{ title: "Scan Result" }} />

          <Stack.Screen name="pages/device_health/device_health" options={{ title: "Device Integrity Check" }} />
          <Stack.Screen name="pages/breach_check/breach" options={{ title: "Breach Checker" }} />
          <Stack.Screen name="pages/breach_check/breach_result" options={{ title: "Breach Result" }} />
        </Stack>
        <StatusBar style="dark" />
      </SecurityProvider>
    </AuthProvider>
  );
}
