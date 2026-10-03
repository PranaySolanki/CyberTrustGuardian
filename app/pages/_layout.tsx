import { Stack } from "expo-router";

export default function PagesLayout() {
    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="app_detection/app_detection" options={{ title: "App Malware Analyzer" }} />
            <Stack.Screen name="app_detection/scan_result" options={{ title: "Scan Result" }} />
        </Stack>
    );
}

