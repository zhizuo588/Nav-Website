# Cloudflare KV 跨设备同步方案

## 🎯 功能概述

实现收藏和拖拽排序数据的跨设备同步，使用 Cloudflare Workers + KV 存储。

---

## 📋 架构设计

### **1. 数据存储**
```
Cloudflare KV → 用户数据
- favorites:{userId} → 收藏列表
- order:{userId} → 自定义排序
- visits:{userId} → 访问历史
- clicks:{userId} → 点击统计
```

### **2. API 接口**
```
GET  /api/sync/read   - 读取云端数据
POST /api/sync/save  - 保存本地数据到云端
POST /api/sync/merge - 合并云端和本地数据
```

### **3. 同步策略**
- **自动同步**：收藏/拖拽后自动保存到云端
- **手动同步**：提供"同步到云端"和"从云端恢复"按钮
- **冲突处理**：时间戳策略，最新的数据覆盖旧数据
- **用户识别**：生成唯一设备 ID，或使用用户自定义密码

---

## 🔧 实现步骤

### **步骤 1：创建 Cloudflare Worker**

创建 `worker/index.js`：

```javascript
import { Router } from 'itty-router'

const router = Router()

// CORS 预检
router.options('*', () => {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }
  })
})

// 读取数据
router.get('/api/sync/read', async () => {
  const userId = getUserIdFromRequest()
  if (!userId) {
    return jsonResponse({ error: '未授权' }, 401)
  }

  const favorites = await NAV_KV.get(`favorites:${userId}`, 'json')
  const order = await NAV_KV.get(`order:${userId}`, 'json')
  const visits = await NAV_KV.get(`visits:${userId}`, 'json')
  const clicks = await NAV_KV.get(`clicks:${userId}`, 'json')

  return jsonResponse({
    favorites: favorites || [],
    order: order || {},
    visits: visits || {},
    clicks: clicks || {},
    timestamp: Date.now()
  })
})

// 保存数据
router.post('/api/sync/save', async (request) => {
  const userId = getUserIdFromRequest(request)
  if (!userId) {
    return jsonResponse({ error: '未授权' }, 401)
  }

  const data = await request.json()
  const timestamp = Date.now()

  // 保存数据
  await NAV_KV.put(`favorites:${userId}`, JSON.stringify(data.favorites))
  await NAV_KV.put(`order:${userId}`, JSON.stringify(data.order))
  await NAV_KV.put(`visits:${userId}`, JSON.stringify(data.visits))
  await NAV_KV.put(`clicks:${userId}`, JSON.stringify(data.clicks))
  await NAV_KV.put(`timestamp:${userId}`, timestamp.toString())

  return jsonResponse({ success: true, timestamp })
})

// 合并数据（智能同步）
router.post('/api/sync/merge', async (request) => {
  const userId = getUserIdFromRequest(request)
  if (!userId) {
    return jsonResponse({ error: '未授权' }, 401)
  }

  const localData = await request.json()
  const cloudTimestamp = await NAV_KV.get(`timestamp:${userId}`)

  // 如果云端没有数据，直接保存本地数据
  if (!cloudTimestamp) {
    await NAV_KV.put(`favorites:${userId}`, JSON.stringify(localData.favorites))
    await NAV_KV.put(`order:${userId}`, JSON.stringify(localData.order))
    await NAV_KV.put(`timestamp:${userId}`, Date.now().toString())
    return jsonResponse({ action: 'saved', message: '已保存到云端' })
  }

  const cloudData = {
    favorites: await NAV_KV.get(`favorites:${userId}`, 'json'),
    order: await NAV_KV.get(`order:${userId}`, 'json'),
  }

  // 时间戳比较：使用最新的数据
  if (localData.timestamp > parseInt(cloudTimestamp)) {
    // 本地数据更新
    await NAV_KV.put(`favorites:${userId}`, JSON.stringify(localData.favorites))
    await NAV_KV.put(`order:${userId}`, JSON.stringify(localData.order))
    await NAV_KV.put(`timestamp:${userId}`, localData.timestamp.toString())
    return jsonResponse({ action: 'uploaded', message: '本地数据已上传' })
  } else {
    // 云端数据更新
    return jsonResponse({
      action: 'downloaded',
      message: '云端数据已下载',
      data: cloudData
    })
  }
})

// 获取用户 ID（从请求头或查询参数）
function getUserIdFromRequest(request) {
  // 方法 1：从 Authorization 头获取
  const authHeader = request.headers.get('Authorization')
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7)
  }

  // 方法 2：从查询参数获取（测试用）
  const url = new URL(request.url)
  const userId = url.searchParams.get('userId')
  if (userId) return userId

  // 方法 3：从请求体获取
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

export default {
  fetch: (request, env, ctx) => router.handle(request, env, ctx)
}
```

### **步骤 2：配置 wrangler.toml**

创建 `wrangler.toml`：

```toml
name = "nav-website-sync"
main = "worker/index.js"
compatibility_date = "2024-01-01"

[[kv_namespaces]]
binding = "NAV_KV"
id = "your_kv_namespace_id"  # 创建 KV 后会显示 ID
preview_id = "your_preview_kv_id"

[vars]
ENVIRONMENT = "production"
```

### **步骤 3：前端集成**

在 `src/App.vue` 中添加同步功能：

```javascript
// === 云同步逻辑 ===
const API_BASE = import.meta.env.VITE_SYNC_API || 'https://your-worker.workers.dev'
const AUTH_TOKEN = ref(localStorage.getItem('syncAuthToken') || generateDeviceId())

// 生成设备 ID
function generateDeviceId() {
  return 'device_' + Math.random().toString(36).substring(2, 15)
}

// 保存到云端
const syncToCloud = async () => {
  try {
    const response = await fetch(`${API_BASE}/api/sync/save`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AUTH_TOKEN.value}`
      },
      body: JSON.stringify({
        favorites: [...favorites.value],
        order: customOrder.value,
        visits: visitHistory.value,
        clicks: clickCounts.value,
        timestamp: Date.now()
      })
    })

    if (response.ok) {
      alert('✅ 已同步到云端！')
    } else {
      alert('❌ 同步失败：' + response.statusText)
    }
  } catch (error) {
    alert('❌ 同步失败：' + error.message)
  }
}

// 从云端恢复
const syncFromCloud = async () => {
  try {
    const response = await fetch(`${API_BASE}/api/sync/read?userId=${AUTH_TOKEN.value}`)
    const data = await response.json()

    if (response.ok && data.favorites) {
      // 更新本地数据
      favorites.value = new Set(data.favorites)
      customOrder.value = data.order || {}
      visitHistory.value = data.visits || {}
      clickCounts.value = data.clicks || {}

      // 保存到 localStorage
      localStorage.setItem('navFavorites', JSON.stringify(data.favorites))
      localStorage.setItem('navCustomOrder', JSON.stringify(data.order))
      localStorage.setItem('navVisits', JSON.stringify(data.visits))
      localStorage.setItem('navClickCounts', JSON.stringify(data.clicks))

      // 刷新显示
      draggablesList.value = [...filteredItems.value]

      alert('✅ 已从云端恢复！')
    }
  } catch (error) {
    alert('❌ 恢复失败：' + error.message)
  }
}

// 智能合并
const syncMerge = async () => {
  try {
    const response = await fetch(`${API_BASE}/api/sync/merge`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AUTH_TOKEN.value}`
      },
      body: JSON.stringify({
        favorites: [...favorites.value],
        order: customOrder.value,
        timestamp: Date.now()
      })
    })

    const result = await response.json()

    if (result.action === 'downloaded') {
      // 云端数据更新，应用到本地
      favorites.value = new Set(result.data.favorites)
      customOrder.value = result.data.order
      localStorage.setItem('navFavorites', JSON.stringify(result.data.favorites))
      localStorage.setItem('navCustomOrder', JSON.stringify(result.data.order))
      alert('✅ ' + result.message)
    } else {
      alert('✅ ' + result.message)
    }
  } catch (error) {
    alert('❌ 同步失败：' + error.message)
  }
}
```

### **步骤 4：添加同步按钮**

在顶部导航添加同步按钮：

```vue
<!-- 云同步按钮 -->
<button
  @click="syncToCloud"
  class="px-3 py-1 rounded-full text-xs bg-gradient-to-r from-blue-600 to-cyan-600 text-white hover:shadow-lg transition-all"
>
  <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M1 13a5 5 0 015.9-6l4 4a4 4 0 01.88 7.904" />
  </svg>
  云同步
</button>
```

---

## 🚀 部署步骤

### **1. 创建 Cloudflare KV 命名空间**
```bash
# 安装 wrangler
npm install -g wrangler

# 登录 Cloudflare
wrangler login

# 创建 KV 命名空间
wrangler kv:namespace create "NAV_KV" --preview
```

### **2. 部署 Worker**
```bash
# 在项目根目录创建 worker 文件夹
mkdir -p worker
# 将上面的 worker 代码保存到 worker/index.js

# 部署
wrangler publish
```

### **3. 配置环境变量**
在 `.env` 或 `vite.config.js` 中：
```js
export default define({
  VITE_SYNC_API: 'https://your-worker.workers.dev'
})
```

---

## 📊 数据流程

### **保存流程**
```
用户操作 → 更新 localStorage → 自动保存到 Cloudflare KV
收藏卡片 → localStorage.navFavorites → POST /api/sync/save → KV 存储
拖拽排序 → localStorage.navCustomOrder → POST /api/sync/save → KV 存储
```

### **恢复流程**
```
新设备 → 打开网站 → 点击"从云端恢复" → GET /api/sync/read → 更新 localStorage
```

### **合并流程**
```
点击"智能同步" → POST /api/sync/merge → 比较时间戳 → 使用最新数据
```

---

## 🔐 安全方案

### **选项 1：设备 ID（简单）**
- 自动生成唯一 ID
- 优点：无需用户操作
- 缺点：换设备需重新获取 ID

### **选项 2：用户密码（推荐）**
- 用户设置同步密码
- 优点：跨设备方便
- 缺点：需要用户记忆

### **选项 3：OAuth 登录（完整）**
- 支持 Google/GitHub 登录
- 优点：最安全
- 缺点：实现复杂

---

## 💡 使用建议

1. **首次使用**：设置一个同步密码
2. **自动同步**：收藏/拖拽后自动保存
3. **定期同步**：每天自动从云端检查更新
4. **多设备**：新设备输入同步密码即可恢复

---

## 🎯 下一步操作

你想让我：
1. 先实现基础的 Worker + KV 部署？
2. 还是先在本地添加同步按钮，测试效果？
3. 或者你有其他想法？

告诉我你的选择，我立即实现！🚀
