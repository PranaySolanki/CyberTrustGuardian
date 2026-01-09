import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";


export default function RootLayout() {
  return(
    <>
      <Stack>
        <Stack.Screen name="index" options={{ title: "Home" }} />
        <Stack.Screen name="pages/phishing" options={{ title: "Phishing Detector" }} />
        <Stack.Screen name="pages/qr_scanner" options={{ title: "QR Code Detector" }} />
        <Stack.Screen name="pages/app_detection" options={{ title: "App Detector" }} />
        <Stack.Screen name="pages/scan_result" options={{ title: "Scan Result" }} />
      </Stack>
      <StatusBar style="dark" />
    </>
  );
}
