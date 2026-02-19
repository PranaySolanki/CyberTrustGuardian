import * as React from 'react';

import { ApkParserViewProps } from './ApkParser.types';

export default function ApkParserView(props: ApkParserViewProps) {
  return (
    <div>
      <iframe
        style={{ flex: 1 }}
        src={props.url}
        onLoad={() => props.onLoad({ nativeEvent: { url: props.url } })}
      />
    </div>
  );
}
