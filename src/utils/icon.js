/**
 * 图标工具函数
 * 提供多种图标获取方案，解决无法访问 Google 的问题
 */

// dashboardicons 图标映射表（常用网站）
const DASHBOARD_ICON_MAP = {
  // 常用网站
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
  
  // 云服务
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
  
  // 开发工具
  'docker': 'docker',
  'kubernetes': 'kubernetes',
  'vuejs': 'vue-js',
  'reactjs': 'react',
  'nextjs': 'nextjs',
  'tailwindcss': 'tailwindcss',
  'typescript': 'typescript',
  'javascript': 'js',
  'nodejs': 'nodejs',
  
  // AI 工具
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
  'felo': 'felo',
  
  // 开发效率工具
  'linear': 'linear',
  'loom': 'loom',
  'cal.com': 'cal',
  'obsidian': 'obsidian',
  'raycast': 'raycast',
  'alfred': 'alfred',
  'popclip': 'popclip',
  'arc': 'arc',
  
  // 浏览器
  'brave': 'brave',
  'chrome': 'google-chrome',
  'firefox': 'firefox',
  'safari': 'safari',
  'edge': 'microsoft-edge',
  
  // 密码管理
  '1password': '1password',
  'bitwarden': 'bitwarden',
  'lastpass': 'lastpass',
  'dashlane': 'dashlane',
  'keepass': 'keepass',
  
  // 监控
  'sentry': 'sentry',
  'datadog': 'datadog',
  'newrelic': 'new-relic',
  'grafana': 'grafana',
  'prometheus': 'prometheus',
  'uptimerobot': 'uptime-robot',
  
  // CI/CD
  'jenkins': 'jenkins',
  'gitlab-ci': 'gitlab-ci',
  'travis-ci': 'travis-ci',
  'circleci': 'circleci',
  'github-actions': 'github-actions',
  
  // 部署平台
  'railway': 'railway',
  'render': 'render',
  'flyio': 'fly',
  'koyeb': 'koyeb',
  'zeabur': 'zeabur',
  'wispbyte': 'wisp',
  'clever-cloud': 'clever-cloud',
  'fly': 'fly',
  
  // 数据库
  'supabase': 'supabase',
  'planetscale': 'planetscale',
  'mongodb': 'mongodb',
  'redis': 'redis',
  'postgresql': 'postgresql',
  'mysql': 'mysql',
  
  // ORM
  'prisma': 'prisma',
  'drizzle': 'drizzle',
  'sequelize': 'sequelize',
  'typeorm': 'typeorm',
  
  // 服务器
  'nginx': 'nginx',
  'apache': 'apache',
  'caddy': 'caddy',
  'traefik': 'traefik',
  
  // 自托管
  'portainer': 'portainer',
  'uptime-kuma': 'uptime-kuma',
  'dozzle': 'dozzle',
  'gotify': 'gotify',
  'searxng': 'searxng',
  'homarr': 'homarr',
  'adguard': 'adguard',
  'pi-hole': 'pi-hole',
  'mailcow': 'mailcow',
  'stirling-pdf': 'stirling-pdf',
  'changedetection': 'changedetection',
  
  // 下载
  'qbittorrent': 'qbittorrent',
  
  // 媒体
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
  
  // 文件管理
  'filebrowser': 'filebrowser',
  'it-tools': 'it-tools',
  'hivision': 'hivision-idphotos',
  'openlist': 'openlist',
  'linkwarden': 'linkwarden',
  'alist': 'alist',
  
  // 自动化
  'n8n': 'n8n',
  'pipedream': 'pipedream',
  'zapier': 'zapier',
  'make': 'make',
  'integromat': 'integromat',
  'ifttt': 'ifttt',
  'nodered': 'node-red',
  
  // 智能家居
  'homeassistant': 'home-assistant',
  'iobroker': 'iobroker',
  
  // 网络
  'openwrt': 'openwrt',
  'tailscale': 'tailscale',
  'wireguard': 'wireguard',
  'zerotier': 'zerotier',
  'cloudflared': 'cloudflared',
  
  // 图标/字体
  'fontawesome': 'font-awesome',
  'fontawesome.com': 'font-awesome',
  
  // IP 查询
  'ip.sb': 'ip',
  'www.ghxi.com': 'ip',
  'ip111.cn': 'ip',
  'iplark.com': 'ip',
  'ipjiance.com': 'ip',
  'scamalytics.com': 'ip',
  'ipdata.co': 'ip',
  
  // 域名
  'gname.vip': 'domain',
  'www.idc.lc': 'domain',
  'domain.nodeloc.com': 'domain',
  'nic.ua': 'domain',
  'nic.zle.ee': 'domain',
  'freedidi.com': 'domain',
  'svgtopng.com': 'image',
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

  // 1. 精确匹配完整域名
  if (DASHBOARD_ICON_MAP[keyword]) {
    return DASHBOARD_ICON_MAP[keyword]
  }

  // 2. 精确匹配（去掉 com/net/org 等后缀）
  const parts = keyword.split('.')
  if (parts.length >= 2) {
    const mainPart = parts[0] // 如 github, huggingface 等
    if (DASHBOARD_ICON_MAP[mainPart]) {
      return DASHBOARD_ICON_MAP[mainPart]
    }
  }

  // 3. 部分匹配（检查关键词是否包含映射的 key）
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
 */
export function getFallbackIconUrls(url) {
  const urls = []
  
  try {
    let domain = url
    if (!domain.startsWith('http')) domain = 'https://' + domain
    const hostname = new URL(domain).hostname
    
    urls.push(`https://unavatar.io/${hostname}`)
    urls.push(`https://icons.duckduckgo.com/ip3/${hostname}.ico`)
    urls.push(`https://www.google.com/s2/favicons?domain=${hostname}&sz=128`)
    urls.push(`https://ico.faviconkit.net/favicon/${hostname}`)
  } catch (e) {
    // ignore
  }
  
  return urls
}
