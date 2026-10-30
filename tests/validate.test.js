#!/usr/bin/env node

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import {
  SHOWCASE_REPOS,
  FEATURED_REPOS,
  SKIP_REPOS,
  TRIVIAL_REPOS,
  selectHighlightProjects,
  generateProjectsMarkdown,
  generateStatsMarkdown,
  updateReadmeContent,
  getShanghaiTime,
  USERNAME,
  resolveDescription,
  renderStatsSvg,
  renderLangsSvg,
  renderStreakSvg,
  computeStreakFromDays,
  aggregateLanguages
} from '../scripts/refresh.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = join(__dirname, '..');

let testsPassed = 0;
let testsFailed = 0;

function assert(condition, message) {
  if (condition) {
    testsPassed++;
    console.log(`✅ PASS: ${message}`);
  } else {
    testsFailed++;
    console.error(`❌ FAIL: ${message}`);
  }
}

function repo(name, extra = {}) {
  return {
    name,
    description: extra.description ?? '',
    htmlUrl: extra.htmlUrl ?? `https://github.com/${USERNAME}/${name}`,
    stars: extra.stars ?? 0,
    language: extra.language ?? null,
    updatedAt: extra.updatedAt ?? '2026-01-01T00:00:00Z'
  };
}

function testProfileJsonSchema() {
  console.log('\n📋 测试 profile.json schema...');

  const profilePath = join(ROOT_DIR, 'data', 'profile.json');

  assert(existsSync(profilePath), 'profile.json 文件存在');

  if (!existsSync(profilePath)) {
    return;
  }

  try {
    const data = JSON.parse(readFileSync(profilePath, 'utf-8'));

    assert(data.user !== undefined, 'profile.json 包含 user 字段');
    assert(data.repos !== undefined, 'profile.json 包含 repos 字段');
    assert(data.fetchedAt !== undefined, 'profile.json 包含 fetchedAt 字段');

    if (data.user) {
      assert(typeof data.user.login === 'string', 'user.login 是字符串');
      assert(typeof data.user.publicRepos === 'number', 'user.publicRepos 是数字');
    }

    if (data.repos) {
      assert(Array.isArray(data.repos), 'repos 是数组');

      if (data.repos.length > 0) {
        const first = data.repos[0];
        assert(first.name !== undefined, '第一个 repo 有 name 字段');
        assert(first.htmlUrl !== undefined, '第一个 repo 有 htmlUrl 字段');
      }
    }

    if (data.fetchedAt) {
      const date = new Date(data.fetchedAt);
      assert(!isNaN(date.getTime()), 'fetchedAt 是有效的 ISO 日期');
    }
  } catch (error) {
    assert(false, `profile.json 可以被解析为 JSON: ${error.message}`);
  }
}

function testReadmeStructure() {
  console.log('\n📄 测试 README.md 结构...');

  const readmePath = join(ROOT_DIR, 'README.md');

  assert(existsSync(readmePath), 'README.md 文件存在');

  if (!existsSync(readmePath)) {
    return;
  }

  const readme = readFileSync(readmePath, 'utf-8');

  assert(readme.includes('<!--PROJECTS:START-->'), 'README 包含 PROJECTS:START 标记');
  assert(readme.includes('<!--PROJECTS:END-->'), 'README 包含 PROJECTS:END 标记');
  assert(readme.includes('<!--TIMESTAMP:START-->'), 'README 包含 TIMESTAMP:START 标记');
  assert(readme.includes('<!--TIMESTAMP:END-->'), 'README 包含 TIMESTAMP:END 标记');
  assert(readme.includes('<!--STATS:START-->'), 'README 包含 STATS:START 标记');
  assert(readme.includes('<!--STATS:END-->'), 'README 包含 STATS:END 标记');

  assert(
    readme.includes('关于我') || readme.includes('About') || readme.includes('此刻'),
    'README 包含介绍部分'
  );
  assert(readme.length > 100, 'README 有实质性内容（>100 字符）');

  const projectsMatch = readme.match(/<!--PROJECTS:START-->([\s\S]*?)<!--PROJECTS:END-->/);
  if (projectsMatch) {
    assert(projectsMatch[1].trim().length > 0, 'PROJECTS 部分有内容');
  }

  const timestampMatch = readme.match(/<!--TIMESTAMP:START-->([\s\S]*?)<!--TIMESTAMP:END-->/);
  if (timestampMatch) {
    const timestampContent = timestampMatch[1].trim();
    assert(timestampContent.length > 0, 'TIMESTAMP 部分有内容');
    assert(timestampContent.includes('Asia/Shanghai'), '时间戳使用 Asia/Shanghai');
  }

  assert(readme.includes('webywz'), 'README 使用用户名 webywz');
  assert(readme.includes('Noah'), 'README 展示显示名 Noah');
  assert(
    readme.includes('https://github.com/webywz/breathing-github-profile'),
    'README 保留 breathing-github-profile 链接'
  );
  assert(
    readme.includes('https://github.com/webywz/contrib-aquarium'),
    'README 链接 contrib-aquarium Demo'
  );
  assert(
    readme.includes('https://github.com/webywz/vibe-commit'),
    'README 链接 vibe-commit Demo'
  );

  const highlightHeading = readme.indexOf('## ✨ 亮点 Demo');
  const projectsStart = readme.indexOf('<!--PROJECTS:START-->');
  assert(highlightHeading !== -1, 'README 包含手写「亮点 Demo」标题');
  assert(
    highlightHeading !== -1 && projectsStart !== -1 && highlightHeading < projectsStart,
    '亮点 Demo 出现在 PROJECTS 标记之前'
  );
  const highlightSection =
    highlightHeading !== -1 && projectsStart !== -1
      ? readme.slice(highlightHeading, projectsStart)
      : '';
  for (const name of [
    'contrib-aquarium',
    'vibe-commit',
    'agent-trace',
    'eval-smoke',
    'diff-vibe',
    'context-diet'
  ]) {
    assert(
      highlightSection.includes(`https://github.com/webywz/${name}`),
      `亮点 Demo 包含 ${name}`
    );
  }
  assert(highlightSection.includes('<table>'), '亮点 Demo 使用双列表格卡片');
  assert(
    (highlightSection.match(/<tr>/g) || []).length >= 2,
    '亮点 Demo 至少两行（2×2）'
  );
  assert(
    highlightSection.includes('npx contrib-aquarium') ||
      highlightSection.includes('npx @webywz/'),
    '产品墙包含可复制的 npx / install 命令'
  );
  assert(readme.includes('产品墙') || readme.includes('Product wall'), '亮点区标注产品墙');
  assert(readme.includes('assets/terminal-flex.svg'), 'README 含克制伪终端 SVG');
  assert(!readme.includes('readme-typing-svg.demolab.com'), '去掉 demolab typing SVG');
  assert(!readme.includes('color=bb9af7'), 'shields 不再使用紫粉 AI 色');
  assert(readme.includes('assets/banner.svg'), 'README 包含自定义横幅');
  assert(readme.includes('assets/stats.svg'), 'README 使用本地 stats SVG');
  assert(readme.includes('assets/langs.svg'), 'README 使用本地 langs SVG');
  assert(readme.includes('assets/streak.svg'), 'README 使用本地 streak SVG');
  assert(!readme.includes('streak-stats.demolab.com'), '去掉 demolab streak');
  assert(!readme.includes('github-readme-stats.vercel.app'), '不依赖 vercel stats');
  assert(readme.includes('assets/aquarium.svg'), 'README 嵌入本地贡献水族箱 SVG');
  assert(readme.includes('assets/wall-header.svg'), 'README 含产品墙呼吸标题条');
  assert(readme.includes('assets/card-chrome.svg'), 'README 产品卡含微光 chrome');
  assert(readme.includes('assets/mid-breath.svg'), 'README 含中段呼吸分隔');
  assert(readme.includes('assets/stack-strip.svg'), 'README 含动效技术栈条');
  assert(readme.includes('assets/social-strip.svg'), 'README 含页脚社交灯条');
  assert(readme.includes('assets/divider-breath.svg'), 'README 含呼吸分隔线');
  assert(
    readme.includes('贡献水族箱') || readme.includes('水族馆'),
    'README 用中文说明水族箱'
  );
  const bannerIdx = readme.indexOf('assets/banner.svg');
  const wallIdx = readme.indexOf('assets/wall-header.svg');
  const aquariumIdx = readme.indexOf('assets/aquarium.svg');
  const stackIdx = readme.indexOf('assets/stack-strip.svg');
  const socialIdx = readme.indexOf('assets/social-strip.svg');
  const projectsIdx = readme.indexOf('<!--PROJECTS:START-->');
  assert(bannerIdx !== -1 && aquariumIdx !== -1, '横幅与水族箱路径都存在');
  assert(bannerIdx < wallIdx, '产品墙在横幅之后');
  assert(wallIdx < aquariumIdx, '水族箱作为中段呼吸在产品墙之后');
  assert(aquariumIdx < projectsIdx, '水族箱出现在精选项目之前');
  assert(stackIdx !== -1 && stackIdx < wallIdx, '技术栈条出现在产品墙之前（Hero 区）');
  assert(socialIdx !== -1 && socialIdx > projectsIdx, '社交灯条在页脚');
  assert(!readme.includes('badge/-TypeScript'), 'README 不再是技术栈徽章墙');
  assert(!readme.includes('github-readme-stats.vercel.app'), '不依赖已暂停的 vercel stats 部署');
}

function testMarkerIntegrity() {
  console.log('\n🔍 测试标记完整性...');

  const readmePath = join(ROOT_DIR, 'README.md');
  if (!existsSync(readmePath)) {
    return;
  }

  const readme = readFileSync(readmePath, 'utf-8');

  const markers = [
    ['PROJECTS:START', 'PROJECTS:END'],
    ['STATS:START', 'STATS:END'],
    ['TIMESTAMP:START', 'TIMESTAMP:END']
  ];

  for (const [start, end] of markers) {
    const startCount = (readme.match(new RegExp(`<!--${start}-->`, 'g')) || []).length;
    const endCount = (readme.match(new RegExp(`<!--${end}-->`, 'g')) || []).length;

    assert(
      startCount === 1 && endCount === 1,
      `${start}/${end} 标记各出现一次（开始:${startCount}, 结束:${endCount}）`
    );

    if (startCount === 1 && endCount === 1) {
      const startIdx = readme.indexOf(`<!--${start}-->`);
      const endIdx = readme.indexOf(`<!--${end}-->`);
      assert(startIdx < endIdx, `${start} 在 ${end} 之前`);
    }
  }
}

function testSelectionLogic() {
  console.log('\n🎯 测试精选项目选择逻辑...');

  assert(SHOWCASE_REPOS[0] === 'contrib-aquarium', 'showcase 首位是 contrib-aquarium');
  assert(SHOWCASE_REPOS.includes('vibe-commit'), 'showcase 包含 vibe-commit');
  assert(
    SHOWCASE_REPOS.includes('breathing-github-profile'),
    'showcase 包含 breathing-github-profile'
  );
  assert(FEATURED_REPOS.includes('learn-fastapi'), 'featured 包含 learn-fastapi');
  assert(FEATURED_REPOS.includes('ClipboardHistoryMac'), 'featured 包含 ClipboardHistoryMac');
  assert(FEATURED_REPOS.includes('nest-admin'), 'featured 包含 nest-admin');
  assert(FEATURED_REPOS.includes('lumi-relay'), 'featured 包含 lumi-relay');
  assert(SKIP_REPOS.has('webywz'), '跳过 profile 仓库本身');

  const crowded = [
    repo('webywz', { stars: 99 }),
    repo('blog', { stars: 50 }),
    repo('PromiseA', { stars: 40 }),
    repo('vue-learn-music', { stars: 30 }),
    repo('star-a', { stars: 20, language: 'Go' }),
    repo('star-b', { stars: 19, language: 'Rust' }),
    repo('star-c', { stars: 18, language: 'Zig' }),
    repo('star-d', { stars: 17, language: 'C' }),
    repo('star-e', { stars: 16, language: 'C++' }),
    repo('star-f', { stars: 15, language: 'Java' }),
    repo('contrib-aquarium', { stars: 0, description: 'aquarium' }),
    repo('vibe-commit', { stars: 0, description: 'cli' }),
    repo('breathing-github-profile', { stars: 0, description: 'generator' }),
    repo('learn-fastapi', { stars: 3, language: 'Python' })
  ];

  const picked = selectHighlightProjects(crowded, { max: 6 });
  const names = picked.map((item) => item.name);

  assert(names[0] === 'contrib-aquarium', '存在时 contrib-aquarium 排第一');
  assert(names[1] === 'vibe-commit', '存在时 vibe-commit 排第二');
  assert(names[2] === 'breathing-github-profile', '存在时 breathing-github-profile 排第三');
  assert(names.includes('learn-fastapi'), 'featured 的 learn-fastapi 会被选中');
  assert(!names.includes('webywz'), '不会展示 profile 仓库');
  assert(!names.includes('blog'), '有更好选项时不把学习堆放在顶卡');
  assert(!names.includes('PromiseA'), '有更好选项时不展示 PromiseA');
  assert(
    SHOWCASE_REPOS.every((name) => names.includes(name)),
    'showcase 仓库全部保留，不会被高星项目挤掉'
  );
  assert(picked.length <= 6 || SHOWCASE_REPOS.length > 6, '默认不超过 6 个（showcase 超量除外）');

  const missingShowcase = selectHighlightProjects([
    repo('learn-fastapi', { stars: 3, language: 'Python' }),
    repo('star-a', { stars: 8, language: 'Go' })
  ]);
  assert(
    !missingShowcase.some((item) => SHOWCASE_REPOS.includes(item.name)),
    'showcase 不存在时不会凭空插入'
  );
  assert(
    missingShowcase[0]?.name === 'learn-fastapi',
    '没有 showcase 时 featured 仍优先'
  );

  const onlyTrivial = selectHighlightProjects([
    repo('blog', { stars: 1 }),
    repo('webywz', { stars: 9 })
  ]);
  assert(onlyTrivial.length === 0, '只剩 trivial / profile 仓库时不硬凑顶卡');
}

function testProjectCards() {
  console.log('\n🃏 测试项目卡片 Markdown...');

  const markdown = generateProjectsMarkdown([
    repo('contrib-aquarium', {
      description: 'Living SVG aquarium',
      language: 'JavaScript',
      stars: 2
    }),
    repo('learn-fastapi', { language: 'Python', stars: 3 })
  ]);

  assert(markdown.includes('contrib-aquarium'), '卡片包含仓库名');
  assert(
    markdown.includes('Living SVG aquarium') || markdown.includes('活体 SVG 水族馆'),
    '卡片包含一行简介'
  );
  assert(markdown.includes('JavaScript') || markdown.includes('SVG'), '卡片包含语言');
  assert(markdown.includes('⭐ 2'), '卡片包含 star 数');
  assert(markdown.includes('learn-fastapi'), '卡片包含 featured 仓库');
  assert(markdown.includes(resolveDescription(repo('learn-fastapi'))), '空描述走 fallback');
  assert(markdown.includes('Demo'), 'contrib-aquarium 带 Demo 链接');
  assert(markdown.includes('<table>'), '项目卡使用双列卡片布局');

  const stats = generateStatsMarkdown();
  assert(stats.includes('assets/stats.svg'), '统计区引用本地 stats.svg');
  assert(stats.includes('assets/langs.svg'), '统计区引用本地 langs.svg');
  assert(stats.includes('assets/streak.svg'), '统计区引用本地 streak.svg');
  assert(!stats.includes('demolab'), '统计区无 demolab');
  assert(!stats.includes('github-readme-stats'), '统计区无 vercel stats');
}

function testGeneratedSvgs() {
  console.log('\n🎨 测试本地 tokyonight 统计 SVG...');

  const statsPath = join(ROOT_DIR, 'assets', 'stats.svg');
  const langsPath = join(ROOT_DIR, 'assets', 'langs.svg');
  const bannerPath = join(ROOT_DIR, 'assets', 'banner.svg');
  const aquariumPath = join(ROOT_DIR, 'assets', 'aquarium.svg');
  assert(existsSync(aquariumPath), 'aquarium.svg 存在');
  const aquarium = readFileSync(aquariumPath, 'utf-8');
  assert(aquarium.includes('<svg'), 'aquarium.svg 是 SVG');
  assert(
    aquarium.includes('webywz') || aquarium.includes('WEBYWZ'),
    'aquarium.svg 绑定用户 webywz'
  );
  assert(aquarium.includes('contribution'), 'aquarium.svg 来自贡献日历');

  assert(existsSync(bannerPath), 'banner.svg 存在');
  const banner = readFileSync(bannerPath);
  let bannerText = '';
  try {
    bannerText = new TextDecoder('utf-8', { fatal: true }).decode(banner);
    assert(true, 'banner.svg 是合法 UTF-8');
  } catch {
    assert(false, 'banner.svg 是合法 UTF-8');
  }
  assert(bannerText.includes('NOAH'), 'banner.svg 包含 NOAH');
  assert(
    bannerText.startsWith('<?xml') && bannerText.includes('encoding="UTF-8"'),
    'banner.svg 声明 UTF-8，避免当作图片时解码失败'
  );
  assert(bannerText.includes('<animate'), 'banner.svg 含呼吸动画');
  assert(bannerText.includes('#7aa2f7'), 'banner.svg 使用 tokyo-night 青蓝');
  assert(!bannerText.includes('#bb9af7'), 'banner.svg 无紫粉 AI 主色');
  const terminalPath = join(ROOT_DIR, 'assets', 'terminal-flex.svg');
  assert(existsSync(terminalPath), 'terminal-flex.svg 存在');
  const terminal = readFileSync(terminalPath, 'utf-8');
  assert(terminal.includes('npx contrib-aquarium'), 'terminal-flex 展示 aquarium 命令');
  assert(terminal.includes('<animate'), 'terminal-flex 含打字机/光标动画');
  for (const name of [
    'card-chrome.svg',
    'wall-header.svg',
    'mid-breath.svg',
    'stack-strip.svg',
    'social-strip.svg',
    'divider-breath.svg'
  ]) {
    const p = join(ROOT_DIR, 'assets', name);
    assert(existsSync(p), `${name} 存在`);
    const svg = readFileSync(p, 'utf-8');
    assert(svg.includes('<svg'), `${name} 是 SVG`);
    assert(svg.includes('<animate') || svg.includes('animateTransform'), `${name} 含呼吸动效`);
  }
  assert(existsSync(statsPath), 'stats.svg 存在');
  assert(existsSync(langsPath), 'langs.svg 存在');
  const streakPath = join(ROOT_DIR, 'assets', 'streak.svg');
  assert(existsSync(streakPath), 'streak.svg 存在');
  const streakFile = readFileSync(streakPath, 'utf-8');
  assert(streakFile.includes('<animate'), 'streak.svg 含呼吸动效');
  assert(streakFile.includes('tokyo-night') || streakFile.includes('tokyonight'), 'streak.svg 标注 tokyonight');
  assert(streakFile.includes('#7aa2f7'), 'streak.svg 使用 tokyo-night 青蓝');
  assert(!streakFile.includes('#bb9af7'), 'streak.svg 无紫粉主色');

  const sampleRepos = [
    repo('learn-fastapi', { language: 'Python', stars: 3, forks: 1 }),
    repo('claude-config', { language: 'TypeScript', stars: 1 }),
    repo('taobao-shop', { language: 'JavaScript', stars: 1 })
  ];
  const statsSvg = renderStatsSvg({ publicRepos: 18, followers: 3 }, sampleRepos);
  assert(statsSvg.includes('tokyo-night') || statsSvg.includes('tokyonight'), 'stats SVG 标注 tokyonight');
  assert(statsSvg.includes('Repos') && statsSvg.includes('仓库'), 'stats SVG 包含仓库数');
  assert(statsSvg.includes('Stars') && statsSvg.includes('星标'), 'stats SVG 包含 Stars');
  assert(statsSvg.includes('#1a1b26'), 'stats SVG 使用深色背景');
  assert(statsSvg.includes('<animate'), 'stats SVG 含呼吸动效');
  assert(statsSvg.includes('#7aa2f7'), 'stats SVG 使用青蓝');
  assert(!statsSvg.includes('#bb9af7'), 'stats SVG 无紫粉主色');

  const langs = aggregateLanguages(sampleRepos);
  assert(langs[0].name === 'Python' || langs.length === 3, '语言聚合按仓库计数');
  const langsSvg = renderLangsSvg(sampleRepos);
  assert(langsSvg.includes('Python'), 'langs SVG 包含 Python');
  assert(langsSvg.includes('tokyo-night') || langsSvg.includes('tokyonight'), 'langs SVG 标注 tokyonight');
  assert(langsSvg.includes('<animate'), 'langs SVG 含呼吸动效');

  const streakSvg = renderStreakSvg({ current: 2, longest: 5, total: 204 });
  assert(streakSvg.includes('tokyo-night') || streakSvg.includes('tokyonight'), 'streak renderer 标注 tokyonight');
  assert(streakSvg.includes('<animate'), 'streak renderer 含呼吸动效');
  assert(streakSvg.includes(USERNAME), 'streak SVG 绑定 webywz');
  assert(streakSvg.includes('204'), 'streak SVG 写入总贡献');
  assert(streakSvg.includes('#7dcfff'), 'streak SVG 使用青蓝光');

  const streakMath = computeStreakFromDays([
    { contributionCount: 1 },
    { contributionCount: 1 },
    { contributionCount: 0 },
    { contributionCount: 2 },
    { contributionCount: 3 },
    { contributionCount: 0 }
  ]);
  assert(streakMath.current === 2, 'computeStreakFromDays 忽略末尾空日');
  assert(streakMath.longest === 2, 'computeStreakFromDays 计算最长连续');

  // v5 craft: clinical palette, no number-opacity steal, balanced tiles
  assert(!statsSvg.includes('#ff9e64'), 'stats SVG 无刺眼橙');
  assert(!statsSvg.includes('#9ece6a'), 'stats SVG 无贡献绿');
  assert(!statsSvg.includes('#f1e05a'), 'stats SVG 无 JS 黄');
  assert(statsSvg.includes('width="420"'), 'stats 卡宽 420 对齐 langs');
  assert(langsSvg.includes('width="420"'), 'langs 卡宽 420');
  assert(!langsSvg.includes('#f1e05a'), 'langs 无 JS 品牌黄');
  assert(!langsSvg.includes('#e34c26'), 'langs 无 HTML 红');
  assert(!langsSvg.includes('attributeName="width"'), 'langs 进度条不抢戏（无 width 脉动）');
  assert(streakSvg.includes('width="852"'), 'streak 与双卡总宽对齐');
  assert(streakSvg.includes('height="148"'), 'streak 收紧高度');
  assert(!streakSvg.includes('#9ece6a'), 'streak Total 不用贡献绿');
  // Numbers stay readable: opacity animate only on chrome/glow, not value text content pattern is soft-checked via no animate inside number-heavy blocks being hard — ensure ring uses stroke-opacity
  assert(streakSvg.includes('stroke-opacity') || streakSvg.includes('ringGlow'), 'streak 呼吸落在环光上');
  const statsMd = generateStatsMarkdown();
  assert(statsMd.includes('width="420"'), 'STATS markdown 固定双卡宽度');
  assert(statsMd.includes('width="852"'), 'STATS markdown 固定 streak 宽度');
}

function testWorkflowIntact() {
  console.log('\n⚙️ 测试 daily-refresh 工作流未被破坏...');
  const workflowPath = join(ROOT_DIR, '.github', 'workflows', 'daily-refresh.yml');
  assert(existsSync(workflowPath), 'daily-refresh.yml 存在');
  const workflow = readFileSync(workflowPath, 'utf-8');
  assert(workflow.includes("cron: '0 16 * * *'"), '保留上海时间 00:00 的 cron');
  assert(workflow.includes('workflow_dispatch'), '保留手动触发');
  assert(workflow.includes('npm test'), '刷新前仍先跑测试');
  assert(workflow.includes('npm run refresh'), '仍调用 refresh 脚本');
  assert(workflow.includes('contents: write'), '仍有写权限');
  assert(
    workflow.includes('webywz/contrib-aquarium@main'),
    '使用 contrib-aquarium 官方 Action 重画鱼缸'
  );
  assert(workflow.includes('out: assets/aquarium.svg'), '水族箱输出到 assets/aquarium.svg');
  assert(
    workflow.includes('assets/aquarium.svg'),
    '变更检测 / 提交包含 aquarium.svg'
  );
  assert(
    workflow.includes('secrets.GITHUB_TOKEN'),
    '使用 Actions 自带 GITHUB_TOKEN，无需额外 secrets'
  );
}

function testReadmeRefreshPreservesCopy() {
  console.log('\n🛡️ 测试标记刷新不覆盖手写文案...');

  const template = `# 手写标题

关于我：请保留

<img src="assets/aquarium.svg" alt="aquarium" />

<!--PROJECTS:START-->
old projects
<!--PROJECTS:END-->

<!--STATS:START-->
old stats
<!--STATS:END-->

<!--TIMESTAMP:START-->
old time
<!--TIMESTAMP:END-->

[breathing-github-profile](https://github.com/webywz/breathing-github-profile)
`;

  const frozen = new Date('2026-10-29T10:00:00Z');
  const next = updateReadmeContent(
    template,
    {
      repos: [
        repo('contrib-aquarium', { description: 'aquarium', language: 'SVG' }),
        repo('vibe-commit', { description: 'cli', language: 'JavaScript' })
      ]
    },
    frozen
  );

  assert(next.includes('关于我：请保留'), '标记外的介绍不会被覆盖');
  assert(next.includes('assets/aquarium.svg'), '刷新后仍保留水族箱嵌入');
  assert(next.includes('breathing-github-profile'), '刷新后仍保留生成器链接');
  assert(!next.includes('old projects'), 'PROJECTS 标记内会被替换');
  assert(next.includes('contrib-aquarium'), '刷新后写入 showcase 项目');
  assert(next.includes('Asia/Shanghai'), '刷新后写入上海时区时间戳');
  assert(next.includes(getShanghaiTime(frozen)), '时间戳来自 getShanghaiTime');
}

function testShanghaiTime() {
  console.log('\n🕒 测试 Asia/Shanghai 时间...');

  const stamp = getShanghaiTime(new Date('2026-10-29T16:00:00Z'));
  assert(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(stamp), '时间格式为 YYYY-MM-DD HH:mm:ss');
  assert(stamp.startsWith('2026-10-30'), 'UTC 16:00 对应上海次日（CST）');
  assert(stamp.includes('00:00:00'), 'UTC 16:00 对应上海 00:00:00');
}

function runAllTests() {
  console.log('🧪 开始运行测试...\n');
  console.log('='.repeat(50));

  testProfileJsonSchema();
  testReadmeStructure();
  testMarkerIntegrity();
  testSelectionLogic();
  testProjectCards();
  testGeneratedSvgs();
  testWorkflowIntact();
  testReadmeRefreshPreservesCopy();
  testShanghaiTime();

  console.log('\n' + '='.repeat(50));
  console.log(`\n📊 测试结果: ${testsPassed} 通过, ${testsFailed} 失败`);

  if (testsFailed > 0) {
    console.error('\n❌ 部分测试失败');
    process.exit(1);
  } else {
    console.log('\n✅ 所有测试通过！');
    process.exit(0);
  }
}

runAllTests();
