// vite.config.js
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  // ÖNEMLİ: GitHub'daki depo adın neyse buraya onu tam olarak yazmalısın (Başında ve sonunda / olacak)
  base: '/Poz/', 
  
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      
      // ÇÖZÜM BURASI: Sanal modülleri otomatik enjekte et (Vite bu sayede hata vermeyecek)
      injectRegister: 'auto',
      
      // Eğer geliştirme aşamasında (npm run dev) PWA servislerinin çalışmasını da istiyorsan:
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
            src: '/icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/icon-512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ]
});