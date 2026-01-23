// Popup 脚本

document.addEventListener('DOMContentLoaded', async () => {
  // 检查配置状态
  const { syncId } = await chrome.storage.local.get(['syncId'])
  updateStatus(syncId)

  // 收藏当前页面
  document.getElementById('savePage').addEventListener('click', async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })

      if (!syncId) {
        showStatus('请先配置同步 ID', 'error')
        setTimeout(() => chrome.runtime.openOptionsPage(), 1500)
        return
      }

      // 调用 background 的快速收藏
      chrome.runtime.sendMessage({
        action: 'quickSave',
        url: tab.url,
        title: tab.title
      })

      showStatus('收藏成功！', 'success')
      setTimeout(() => window.close(), 1500)
    } catch (error) {
      showStatus('收藏失败: ' + error.message, 'error')
    }
  })

  // 导入书签
  document.getElementById('importBookmarks').addEventListener('click', () => {
    if (!syncId) {
      showStatus('请先配置同步 ID', 'error')
      setTimeout(() => chrome.runtime.openOptionsPage(), 1500)
      return
    }

    chrome.tabs.create({ url: 'bookmarks/bookmarks.html' })
    window.close()
  })

  // 打开设置
  document.getElementById('openSettings').addEventListener('click', () => {
    chrome.runtime.openOptionsPage()
  })
})

// 更新状态显示
function updateStatus(syncId) {
  const statusEl = document.getElementById('status')

  if (syncId) {
    statusEl.innerHTML = '<span class="success">✓ 已配置</span>'
  } else {
    statusEl.innerHTML = '<span class="warning">⚠ 未配置同步 ID</span>'
  }
}

// 显示状态消息
function showStatus(message, type = 'info') {
  const statusEl = document.getElementById('status')
  statusEl.innerHTML = `<span class="${type}">${message}</span>`

  setTimeout(() => {
    if (type === 'success') {
      statusEl.innerHTML = ''
    }
  }, 3000)
}
