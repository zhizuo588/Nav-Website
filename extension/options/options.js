// Options 页面脚本

document.addEventListener('DOMContentLoaded', async () => {
  // 加载已保存的设置
  loadSettings()

  // 保存设置
  document.getElementById('settingsForm').addEventListener('submit', async (e) => {
    e.preventDefault()

    const settings = {
      syncId: document.getElementById('syncId').value.trim(),
      apiUrl: document.getElementById('apiUrl').value.trim(),
      defaultCategory: document.getElementById('defaultCategory').value
    }

    // 保存到 chrome.storage
    await chrome.storage.local.set(settings)

    showTestResult('设置已保存！', 'success')
  })

  // 测试连接
  document.getElementById('testConnection').addEventListener('click', async () => {
    const syncId = document.getElementById('syncId').value.trim()

    if (!syncId) {
      showTestResult('请先输入同步 ID', 'error')
      return
    }

    showTestResult('正在测试连接...', 'info')

    try {
      // 尝试读取数据
      const apiUrl = document.getElementById('apiUrl').value.trim().replace('/save', '/read')
      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${syncId}`
        }
      })

      if (response.ok) {
        showTestResult('✓ 连接成功！配置有效', 'success')
      } else {
        const error = await response.json()
        showTestResult(`连接失败: ${error.error}`, 'error')
      }
    } catch (error) {
      showTestResult(`连接失败: ${error.message}`, 'error')
    }
  })

  // 导入书签
  document.getElementById('importBookmarks').addEventListener('click', () => {
    const syncId = document.getElementById('syncId').value.trim()

    if (!syncId) {
      showTestResult('请先配置同步 ID', 'error')
      return
    }

    chrome.tabs.create({ url: 'bookmarks/bookmarks.html' })
  })
})

// 加载设置
async function loadSettings() {
  const settings = await chrome.storage.local.get([
    'syncId',
    'apiUrl',
    'defaultCategory'
  ])

  if (settings.syncId) {
    document.getElementById('syncId').value = settings.syncId
  }

  if (settings.apiUrl) {
    document.getElementById('apiUrl').value = settings.apiUrl
  }

  if (settings.defaultCategory) {
    document.getElementById('defaultCategory').value = settings.defaultCategory
  }
}

// 显示测试结果
function showTestResult(message, type) {
  const resultEl = document.getElementById('testResult')
  resultEl.className = `test-result ${type}`
  resultEl.textContent = message
  resultEl.classList.remove('hidden')

  if (type === 'success') {
    setTimeout(() => {
      resultEl.classList.add('hidden')
    }, 3000)
  }
}
