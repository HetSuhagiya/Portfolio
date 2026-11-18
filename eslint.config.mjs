import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // Shader uniforms and sim buffers are mutated imperatively in the frame loop on purpose.
      'react-hooks/immutability': 'off',
    },
  },
  globalIgnores(['.next/**', 'out/**', 'node_modules/**', 'next-env.d.ts', 'playwright-report/**', 'test-results/**', '.lighthouseci/**', '.agents/**']),
]);
