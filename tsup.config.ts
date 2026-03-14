import { readFileSync } from 'node:fs';
import { defineConfig } from 'tsup';

const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'));
const sharedDefine = {
  __SDK_VERSION__: JSON.stringify(pkg.version),
};

export default defineConfig([
  {
    entry: {
      index: 'src/index.ts',
    },
    format: ['esm', 'cjs'],
    dts: true,
    sourcemap: true,
    clean: true,
    treeshake: true,
    define: sharedDefine,
    external: [
      'react',
      'react-dom',
      'react-native',
      'next',
      'react-router',
      '@react-navigation/native',
    ],
    outExtension({ format }) {
      return {
        js: format === 'esm' ? '.mjs' : '.cjs',
      };
    },
  },
  {
    entry: {
      'native/index': 'src/native/index.ts',
    },
    format: ['esm', 'cjs'],
    dts: true,
    sourcemap: true,
    treeshake: true,
    define: sharedDefine,
    external: ['react', 'react-dom', 'react-native', '@react-navigation/native'],
    outExtension({ format }) {
      return {
        js: format === 'esm' ? '.mjs' : '.cjs',
      };
    },
  },
  {
    entry: {
      'nextjs/index': 'src/nextjs/index.ts',
    },
    format: ['esm', 'cjs'],
    dts: true,
    sourcemap: true,
    treeshake: true,
    define: sharedDefine,
    external: ['react', 'react-dom', 'next'],
    outExtension({ format }) {
      return {
        js: format === 'esm' ? '.mjs' : '.cjs',
      };
    },
  },
]);
