// 私密分类密码验证 API
export async function onRequest(context) {
  const { request, env } = context

  // CORS
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    })
  }

  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405)
  }

  try {
    const { password } = await request.json()

    if (!password) {
      return jsonResponse({ error: '缺少密码' }, 400)
    }

    // 从环境变量读取正确密码
    const correctPassword = env.PRIVATE_PASSWORD

    if (!correctPassword) {
      return jsonResponse({ error: '服务器配置错误：密码未设置' }, 500)
    }

    // 验证密码
    if (password === correctPassword) {
      return jsonResponse({ success: true })
    } else {
      return jsonResponse({ error: '密码错误' }, 401)
    }

  } catch (error) {
    console.error('密码验证失败:', error)
    return jsonResponse({ error: '服务器错误' }, 500)
  }
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  })
}
