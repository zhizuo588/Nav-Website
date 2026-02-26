/**
 * 图标工具函数
 * 提供多种图标获取方案，解决无法访问 Google 的问题
 */

// dashboardicons 图标映射表（常用网站）
const DASHBOARD_ICON_MAP = {
  'github': 'github',
  'gitlab': 'gitlab',
  'bitbucket': 'bitbucket',
  'youtube': 'youtube',
  'twitter': 'twitter',
  'x.com': 'twitter',
  'facebook': 'facebook',
  'instagram': 'instagram',
  'reddit': 'reddit',
  'discord': 'discord',
  'slack': 'slack',
  'notion': 'notion',
  'figma': 'figma',
  'spotify': 'spotify',
  'netflix': 'netflix',
  'amazon': 'amazon',
  'stackoverflow': 'stackoverflow',
  'medium': 'medium',
  'zhihu': 'zhihu',
  'bilibili': 'bilibili',
  'douyin': 'douyin',
  'juejin': 'juejin',
  'cloudflare': 'cloudflare',
  'vercel': 'vercel',
  'heroku': 'heroku',
  'digitalocean': 'digitalocean',
  'aws': 'aws',
  'azure': 'azure',
  'google': 'google',
  'google.com': 'google',
  'microsoft': 'microsoft',
  'apple': 'apple',
  'docker': 'docker',
  'kubernetes': 'kubernetes',
  'vuejs': 'vue-js',
  'reactjs': 'react',
  'nextjs': 'nextjs',
  'tailwindcss': 'tailwindcss',
  'deepseek': 'deepseek',
  'openai': 'openai',
  'anthropic': 'anthropic',
  'claude': 'claude',
  'chatgpt': 'chatgpt',
  'midjourney': 'midjourney',
  'stabilityai': 'stability-ai',
  'siliconflow': 'siliconflow',
  'huggingface': 'huggingface',
  'bard': 'google-bard',
  'gemini': 'google-gemini',
  'perplexity': 'perplexity',
  'copilot': 'microsoft-copilot',
  'cursor': 'cursor',
  'windsurf': 'windsurf',
  'linear': 'linear',
  'loom': 'loom',
  'cal.com': 'cal',
  'notion': 'notion',
  'obsidian': 'obsidian',
  'raycast': 'raycast',
  'alfred': 'alfred',
  'popclip': 'popclip',
  'arc': 'arc',
  'brave': 'brave',
  'chrome': 'google-chrome',
  'firefox': 'firefox',
  'safari': 'safari',
  'edge': 'microsoft-edge',
  '1password': '1password',
  'bitwarden': 'bitwarden',
  'lastpass': 'lastpass',
  'dashlane': 'dashlane',
  'keepass': 'keepass',
  'sentry': 'sentry',
  'datadog': 'datadog',
  'newrelic': 'new-relic',
  'grafana': 'grafana',
  'prometheus': 'prometheus',
  'jenkins': 'jenkins',
  'gitlab': 'gitlab-ci',
  'travis-ci': 'travis-ci',
  'circleci': 'circleci',
  'github-actions': 'github-actions',
  'railway': 'railway',
  'render': 'render',
  'flyio': 'fly',
  'supabase': 'supabase',
  'planetscale': 'planetscale',
  'mongodb': 'mongodb',
  'redis': 'redis',
  'postgresql': 'postgresql',
  'mysql': 'mysql',
  'prisma': 'prisma',
  'drizzle': 'drizzle',
  'sequelize': 'sequelize',
  'typeorm': 'typeorm',
  'nginx': 'nginx',
  'apache': 'apache',
  'caddy': 'caddy',
  'traefik': 'traefik',
  'portainer': 'portainer',
  'uptime-kuma': 'uptime-kuma',
  'dozzle': 'dozzle',
  'gotify': 'gotify',
  'searxng': 'searxng',
  'homarr': 'homarr',
  'adguard': 'adguard',
  'pi-hole': 'pi-hole',
  'cloudflare': 'cloudflare-turnstile',
  'mailcow': 'mailcow',
  'stirling-pdf': 'stirling-pdf',
  'changedetection': 'changedetection',
  'qbittorrent': 'qbittorrent',
  'immich': 'immich',
  'jellyfin': 'jellyfin',
  'plex': 'plex',
  'emby': 'emby',
  'sonarr': 'sonarr',
  'radarr': 'radarr',
  'lidarr': 'lidarr',
  'readarr': 'readarr',
  'prowlarr': 'prowlarr',
  'tautulli': 'tautulli',
  'ombi': 'ombi',
  'jackett': 'jackett',
  'filebrowser': 'filebrowser',
  'it-tools': 'it-tools',
  'hivision': 'hivision-idphotos',
  'openlist': 'openlist',
  'linkwarden': 'linkwarden',
  'n8n': 'n8n',
  'pipedream': 'pipedream',
  'zapier': 'zapier',
  'make': 'make',
  'integromat': 'integromat',
  'ifttt': 'ifttt',
  'nodered': 'node-red',
  'homeassistant': 'home-assistant',
  'iobroker': 'iobroker',
  'openwrt': 'openwrt',
  'tailscale': 'tailscale',
  'wireguard': 'wireguard',
  'zerotier': 'zerotier',
  'cloudflared': 'cloudflared',
  'alist': 'alist',
}

/**
 * 从 URL 中提取域名关键词
 */
function extractDomainKeyword(url) {
  try {
    if (!url.startsWith('http')) url = 'https://' + url
    const hostname = new URL(url).hostname
    // 移除 www. 前缀
    const domain = hostname.replace(/^www\./, '')
    return domain
  } catch (e) {
    return ''
  }
}

/**
 * 查找 dashboardicons 图标
 */
function findDashboardIcon(url) {
  const keyword = extractDomainKeyword(url).toLowerCase()
  if (!keyword) return null

  // 精确匹配
  if (DASHBOARD_ICON_MAP[keyword]) {
    return DASHBOARD_ICON_MAP[keyword]
  }

  // 部分匹配
  for (const [key, value] of Object.entries(DASHBOARD_ICON_MAP)) {
    if (keyword.includes(key) || key.includes(keyword)) {
      return value
    }
  }

  return null
}

/**
 * 获取网站图标 URL
 * 优先级：
 * 1. 手动设置的 iconUrl
 * 2. dashboardicons.com 本地图标（匹配最准，最快）
 * 3. unavatar.io（聚合多个源）
 * 4. DuckDuckGo（备用）
 * 
 * @param {string} url - 网站URL
 * @param {string} iconUrl - 手动设置的图标URL
 * @returns {string} 图标URL
 */
export function getIconUrl(url, iconUrl = '') {
  // 1. 优先用手动填的链接
  if (iconUrl) return iconUrl

  // 2. 尝试 dashboardicons 本地图标
  const dashboardIconName = findDashboardIcon(url)
  if (dashboardIconName) {
    // 优先用 SVG，更清晰
    return `https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/svg/${dashboardIconName}.svg`
  }

  // 3. 自动抓取：使用 unavatar.io（聚合多个源，自动回退）
  try {
    let domain = url
    if (!domain.startsWith('http')) domain = 'https://' + domain
    const hostname = new URL(domain).hostname
    
    // unavatar.io 会自动尝试多个源并回退
    return `https://unavatar.io/${hostname}`
    return `https://unavatar.io/${hostname}?fallback=false`
  } catch (e) {
    // 4. 最后的备用方案：DuckDuckGo
    try {
      let domain = url
      if (!domain.startsWith('http')) domain = 'https://' + domain
      const hostname = new URL(domain).hostname
      return `https://icons.duckduckgo.com/ip3/${hostname}.ico`
    } catch (e2) {
      return ''
    }
  }
}

/**
 * 获取 favicon URL（用于兼容性场景）
 */
export function getFaviconUrl(url) {
  try {
    let domain = url
    if (!domain.startsWith('http')) domain = 'https://' + domain
    const hostname = new URL(domain).hostname
    return `https://www.google.com/s2/favicons?domain=${hostname}&sz=128`
  } catch (e) {
    return ''
  }
}

/**
 * 检查图标是否可访问（异步检查）
 * 这个函数可以在后台使用，用于预加载和缓存
 */
export async function checkIconAvailable(iconUrl) {
  try {
    const response = await fetch(iconUrl, { method: 'HEAD', mode: 'no-cors' })
    return response.ok || response.type === 'opaque'
  } catch (e) {
    return false
  }
}

/**
 * 获取图标 URL 列表（用于备用）
 * @returns {string[]} 备用的图标URL列表
 */
export function getFallbackIconUrls(url) {
  const urls = []
  
  try {
    let domain = url
    if (!domain.startsWith('http')) domain = 'https://' + domain
    const hostname = new URL(domain).hostname
    
    // 按优先级添加
    urls.push(`https://unavatar.io/${hostname}`)
    urls.push(`https://icons.duckduckgo.com/ip3/${hostname}.ico`)
    urls.push(`https://www.google.com/s2/favicons?domain=${hostname}&sz=128`)
    urls.push(`https://ico.faviconkit.net/favicon/${hostname}`)
  } catch (e) {
    // ignore
  }
  
  return urls
}
