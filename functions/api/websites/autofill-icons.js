/**
 * 自动填充网站图标 API
 * 
 * 根据网址自动获取并填充图标链接
 * 支持两种模式：
 * 1. 批量填充：为数据库中所有缺少图标的网站自动填充
 * 2. 单个填充：根据提供的 URL 自动获取图标
 */

import {
  authenticateRequest,
  unauthorizedResponse,
  jsonResponse,
  corsOptionsResponse
} from '../_middleware.js'

// 图标获取优先级：
// 1. api.iowen.cn 服务 (国内最稳定)
// 2. favicon.im 服务
// 3. DuckDuckGo 图标服务
// 4. Google Favicon 服务
// 5. 网站原生 favicon (/favicon.ico)

// 检测 URL 是否返回有效的图片
async function checkFavicon(url) {
  try {
    // 设置较短的超时时间避免阻塞过久
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 2000)
    
    // 使用 GET 请求而不是 HEAD，因为有些简单的图标 API 服务器不支持 HEAD，或者即使 404 也返回不规范的内容
    const response = await fetch(url, { 
      method: 'GET', 
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
      signal: controller.signal
    })
    
    clearTimeout(timeoutId)
    
    // 检查状态码并且内容类型必须是图片
    if (response.ok) {
      const contentType = response.headers.get('content-type')
      if (contentType && contentType.startsWith('image/')) {
        return true
      }
    }
    return false
  } catch (e) {
    return false
  }
}

async function getAutoIconUrl(url) {
  try {
    if (!url.startsWith('http')) {
      url = 'https://' + url
    }
    const hostname = new URL(url).hostname.replace(/^www\./, '')
    
    const sources = [
      `https://api.iowen.cn/favicon/${hostname}.png`,
      `https://favicon.im/${hostname}`,
      `https://icons.duckduckgo.com/ip3/${hostname}.ico`,
      `https://www.google.com/s2/favicons?domain=${hostname}&sz=128`,
      `https://${hostname}/favicon.ico`
    ]

    // 逐个检测有效性，使用能够正常返回图片的源
    for (const source of sources) {
      const isValid = await checkFavicon(source)
      if (isValid) {
        return source
      }
    }
    
    // 如果全部失败，默认返回最可靠的 api.iowen.cn（虽然前端加载可能会失败，但这是最后的倔强）
    return `https://api.iowen.cn/favicon/${hostname}.png`
  } catch (e) {
    return ''
  }
}

export async function onRequest(context) {
  const { request, env } = context

  // CORS
  if (request.method === 'OPTIONS') {
    return corsOptionsResponse(['POST', 'GET', 'OPTIONS'])
  }

  try {
    // 验证会话（可选，如果不传则跳过验证）
    let user = null
    const authHeader = request.headers.get('Authorization')
    if (authHeader) {
      user = await authenticateRequest(request, env)
      if (!user) {
        return unauthorizedResponse('需要登录')
      }
    }

    if (request.method === 'POST') {
      // 批量填充模式：为所有缺少图标的网站填充图标
      return await handleBatchAutoFill(request, env)
    } else if (request.method === 'GET') {
      // 单个获取模式：根据 URL 获取图标
      return await handleSingleIcon(request, env)
    } else {
      return jsonResponse({ error: 'Method not allowed' }, 405)
    }

  } catch (error) {
    console.error('自动填充图标失败:', error)
    return jsonResponse({
      error: '操作失败',
      message: error.message
    }, 500)
  }
}

// 批量自动填充
async function handleBatchAutoFill(request, env) {
  const data = await request.json().catch(() => ({}))
  
  // 可选：限制每次处理的数量
  const limit = data.limit || 100
  const dryRun = data.dryRun || false

  // 查询缺少图标的网站
  const result = await env.DB.prepare(`
    SELECT id, url, name FROM websites 
    WHERE icon_url IS NULL OR icon_url = '' 
    LIMIT ?
  `).bind(limit).all()

  const websites = result.results || []
  
  if (websites.length === 0) {
    return jsonResponse({
      success: true,
      message: '没有需要填充图标的网站',
      processed: 0
    })
  }

  if (dryRun) {
    // 试运行模式：只返回结果不更新
    const preview = websites.map(w => ({
      id: w.id,
      url: w.url,
      name: w.name,
      autoIconUrl: getAutoIconUrl(w.url)
    }))
    return jsonResponse({
      success: true,
      message: `发现 ${websites.length} 个网站需要填充图标（试运行模式）`,
      processed: 0,
      preview
    })
  }

  // 实际更新
  let updated = 0
  const errors = []

  for (const website of websites) {
    try {
      const iconUrl = getAutoIconUrl(website.url)
      if (iconUrl) {
        await env.DB.prepare(`
          UPDATE websites SET icon_url = ?, updated_at = CURRENT_TIMESTAMP 
          WHERE id = ?
        `).bind(iconUrl, website.id).run()
        updated++
      }
    } catch (err) {
      errors.push({
        id: website.id,
        name: website.name,
        error: err.message
      })
    }
  }

  return jsonResponse({
    success: true,
    message: `成功填充 ${updated} 个网站图标`,
    processed: updated,
    errors: errors.length > 0 ? errors : undefined
  })
}

// 单个图标获取
async function handleSingleIcon(request, env) {
  const url = new URL(request.url).searchParams.get('url')
  
  if (!url) {
    return jsonResponse({ error: '缺少 URL 参数' }, 400)
  }

  const iconUrl = getAutoIconUrl(url)
  
  if (!iconUrl) {
    return jsonResponse({ error: '无法从 URL 中提取域名' }, 400)
  }

  return jsonResponse({
    success: true,
    url: url,
    iconUrl: iconUrl
  })
}
