import { useAuth } from "@/services/auth/authContext";
import { Redirect, Slot } from "expo-router";
import { ActivityIndicator, View } from "react-native";

export default function PagesLayout() {
    const { isSignedIn, isLoading } = useAuth();

    if (isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#2563EB" />
            </View>
        );
    }

    if (!isSignedIn) {
        return <Redirect href="/auth" />;
    }

    return <Slot />;
}
