import { defineConfig } from "vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import { resolve } from "node:path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [TanStackRouterVite({ autoCodeSplitting: true }), viteReact(), tailwindcss()],
  test: {
    globals: true,
    environment: "jsdom",
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      // Proxy API requests to your backend
      '/api': {
        target: 'https://cr.pranjal.work', // Your actual backend URL
        changeOrigin: true,
        secure: true, // Assuming your backend uses HTTPS with a valid certificate
        rewrite: (path) => path.replace(/^\/api/, ''), // Remove /api prefix before forwarding
      },
    },
  },
});
