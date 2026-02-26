/**
 * 添加新网站到 D1 数据库（安全升级版）
 *
 * 安全改进：
 * - 添加会话鉴权检查
 */

import {
  authenticateRequest,
  unauthorizedResponse,
  jsonResponse,
  corsOptionsResponse
} from '../_middleware.js'

export async function onRequest(context) {
  const { request, env } = context

  // CORS
  if (request.method === 'OPTIONS') {
    return corsOptionsResponse(['POST', 'OPTIONS'])
  }

  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405)
  }

  // 鉴权检查
  const user = await authenticateRequest(request, env)
  if (!user) {
    return unauthorizedResponse('您需要登录后才能添加网站')
  }

  // 验证数据
  const data = await request.json()

  if (!data.name || !data.url || !data.category) {
    return jsonResponse({ error: '缺少必填字段: name, url, category' }, 400)
  }

  // 如果没有提供 iconUrl，自动根据 URL 获取
  let autoIconUrl = data.iconUrl || ''
  if (!autoIconUrl && data.url) {
    try {
      const hostname = new URL(data.url.startsWith('http') ? data.url : 'https://' + data.url).hostname.replace(/^www\./, '')
      autoIconUrl = `https://${hostname}/favicon.ico`
    } catch (e) {
      // ignore
    }
  }

  try {
    // 插入数据并获取结果
    const result = await env.DB.prepare(`
      INSERT INTO websites (name, url, category, desc, icon_url, lan_url, dark_icon)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      data.name,
      data.url,
      data.category,
      data.desc || '',
      autoIconUrl,
      data.lanUrl || '',
      data.darkIcon ? 1 : 0
    ).run()

    // 获取新插入的 ID（从结果中获取）
    // 插入数据并获取结果
    const result = await env.DB.prepare(`
      INSERT INTO websites (name, url, category, desc, icon_url, lan_url, dark_icon)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      data.name,
      data.url,
      data.category,
      data.desc || '',
      autoIconUrl,
      data.lanUrl || '',
      data.darkIcon ? 1 : 0
    ).run()
    // 插入数据并获取结果
    const result = await env.DB.prepare(`
      INSERT INTO websites (name, url, category, desc, icon_url, lan_url, dark_icon)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      data.name,
      data.url,
      data.category,
      data.desc || '',
      data.iconUrl || '',
      data.lanUrl || '',
      data.darkIcon ? 1 : 0
    ).run()

    // 获取新插入的 ID（从结果中获取）
    const lastId = result.meta.last_row_id

    return jsonResponse({
      success: true,
      id: lastId,
      message: `网站 "${data.name}" 已添加到「${data.category}」`
    })

  } catch (error) {
    console.error('添加网站失败:', error)

    // 检查是否是唯一约束错误
    if (error.message.includes('UNIQUE')) {
      return jsonResponse({ error: '该网址已存在' }, 409)
    }

    return jsonResponse({
      error: '添加失败',
      message: error.message
    }, 500)
  }
}
