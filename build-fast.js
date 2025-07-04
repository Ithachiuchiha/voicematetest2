import * as esbuild from 'esbuild';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Build frontend with esbuild (much faster than Vite for this case)
await esbuild.build({
  entryPoints: [resolve(__dirname, 'client/src/main.tsx')],
  bundle: true,
  outfile: resolve(__dirname, 'dist/public/assets/index.js'),
  format: 'esm',
  target: 'es2020',
  platform: 'browser',
  minify: true,
  sourcemap: false,
  define: {
    'process.env.NODE_ENV': '"production"',
    'global': 'globalThis'
  },
  jsx: 'automatic',
  loader: {
    '.png': 'file',
    '.jpg': 'file',
    '.jpeg': 'file',
    '.svg': 'file'
  },
  external: ['fs', 'path', 'os'],
  plugins: [{
    name: 'alias',
    setup(build) {
      build.onResolve({ filter: /^@\// }, args => ({
        path: resolve(__dirname, 'client/src', args.path.slice(2))
      }));
      build.onResolve({ filter: /^@shared\// }, args => ({
        path: resolve(__dirname, 'shared', args.path.slice(8))
      }));
    }
  }]
});

console.log('Frontend built successfully with esbuild!');

// Create a basic CSS file
const css = `
/* Tailwind CSS will be processed here */
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Basic fallback styles */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  line-height: 1.6;
  color: #333;
  background-color: #fff;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
}

.btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 0.375rem;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
}

.btn-primary {
  background-color: #3b82f6;
  color: white;
}

.btn-primary:hover {
  background-color: #2563eb;
}

.card {
  background: white;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
  margin-bottom: 1rem;
}
`;

fs.writeFileSync(resolve(__dirname, 'dist/public/assets/index.css'), css);
console.log('CSS file created!');

console.log('Fast build completed successfully!');