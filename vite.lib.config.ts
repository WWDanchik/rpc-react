import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import dts from 'vite-plugin-dts';
import { resolve } from 'path';

export default defineConfig({
  plugins: [
    react(),
    dts({
      insertTypesEntry: true,
      rollupTypes: true,
    }),
  ],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'RpcReact',
      formats: ['es', 'cjs'],
      fileName: (format) => `index.${format === 'es' ? 'es' : 'js'}`,
    },
    rollupOptions: {
      external: [
        'react-redux',
        '@reduxjs/toolkit',
        '@yunu-lab/rpc-ts',
        'zod',
      ],
      output: {
        globals: {
          'react-redux': 'ReactRedux',
          '@reduxjs/toolkit': 'ReduxToolkit',
          '@yunu-lab/rpc-ts': 'RpcTs',
          zod: 'zod',
        },
      },
    },
    sourcemap: true,
    minify: false,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
}); 