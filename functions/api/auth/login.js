/**
 * 用户登录 API - 安全升级版
 *
 * 安全改进：
 * 1. 支持 PBKDF2 和旧版 SHA-256 密码验证
 * 2. 自动升级旧密码哈希（首次登录）
 * 3. 创建安全随机会话令牌
 * 4. 使用 sessions 表管理会话
 */

import {
  verifyPassword,
  hashPassword,
  isOldHashFormat,
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

    // 查询用户
    const user = await env.DB.prepare(
      'SELECT id, username, password_hash FROM users WHERE username = ?'
    ).bind(username).first()

    if (!user) {
      return jsonResponse({ error: '用户名或密码错误' }, 401)
    }

    // 验证密码
    const passwordValid = await verifyPassword(password, user.password_hash)

    if (!passwordValid) {
      return jsonResponse({ error: '用户名或密码错误' }, 401)
    }

    // 检查是否需要升级密码哈希（旧格式）
    let passwordUpgraded = false
    if (isOldHashFormat(user.password_hash)) {
      console.log(`⚠️  用户 ${username} 使用旧密码格式，正在升级...`)

      // 生成新的 PBKDF2 哈希
      const newHash = await hashPassword(password)

      // 更新数据库
      const upgradeResult = await env.DB.prepare(
        'UPDATE users SET password_hash = ? WHERE id = ?'
      ).bind(newHash, user.id).run()

      if (upgradeResult.success) {
        passwordUpgraded = true
        console.log(`✓ 用户 ${username} 密码哈希已升级为 PBKDF2`)
      } else {
        console.error(`✗ 用户 ${username} 密码哈希升级失败`)
      }
    }

    // 创建会话（30 天有效）
    const token = await createSession(env, user.id, 30)

    // 构建响应消息
    let message = '登录成功'
    if (passwordUpgraded) {
      message += '（密码安全已升级）'
    }

    console.log(`✓ 用户 ${username} 登录成功`)

    return jsonResponse({
      success: true,
      message: message,
      token: token,
      userId: user.id,
      username: user.username,
      passwordUpgraded: passwordUpgraded
    })

  } catch (error) {
    console.error('登录错误:', error)
    return jsonResponse({ error: '登录失败: ' + error.message }, 500)
  }
}
