# Nav Start Page

一个轻量级、响应式的个人导航网站，基于 Vue 3 + Tailwind CSS 开发，采用 Glassmorphism 毛玻璃设计风格。

## 功能特性

- 🎨 Glassmorphism 毛玻璃 UI 设计
- 🔍 多搜索引擎支持（Google、Bing、Baidu、GitHub）
- 📂 分类导航（云服务、开发工具、设计、AI 工具、娱乐等）
- 📱 完全响应式设计，适配移动端
- ⚡ Vue 3 + Vite 快速构建
- 💾 纯前端，无需后端
- 🚀 可直接部署到 Cloudflare Pages

## 技术栈

- Vue 3 (Composition API + Script Setup)
- Vite
- Tailwind CSS
- Lucide Vue Next (图标库)

## 快速开始

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run dev
```

### 构建生产版本

```bash
npm run build
```

## 自定义数据

编辑 `src/data.js` 文件来自定义你的导航链接：

```javascript
export const navItems = [
  {
    category: 'cloud',
    items: [
      {
        id: 1,
        name: 'GitHub',
        url: 'https://github.com',
        icon: 'github',
        desc: '代码托管'
      }
    ]
  }
]
```

支持的图标来自 [Lucide Icons](https://lucide.dev/icons/)，使用图标名称即可。

## 部署到 Cloudflare Pages

1. 在 Cloudflare Pages 创建新项目
2. 连接你的 Git 仓库
3. 构建配置：
   - **构建命令**: `npm run build`
   - **输出目录**: `dist`
4. 点击部署

## 项目结构

```
nav-start-page/
├── public/
├── src/
│   ├── components/
│   │   └── NavCard.vue       # 卡片组件
│   ├── App.vue               # 主应用
│   ├── data.js               # 数据文件
│   ├── main.js               # 入口文件
│   └── style.css             # 样式文件
├── index.html
├── package.json
├── tailwind.config.js
├── vite.config.js
└── postcss.config.js
```

## License

MIT
