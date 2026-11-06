// Demo build: the real app with src/lib/supabase.ts swapped for demo/supabase.ts.
//
//   npm run build:demo            -> dist/demo/
//   npx vite --config demo/vite.config.ts   (local preview)
//
// The Pages workflow runs this after the main build, so the demo is served at
// /<repo>/demo/ next to the real app. No Supabase URL or key is passed in.

import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('..', import.meta.url));
const realClient = path.join(root, 'src/lib/supabase.ts');
const demoClient = path.join(root, 'demo/supabase.ts');

/** Every import of src/lib/supabase resolves to the in-memory demo client. */
function demoSupabase(): Plugin {
  return {
    name: 'demo-supabase',
    enforce: 'pre',
    async resolveId(source, importer, options) {
      if (!importer || !/(^|\/)supabase$/.test(source)) return null;
      const resolved = await this.resolve(source, importer, { ...options, skipSelf: true });
      return resolved && path.normalize(resolved.id) === realClient ? demoClient : null;
    },
  };
}

export default defineConfig({
  root,
  base: (process.env.VITE_BASE ?? '/') + 'demo/',
  plugins: [demoSupabase(), react()],
  define: {
    // Keep real connection values out of the demo bundle even if they are set in the shell.
    'import.meta.env.VITE_SUPABASE_URL': 'undefined',
    'import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY': 'undefined',
    'import.meta.env.VITE_SUPABASE_ANON_KEY': 'undefined',
    'import.meta.env.VITE_PHOTO_FILES_URL': 'undefined',
  },
  build: {
    outDir: path.join(root, 'dist/demo'),
    emptyOutDir: true,
    rollupOptions: { input: path.join(root, 'index.html') },
  },
  server: { host: '127.0.0.1', port: 5174 },
});
