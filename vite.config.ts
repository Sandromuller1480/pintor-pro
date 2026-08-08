import path from 'path';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig(() => {
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      build: {
        rollupOptions: {
          output: {
            manualChunks(id) {
              if (!id.includes('node_modules')) {
                return;
              }

              if (id.includes('/react/') || id.includes('/react-dom/') || id.includes('/scheduler/')) {
                return 'vendor-react';
              }

              if (id.includes('/@supabase/')) {
                return 'vendor-supabase';
              }

              if (id.includes('/lucide-react/')) {
                return 'vendor-icons';
              }

              if (id.includes('/jspdf/') || id.includes('/dompurify/') || id.includes('/fflate/')) {
                return 'vendor-jspdf';
              }

              if (id.includes('/html2canvas/')) {
                return 'vendor-html2canvas';
              }

              return 'vendor';
            }
          }
        }
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      test: {
        environment: 'node',
        include: ['**/*.test.ts', '**/*.test.tsx'],
        exclude: ['dist/**', 'node_modules/**', 'supabase/functions/**'],
        pool: 'forks'
      }
    };
});
