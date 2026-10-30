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
- **贡献水族箱：** 同一 job 内调用钉版 `webywz/contrib-aquarium@v0.1.3`（与 workflow 注释一致；官方 composite Action，等价于 `npx contrib-aquarium@0.1.3 generate --user webywz --out assets/aquarium.svg`），重画 `assets/aquarium.svg`。Git 只在文件内容变化时把它写入提交。勿再用 `@main`。

### 5. 贡献水族箱

README 横幅下方嵌入本地 `assets/aquarium.svg`（相对路径，随仓库一起刷新，比跨仓库 raw URL 更不容易被 Camo 缓存卡住）。

数据来源（`--source auto`）：
1. **GraphQL** `contributionsCollection` — 需要 token，拿到完整近一年日历
2. **公开 Events** — 无需 token，只有最近活动
3. **Mock** — 用用户名哈希生成确定的演示日历，保证 CI / 离线也能出图

本仓库 **不额外配置 secrets**：Actions 自动提供的 `GITHUB_TOKEN` 已足够读取公开贡献日历（见 contrib-aquarium 文档）。没有 token 时生成也不会失败，只是会回退到 Events / mock。

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

- `GITHUB_TOKEN`：GitHub API token（Actions 自动提供，本地测试可选）。Profile 刷新用它拉 REST API；水族箱 Action 用同一个 token 走 GraphQL。无需再配 PAT。

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
- ✅ 水族箱 SVG 已嵌入（在横幅之后、精选项目之前），且 `assets/aquarium.svg` 是有效 SVG
- ✅ `daily-refresh.yml` 仍按上海时间跑，并调用钉版 `webywz/contrib-aquarium@v0.1.3`

## 技术栈

- **运行时：** Node.js (ES Modules)
- **API：** GitHub REST API v3
- **自动化：** GitHub Actions
- **时区：** Asia/Shanghai (UTC+8)

## 相关链接

- 配套开源项目：[breathing-github-profile](https://github.com/webywz/breathing-github-profile)
- 贡献水族箱：[contrib-aquarium](https://github.com/webywz/contrib-aquarium)
- GitHub API 文档：https://docs.github.com/rest

## 维护

### 修改介绍文本

直接编辑 README.md 中标记**外部**的内容，提交后不会被覆盖。

### 修改项目选择逻辑

编辑 `scripts/refresh.js` 中的 `SHOWCASE_REPOS` / `FEATURED_REPOS` 或 `selectHighlightProjects()`。

### 调整刷新频率

修改 `.github/workflows/daily-refresh.yml` 中的 cron 表达式。

### 本地重画水族箱

优先用钉版 npm 包（与 Action `@v0.1.3` 同源）：

```bash
npx --yes contrib-aquarium@0.1.3 generate --user webywz --out assets/aquarium.svg --width 860
```

也可 clone sibling 仓库再生成：

```bash
git clone https://github.com/webywz/contrib-aquarium.git
cd contrib-aquarium
git checkout v0.1.3
npm install
npm run generate -- --user webywz --out /path/to/webywz/assets/aquarium.svg --width 860
```

有 token 时会走 GraphQL 真日历：`export GITHUB_TOKEN=...`（可选）。

---

*由 [breathing-github-profile](https://github.com/webywz/breathing-github-profile) 驱动*
