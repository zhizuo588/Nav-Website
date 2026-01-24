/**
 * 安全升级数据库迁移脚本
 *
 * 执行内容：
 * 1. 创建 sessions 表（用于会话管理）
 * 2. 创建索引以提高查询性能
 *
 * 使用方法：
 * POST /api/_migrate-security
 * Header: Authorization: Bearer <admin_password>
 */

import { jsonResponse, corsOptionsResponse } from './_middleware.js'

export async function onRequest(context) {
  const { request, env } = context

  // CORS 预检
  if (request.method === 'OPTIONS') {
    return corsOptionsResponse(['POST', 'OPTIONS'])
  }

  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405)
  }

  try {
    // 验证管理员密码
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return jsonResponse({ error: '未授权' }, 401)
    }

    const adminPassword = authHeader.substring(7)

    // 验证管理员密码（从环境变量获取）
    // 注意：需要在 wrangler.toml 中配置 ADMIN_PASSWORD 环境变量
    if (env.ADMIN_PASSWORD && adminPassword !== env.ADMIN_PASSWORD) {
      return jsonResponse({ error: '管理员密码错误' }, 401)
    }

    const changes = []
    const errors = []

    // 1. 创建 sessions 表
    try {
      await env.DB.exec(`
        CREATE TABLE IF NOT EXISTS sessions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          token_hash TEXT NOT NULL UNIQUE,
          expires_at DATETIME NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          last_used_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );
      `)
      changes.push('✅ 已创建 sessions 表')
    } catch (error) {
      errors.push(`创建 sessions 表失败: ${error.message}`)
    }

    // 2. 创建索引
    try {
      await env.DB.exec(`
        CREATE INDEX IF NOT EXISTS idx_sessions_token_hash ON sessions(token_hash);
        CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
        CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);
      `)
      changes.push('✅ 已创建 sessions 索引')
    } catch (error) {
      errors.push(`创建索引失败: ${error.message}`)
    }

    // 3. 清理可能的过期数据（如果表已存在）
    try {
      const result = await env.DB.prepare(`
        DELETE FROM sessions WHERE expires_at <= datetime('now')
      `).run()

      if (result.meta.changes > 0) {
        changes.push(`✅ 已清理 ${result.meta.changes} 个过期会话`)
      }
    } catch (error) {
      // 忽略清理错误
    }

    // 4. 验证表结构
    try {
      const tableInfo = await env.DB.prepare(`
        SELECT sql FROM sqlite_master WHERE type='table' AND name='sessions'
      `).first()

      if (tableInfo) {
        changes.push('✅ sessions 表结构验证通过')
      } else {
        errors.push('sessions 表结构验证失败')
      }
    } catch (error) {
      errors.push(`表结构验证失败: ${error.message}`)
    }

    // 返回结果
    return jsonResponse({
      success: errors.length === 0,
      message: errors.length === 0
        ? '安全升级迁移完成'
        : '迁移完成，但存在错误',
      changes: changes,
      errors: errors,
      warnings: [
        '⚠️  所有用户需要重新登录以使用新的会话系统',
        '⚠️  旧的可预测 token (user_1, user_2...) 已不再有效'
      ]
    })

  } catch (error) {
    console.error('迁移错误:', error)
    return jsonResponse({
      success: false,
      error: '迁移失败: ' + error.message
    }, 500)
  }
}
