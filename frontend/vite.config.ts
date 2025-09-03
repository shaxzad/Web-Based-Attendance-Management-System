import path from "node:path"
import { TanStackRouterVite } from "@tanstack/router-vite-plugin"
import react from "@vitejs/plugin-react-swc"
import { defineConfig, loadEnv } from "vite"

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '')
  
  return {
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    plugins: [react(), TanStackRouterVite()],
    build: {
      target: "es2015",
      outDir: "dist",
      sourcemap: false,
      minify: "esbuild",
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ["react", "react-dom"],
            router: ["@tanstack/react-router"],
          },
        },
      },
    },
    server: {
      port: 5173,
      host: true,
    },
    preview: {
      port: 4173,
      host: true,
    },
    optimizeDeps: {
      include: ["react", "react-dom", "@tanstack/react-router"],
    },
    // Ensure proper base path for Cloudflare Pages
    base: "/",
    // Explicitly define environment variables for the client
    define: {
      'import.meta.env.VITE_API_URL': JSON.stringify(
        mode === 'production' 
          ? 'https://web-based-attendance-management-system.onrender.com'
          : (env.VITE_API_URL || 'http://localhost:8000')
      ),
      'import.meta.env.MODE': JSON.stringify(mode),
      'import.meta.env.PROD': mode === 'production',
      'import.meta.env.DEV': mode === 'development',
    },
  }
})
