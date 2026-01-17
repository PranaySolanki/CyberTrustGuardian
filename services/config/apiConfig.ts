import Constants from "expo-constants";

const getApiUrl = () => {
    if (__DEV__) {
        const debuggerHost = Constants.expoConfig?.hostUri;
        const localhost = debuggerHost?.split(":")[0];

        if (localhost) {
            return `http://${localhost}:3000`;
        }
    }

    return "https://your-production-api.com";
};

export const API_BASE_URL = getApiUrl();
