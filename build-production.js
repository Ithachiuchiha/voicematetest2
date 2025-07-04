import { build } from 'vite';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import fs from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function buildProduction() {
  try {
    console.log('Building production frontend...');
    
    // Build with optimized configuration
    await build({
      root: resolve(__dirname, 'client'),
      build: {
        outDir: resolve(__dirname, 'dist/public'),
        emptyOutDir: true,
        rollupOptions: {
          output: {
            manualChunks: {
              vendor: ['react', 'react-dom'],
              ui: ['@radix-ui/react-dialog', '@radix-ui/react-toast'],
              query: ['@tanstack/react-query']
            }
          }
        },
        chunkSizeWarningLimit: 1000,
        minify: true,
        sourcemap: false,
        reportCompressedSize: false
      },
      define: {
        'process.env.NODE_ENV': '"production"'
      },
      plugins: [
        // Only essential plugins for production
        (await import('@vitejs/plugin-react')).default()
      ],
      resolve: {
        alias: {
          '@': resolve(__dirname, 'client', 'src'),
          '@shared': resolve(__dirname, 'shared'),
          '@assets': resolve(__dirname, 'attached_assets'),
        }
      }
    });

    console.log('Frontend build completed successfully!');
    
    // Copy essential static files
    const staticFiles = [
      'manifest.json',
      'sw.js',
      'icon-192x192.png',
      'icon-512x512.png'
    ];
    
    for (const file of staticFiles) {
      const src = resolve(__dirname, 'client/public', file);
      const dest = resolve(__dirname, 'dist/public', file);
      
      if (fs.existsSync(src)) {
        fs.copyFileSync(src, dest);
        console.log(`Copied ${file}`);
      }
    }
    
    console.log('Build completed successfully!');
    
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
}

buildProduction();