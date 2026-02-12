import Constants from "expo-constants";

const getApiUrl = () => {
  // If we have a production URL defined and we are not in dev mode (conceptually), we could use it.
  // For now, we prioritize the dev machine IP for development convenience.
  
  if (__DEV__) {
      // Automatically get the IP of the machine running the Metro bundler
      const debuggerHost = Constants.expoConfig?.hostUri;
      const localhost = debuggerHost?.split(":")[0];
      
      if (localhost) {
          return `http://${localhost}:3000`; // Assuming backend is on port 3000
      }
  }

  // Fallback for production or if dev IP isn't found
  return "https://your-production-api.com"; 
};

export const API_BASE_URL = getApiUrl();
