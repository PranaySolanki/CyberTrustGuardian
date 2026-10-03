import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { LogBox } from 'react-native';

// Ignore all log notifications
LogBox.ignoreAllLogs();

export default function RootLayout() {
  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="pages" />
      </Stack>
      <StatusBar style="dark" />
    </>
  );
}

