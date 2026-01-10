import { defineConfig, loadEnv } from "vite"
import react from "@vitejs/plugin-react-swc"
import path from "path"
import { componentTagger } from "lovable-tagger"

import { fileURLToPath } from 'url'

// ESM compatible __dirname alternative
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    server: {
      host: "::",
      port: 8080,
      proxy: {
        // Proxy API requests to avoid CORS issues during development
        '/api/proxy-gemini': {
          target: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
          changeOrigin: true,
          rewrite: (path) => '',
          configure: (proxy, options) => {
            // Proxy will pass custom headers from the original request
            proxy.on('proxyReq', (proxyReq, req, res) => {
              // Transfer API key from X-Gemini-API-Key to Authorization
              const apiKey = req.headers['x-gemini-api-key'] || env.GEMINI_API_KEY || env.VITE_GEMINI_API_KEY;
              if (apiKey) {
                proxyReq.setHeader('Authorization', `Bearer ${apiKey}`);
              }
            });
          },
        },
        // Fallback/Alias for gemini proxy
        '/api/gemini-proxy': {
          target: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
          changeOrigin: true,
          rewrite: (path) => '',
          configure: (proxy, options) => {
            proxy.on('proxyReq', (proxyReq, req, res) => {
              const apiKey = req.headers['x-gemini-api-key'] || env.GEMINI_API_KEY || env.VITE_GEMINI_API_KEY;
              if (apiKey) {
                proxyReq.setHeader('Authorization', `Bearer ${apiKey}`);
              }
            });
          },
        },
        // Proxy backend Flask endpoints for function calling and replicate
        '/api/gemini_functions': {
          target: 'http://127.0.0.1:3000',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/gemini_functions/, '/api/gemini_functions'),
        },
        '/api/replicate': {
          target: 'http://127.0.0.1:3000',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/replicate/, '/api/replicate'),
        },
        '/api/sensay-proxy': {
          target: 'http://127.0.0.1:3000',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/sensay-proxy/, '/api/sensay-proxy'),
        },
        // MNEE API Proxy to avoid CORS issues
        '/mnee-api': {
          target: 'https://sandbox-proxy-api.mnee.net',
          changeOrigin: true,
          rewrite: (path) => {
            // Remove /mnee-api prefix
            const newPath = path.replace(/^\/mnee-api/, '');
            // Append auth_token query parameter
            const apiKey = env.VITE_MNEE_API_KEY || env.MNEE_API_KEY;
            if (apiKey) {
              const separator = newPath.includes('?') ? '&' : '?';
              return `${newPath}${separator}auth_token=${apiKey}`;
            }
            return newPath;
          },
          configure: (proxy, options) => {
            proxy.on('proxyReq', (proxyReq, req, res) => {
              // Remove any existing origin headers to avoid CORS conflicts
              proxyReq.removeHeader('origin');
            });
          },
        },
      }
    },
    plugins: [
      react(),
      mode === "development" && componentTagger(),
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  }
})









