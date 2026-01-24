import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [
    vue(),
    {
      name: 'api-dev-middleware',
      configureServer(server) {
        // 同步 API
        server.middlewares.use('/api/sync', (req, res, next) => {
          res.setHeader('Content-Type', 'application/json')
          res.setHeader('Access-Control-Allow-Origin', '*')
          res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
          res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

          if (req.method === 'OPTIONS') {
            res.statusCode = 204
            res.end()
            return
          }

          if (req.method === 'POST' && req.url.includes('/save')) {
            res.statusCode = 200
            res.end(JSON.stringify({
              success: true,
              timestamp: Date.now()
            }))
            console.log('📦 模拟保存成功:', req.method, req.url)
            return
          }

          if (req.method === 'GET' && req.url.includes('/read')) {
            res.statusCode = 200
            res.end(JSON.stringify({
              favorites: [],
              order: {},
              visits: {},
              clicks: {},
              categoryOrder: [],
              timestamp: null
            }))
            return
          }

          next()
        })

        // 网站数据 API
        server.middlewares.use('/api/websites', (req, res, next) => {
          res.setHeader('Content-Type', 'application/json')
          res.setHeader('Access-Control-Allow-Origin', '*')
          res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
          res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

          if (req.method === 'OPTIONS') {
            res.statusCode = 204
            res.end()
            return
          }

          // 读取网站数据
          if (req.method === 'GET' && req.url.includes('/read')) {
            // 开发模式返回静态数据
            res.statusCode = 200
            res.end(JSON.stringify({ navItems }))
            console.log('📖 返回网站数据:', navItems.length, '个分类')
            return
          }

          // 添加网站（开发模式）
          if (req.method === 'POST' && req.url.includes('/add')) {
            // 模拟添加成功
            const newId = Math.floor(Math.random() * 10000)
            res.statusCode = 200
            res.end(JSON.stringify({
              success: true,
              id: newId,
              message: '开发模式：网站已添加（未实际保存到数据库）'
            }))
            console.log('➕ 模拟添加网站')
            return
          }

          next()
        })

        // 私密分类验证 API
        server.middlewares.use('/api/private', (req, res, next) => {
          res.setHeader('Content-Type', 'application/json')
          res.setHeader('Access-Control-Allow-Origin', '*')
          res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
          res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

          if (req.method === 'OPTIONS') {
            res.statusCode = 204
            res.end()
            return
          }

          // 密码验证（开发模式）
          if (req.method === 'POST' && req.url.includes('/verify')) {
            // 开发模式：任意密码都可以通过
            res.statusCode = 200
            res.end(JSON.stringify({ success: true }))
            console.log('🔓 开发模式：密码验证通过')
            return
          }

          next()
        })

        // 数据迁移 API
        server.middlewares.use('/api/migrate', (req, res, next) => {
          res.setHeader('Content-Type', 'application/json')
          res.setHeader('Access-Control-Allow-Origin', '*')
          res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
          res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

          if (req.method === 'OPTIONS') {
            res.statusCode = 204
            res.end()
            return
          }

          // 数据迁移（开发模式）
          if (req.method === 'POST') {
            res.statusCode = 200
            res.end(JSON.stringify({
              success: true,
              message: '开发模式：数据迁移未执行（请部署到 Cloudflare 后执行）',
              migrated: 0,
              total: '需要部署后获取实际数量'
            }))
            console.log('📦 开发模式：数据迁移')
            return
          }

          next()
        })
      }
    }
  ],
  base: './',
  server: {
    host: '0.0.0.0', // 监听所有网络接口，允许局域网访问
    port: 5173       // 指定端口号
  }
})
