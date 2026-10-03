import { Stack } from "expo-router";

export default function PagesLayout() {
  return (
    <Stack>
      <Stack.Screen name="phishing/phishing" options={{ title: "Phishing Detector", headerShown: false }} />
      <Stack.Screen name="phishing/scan_result" options={{ title: "Analysis Result", headerShown: false }} />
    </Stack>
  );
}
