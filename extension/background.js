// Background Service Worker

// 分类列表（与网站分类保持一致）
const CATEGORIES = [
  { id: 'AI工具', name: 'AI工具' },
  { id: '云服务和服务器', name: '云服务和服务器' },
  { id: '互联网工具', name: '互联网工具' },
  { id: '娱乐', name: '娱乐' },
  { id: '常用网站', name: '常用网站' },
  { id: '邮箱和域名', name: '邮箱和域名' },
  { id: '我的服务', name: '我的服务' },
  { id: '私密', name: '私密' },
  { id: '友情链接', name: '友情链接 ⭐' }
]

// 扩展安装时初始化
chrome.runtime.onInstalled.addListener(() => {
  // 创建主菜单
  chrome.contextMenus.create({
    id: 'saveToNav',
    title: '📌 收藏到导航网站',
    contexts: ['page', 'link']
  })

  // 快速收藏
  chrome.contextMenus.create({
    id: 'quickSave',
    parentId: 'saveToNav',
    title: '⚡ 快速收藏（默认分类）',
    contexts: ['page', 'link']
  })

  // 分隔符
  chrome.contextMenus.create({
    id: 'separator',
    parentId: 'saveToNav',
    type: 'separator',
    contexts: ['page', 'link']
  })

  // 为每个分类创建子菜单
  CATEGORIES.forEach(category => {
    chrome.contextMenus.create({
      id: 'category-' + category.id,
      parentId: 'saveToNav',
      title: category.name,
      contexts: ['page', 'link']
    })
  })

  console.log('导航网站收藏助手已安装')
})

// 监听右键菜单点击
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  // 快速收藏
  if (info.menuItemId === 'quickSave') {
    let url = info.linkUrl || tab.url
    let title = info.linkUrl ? info.linkText : tab.title
    await quickSave(url, title, tab)
    return
  }

  // 分类收藏
  if (typeof info.menuItemId === 'string' && info.menuItemId.startsWith('category-')) {
    const category = info.menuItemId.replace('category-', '')
    let url = info.linkUrl || tab.url
    let title = info.linkUrl ? info.linkText : tab.title
    await saveToCategory(url, title, category, tab)
    return
  }
})

// 监听来自 popup 的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'quickSave') {
    quickSave(request.url, request.title, sender.tab)
    return true
  }
  if (request.action === 'customSave') {
    customSave(request.url, request.title, request.iconUrl, sender.tab)
    return true
  }
  return false
})

// 快速收藏
async function quickSave(url, title, tab) {
  try {
    // 检查是否已登录
    const { userToken, currentUser, apiUrl, defaultCategory } = await chrome.storage.local.get([
      'userToken',
      'currentUser',
      'apiUrl',
      'defaultCategory'
    ])

    if (!userToken || !currentUser) {
      showNotification('请先登录', '请在扩展设置中登录账号', () => {
        chrome.runtime.openOptionsPage()
      })
      return
    }

    if (!apiUrl) {
      showNotification('请先配置 API 地址', '请在扩展设置中配置 API 地址', () => {
        chrome.runtime.openOptionsPage()
      })
      return
    }

    // 提取图标 - 使用 unavatar.io（替代 Google favicon，在无法访问 Google 的地方也能用）
    const iconUrl = 'https://unavatar.io/' + new URL(url).hostname

    // 构造收藏数据
    const favorite = {
      name: title || new URL(url).hostname,
      url: url,
      desc: '',
      iconUrl: iconUrl,
      category: defaultCategory || '私密'
    }

    // 调用添加网站 API
    const response = await fetch(apiUrl + '/api/websites/add', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + userToken
      },
      body: JSON.stringify(favorite)
    })

    const result = await response.json()

    if (response.ok && result.success) {
      const msg = '"' + favorite.name + '" 已保存到「' + favorite.category + '」'
      // 尝试在页面内显示提示
      if (tab && tab.id) {
        chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: showInPageToast,
          args: [msg, 'success']
        }).catch(() => {
          // 如果注入失败（例如在 chrome:// 页面），回退到系统通知
          showNotification('收藏成功', msg)
        })
      } else {
        showNotification('收藏成功', msg)
      }
    } else {
      throw new Error(result.error || '收藏失败')
    }

  } catch (error) {
    console.error('快速收藏失败:', error)
    // 错误提示也尝试在页面显示
    if (tab && tab.id) {
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: showInPageToast,
        args: ['收藏失败: ' + error.message, 'error']
      }).catch(() => showNotification('收藏失败', error.message))
    } else {
      showNotification('收藏失败', error.message)
    }
  }
}

// 自定义图标收藏
async function customSave(url, title, customIconUrl, tab) {
  try {
    // 检查是否已登录
    const { userToken, currentUser, apiUrl, defaultCategory } = await chrome.storage.local.get([
      'userToken',
      'currentUser',
      'apiUrl',
      'defaultCategory'
    ])

    if (!userToken || !currentUser) {
      showNotification('请先登录', '请在扩展设置中登录账号', () => {
        chrome.runtime.openOptionsPage()
      })
      return
    }

    if (!apiUrl) {
      showNotification('请先配置 API 地址', '请在扩展设置中配置 API 地址', () => {
        chrome.runtime.openOptionsPage()
      })
      return
    }

    // 使用自定义图标或自动获取
    let iconUrl = customIconUrl
    if (!iconUrl) {
      // 自动获取图标 - 使用 unavatar.io
      iconUrl = 'https://unavatar.io/' + new URL(url).hostname
    }

    // 构造收藏数据
    const favorite = {
      name: title || new URL(url).hostname,
      url: url,
      desc: '',
      iconUrl: iconUrl,
      category: defaultCategory || '私密'
    }

    // 调用添加网站 API
    const response = await fetch(apiUrl + '/api/websites/add', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + userToken
      },
      body: JSON.stringify(favorite)
    })

    const result = await response.json()

    if (response.ok && result.success) {
      const msg = '"' + favorite.name + '" 已保存到「' + favorite.category + '」'
      if (tab && tab.id) {
        chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: showInPageToast,
          args: [msg, 'success']
        }).catch(() => showNotification('收藏成功', msg))
      } else {
        showNotification('收藏成功', msg)
      }
    } else {
      throw new Error(result.error || '收藏失败')
    }

  } catch (error) {
    console.error('自定义收藏失败:', error)
    if (tab && tab.id) {
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: showInPageToast,
        args: ['收藏失败: ' + error.message, 'error']
      }).catch(() => showNotification('收藏失败', error.message))
    } else {
      showNotification('收藏失败', error.message)
    }
  }
}

// 保存到指定分类
async function saveToCategory(url, title, category, tab) {
  try {
    // 检查是否已登录
    const { userToken, currentUser, apiUrl } = await chrome.storage.local.get([
      'userToken',
      'currentUser',
      'apiUrl'
    ])

    if (!userToken || !currentUser) {
      showNotification('请先登录', '请在扩展设置中登录账号', () => {
        chrome.runtime.openOptionsPage()
      })
      return
    }

    if (!apiUrl) {
      showNotification('请先配置 API 地址', '请在扩展设置中配置 API 地址', () => {
        chrome.runtime.openOptionsPage()
      })
      return
    }

    // 提取图标 - 使用 unavatar.io（替代 Google favicon，在无法访问 Google 的地方也能用）
    const iconUrl = 'https://unavatar.io/' + new URL(url).hostname

    // 构造收藏数据
    const favorite = {
      name: title || new URL(url).hostname,
      url: url,
      desc: '',
      iconUrl: iconUrl,
      category: category
    }

    // 调用添加网站 API
    const response = await fetch(apiUrl + '/api/websites/add', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + userToken
      },
      body: JSON.stringify(favorite)
    })

    const result = await response.json()

    if (response.ok && result.success) {
      const msg = '"' + favorite.name + '" 已保存到「' + category + '」'
      if (tab && tab.id) {
        chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: showInPageToast,
          args: [msg, 'success']
        }).catch(() => showNotification('收藏成功', msg))
      } else {
        showNotification('收藏成功', msg)
      }
    } else {
      throw new Error(result.error || '收藏失败')
    }

  } catch (error) {
    console.error('分类收藏失败:', error)
    if (tab && tab.id) {
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: showInPageToast,
        args: ['收藏失败: ' + error.message, 'error']
      }).catch(() => showNotification('收藏失败', error.message))
    } else {
      showNotification('收藏失败', error.message)
    }
  }
}

// 页面内提示函数（将被注入到页面执行）
function showInPageToast(message, type) {
  // 移除可能存在的旧提示
  const existing = document.getElementById('nav-helper-toast')
  if (existing) existing.remove()

  const toast = document.createElement('div')
  toast.id = 'nav-helper-toast'
  toast.style.cssText = `
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: ${type === 'success' ? 'rgba(16, 185, 129, 0.95)' : 'rgba(239, 68, 68, 0.95)'};
    color: white;
    padding: 12px 24px;
    border-radius: 8px;
    font-family: system-ui, -apple-system, sans-serif;
    font-size: 14px;
    font-weight: 500;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    z-index: 2147483647;
    transition: all 0.3s ease;
    opacity: 0;
    pointer-events: none;
    display: flex;
    align-items: center;
    gap: 8px;
    backdrop-filter: blur(4px);
  `
  
  const icon = type === 'success' ? '✓' : '✕'
  toast.innerHTML = `<span style="font-size: 16px">${icon}</span> <span>${message}</span>`

  document.body.appendChild(toast)

  // 动画显示
  requestAnimationFrame(() => {
    toast.style.top = '40px'
    toast.style.opacity = '1'
  })

  // 自动消失
  setTimeout(() => {
    toast.style.top = '20px'
    toast.style.opacity = '0'
    setTimeout(() => toast.remove(), 300)
  }, 3000)
}

// 显示通知
function showNotification(title, message, callback) {
  const options = {
    type: 'basic',
    iconUrl: 'icons/icon128.png',
    title: title,
    message: message
  }

  if (callback) {
    options.requireInteraction = true
  }

  chrome.notifications.create(options, (notificationId) => {
    if (callback) {
      chrome.notifications.onButtonClicked.addListener((id) => {
        if (id === notificationId) {
          callback()
        }
      })
    }
  })
}
