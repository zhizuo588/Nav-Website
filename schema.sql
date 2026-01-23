-- 导航网站 D1 数据库 Schema
-- 创建网站表
CREATE TABLE IF NOT EXISTS websites (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,           -- 网站名称
  url TEXT NOT NULL,            -- 网站链接
  category TEXT NOT NULL,       -- 分类
  desc TEXT,                    -- 描述
  icon_url TEXT,                -- 图标URL
  lan_url TEXT,                 -- 内网地址（可选）
  dark_icon INTEGER DEFAULT 0,   -- 是否深色图标
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_category ON websites(category);
CREATE INDEX IF NOT EXISTS idx_name ON websites(name);
CREATE INDEX IF NOT EXISTS idx_url ON websites(url);
