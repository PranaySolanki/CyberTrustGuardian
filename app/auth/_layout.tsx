import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/services/auth/authContext";
import { Redirect, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View } from "react-native";

export default function AuthLayout() {
  const { colors, isDarkMode } = useTheme();
  const { isSignedIn, isInitializing } = useAuth();

  if (isInitializing) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  if (isSignedIn) {
    return <Redirect href="/" />;
  }

  return (
    <>
      <Stack screenOptions={{
        headerStyle: {
          backgroundColor: colors.background,
        },
        headerTintColor: colors.accent,
        headerTitleStyle: {
          fontWeight: '700',
          color: colors.textPrimary,
        },
        headerShadowVisible: false,
      }}>
        <Stack.Screen
          name="index"
          options={{
            title: 'Welcome',
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="sign-up"
          options={{
            title: 'Sign Up',
            headerBackTitle: 'Back',
          }}
        />
        <Stack.Screen
          name="sign-in"
          options={{
            title: 'Sign In',
            headerBackTitle: 'Back',
          }}
        />
        <Stack.Screen
          name="forgot-password"
          options={{
            title: 'Forgot Password',
            headerBackTitle: 'Back',
          }}
        />
      </Stack>
      <StatusBar style={isDarkMode ? "light" : "dark"} />
    </>
  );
}
