/**
 * 用户登出 API
 *
 * 功能：撤销当前会话（使 token 失效）
 */

import {
  revokeSession,
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

  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405)
  }

  try {
    // 提取 token
    const token = extractTokenFromRequest(request)

    if (!token) {
      return jsonResponse({ error: '未提供认证令牌' }, 401)
    }

    // 撤销会话
    const revoked = await revokeSession(env, token)

    if (revoked) {
      console.log('✓ 用户已登出')
      return jsonResponse({
        success: true,
        message: '已成功登出'
      })
    } else {
      // 即使 token 不存在也返回成功（幂等性）
      return jsonResponse({
        success: true,
        message: '已成功登出'
      })
    }

  } catch (error) {
    console.error('登出错误:', error)
    return jsonResponse({ error: '登出失败: ' + error.message }, 500)
  }
}
