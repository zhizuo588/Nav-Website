// Cloudflare Pages Functions - 读取云端数据（安全升级版）
//
// 安全改进：
// - 移除 userId 查询参数
// - 仅支持 Authorization Bearer token 验证
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
    return corsOptionsResponse(['GET', 'POST', 'OPTIONS'])
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
    // 从 KV 读取数据
    const favorites = await env.NAV_KV.get(`favorites:${user.userId}`, 'json')
    const order = await env.NAV_KV.get(`order:${user.userId}`, 'json')
    const categoryOrder = await env.NAV_KV.get(`categoryOrder:${user.userId}`, 'json')
    const visits = await env.NAV_KV.get(`visits:${user.userId}`, 'json')
    const clicks = await env.NAV_KV.get(`clicks:${user.userId}`, 'json')
    const timestamp = await env.NAV_KV.get(`timestamp:${user.userId}`)

    return jsonResponse({
      favorites: favorites || [],
      order: order || {},
      categoryOrder: categoryOrder || [],
      visits: visits || {},
      clicks: clicks || {},
      timestamp: timestamp ? parseInt(timestamp) : null
    })
  } catch (error) {
    return jsonResponse({ error: '读取失败: ' + error.message }, 500)
  }
}
