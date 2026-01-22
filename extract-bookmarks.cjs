/**
 * Edge 浏览器书签提取脚本
 * 从 Edge 的 Bookmarks 文件中提取书签并转换为目标格式
 */

const fs = require('fs');
const path = require('path');

// Edge 书签文件路径（自动适配 WSL2 和 Windows）
const isWSL = require('os').platform() === 'linux' && require('fs').existsSync('/mnt/c');
const bookmarksPath = isWSL
  ? '/mnt/c/Users/north/AppData/Local/Microsoft/Edge/User Data/Profile 2/Bookmarks'
  : 'C:\\Users\\north\\AppData\\Local\\Microsoft\\Edge\\User Data\\Profile 2\\Bookmarks';

// 输出目录（自动适配 WSL2 和 Windows）
const outputPath = isWSL
  ? '/mnt/e/ClaudeWork/extracted-bookmarks.js'
  : 'E:\\ClaudeWork\\extracted-bookmarks.js';

// 图标映射 - 根据网站名称自动推荐图标
const iconMap = {
  'github': { icon: 'github', desc: '代码托管' },
  'google': { icon: 'search', desc: '搜索引擎' },
  'stackoverflow': { icon: 'code', desc: '技术问答' },
  'youtube': { icon: 'play', desc: '视频平台' },
  'twitter': { icon: 'twitter', desc: '社交平台' },
  'facebook': { icon: 'facebook', desc: '社交平台' },
  'linkedin': { icon: 'linkedin', desc: '职业社交' },
  'reddit': { icon: 'message-circle', desc: '社区论坛' },
  'figma': { icon: 'pen-tool', desc: '设计工具' },
  'notion': { icon: 'file-text', desc: '笔记工具' },
  'chatgpt': { icon: 'sparkles', desc: 'AI 助手' },
  'claude': { icon: 'cpu', desc: 'AI 对话' },
  'bilibili': { icon: 'tv', desc: '视频网站' },
  'netflix': { icon: 'film', desc: '流媒体' },
  'spotify': { icon: 'music', desc: '音乐平台' },
  'amazon': { icon: 'shopping-cart', desc: '购物平台' },
  'docker': { icon: 'box', desc: '容器平台' },
  'vercel': { icon: 'triangle', desc: '部署平台' },
  'mdn': { icon: 'book', desc: '开发文档' },
  'vue': { icon: 'code', desc: '前端框架' },
  'react': { icon: 'atom', desc: '前端框架' },
  'angular': { icon: 'shield', desc: '前端框架' },
  'tailwind': { icon: 'wind', desc: 'CSS 框架' },
  'font': { icon: 'type', desc: '字体' },
  'icon': { icon: 'icons', desc: '图标' },
  'image': { icon: 'image', desc: '图片' },
  'photo': { icon: 'camera', desc: '照片' },
  'video': { icon: 'video', desc: '视频' },
  'music': { icon: 'music', desc: '音乐' },
  'mail': { icon: 'mail', desc: '邮箱' },
  'cloud': { icon: 'cloud', desc: '云服务' },
  'drive': { icon: 'hard-drive', desc: '云存储' },
  'docs': { icon: 'file-text', desc: '文档' },
  'calendar': { icon: 'calendar', desc: '日历' },
  'map': { icon: 'map', desc: '地图' },
  'news': { icon: 'newspaper', desc: '新闻' },
  'blog': { icon: 'book-open', desc: '博客' },
  'shop': { icon: 'shopping-bag', desc: '购物' },
};

/**
 * 从 URL 或名称中提取关键词并匹配图标
 */
function guessIcon(url, name) {
  const lowerUrl = url.toLowerCase();
  const lowerName = name.toLowerCase();

  // 遍历图标映射
  for (const [keyword, info] of Object.entries(iconMap)) {
    if (lowerUrl.includes(keyword) || lowerName.includes(keyword)) {
      return info;
    }
  }

  // 默认图标和描述
  return { icon: 'link', desc: '常用网站' };
}

/**
 * 递归遍历书签节点
 */
function traverseBookmarks(node, results = []) {
  if (!node) return results;

  // 如果是书签项
  if (node.type === 'url' && node.url && node.name) {
    const iconInfo = guessIcon(node.url, node.name);

    results.push({
      id: results.length + 1,
      name: node.name,
      url: node.url,
      icon: iconInfo.icon,
      desc: iconInfo.desc
    });
  }

  // 如果是文件夹，递归处理子项
  if (node.type === 'folder' && node.children) {
    node.children.forEach(child => traverseBookmarks(child, results));
  }

  return results;
}

/**
 * 从 Edge 书签文件中提取所有书签
 */
function extractBookmarks() {
  try {
    // 检查书签文件是否存在
    if (!fs.existsSync(bookmarksPath)) {
      console.error(`错误：找不到书签文件: ${bookmarksPath}`);
      console.log('请确认以下路径是否正确：');
      console.log('1. Edge 浏览器是否已安装');
      console.log('2. Profile 2 是否存在（可能是 Default 或其他 Profile）');
      console.log('\n你可以尝试以下路径：');
      console.log('  - Default Profile: C:\\Users\\north\\AppData\\Local\\Microsoft\\Edge\\User Data\\Default\\Bookmarks');
      console.log('  - Profile 1: C:\\Users\\north\\AppData\\Local\\Microsoft\\Edge\\User Data\\Profile 1\\Bookmarks');
      return;
    }

    // 读取书签文件
    console.log('正在读取书签文件...');
    const bookmarksData = fs.readFileSync(bookmarksPath, 'utf-8');
    const bookmarks = JSON.parse(bookmarksData);

    // 提取所有书签
    const allBookmarks = [];

    // 从各个根目录提取书签
    if (bookmarks.roots) {
      const roots = ['bookmark_bar', 'other', 'synced'];
      roots.forEach(rootKey => {
        if (bookmarks.roots[rootKey]) {
          traverseBookmarks(bookmarks.roots[rootKey], allBookmarks);
        }
      });
    }

    console.log(`共提取 ${allBookmarks.length} 个书签`);

    // 按分类组织书签
    const categorizedBookmarks = {
      '我的服务': [],
      '云服务': [],
      '开发工具': [],
      '设计工具': [],
      'AI工具': [],
      '娱乐': [],
      '其他': []
    };

    // 根据关键词分类
    allBookmarks.forEach(bookmark => {
      const lowerUrl = bookmark.url.toLowerCase();
      const lowerName = bookmark.name.toLowerCase();

      if (lowerUrl.includes('localhost') || lowerUrl.includes('192.168') || lowerUrl.includes('jishu.de5.net')) {
        categorizedBookmarks['我的服务'].push(bookmark);
      } else if (lowerUrl.includes('cloudflare') || lowerUrl.includes('vercel') || lowerUrl.includes('aws') || lowerUrl.includes('azure')) {
        categorizedBookmarks['云服务'].push(bookmark);
      } else if (lowerUrl.includes('github') || lowerUrl.includes('stackoverflow') || lowerUrl.includes('mdn') || lowerUrl.includes('vue') || lowerUrl.includes('react')) {
        categorizedBookmarks['开发工具'].push(bookmark);
      } else if (lowerUrl.includes('figma') || lowerUrl.includes('dribbble') || lowerUrl.includes('unsplash') || lowerUrl.includes('font')) {
        categorizedBookmarks['设计工具'].push(bookmark);
      } else if (lowerUrl.includes('chatgpt') || lowerUrl.includes('claude') || lowerUrl.includes('openai') || lowerUrl.includes('huggingface')) {
        categorizedBookmarks['AI工具'].push(bookmark);
      } else if (lowerUrl.includes('youtube') || lowerUrl.includes('netflix') || lowerUrl.includes('bilibili') || lowerUrl.includes('spotify')) {
        categorizedBookmarks['娱乐'].push(bookmark);
      } else {
        categorizedBookmarks['其他'].push(bookmark);
      }
    });

    // 生成输出内容
    let output = '/**\n * 从 Edge 浏览器提取的书签\n * 提取时间: ' + new Date().toLocaleString('zh-CN') + '\n */\n\n';
    output += 'export const extractedBookmarks = [\n';

    Object.entries(categorizedBookmarks).forEach(([category, items]) => {
      if (items.length > 0) {
        output += `  {\n    category: '${category}',\n    items: [\n`;
        items.forEach(item => {
          output += `      {\n`;
          output += `        id: ${item.id},\n`;
          output += `        name: '${item.name.replace(/'/g, "\\'")}',\n`;
          output += `        url: '${item.url}',\n`;
          output += `        icon: '${item.icon}',\n`;
          output += `        desc: '${item.desc}'\n`;
          output += `      },\n`;
        });
        output += '    ]\n  },\n';
      }
    });

    output += ']\n';

    // 确保输出目录存在
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // 写入文件
    fs.writeFileSync(outputPath, output, 'utf-8');
    console.log(`\n✅ 书签已成功导出到: ${outputPath}`);

    // 输出统计信息
    console.log('\n📊 分类统计:');
    Object.entries(categorizedBookmarks).forEach(([category, items]) => {
      if (items.length > 0) {
        console.log(`  ${category}: ${items.length} 个书签`);
      }
    });

  } catch (error) {
    console.error('提取书签时出错:', error.message);
    if (error.code === 'EBUSY') {
      console.log('\n提示：请关闭 Edge 浏览器后再运行此脚本（Edge 运行时会锁定书签文件）');
    }
  }
}

// 运行提取
extractBookmarks();
