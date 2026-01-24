// 从 R2 获取并展示图片
export async function onRequest(context) {
  const { request, env, params } = context

  // 获取路径参数
  // params.path 是一个数组，例如 ['icons', '123.png']
  const pathArray = params.path
  if (!pathArray || pathArray.length === 0) {
    return new Response('Not Found', { status: 404 })
  }

  const key = pathArray.join('/')

  try {
    // 从 R2 获取对象
    const object = await env.NAV_IMAGES.get(key)

    if (object === null) {
      return new Response('Image Not Found', { status: 404 })
    }

    const headers = new Headers()
    object.writeHttpMetadata(headers)
    headers.set('etag', object.httpEtag)
    
    // 设置缓存控制 (例如缓存 1 天)
    headers.set('Cache-Control', 'public, max-age=86400')

    return new Response(object.body, {
      headers
    })

  } catch (error) {
    console.error('获取图片失败:', error)
    return new Response('Internal Error', { status: 500 })
  }
}
