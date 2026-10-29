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

`scripts/refresh.js` 的 `selectHighlightProjects()` 按固定优先级挑选，**showcase 仓库只要存在就永远排在最前，不会被其他高星项目挤掉**：

1. **Showcase（永不降级）**
   - `contrib-aquarium`
   - `vibe-commit`
   - `breathing-github-profile`
2. **精选候选**（仓库存在才入选）
   - `ClipboardHistoryMac`、`nest-admin`、`lumi-relay`、`learn-fastapi`
3. **其余公开非 fork 仓库**：按 stars → 有描述 → 最近更新排序
4. **排除**：profile 仓库本身（`webywz`），以及空的学习堆（`blog`、`PromiseA`、`vue-learn-music`、`UmoEditorDemo`）

默认最多 6 张卡片；若 showcase 超过 6 个，仍会全部保留。

项目卡展示名称、一行简介（API 描述或内置 fallback）、语言和 star 数；`contrib-aquarium` / `vibe-commit` 额外带 Demo 链接。统计与语言分布由脚本生成本地 `assets/stats.svg` / `assets/langs.svg`（tokyonight 深色），避免依赖可能暂停的第三方 stats 部署；连续提交条使用 `streak-stats.demolab.com?theme=tokyonight`。

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

编辑 `scripts/refresh.js` 中的 `SHOWCASE_REPOS` / `FEATURED_REPOS` 或 `selectHighlightProjects()`。

### 调整刷新频率

修改 `.github/workflows/daily-refresh.yml` 中的 cron 表达式。

---

*由 [breathing-github-profile](https://github.com/webywz/breathing-github-profile) 驱动*
