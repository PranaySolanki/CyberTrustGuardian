import { requireNativeView } from 'expo';
import * as React from 'react';
import { View } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';

import { ApkParserViewProps } from './ApkParser.types';

const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient || Constants.appOwnership === 'expo';

const NativeView: React.ComponentType<ApkParserViewProps> = isExpoGo
  ? (props: ApkParserViewProps) => <View {...props} />
  : requireNativeView('ApkParser');

export default function ApkParserView(props: ApkParserViewProps) {
  return <NativeView {...props} />;
}
