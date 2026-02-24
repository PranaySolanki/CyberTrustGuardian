import { ExpoAndroidAppList } from 'expo-android-app-list';
import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';

export type AppResult = {
  appName: string;
  packageName: string;
  permissions?: string[];
  versionName?: string;
  isSystemApp?: boolean;
  size?: number;
  firstInstallTime?: number;
  lastUpdateTime?: number;
};

export default function useAppScanner() {
  const [apps, setApps] = useState<AppResult[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchApps = useCallback(async () => {
    setLoading(true);
    setError(null);
    setApps([]);

    if (Platform.OS !== 'android') {
      setError('Platform not supported: only Android is supported.');
      setLoading(false);
      return;
    }

    try {
      const result = await ExpoAndroidAppList.getAll();
      const userApps = (result as AppResult[])
        .filter(app => !app.isSystemApp)
        .sort((a, b) => a.appName.localeCompare(b.appName));
      setApps(userApps);
    } catch (err: any) {
      setError(err?.message || String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  const getAppPermissions = useCallback(async (packageName: string): Promise<string[]> => {
    if (Platform.OS !== 'android') return [];
    try {
      const permissions = await ExpoAndroidAppList.getPermissions(packageName);
      // Filter: keep only real Android permission strings, remove empty/system-internal entries
      return (permissions as string[]).filter(p => p && p.includes('permission')) || [];
    } catch (error) {
      console.error(`Failed to get permissions for ${packageName}:`, error);
      return [];
    }
  }, []);

  const getAppIcon = useCallback(async (packageName: string): Promise<string | null> => {
    if (Platform.OS !== 'android') return null;
    try {
      const icon = await ExpoAndroidAppList.getAppIcon(packageName);
      return icon ? `data:image/png;base64,${icon}` : null;
    } catch (error) {
      // console.error(`Failed to get icon for ${packageName}:`, error);
      return null;
    }
  }, []);

  useEffect(() => {
    fetchApps();
  }, [fetchApps]);

  return { apps, loading, error, refresh: fetchApps, getAppPermissions, getAppIcon } as const;
}
