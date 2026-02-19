// Reexport the native module. On web, it will be resolved to ApkParserModule.web.ts
// and on native platforms to ApkParserModule.ts
export { default } from './src/ApkParserModule';
export { default as ApkParserView } from './src/ApkParserView';
export * from  './src/ApkParser.types';
