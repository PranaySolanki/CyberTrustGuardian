import { AuthProvider } from "@/services/auth/authContext";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { LogBox } from 'react-native';
import { SecurityProvider } from "../context/SecurityContext";
import { ThemeProvider, useTheme } from "../context/ThemeContext";

// Ignore all log notifications
LogBox.ignoreAllLogs();

function AppContent() {
  const { isDarkMode } = useTheme();
  return (
    <>
      <Stack>
        <Stack.Screen name="auth" options={{ headerShown: false }} />
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="pages" options={{ headerShown: false }} />
      </Stack>
      <StatusBar style={isDarkMode ? "light" : "dark"} />
    </>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <SecurityProvider>
        <ThemeProvider>
          <AppContent />
        </ThemeProvider>
      </SecurityProvider>
    </AuthProvider>
  );
}
