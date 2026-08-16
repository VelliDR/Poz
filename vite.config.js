// vite.config.js
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ command }) => {
  return {
    // ÇÖZÜM 1: Sadece GitHub'a build alırken '/Poz/' yap, lokalde '/' kal.
    base: command === 'build' ? '/Poz/' : '/', 
    
    plugins: [
      VitePWA({
        registerType: 'autoUpdate',
        injectRegister: 'inline',
        devOptions: {
          enabled: true
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,task,wasm}'],
          maximumFileSizeToCacheInBytes: 10000000 
        },
        manifest: {
          name: 'Poz | Görsel Hizalama',
          short_name: 'Poz',
          description: 'Sanatsal mizanpaj, görsel kopyalama ve AI otonom kamera.',
          theme_color: '#000000',
          background_color: '#000000',
          display: 'standalone',
          orientation: 'portrait',
          icons: [
            {
              // ÇÖZÜM 2: Başındaki '/' işaretlerini sildik
              src: 'icon-192.png',
              sizes: '192x192',
              type: 'image/png'
            },
            {
              src: 'icon-512.png',
              sizes: '512x512',
              type: 'image/png'
            }
          ]
        }
      })
    ]
  };
});