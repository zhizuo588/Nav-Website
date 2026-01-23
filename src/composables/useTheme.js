import { ref, watch, onMounted } from 'vue'

// 预设主题色
const PRESET_COLORS = {
  default: { from: '147, 51, 234', to: '59, 130, 246', name: '紫蓝' },
  ocean: { from: '6, 182, 212', to: '59, 130, 246', name: '青蓝' },
  forest: { from: '34, 197, 94', to: '16, 185, 129', name: '森林' },
  sunset: { from: '249, 115, 22', to: '239, 68, 68', name: '日落' },
  pink: { from: '236, 72, 153', to: '168, 85, 247', name: '粉紫' }
}

export function useTheme() {
  const settings = ref({
    mode: 'auto', // 'auto' | 'light' | 'dark'
    primaryColor: 'default',
    backgroundType: 'default', // 'default' | 'custom'
    customBackground: null,
    glassEffect: 50, // 0-100
    saturation: 100 // 0-200
  })

  // 从 localStorage 加载设置
  onMounted(() => {
    const saved = localStorage.getItem('themeSettings')
    if (saved) {
      try {
        const data = JSON.parse(saved)
        settings.value = { ...settings.value, ...data }
      } catch (e) {
        console.error('Failed to load theme settings:', e)
      }
    }
    applyTheme(settings.value)
  })

  // 监听设置变化并应用
  watch(settings, (newVal) => {
    localStorage.setItem('themeSettings', JSON.stringify(newVal))
    applyTheme(newVal)
  }, { deep: true })

  // 应用主题到 DOM
  const applyTheme = (theme) => {
    const root = document.documentElement

    // 1. 设置主题模式
    let isDark = true
    if (theme.mode === 'auto') {
      isDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    } else {
      isDark = theme.mode === 'dark'
    }
    root.classList.toggle('light', !isDark)

    // 2. 设置主题色
    const colors = theme.primaryColor.startsWith('#')
      ? hexToRgbObj(theme.primaryColor)
      : PRESET_COLORS[theme.primaryColor] || PRESET_COLORS.default

    root.style.setProperty('--primary-from', `rgb(${colors.from})`)
    root.style.setProperty('--primary-to', `rgb(${colors.to})`)

    // 3. 设置背景
    if (theme.backgroundType === 'custom' && theme.customBackground) {
      root.style.setProperty('--bg-image', `url(${theme.customBackground})`)
    } else {
      root.style.setProperty('--bg-image', "url('/bg.jpg')")
    }
    root.style.setProperty('--bg-saturation', theme.saturation)

    // 4. 设置玻璃效果
    updateGlassEffect(theme.glassEffect)
  }

  // 更新玻璃效果
  const updateGlassEffect = (value) => {
    const blur = (value / 100) * 20 // 0-20px
    const opacity = 0.3 + (value / 100) * 0.5 // 0.3-0.8

    document.documentElement.style.setProperty('--glass-blur', `${blur}px`)
    document.documentElement.style.setProperty('--glass-bg-opacity', opacity)
  }

  // Hex 转 RGB 对象
  const hexToRgbObj = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    if (!result) return PRESET_COLORS.default

    const r = parseInt(result[1], 16)
    const g = parseInt(result[2], 16)
    const b = parseInt(result[3], 16)

    return {
      from: `${r}, ${g}, ${b}`,
      to: `${Math.max(0, r - 30)}, ${Math.max(0, g - 30)}, ${Math.max(0, b - 30)}`
    }
  }

  // 处理背景图上传
  const handleBackgroundUpload = (file) => {
    if (!file) return

    // 验证文件类型
    const validTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!validTypes.includes(file.type)) {
      alert('请上传 JPG、PNG 或 WebP 格式的图片')
      return
    }

    // 限制文件大小（5MB）
    if (file.size > 5 * 1024 * 1024) {
      alert('图片大小不能超过 5MB')
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        // 使用 canvas 压缩
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')

        // 限制最大尺寸
        const maxWidth = 1920
        const maxHeight = 1080
        let width = img.width
        let height = img.height

        if (width > maxWidth) {
          height = (maxWidth / width) * height
          width = maxWidth
        }
        if (height > maxHeight) {
          width = (maxHeight / height) * width
          height = maxHeight
        }

        canvas.width = width
        canvas.height = height
        ctx.drawImage(img, 0, 0, width, height)

        // 转为 base64（压缩质量 0.8）
        const compressed = canvas.toDataURL('image/jpeg', 0.8)
        settings.value.customBackground = compressed
        settings.value.backgroundType = 'custom'
      }
      img.src = e.target.result
    }
    reader.readAsDataURL(file)
  }

  // 重置背景为默认
  const resetBackground = () => {
    settings.value.backgroundType = 'default'
    settings.value.customBackground = null
  }

  return {
    settings,
    applyTheme,
    handleBackgroundUpload,
    resetBackground,
    PRESET_COLORS
  }
}
