# 🔄 Profile 自动刷新机制说明

## 概述

这个 GitHub Profile README 通过自动化脚本每天更新，保持内容新鲜和数据准确。

## 工作原理

### 1. 数据获取

刷新脚本 `scripts/refresh.js` 通过 GitHub API 获取：
- 用户基本信息
- 公开仓库列表（按更新时间排序）
- 仓库统计数据（stars、forks、语言等）

### 2. 数据存储

所有获取的数据保存在 `data/profile.json`，包含：
```json
{
  "user": { ... },          // 用户信息
  "repos": [ ... ],         // 仓库列表
  "fetchedAt": "..."        // 获取时间
}
```

### 3. README 更新

脚本使用标记（markers）识别需要更新的区域：
- `<!--PROJECTS:START-->...<!--PROJECTS:END-->` - 项目列表
- `<!--STATS:START-->...<!--STATS:END-->` - 统计数据
- `<!--TIMESTAMP:START-->...<!--TIMESTAMP:END-->` - 更新时间

标记外的内容不会被修改，可以安全地手动编辑。

### 4. 自动化运行

GitHub Actions 工作流 `.github/workflows/daily-refresh.yml`：
- **定时运行：** 每天上海时间 00:00（UTC 16:00）
- **手动触发：** 可在 Actions 页面手动运行
- **智能提交：** 只在有实际变化时才提交

## 使用方法

### 本地运行

```bash
# 安装依赖（如果有）
npm install

# 运行测试
npm test

# 刷新数据
npm run refresh
```

### 环境变量

- `GITHUB_TOKEN`：GitHub API token（Actions 自动提供，本地测试可选）

## 项目选择逻辑

脚本优先展示以下类型的项目：
1. 预设的精选项目（nest-admin、lumi-relay 等）
2. 有 stars 的活跃项目
3. 最近更新的项目

最多展示 6 个项目。

## 测试

测试脚本 `tests/validate.test.js` 验证：
- ✅ `profile.json` 数据结构正确
- ✅ README 包含所有必需的标记
- ✅ 标记成对出现且顺序正确
- ✅ 内容区域非空

## 技术栈

- **运行时：** Node.js (ES Modules)
- **API：** GitHub REST API v3
- **自动化：** GitHub Actions
- **时区：** Asia/Shanghai (UTC+8)

## 相关链接

- 配套开源项目：[breathing-github-profile](https://github.com/webywz/breathing-github-profile)
- GitHub API 文档：https://docs.github.com/rest

## 维护

### 修改介绍文本

直接编辑 README.md 中标记**外部**的内容，提交后不会被覆盖。

### 修改项目选择逻辑

编辑 `scripts/refresh.js` 中的 `selectHighlightProjects()` 函数。

### 调整刷新频率

修改 `.github/workflows/daily-refresh.yml` 中的 cron 表达式。

---

*由 [breathing-github-profile](https://github.com/webywz/breathing-github-profile) 驱动*
