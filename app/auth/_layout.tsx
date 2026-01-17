import { useAuth } from "@/services/auth/authContext";
import { Redirect, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View } from "react-native";

export default function AuthLayout() {
  const { isSignedIn, isInitializing } = useAuth();

  if (isInitializing) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  if (isSignedIn) {
    return <Redirect href="/" />;
  }

  return (
    <>
      <Stack>
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
            headerTintColor: '#2563EB',
          }}
        />
        <Stack.Screen
          name="sign-in"
          options={{
            title: 'Sign In',
            headerBackTitle: 'Back',
            headerTintColor: '#2563EB',
          }}
        />
        <Stack.Screen
          name="forgot-password"
          options={{
            title: 'Forgot Password',
            headerBackTitle: 'Back',
            headerTintColor: '#2563EB',
          }}
        />
      </Stack>
      <StatusBar style="dark" />
    </>
  );
}
