import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [
    vue()
  ],
  base: './',
  server: {
    host: '0.0.0.0', // 监听所有网络接口，允许局域网访问
    port: 5173,      // 指定端口号
    proxy: {
      // 将 API 请求代理到 Wrangler 开发服务器
      '/api': {
        target: 'http://localhost:8788',
        changeOrigin: true,
        secure: false
      }
    }
  }
})
