import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  appType: 'mpa',
  base: './',
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        calculadoras: resolve(__dirname, 'calculadoras/index.html'),
        auth: resolve(__dirname, 'auth.html'),
        perfil: resolve(__dirname, 'perfil.html'),
      },
    },
  },
});
