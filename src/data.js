// 导航网站数据 - 从 API 动态加载

/**
 * 从 D1 数据库加载导航网站数据
 * @returns {Promise<Array>} 分类数据列表
 */
export async function fetchNavItems() {
  try {
    const response = await fetch('/api/websites/read')

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()

    if (data.error) {
      throw new Error(data.error)
    }

    console.log(`✓ 成功加载 ${data.navItems.length} 个分类`)
    return data.navItems

  } catch (error) {
    console.error('❌ 加载导航数据失败:', error)

    // 返回空数据结构（降级处理）
    return getEmptyNavItems()
  }
}

/**
 * 获取空数据结构（降级使用）
 */
function getEmptyNavItems() {
  return [
    {
      category: '我的服务',
      items: []
    },
    {
      category: '云服务和服务器',
      items: []
    },
    {
      category: '开发工具',
      items: []
    },
    {
      category: '邮箱和域名',
      items: []
    },
    {
      category: 'AI工具',
      items: []
    },
    {
      category: '常用网站',
      items: []
    },
    {
      category: '互联网工具',
      items: []
    },
    {
      category: '娱乐',
      items: []
    },
    {
      category: '私密',
      items: []
    }
  ]
}

// ========== 搜索引擎配置 ==========
export const searchEngines = [
  {
    name: 'Google',
    url: 'https://www.google.com/search?q=',
    icon: 'https://www.google.com/favicon.ico'
  },
  {
    name: 'Bing',
    url: 'https://www.bing.com/search?q=',
    icon: 'https://www.bing.com/favicon.ico'
  },
  {
    name: 'Baidu',
    url: 'https://www.baidu.com/s?wd=',
    icon: 'https://www.baidu.com/favicon.ico'
  }
]

// ========== 友情链接 ==========
export const friendLinks = [
  { name: 'GitHub', url: 'https://github.com', icon: 'https://github.com/favicon.ico' },
  { name: 'Vercel', url: 'https://vercel.com', icon: 'https://vercel.com/favicon.ico' },
  { name: 'Cloudflare', url: 'https://cloudflare.com', icon: 'https://cloudflare.com/favicon.ico' }
]

// ========== 说明 ==========
// 原静态数据已迁移到 D1 数据库
// 使用以下命令迁移数据：
// curl -X POST http://localhost:8788/api/migrate \
//   -H "Authorization: Bearer your_password"
//
// 原 data.js.backup 包含原始静态数据
