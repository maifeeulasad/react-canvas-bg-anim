import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import dts from 'vite-plugin-dts';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    dts({
      entryRoot: 'lib',
      outDir: 'dist',
      tsconfigPath: './tsconfig.build.json',
      copyDtsFiles: true,
    }),
  ],
  build: {
    lib: {
      entry: [
        path.resolve(__dirname, 'src/components/Attraction.tsx'),
        path.resolve(__dirname, 'src/components/BubbleParticle.tsx'),
        path.resolve(__dirname, 'src/components/HighlightedBox.tsx'),
        path.resolve(__dirname, 'src/components/MeteorParticle.tsx'),
      ],
      formats: ['es', 'cjs']
    },
    outDir: 'dist',
    rollupOptions: {
      external: ['react', 'react-dom'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          antd: 'antd',
        },
      },
    },
  },
});