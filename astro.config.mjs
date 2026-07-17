// @ts-check
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://de.krya.com',
  output: 'static',
  trailingSlash: 'always',
  compressHTML: true,
  markdown: {
    shikiConfig: { theme: 'dark-plus' },
  },
  vite: {
    build: { cssCodeSplit: false },
    css: { preprocessorOptions: { scss: { api: 'modern-compiler' } } },
  },
});
