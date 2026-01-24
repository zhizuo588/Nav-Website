// Cloudflare Pages Functions - 保存数据到云端（安全升级版）
//
// 安全改进：
// - 使用会话验证而不是直接使用 userId

import {
  validateSession,
  extractTokenFromRequest,
  jsonResponse,
  corsOptionsResponse
} from '../_middleware.js'

export async function onRequest(context) {
  const { request, env } = context

  // CORS 预检
  if (request.method === 'OPTIONS') {
    return corsOptionsResponse(['POST', 'OPTIONS'])
  }

  // 验证会话
  const token = extractTokenFromRequest(request)
  if (!token) {
    return jsonResponse({ error: '未授权，请提供有效的认证令牌' }, 401)
  }

  const user = await validateSession(env, token)
  if (!user) {
    return jsonResponse({ error: '会话无效或已过期，请重新登录' }, 401)
  }

  try {
    const data = await request.json()
    const timestamp = Date.now()

    // 验证数据格式
    if (!data.favorites || !Array.isArray(data.favorites)) {
      return jsonResponse({ error: '数据格式错误' }, 400)
    }

    // 保存数据到 KV
    await env.NAV_KV.put(`favorites:${user.userId}`, JSON.stringify(data.favorites))
    await env.NAV_KV.put(`order:${user.userId}`, JSON.stringify(data.order || {}))
    await env.NAV_KV.put(`categoryOrder:${user.userId}`, JSON.stringify(data.categoryOrder || []))
    await env.NAV_KV.put(`visits:${user.userId}`, JSON.stringify(data.visits || {}))
    await env.NAV_KV.put(`clicks:${user.userId}`, JSON.stringify(data.clicks || {}))
    await env.NAV_KV.put(`timestamp:${user.userId}`, timestamp.toString())

    return jsonResponse({
      success: true,
      timestamp
    })
  } catch (error) {
    return jsonResponse({ error: '保存失败: ' + error.message }, 500)
  }
}
