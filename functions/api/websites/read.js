// 从 D1 数据库读取所有网站数据
export async function onRequest(context) {
  const { request, env } = context

  // CORS
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    })
  }

  if (request.method !== 'GET') {
    return jsonResponse({ error: 'Method not allowed' }, 405)
  }

  try {
    // 从 D1 读取所有网站，按分类和名称排序
    const stmt = env.DB.prepare(`
      SELECT * FROM websites
      ORDER BY category, name
    `)

    const result = await stmt.all()

    if (!result.results) {
      return jsonResponse({ navItems: [] })
    }

    // 按分类组织数据
    const categorized = {}

    result.results.forEach(row => {
      if (!categorized[row.category]) {
        categorized[row.category] = {
          category: row.category,
          items: []
        }
      }

      categorized[row.category].items.push({
        id: row.id,
        name: row.name,
        url: row.url,
        desc: row.desc || '',
        iconUrl: row.icon_url || '',
        lanUrl: row.lan_url || null,
        darkIcon: row.dark_icon === 1
      })
    })

    // 转换为数组格式
    const navItems = Object.values(categorized)

    return jsonResponse({ navItems })

  } catch (error) {
    console.error('读取网站数据失败:', error)
    return jsonResponse({
      error: '读取数据失败',
      message: error.message
    }, 500)
  }
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  })
}
