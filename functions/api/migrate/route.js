// 数据迁移 API - 触发 data.js 到 D1 的迁移
import { migrateToD1 } from '../../../scripts/migrate-to-d1.js'

export async function onRequest(context) {
  const { request, env } = context

  // CORS
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    })
  }

  // 仅允许 POST 请求
  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405)
  }

  // 验证权限（使用环境变量中的密码）
  const authHeader = request.headers.get('Authorization')
  if (!authHeader || authHeader !== `Bearer ${env.PRIVATE_PASSWORD}`) {
    return jsonResponse({ error: '未授权 - 需要管理员密码' }, 401)
  }

  try {
    // 执行迁移
    const result = await migrateToD1(env)

    return jsonResponse({
      success: true,
      message: `迁移完成！新增 ${result.migrated} 条，跳过 ${result.skipped} 条，总计 ${result.total} 条`,
      ...result
    })

  } catch (error) {
    return jsonResponse({
      success: false,
      error: error.message
    }, 500)
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
