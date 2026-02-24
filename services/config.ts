import Constants from "expo-constants";

const getApiUrl = () => {
  if (__DEV__) {
    // Automatically get the IP of the machine running the Metro bundler
    const debuggerHost = Constants.expoConfig?.hostUri;
    const localhost = debuggerHost?.split(":")[0];

    if (localhost) {
      return `http://${localhost}:3000`;
    }
  }

  // Hardcoded fallback for development when automatic detection fails
  // Run `ipconfig` in your terminal and update this with your IPv4 address
  return "http://192.168.1.40:3000";
};

export const API_BASE_URL = getApiUrl();
