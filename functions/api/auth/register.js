/**
 * 用户注册 API - 安全升级版
 *
 * 安全改进：
 * 1. 使用 PBKDF2 密码哈希（100,000 次迭代）
 * 2. 创建安全随机会话令牌
 * 3. 使用 sessions 表管理会话
 */

import {
  hashPassword,
  createSession,
  jsonResponse,
  corsOptionsResponse
} from '../_middleware.js'

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
    const { username, password } = await request.json()

    // 验证输入
    if (!username || !password) {
      return jsonResponse({ error: '用户名和密码不能为空' }, 400)
    }

    if (username.length < 3) {
      return jsonResponse({ error: '用户名至少需要 3 个字符' }, 400)
    }

    if (password.length < 6) {
      return jsonResponse({ error: '密码至少需要 6 个字符' }, 400)
    }

    // 检查用户名是否已存在
    const existingUser = await env.DB.prepare(
      'SELECT id FROM users WHERE username = ?'
    ).bind(username).first()

    if (existingUser) {
      return jsonResponse({ error: '用户名已存在' }, 409)
    }

    // 使用 PBKDF2 生成密码哈希
    const passwordHash = await hashPassword(password)
    console.log(`✓ 用户注册：${username}（使用 PBKDF2 哈希）`)

    // 创建用户
    const result = await env.DB.prepare(
      'INSERT INTO users (username, password_hash) VALUES (?, ?)'
    ).bind(username, passwordHash).run()

    if (!result.success) {
      return jsonResponse({ error: '注册失败' }, 500)
    }

    const userId = result.meta.last_row_id

    // 创建会话（30 天有效）
    const token = await createSession(env, userId, 30)

    return jsonResponse({
      success: true,
      message: '注册成功',
      token: token,
      userId: userId,
      username: username
    })

  } catch (error) {
    console.error('注册错误:', error)
    return jsonResponse({ error: '注册失败: ' + error.message }, 500)
  }
}
