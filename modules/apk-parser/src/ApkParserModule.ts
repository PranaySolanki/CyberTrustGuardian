import { NativeModule, requireNativeModule } from 'expo';
import Constants, { ExecutionEnvironment } from 'expo-constants';

import { ApkParserModuleEvents } from './ApkParser.types';

declare class ApkParserModule extends NativeModule<ApkParserModuleEvents> {
  PI: number;
  hello(): string;
  setValueAsync(value: string): Promise<void>;
  parseApk(path: string): Promise<any>;
}

const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient || Constants.appOwnership === 'expo';

// This call loads the native module object from the JSI.
// If we are in Expo Go, the native module doesn't exist, so we mock it to prevent crashes.
export default isExpoGo
  ? {
      PI: Math.PI,
      hello: () => 'Hello from Expo Go Mock',
      setValueAsync: async () => {},
      parseApk: async () => {
          console.warn('ApkParser.parseApk is not available in Expo Go.');
          return null;
      }
    } as unknown as ApkParserModule
  : requireNativeModule<ApkParserModule>('ApkParser');

