import { defineConfig } from 'vite';
import { resolve } from 'node:path';

export default defineConfig({
  server: { port: 4173 },
  preview: { port: 4173 },
  build: {
    rollupOptions: {
      input: {
        main: resolve(process.cwd(), 'index.html'),
        queEsLink: resolve(process.cwd(), 'que-es-link/index.html'),
        serParte: resolve(process.cwd(), 'ser-parte/index.html'),
        ingreso: resolve(process.cwd(), 'ingreso/index.html'),
        conectarNegocio: resolve(process.cwd(), 'conectar-negocio/index.html'),
        fin: resolve(process.cwd(), 'fin/index.html')
      }
    }
  }
});
