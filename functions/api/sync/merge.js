// Cloudflare Pages Functions - 智能合并数据（安全升级版）
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
    const localData = await request.json()
    const cloudTimestamp = await env.NAV_KV.get(`timestamp:${user.userId}`)

    // 如果云端没有数据，直接保存本地数据
    if (!cloudTimestamp) {
      const timestamp = Date.now()
      await env.NAV_KV.put(`favorites:${user.userId}`, JSON.stringify(localData.favorites || []))
      await env.NAV_KV.put(`order:${user.userId}`, JSON.stringify(localData.order || {}))
      await env.NAV_KV.put(`visits:${user.userId}`, JSON.stringify(localData.visits || {}))
      await env.NAV_KV.put(`clicks:${user.userId}`, JSON.stringify(localData.clicks || {}))
      await env.NAV_KV.put(`timestamp:${user.userId}`, timestamp.toString())

      return jsonResponse({
        action: 'saved',
        message: '已保存到云端',
        timestamp
      })
    }

    // 时间戳比较：使用最新的数据
    if (localData.timestamp && localData.timestamp > parseInt(cloudTimestamp)) {
      // 本地数据更新
      await env.NAV_KV.put(`favorites:${user.userId}`, JSON.stringify(localData.favorites || []))
      await env.NAV_KV.put(`order:${user.userId}`, JSON.stringify(localData.order || {}))
      await env.NAV_KV.put(`visits:${user.userId}`, JSON.stringify(localData.visits || {}))
      await env.NAV_KV.put(`clicks:${user.userId}`, JSON.stringify(localData.clicks || {}))
      await env.NAV_KV.put(`timestamp:${user.userId}`, localData.timestamp.toString())

      return jsonResponse({
        action: 'uploaded',
        message: '本地数据已上传到云端'
      })
    } else {
      // 云端数据更新，返回云端数据
      const favorites = await env.NAV_KV.get(`favorites:${user.userId}`, 'json')
      const order = await env.NAV_KV.get(`order:${user.userId}`, 'json')
      const visits = await env.NAV_KV.get(`visits:${user.userId}`, 'json')
      const clicks = await env.NAV_KV.get(`clicks:${user.userId}`, 'json')

      return jsonResponse({
        action: 'downloaded',
        message: '云端数据已下载',
        data: {
          favorites: favorites || [],
          order: order || {},
          visits: visits || {},
          clicks: clicks || {}
        },
        timestamp: parseInt(cloudTimestamp)
      })
    }
  } catch (error) {
    return jsonResponse({ error: '同步失败: ' + error.message }, 500)
  }
}
