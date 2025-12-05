import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '')
  
  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api/custom-claude': {
          target: env.VITE_CLAUDE_PROXY_TARGET || 'http://127.0.0.1:8000',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/custom-claude/, ''),
          configure: (proxy) => {
            proxy.on('proxyReq', (_proxyReq, req) => {
              console.log('🔑 [Proxy] Custom Claude request to:', req.url);
              console.log('🔑 [Proxy] Target:', env.VITE_CLAUDE_PROXY_TARGET || 'http://127.0.0.1:8000');
            });
            
            proxy.on('proxyRes', (proxyRes) => {
              console.log('📥 [Proxy] Custom Claude response status:', proxyRes.statusCode);
            });
            
            proxy.on('error', (err) => {
              console.error('❌ [Proxy] Custom Claude error:', err);
            });
          },
        },
        '/api/custom-gemini': {
          target: env.VITE_GEMINI_PROXY_TARGET || 'http://127.0.0.1:8001',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/custom-gemini/, ''),
          configure: (proxy) => {
            proxy.on('proxyReq', (_proxyReq, req) => {
              console.log('🔑 [Proxy] Custom Gemini request to:', req.url);
              console.log('🔑 [Proxy] Target:', env.VITE_GEMINI_PROXY_TARGET || 'http://127.0.0.1:8001');
            });
            
            proxy.on('proxyRes', (proxyRes) => {
              console.log('📥 [Proxy] Custom Gemini response status:', proxyRes.statusCode);
            });
            
            proxy.on('error', (err) => {
              console.error('❌ [Proxy] Custom Gemini error:', err);
            });
          },
        },
      },
    },
  }
})
