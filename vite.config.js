import { defineConfig, loadEnv } from "vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import { resolve } from "node:path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env variables based on the current mode
  const env = loadEnv(mode, process.cwd(), "");
  return {
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
        // Specific proxy for job-related API requests that *should* retain /api prefix
        '/api/job': {
          target: env.VITE_CROSSROAD_API_URL,
          changeOrigin: true,
          secure: false,
          // No rewrite here, so /api/job/... is forwarded as is
        },
        // General proxy for other /api requests (like /analyze_ssr/) that *should* have /api stripped
        '/api': {
          target: env.VITE_CROSSROAD_API_URL, // Use backend URL from .env
          changeOrigin: true,
          secure: false, // Assuming your backend uses HTTPS with a valid certificate
          rewrite: (path) => path.replace(/^\/api/, ''), // Remove /api prefix before forwarding
        },
      },
    },
  };
});
