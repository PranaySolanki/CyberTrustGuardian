import { useAuth } from "@/services/auth/authContext";
import { Redirect, Stack } from "expo-router";
import { ActivityIndicator, View } from "react-native";

export default function PagesLayout() {
    const { isSignedIn, isInitializing } = useAuth(); // renamed isLoading to isInitializing based on authContext usage elsewhere

    if (isInitializing) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#2563EB" />
            </View>
        );
    }

    if (!isSignedIn) {
        return <Redirect href="/auth" />;
    }

    return (
        <Stack>
            <Stack.Screen name="phishing/phishing" options={{ title: "Phishing Detector", headerShown: false }} />
            <Stack.Screen name="phishing/scan_result" options={{ title: "Scan Result", headerShown: false }} />
            <Stack.Screen name="qr_scanner/qr_scanner" options={{ title: "QR Code Detector", headerShown: false }} />
            <Stack.Screen name="qr_scanner/scan_result" options={{ title: "Scan Result", headerShown: false }} />
            <Stack.Screen name="app_detection/app_detection" options={{ title: "App Permission Analyzer", headerShown: false }} />
            <Stack.Screen name="app_detection/scan_result" options={{ title: "Scan Result", headerShown: false }} />
            <Stack.Screen name="device_health/device_health" options={{ title: "Device Integrity Check", headerShown: false }} />
            <Stack.Screen name="breach_check/breach" options={{ title: "Breach Checker", headerShown: false }} />
            <Stack.Screen name="breach_check/breach_result" options={{ title: "Breach Result", headerShown: false }} />
        </Stack>
    );
}
