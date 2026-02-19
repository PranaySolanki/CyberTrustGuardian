import { NativeModule, requireNativeModule } from 'expo';

import { ApkParserModuleEvents } from './ApkParser.types';

declare class ApkParserModule extends NativeModule<ApkParserModuleEvents> {
  PI: number;
  hello(): string;
  setValueAsync(value: string): Promise<void>;
}

// This call loads the native module object from the JSI.
export default requireNativeModule<ApkParserModule>('ApkParser');
