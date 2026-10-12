import { defineConfig, type Plugin, type ViteDevServer } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import fs from 'node:fs'

const rootDir = path.dirname(fileURLToPath(import.meta.url))
const adminHtmlPath = path.resolve(rootDir, 'admin.html')

/**
 * Force the admin entry HTML for every SPA route in dev.
 * Must run as a pre-middleware (before Vite's index.html fallback).
 */
function adminHtmlFallback(): Plugin {
  return {
    name: 'admin-html-fallback',
    configureServer(server: ViteDevServer) {
      server.middlewares.use(async (req, res, next) => {
        try {
          const url = req.url || '/'
          const pathname = url.split('?')[0] || '/'
          const isAssetOrInternal =
            pathname.startsWith('/@') ||
            pathname.startsWith('/src') ||
            pathname.startsWith('/node_modules') ||
            pathname.startsWith('/public') ||
            pathname.includes('.')

          if (isAssetOrInternal) {
            next()
            return
          }

          const html = fs.readFileSync(adminHtmlPath, 'utf-8')
          const transformed = await server.transformIndexHtml(pathname, html)
          res.statusCode = 200
          res.setHeader('Content-Type', 'text/html')
          res.end(transformed)
        } catch (err) {
          next(err)
        }
      })
    },
  }
}

export default defineConfig({
  plugins: [adminHtmlFallback(), react(), tailwindcss()],
  server: {
    open: '/login',
  },
  build: {
    outDir: 'dist-admin',
    rollupOptions: {
      input: {
        index: adminHtmlPath,
      },
    },
  },
})
