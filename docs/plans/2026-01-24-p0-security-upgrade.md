# 安全与鉴权升级实施计划（P0）

**日期**：2026-01-24
**优先级**：P0 - 关键安全修复
**目标**：杜绝可预测 token、提升密码安全、统一写接口权限

---

## 一、当前安全问题分析

### 1.1 密码哈希问题（严重）

**问题代码**：
- `functions/api/auth/register.js:76-83` - 使用 SHA-256 无 salt
- `functions/api/auth/login.js:60-68` - 使用 SHA-256 无 salt

**风险**：
- SHA-256 哈希容易通过彩虹表攻击破解
- 没有 salt 使得相同密码产生相同哈希
- 不符合 OWASP 密码存储最佳实践

**示例**：
```javascript
// ❌ 当前实现（不安全）
async function hashPassword(password) {
  const data = new TextEncoder().encode(password)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0')).join('')
}
// "password123" 总是生成 "ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f"
```

---

### 1.2 Token 安全问题（严重）

**问题代码**：
- `functions/api/auth/register.js:56` - `token = 'user_${userId}'`
- `functions/api/auth/login.js:44` - `token = 'user_${user.id}'`

**风险**：
- Token 完全可预测：user_1, user_2, user_3...
- 攻击者可以枚举所有用户 ID 获取数据
- 没有过期时间，永久有效
- 没有撤销机制，无法强制登出

**示例攻击**：
```javascript
// 攻击者脚本
for (let i = 1; i <= 1000; i++) {
  const token = `user_${i}`
  fetch('/api/sync/read', {
    headers: { 'Authorization': `Bearer ${token}` }
  }).then(r => r.json()).then(data => {
    console.log(`User ${i} data:`, data)
  })
}
```

---

### 1.3 同步接口鉴权问题

**问题代码**：
- `functions/api/sync/read.js:51-54` - 接受 `?userId=` 查询参数
- `worker/index.js:149-152` - 接受 `?userId=` 查询参数

**风险**：
- 任何人都可以通过 `?userId=user_1` 读取用户数据
- 绕过了 Authorization Bearer token 检查

---

### 1.4 写接口鉴权缺失

**问题代码**：
- `functions/api/websites/add.js` - 没有任何鉴权检查
- 其他写接口可能也存在同样问题

**风险**：
- 任何人都可以添加、修改、删除网站数据
- 未授权用户可以破坏数据完整性

---

## 二、解决方案设计

### 2.1 密码哈希升级 - PBKDF2

**选择理由**：
- PBKDF2 是 Web Crypto API 原生支持
- NIST 推荐，经过充分验证
- 可调节迭代次数以应对硬件性能提升

**实施细节**：
```javascript
// ✅ 安全实现
async function hashPassword(password, salt = null) {
  // 生成随机 salt（16 字节）
  if (!salt) {
    salt = crypto.getRandomValues(new Uint8Array(16))
  }

  // 将密码编码
  const encoder = new TextEncoder()
  const passwordBuffer = encoder.encode(password)

  // 使用 PBKDF2 派生密钥
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    'PBKDF2',
    false,
    ['deriveBits']
  )

  // 100,000 次迭代（2024年推荐值）
  const iterations = 100000
  const hashBuffer = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: iterations,
      hash: 'SHA-256'
    },
    keyMaterial,
    256
  )

  // 返回格式：salt:hash（都使用 hex 编码）
  const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('')
  const hashHex = Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0')).join('')

  return `${saltHex}:${hashHex}`
}

async function verifyPassword(password, storedHash) {
  const [saltHex, hashHex] = storedHash.split(':')
  const salt = new Uint8Array(saltHex.match(/.{2}/g).map(b => parseInt(b, 16)))
  const computedHash = await hashPassword(password, salt)
  return computedHash === storedHash
}
```

**迁移策略**：
- **选项 A**：强制所有用户重置密码（最安全）
- **选项 B**：首次登录时自动升级哈希（更用户友好）

我们选择**选项 B**，实现逻辑：
```javascript
// 登录时检测旧哈希格式
if (!user.password_hash.includes(':')) {
  // 旧格式（SHA-256），验证后自动升级
  const oldHash = await hashPasswordOld(password)
  if (oldHash === user.password_hash) {
    // 验证成功，生成新哈希并保存
    const newHash = await hashPassword(password)
    await env.DB.prepare(
      'UPDATE users SET password_hash = ? WHERE id = ?'
    ).bind(newHash, user.id).run()
  }
}
```

---

### 2.2 Token 安全升级 - 随机会话令牌

**设计**：
1. **Token 格式**：`<random_bytes>`（32 字节 = 256 位）
2. **存储方案**：新增 `sessions` 表
3. **过期时间**：30 天
4. **撤销机制**：登出时删除 session

#### 数据库 Schema 变更

```sql
-- 新增会话表
CREATE TABLE IF NOT EXISTS sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,  -- token 的 SHA-256 哈希
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_used_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_sessions_token_hash ON sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);
```

#### Token 生成函数

```javascript
// 生成安全随机会话令牌
async function generateSessionToken() {
  // 生成 32 字节随机数据（256 位）
  const randomBytes = crypto.getRandomValues(new Uint8Array(32))

  // 转换为 hex 字符串（64 字符）
  const token = Array.from(randomBytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')

  return token
}

// 计算令牌哈希（用于存储）
async function hashToken(token) {
  const encoder = new TextEncoder()
  const data = encoder.encode(token)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

// 创建会话
async function createSession(env, userId) {
  const token = await generateSessionToken()
  const tokenHash = await hashToken(token)

  // 30 天后过期
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 30)

  await env.DB.prepare(`
    INSERT INTO sessions (user_id, token_hash, expires_at)
    VALUES (?, ?, ?)
  `).bind(userId, tokenHash, expiresAt.toISOString()).run()

  return token
}

// 验证会话并返回用户信息
async function validateSession(env, token) {
  const tokenHash = await hashToken(token)

  const session = await env.DB.prepare(`
    SELECT s.user_id, s.expires_at, u.id, u.username
    FROM sessions s
    JOIN users u ON s.user_id = u.id
    WHERE s.token_hash = ?
      AND s.expires_at > datetime('now')
    ORDER BY s.last_used_at DESC
    LIMIT 1
  `).bind(tokenHash).first()

  if (!session) {
    return null
  }

  // 更新最后使用时间
  await env.DB.prepare(`
    UPDATE sessions SET last_used_at = datetime('now')
    WHERE token_hash = ?
  `).bind(tokenHash).run()

  return session
}

// 撤销会话（登出）
async function revokeSession(env, token) {
  const tokenHash = await hashToken(token)

  await env.DB.prepare(`
    DELETE FROM sessions WHERE token_hash = ?
  `).bind(tokenHash).run()
}

// 清理过期会话（定期任务）
async function cleanExpiredSessions(env) {
  await env.DB.prepare(`
    DELETE FROM sessions WHERE expires_at <= datetime('now')
  `).run()
}
```

#### 修改登录/注册接口

```javascript
// 登录成功后
const token = await createSession(env, user.id)

return jsonResponse({
  success: true,
  message: '登录成功',
  token: token,  // 返回随机 token
  userId: user.id,
  username: user.username
})
```

---

### 2.3 同步接口鉴权修复

**修改文件**：
- `functions/api/sync/read.js`
- `worker/index.js`

**修改内容**：

```javascript
// ❌ 移除这段代码
const url = new URL(request.url)
const userId = url.searchParams.get('userId')
if (userId) return userId

// ✅ 只保留 Authorization Bearer token 验证
function getUserIdFromRequest(request) {
  const authHeader = request.headers.get('Authorization')
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7)
  }
  return null
}

// 更新为使用会话验证
async function getUserFromRequest(request, env) {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }

  const token = authHeader.substring(7)
  return await validateSession(env, token)
}
```

---

### 2.4 写接口统一鉴权

**需要添加鉴权的接口**：
- `functions/api/websites/add.js`
- `functions/api/websites/update.js`
- `functions/api/websites/delete.js`
- `functions/api/websites/batch-import.js`
- `functions/api/categories/create.js`
- `functions/api/categories/rename.js`
- `functions/api/categories/delete.js`

**实现方案**：

#### 创建公共鉴权中间件

`functions/api/_middleware.js`:
```javascript
// 验证会话并返回用户信息
export async function authenticateRequest(request, env) {
  const authHeader = request.headers.get('Authorization')

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }

  const token = authHeader.substring(7)

  // 计算令牌哈希
  const encoder = new TextEncoder()
  const data = encoder.encode(token)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const tokenHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

  // 查询会话
  const session = await env.DB.prepare(`
    SELECT s.user_id, s.expires_at, u.id, u.username
    FROM sessions s
    JOIN users u ON s.user_id = u.id
    WHERE s.token_hash = ?
      AND s.expires_at > datetime('now')
  `).bind(tokenHash).first()

  if (!session) {
    return null
  }

  // 更新最后使用时间
  await env.DB.prepare(`
    UPDATE sessions SET last_used_at = datetime('now')
    WHERE token_hash = ?
  `).bind(tokenHash).run()

  return session
}

export function unauthorizedResponse(message = '未授权') {
  return new Response(JSON.stringify({ error: message }), {
    status: 401,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  })
}
```

#### 修改 add.js（示例）

```javascript
import { authenticateRequest, unauthorizedResponse } from '../_middleware.js'

export async function onRequest(context) {
  const { request, env } = context

  // CORS 预检
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    })
  }

  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405)
  }

  // ✅ 添加鉴权检查
  const user = await authenticateRequest(request, env)
  if (!user) {
    return unauthorizedResponse()
  }

  // ... 原有业务逻辑
}
```

---

## 三、数据库迁移脚本

创建新的迁移文件：`functions/api/_migrate.js`

```javascript
// 执行安全升级的数据库迁移
export async function onRequest(context) {
  const { request, env } = context

  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405)
  }

  try {
    // 验证管理员密码
    // ...（复用现有管理员验证逻辑）

    // 1. 创建 sessions 表
    await env.DB.exec(`
      CREATE TABLE IF NOT EXISTS sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        token_hash TEXT NOT NULL UNIQUE,
        expires_at DATETIME NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_used_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_sessions_token_hash ON sessions(token_hash);
      CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
      CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);
    `)

    // 2. 清理所有旧 token（强制用户重新登录）
    console.log('⚠️  所有用户需要重新登录')

    return jsonResponse({
      success: true,
      message: '安全升级完成',
      changes: [
        '✅ 已创建 sessions 表',
        '⚠️  所有用户需要重新登录'
      ]
    })
  } catch (error) {
    return jsonResponse({ error: error.message }, 500)
  }
}
```

---

## 四、前端适配

### 4.1 登录逻辑调整

无需修改！前端继续使用相同的方式存储和发送 token：
```javascript
// 存储到 localStorage
localStorage.setItem('userToken', token)

// 发送请求时携带
headers: {
  'Authorization': `Bearer ${token}`
}
```

### 4.2 登出逻辑实现

新增登出接口调用：

```javascript
// 登出功能
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

## 五、实施步骤

### 阶段 1：准备工作
1. ✅ 分析当前安全问题
2. ⬜ 创建公共鉴权中间件 (`_middleware.js`)
3. ⬜ 创建数据库迁移脚本

### 阶段 2：密码哈希升级
4. ⬜ 实现 PBKDF2 哈希函数
5. ⬜ 修改 `register.js` 使用新哈希
6. ⬜ 修改 `login.js` 支持旧哈希验证并自动升级
7. ⬜ 测试注册和登录功能

### 阶段 3：会话管理系统
8. ⬜ 执行数据库迁移（创建 sessions 表）
9. ⬜ 实现会话管理函数
10. ⬜ 修改 `login.js` 返回随机 token
11. ⬜ 新增 `logout.js` 接口
12. ⬜ 测试登录和登出流程

### 阶段 4：接口鉴权修复
13. ⬜ 修改 `sync/read.js` 移除 userId 查询参数
14. ⬜ 修改 `worker/index.js` 移除 userId 查询参数
15. ⬜ 为所有写接口添加鉴权检查
16. ⬜ 测试所有接口的鉴权

### 阶段 5：前端适配和测试
17. ⬜ 实现前端登出功能
18. ⬜ 全面测试安全升级
19. ⬜ 更新文档
20. ⬜ 部署到生产环境

---

## 六、验收标准

### 6.1 安全性
- ✅ Token 无法通过枚举或推断获得（256 位随机）
- ✅ 密码使用 PBKDF2 哈希（100,000 次迭代）
- ✅ `sync/read` 不再接受 `userId` 查询参数
- ✅ 所有写接口未授权返回 401

### 6.2 功能性
- ✅ 用户可以正常登录和登出
- ✅ 登出后 token 立即失效
- ✅ 会话 30 天后自动过期
- ✅ 旧用户密码自动升级（首次登录）

### 6.3 兼容性
- ✅ 前端无需修改（除新增登出功能）
- ✅ 浏览器扩展正常工作
- ✅ API 响应格式保持一致

---

## 七、风险评估

### 风险 1：强制重新登录
- **影响**：所有用户需要重新登录
- **缓解**：在登录页面显示公告说明
- **回滚**：保留旧代码分支以备回滚

### 风险 2：性能影响
- **影响**：PBKDF2 比 SHA-256 慢（但这是设计目标）
- **缓解**：100,000 次迭代在现代设备上约 100-200ms
- **监控**：添加登录耗时监控

### 风险 3：迁移失败
- **影响**：可能导致用户无法登录
- **缓解**：在测试环境充分测试后再部署生产
- **回滚**：保留旧哈希验证逻辑作为降级方案

---

## 八、时间估算

| 任务 | 预计时间 |
|------|---------|
| 阶段 1：准备工作 | 1 小时 |
| 阶段 2：密码哈希升级 | 2 小时 |
| 阶段 3：会话管理系统 | 3 小时 |
| 阶段 4：接口鉴权修复 | 2 小时 |
| 阶段 5：前端适配和测试 | 2 小时 |
| **总计** | **10 小时** |

---

## 九、参考资料

- [OWASP 密码存储备忘单](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)
- [NIST SP 800-63B](https://pages.nist.gov/800-63-3/sp800-63b.html)
- [Web Crypto API - PBKDF2](https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/deriveBits#pbkdf2)
- [Cloudflare D1 文档](https://developers.cloudflare.com/d1/)
