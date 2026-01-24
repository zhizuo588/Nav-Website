# P0 安全升级部署指南

## 📋 当前状态

✅ 代码已推送到 GitHub
✅ Cloudflare Pages 已自动部署
⚠️ **还需要执行数据库迁移**

---

## 🚀 后续操作步骤

### 步骤 1：执行数据库迁移（必须）

创建 `sessions` 表以支持新的会话管理系统。

#### 方法 A：通过 API 直接调用（推荐）

```bash
curl -X POST https://你的域名/api/_migrate-security \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer 你的管理员密码"
```

**预期响应：**
```json
{
  "success": true,
  "message": "安全升级迁移完成",
  "changes": [
    "✅ 已创建 sessions 表",
    "✅ 已创建 sessions 索引",
    "✅ sessions 表结构验证通过"
  ],
  "errors": [],
  "warnings": [
    "⚠️  所有用户需要重新登录以使用新的会话系统",
    "⚠️  旧的可预测 token (user_1, user_2...) 已不再有效"
  ]
}
```

#### 方法 B：通过 Cloudflare Dashboard

1. 访问 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 进入 **Workers & Pages** → **D1**
3. 选择你的数据库（`nav-website`）
4. 点击 **Console**
5. 执行以下 SQL：

```sql
-- 创建 sessions 表
CREATE TABLE IF NOT EXISTS sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_used_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_sessions_token_hash ON sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);
```

---

### 步骤 2：验证迁移成功

#### 检查 sessions 表是否创建

在 Cloudflare D1 Console 执行：

```sql
-- 查看表结构
SELECT sql FROM sqlite_master WHERE type='table' AND name='sessions';

-- 查看索引
SELECT name FROM sqlite_master WHERE type='index' AND tbl_name='sessions';
```

**预期结果：**
- sessions 表存在
- 有 3 个索引（token_hash, user_id, expires_at）

---

### 步骤 3：测试新功能

#### 3.1 测试注册（新用户）

```bash
curl -X POST https://你的域名/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "test123456"
  }'
```

**预期响应：**
```json
{
  "success": true,
  "message": "注册成功",
  "token": "a1b2c3d4e5f6...（64字符随机字符串）",
  "userId": 1,
  "username": "testuser"
}
```

#### 3.2 测试登录（旧用户自动升级密码）

```bash
curl -X POST https://你的域名/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "你的用户名",
    "password": "你的密码"
  }'
```

**预期响应：**
```json
{
  "success": true,
  "message": "登录成功（密码安全已升级）",
  "token": "新的随机token",
  "userId": 123,
  "username": "你的用户名",
  "passwordUpgraded": true
}
```

#### 3.3 测试登出

```bash
curl -X POST https://你的域名/api/auth/logout \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer 你的token"
```

#### 3.4 测试同步接口（验证 userId 参数已禁用）

```bash
# ❌ 这个应该失败（401）
curl "https://你的域名/api/sync/read?userId=user_1"

# ✅ 这个应该成功（需要有效 token）
curl "https://你的域名/api/sync/read" \
  -H "Authorization: Bearer 你的token"
```

---

### 步骤 4：前端适配（如需登出功能）

如果前端需要添加登出按钮，在 `src/App.vue` 中添加：

```javascript
// 登出函数
async function logout() {
  const token = localStorage.getItem('userToken')

  if (token) {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })
    } catch (error) {
      console.error('登出失败:', error)
    }
  }

  // 清除本地存储
  localStorage.removeItem('userToken')
  localStorage.removeItem('currentUser')
  localStorage.removeItem('adminPassword')
  localStorage.removeItem('adminPasswordTimestamp')

  // 刷新页面
  window.location.reload()
}
```

---

### 步骤 5：通知用户重新登录

由于旧的 token 格式（`user_1`, `user_2`）不再有效，所有用户需要重新登录。

**建议在登录页面添加公告：**

```
📢 安全升级通知

为了提升账号安全性，我们已完成以下升级：
• 密码加密升级（PBKDF2）
• 会话管理系统
• 随机安全令牌

所有用户需要重新登录，首次登录时会自动升级密码安全。

感谢您的理解与支持！
```

---

## 🔒 安全验证清单

- [ ] sessions 表已创建
- [ ] 注册接口返回随机 64 字符 token
- [ ] 登录接口自动升级旧密码哈希
- [ ] 登出接口能撤销会话
- [ ] 同步接口不再接受 `?userId=` 参数
- [ ] 写接口（add）需要有效 token
- [ ] 旧的可预测 token 失效

---

## 📊 性能监控

### PBKDF2 登录耗时参考

- 100,000 次迭代：约 100-200ms
- 如果觉得太慢，可以在 `_middleware.js` 中调整迭代次数：

```javascript
// 修改这个值（默认 100000）
const iterations = 100000  // 可改为 50000 加快速度
```

### 会话清理（可选优化）

可以创建 Cloudflare Cron Trigger 定期清理过期会话：

```javascript
// functions/api/_cron-clean-sessions.js
export async function onRequest(context) {
  const { env } = context

  const result = await env.DB.prepare(`
    DELETE FROM sessions WHERE expires_at <= datetime('now')
  `).run()

  return new Response(`清理了 ${result.meta.changes} 个过期会话`)
}
```

在 Cloudflare Dashboard 设置 Cron 触发器：
```
cron: 0 0 * * *  # 每天凌晨执行
```

---

## 🐛 故障排查

### 问题 1：迁移接口返回 401

**原因：** 管理员密码未配置或错误

**解决：**
```bash
# 设置环境变量（如果需要）
# 在 Cloudflare Pages Settings → Environment Variables 添加：
# ADMIN_PASSWORD = 你的管理员密码
```

### 问题 2：登录后仍然提示未授权

**原因：** 前端仍在使用旧 token

**解决：**
```javascript
// 清除本地存储
localStorage.clear()
// 重新登录
```

### 问题 3：同步接口报错

**原因：** 未执行数据库迁移

**解决：** 重新执行步骤 1 的迁移脚本

---

## 📚 相关文档

- [安全升级实施计划](./docs/plans/2026-01-24-p0-security-upgrade.md)
- [Cloudflare D1 文档](https://developers.cloudflare.com/d1/)
- [Cloudflare Pages Functions 文档](https://developers.cloudflare.com/pages/functions/)

---

## ⚠️ 重要提醒

1. **备份数据库**：执行迁移前建议备份 D1 数据
2. **测试环境验证**：先在测试环境验证，再部署生产
3. **用户通知**：提前通知用户需要重新登录
4. **监控日志**：部署后监控 Cloudflare Logs，检查错误

---

## 🎉 完成后效果

- ✅ 密码使用 PBKDF2 安全哈希
- ✅ 会话 30 天自动过期
- ✅ 支持登出撤销会话
- ✅ Token 不可预测（256 位随机）
- ✅ 所有写接口需要鉴权
- ✅ 同步接口不再有 userId 参数漏洞
