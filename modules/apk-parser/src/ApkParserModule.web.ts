import { registerWebModule, NativeModule } from 'expo';

import { ChangeEventPayload } from './ApkParser.types';

type ApkParserModuleEvents = {
  onChange: (params: ChangeEventPayload) => void;
}

class ApkParserModule extends NativeModule<ApkParserModuleEvents> {
  PI = Math.PI;
  async setValueAsync(value: string): Promise<void> {
    this.emit('onChange', { value });
  }
  hello() {
    return 'Hello world! 👋';
  }
};

export default registerWebModule(ApkParserModule, 'ApkParserModule');
