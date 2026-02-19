import { requireNativeView } from 'expo';
import * as React from 'react';

import { ApkParserViewProps } from './ApkParser.types';

const NativeView: React.ComponentType<ApkParserViewProps> =
  requireNativeView('ApkParser');

export default function ApkParserView(props: ApkParserViewProps) {
  return <NativeView {...props} />;
}
