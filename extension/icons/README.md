# 扩展图标

## 需要的图标文件

请创建以下尺寸的 PNG 图标：

- `icon16.png` - 16x16 像素
- `icon48.png` - 48x48 像素
- `icon128.png` - 128x128 像素

## 临时解决方案

在测试期间，你可以：

1. 使用在线工具将 `icon.svg` 转换为 PNG
   - 访问：https://cloudconvert.com/svg-to-png
   - 上传 `icon.svg`
   - 分别转换为 16、48、128 像素的 PNG

2. 或者暂时注释掉 `manifest.json` 中的 `default_icon`

### 注释方法

```json
{
  "action": {
    "default_popup": "popup/popup.html"
    // "default_icon": {
    //   "16": "icons/icon16.png",
    //   "48": "icons/icon48.png",
    //   "128": "icons/icon128.png"
    // }
  }
}
```

## 图标设计建议

- 使用渐变紫色背景（#667eea → #764ba2）
- 中心是白色书签图标
- 保持简洁和识别度
