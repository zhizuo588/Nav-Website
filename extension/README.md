# 导航网站收藏助手 - Edge 浏览器扩展

这是一个浏览器扩展，让你可以快速收藏网站到你的导航网站，并支持从浏览器书签批量导入。

## 功能特性

- 📌 右键菜单快速收藏当前页面
- 📚 从浏览器书签批量导入到导航网站
- ⚙️ 可配置同步 ID 和 API 地址
- 🔔 收藏成功/失败通知

## 安装方法

### 开发者模式安装（推荐用于测试）

1. 打开 Edge 浏览器
2. 访问 `edge://extensions/`
3. 开启右上角的"开发者模式"
4. 点击"加载已解压的扩展"
5. 选择这个 `extension` 文件夹

## 配置步骤

### 1. 获取同步 ID

在你的导航网站中：
1. 点击左上角的云同步图标
2. 复制显示的同步 ID（格式：`device_xxxxxxxxxxxxxxx`）

### 2. 配置扩展

1. 点击扩展图标
2. 点击"设置"按钮
3. 输入同步 ID
4. API 地址保持默认（`http://localhost:5173/api/sync/save`）
5. 点击"测试连接"验证配置
6. 点击"保存设置"

## 使用方法

### 收藏当前页面

**方法 1：右键菜单**
1. 在任意网页上右键
2. 选择"📌 收藏到导航网站" → "快速收藏"

**方法 2：扩展弹窗**
1. 点击扩展图标
2. 点击"收藏当前页面"

### 导入浏览器书签

1. 点击扩展图标
2. 点击"导入浏览器书签"
3. 选择要导入的书签（支持文件夹全选）
4. 点击"导入选中书签"

## 文件结构

```
extension/
├── manifest.json          # 扩展配置
├── background.js          # 后台脚本（右键菜单）
├── popup/                # 弹窗页面
│   ├── popup.html
│   ├── popup.js
│   └── popup.css
├── options/              # 设置页面
│   ├── options.html
│   ├── options.js
│   └── options.css
└── bookmarks/            # 书签导入
    ├── bookmarks.html
    ├── bookmarks.js
    └── bookmarks.css
```

## API 集成

扩展会调用以下 API 端点：

- `POST /api/sync/save` - 保存收藏数据
- `GET /api/sync/read` - 读取现有数据（测试连接）

请求格式：
```json
{
  "favorites": [
    {
      "id": "唯一ID",
      "name": "网站名称",
      "url": "https://example.com",
      "desc": "网站描述",
      "iconUrl": "图标URL",
      "category": "分类"
    }
  ],
  "append": true  // 追加模式
}
```

## 开发说明

### 修改 API 地址

如果你部署到生产环境，需要修改：
1. `manifest.json` 中的 `host_permissions`
2. 设置页面中的默认 API 地址

### 自定义图标

替换 `icons/` 文件夹中的图标文件：
- `icon16.png` - 16x16 像素
- `icon48.png` - 48x48 像素
- `icon128.png` - 128x128 像素

## 权限说明

扩展需要以下权限：
- `storage` - 存储配置信息
- `contextMenus` - 右键菜单
- `activeTab` - 访问当前标签页
- `bookmarks` - 读取浏览器书签
- `notifications` - 显示通知

## 故障排查

### 收藏失败
1. 检查同步 ID 是否正确
2. 确认导航网站正在运行
3. 查看浏览器控制台是否有错误

### 无法加载书签
1. 确认已授予书签权限
2. 检查浏览器设置中是否允许扩展访问书签

## 注意事项

- 本地开发时，确保导航网站在 `http://localhost:5173` 运行
- 生产环境需要修改 API 地址为你的部署地址
- 同步 ID 可以在多设备间共享，实现数据同步
