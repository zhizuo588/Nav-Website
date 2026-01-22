// Cloudflare Pages Functions - 智能合并数据
export async function onRequest(context) {
  const { request, env } = context

  // CORS 预检
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      }
    })
  }

  const userId = getUserIdFromRequest(request)
  if (!userId) {
    return jsonResponse({ error: '未授权' }, 401)
  }

  try {
    const localData = await request.json()
    const cloudTimestamp = await env.NAV_KV.get(`timestamp:${userId}`)

    // 如果云端没有数据，直接保存本地数据
    if (!cloudTimestamp) {
      const timestamp = Date.now()
      await env.NAV_KV.put(`favorites:${userId}`, JSON.stringify(localData.favorites || []))
      await env.NAV_KV.put(`order:${userId}`, JSON.stringify(localData.order || {}))
      await env.NAV_KV.put(`visits:${userId}`, JSON.stringify(localData.visits || {}))
      await env.NAV_KV.put(`clicks:${userId}`, JSON.stringify(localData.clicks || {}))
      await env.NAV_KV.put(`timestamp:${userId}`, timestamp.toString())

      return jsonResponse({
        action: 'saved',
        message: '已保存到云端',
        timestamp
      })
    }

    // 时间戳比较：使用最新的数据
    if (localData.timestamp && localData.timestamp > parseInt(cloudTimestamp)) {
      // 本地数据更新
      await env.NAV_KV.put(`favorites:${userId}`, JSON.stringify(localData.favorites || []))
      await env.NAV_KV.put(`order:${userId}`, JSON.stringify(localData.order || {}))
      await env.NAV_KV.put(`visits:${userId}`, JSON.stringify(localData.visits || {}))
      await env.NAV_KV.put(`clicks:${userId}`, JSON.stringify(localData.clicks || {}))
      await env.NAV_KV.put(`timestamp:${userId}`, localData.timestamp.toString())

      return jsonResponse({
        action: 'uploaded',
        message: '本地数据已上传到云端'
      })
    } else {
      // 云端数据更新，返回云端数据
      const favorites = await env.NAV_KV.get(`favorites:${userId}`, 'json')
      const order = await env.NAV_KV.get(`order:${userId}`, 'json')
      const visits = await env.NAV_KV.get(`visits:${userId}`, 'json')
      const clicks = await env.NAV_KV.get(`clicks:${userId}`, 'json')

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

function getUserIdFromRequest(request) {
  const authHeader = request.headers.get('Authorization')
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7)
  }
  return null
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    }
  })
}
