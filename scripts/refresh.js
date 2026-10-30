#!/usr/bin/env node

import { mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = join(__dirname, '..');

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
export const USERNAME = 'webywz';
export const MAX_PROJECTS = 6;

/**
 * Showcase repos are pinned first whenever they exist.
 * Daily refresh must never drop them to make room for other starred repos.
 */
export const SHOWCASE_REPOS = [
  'contrib-aquarium',
  'vibe-commit',
  'breathing-github-profile'
];

/** Strong featured set after showcase. Kept even if currently unpublished. */
export const FEATURED_REPOS = [
  'ClipboardHistoryMac',
  'nest-admin',
  'lumi-relay',
  'learn-fastapi'
];

/** Never feature the profile repo itself. */
export const SKIP_REPOS = new Set(['webywz']);

/** Empty / trivial learning dumps — skip as top cards when better options exist. */
export const TRIVIAL_REPOS = new Set([
  'blog',
  'PromiseA',
  'vue-learn-music',
  'UmoEditorDemo'
]);

export const FALLBACK_DESCRIPTIONS = {
  'contrib-aquarium': '由 GitHub 贡献图驱动的活体 SVG 水族馆，可直接嵌入 README',
  'vibe-commit': '一条命令写出有品味的 conventional commit',
  'breathing-github-profile': '开源的活 README 生成器：每日刷新 + 测试',
  'learn-fastapi': '面向前端开发者的 FastAPI 后端实战教程',
  ClipboardHistoryMac: 'macOS 剪贴板历史工具',
  'nest-admin': 'NestJS 管理后台',
  'lumi-relay': '轻量模型中继网关',
  'claude-config': 'Electron + Vue 3 的 Claude Code 配置管理桌面应用',
  'taobao-shop': '淘宝店铺采集、后端与桌面端工具套件',
  'imitate-vue-stage': 'Vue 响应式原理的分阶段实现',
  'noah-utils': '树结构与货币格式化的 TypeScript 工具库',
  toolStore: '船用五金 AI 识别与 RAG 查询系统'
};

export const FALLBACK_LANGUAGES = {
  'contrib-aquarium': 'SVG',
  'vibe-commit': 'JavaScript',
  'breathing-github-profile': 'JavaScript'
};

export const DEMO_LINKS = {
  'contrib-aquarium': {
    label: 'Demo',
    url: 'https://github.com/webywz/contrib-aquarium'
  },
  'vibe-commit': {
    label: 'CLI',
    url: 'https://github.com/webywz/vibe-commit'
  }
};

export const STATS_THEME = 'tokyonight';

const THEME = {
  bg: '#1a1b26',
  fg: '#c0caf5',
  muted: '#565f89',
  blue: '#7aa2f7',
  cyan: '#7dcfff',
  magenta: '#bb9af7',
  green: '#9ece6a',
  orange: '#ff9e64'
};

const LANGUAGE_COLORS = {
  TypeScript: '#3178c6',
  JavaScript: '#f1e05a',
  Python: '#3572a5',
  Dart: '#00b4ab',
  HTML: '#e34c26',
  Vue: '#41b883',
  Go: '#00add8',
  CSS: '#563d7c',
  Shell: '#89e051',
  SVG: '#ffb13b'
};

/**
 * Pick highlight projects: showcase first (never demoted), then featured, then starred.
 */
export function selectHighlightProjects(repos, { max = MAX_PROJECTS } = {}) {
  const list = Array.isArray(repos) ? repos : [];
  const byName = new Map();
  for (const repo of list) {
    if (!repo?.name || SKIP_REPOS.has(repo.name)) continue;
    byName.set(repo.name, repo);
  }

  const selected = [];
  const selectedNames = new Set();

  const take = (name) => {
    if (selectedNames.has(name)) return;
    const repo = byName.get(name);
    if (!repo) return;
    selected.push(repo);
    selectedNames.add(name);
  };

  for (const name of SHOWCASE_REPOS) take(name);
  const showcaseCount = selected.length;

  for (const name of FEATURED_REPOS) take(name);

  const rest = list
    .filter((repo) => {
      if (!repo?.name) return false;
      if (SKIP_REPOS.has(repo.name) || selectedNames.has(repo.name)) return false;
      if (TRIVIAL_REPOS.has(repo.name)) return false;
      return true;
    })
    .sort((a, b) => {
      const starDiff = (b.stars || 0) - (a.stars || 0);
      if (starDiff !== 0) return starDiff;
      const hasDesc = (x) => Boolean((x.description || '').trim() || FALLBACK_DESCRIPTIONS[x.name]);
      if (hasDesc(a) !== hasDesc(b)) return hasDesc(a) ? -1 : 1;
      return new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0);
    });

  const cap = Math.max(max, showcaseCount);
  for (const repo of rest) {
    if (selected.length >= cap) break;
    // Prefer starred / described repos as fillers; skip 0-star no-desc dumps.
    const stars = repo.stars || 0;
    const described = Boolean((repo.description || '').trim() || FALLBACK_DESCRIPTIONS[repo.name]);
    if (stars <= 0 && !described) continue;
    selected.push(repo);
    selectedNames.add(repo.name);
  }

  return selected;
}

export function resolveDescription(repo) {
  // Profile copy stays Chinese when we have a curated line.
  if (FALLBACK_DESCRIPTIONS[repo?.name]) {
    return FALLBACK_DESCRIPTIONS[repo.name];
  }
  const fromApi = (repo?.description || '').trim();
  if (fromApi) return fromApi;
  return '实验性项目';
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function projectCard(repo) {
  const desc = resolveDescription(repo);
  const language = repo.language || FALLBACK_LANGUAGES[repo.name] || '—';
  const stars = Number.isFinite(repo.stars) ? repo.stars : 0;
  const demo = DEMO_LINKS[repo.name];
  const demoBit = demo ? ` · [${demo.label}](${demo.url})` : '';

  return `### [${repo.name}](${repo.htmlUrl})

${desc}

\`${language}\` · ⭐ ${stars}${demoBit}`;
}

/**
 * Rich 2-column project cards: pin + description + language + stars.
 */
export function generateProjectsMarkdown(repos) {
  const highlights = selectHighlightProjects(repos);

  if (highlights.length === 0) {
    return '暂无公开项目';
  }

  const cells = highlights.map((repo) => `<td width="50%" valign="top">

${projectCard(repo)}

</td>`);

  const rows = [];
  for (let i = 0; i < cells.length; i += 2) {
    const right = cells[i + 1] || '<td width="50%" valign="top"></td>';
    rows.push(`<tr>
${cells[i]}
${right}
</tr>`);
  }

  return `<table>
${rows.join('\n')}
</table>`;
}

export function generateStatsMarkdown() {
  return `<div align="center">

<table>
<tr>
<td>
<img src="assets/stats.svg" alt="GitHub Stats" />
</td>
<td>
<img src="assets/langs.svg" alt="Top Languages" />
</td>
</tr>
</table>

![GitHub Streak](https://streak-stats.demolab.com?user=${USERNAME}&theme=${STATS_THEME}&hide_border=true)

</div>`;
}

export function aggregateLanguages(repos) {
  const counts = new Map();
  for (const repo of repos || []) {
    if (!repo?.language) continue;
    counts.set(repo.language, (counts.get(repo.language) || 0) + 1);
  }
  const total = [...counts.values()].reduce((sum, n) => sum + n, 0) || 1;
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([name, count]) => ({
      name,
      count,
      pct: Math.round((count / total) * 100)
    }));
}

function svgText(value) {
  return escapeHtml(value).replace(/'/g, '&#39;');
}

export function renderStatsSvg(user = {}, repos = []) {
  const publicRepos = user.publicRepos ?? repos.length;
  const followers = user.followers ?? 0;
  const stars = repos.reduce((sum, repo) => sum + (repo.stars || 0), 0);
  const forks = repos.reduce((sum, repo) => sum + (repo.forks || 0), 0);
  const rows = [
    ['公开仓库', publicRepos, THEME.blue],
    ['Stars', stars, THEME.cyan],
    ['Followers', followers, THEME.magenta],
    ['Forks', forks, THEME.green]
  ];

  const items = rows.map(([label, value, color], index) => {
    const y = 78 + index * 28;
    return `<circle cx="36" cy="${y - 6}" r="5" fill="${color}"/>
  <text x="52" y="${y}" fill="${THEME.fg}" font-size="15" font-family="Verdana, Geneva, sans-serif">${svgText(label)}</text>
  <text x="430" y="${y}" text-anchor="end" fill="${color}" font-size="16" font-weight="700" font-family="Verdana, Geneva, sans-serif">${svgText(value)}</text>`;
  }).join('\n  ');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="460" height="195" viewBox="0 0 460 195" role="img" aria-label="GitHub Stats">
  <rect width="460" height="195" rx="16" fill="${THEME.bg}"/>
  <text x="24" y="36" fill="${THEME.blue}" font-size="16" font-weight="700" font-family="Verdana, Geneva, sans-serif">${svgText(USERNAME)} 的 GitHub 统计</text>
  <text x="24" y="56" fill="${THEME.muted}" font-size="11" font-family="Verdana, Geneva, sans-serif">theme · ${STATS_THEME}</text>
  ${items}
</svg>
`;
}

export function renderLangsSvg(repos = []) {
  const langs = aggregateLanguages(repos);
  const bars = langs.length === 0
    ? `<text x="24" y="100" fill="${THEME.muted}" font-size="14" font-family="Verdana, Geneva, sans-serif">暂无语言数据</text>`
    : langs.map((lang, index) => {
      const y = 70 + index * 20;
      const width = Math.max(8, Math.round((lang.pct / 100) * 210));
      const color = LANGUAGE_COLORS[lang.name] || THEME.blue;
      return `<text x="24" y="${y}" fill="${THEME.fg}" font-size="12" font-family="Verdana, Geneva, sans-serif">${svgText(lang.name)}</text>
  <rect x="130" y="${y - 11}" width="210" height="10" rx="5" fill="#121526"/>
  <rect x="130" y="${y - 11}" width="${width}" height="10" rx="5" fill="${color}"/>
  <text x="350" y="${y}" fill="${THEME.muted}" font-size="11" font-family="Verdana, Geneva, sans-serif">${lang.pct}%</text>`;
    }).join('\n  ');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="380" height="195" viewBox="0 0 380 195" role="img" aria-label="Top Languages">
  <rect width="380" height="195" rx="16" fill="${THEME.bg}"/>
  <text x="24" y="36" fill="${THEME.cyan}" font-size="16" font-weight="700" font-family="Verdana, Geneva, sans-serif">最常用的语言</text>
  <text x="24" y="56" fill="${THEME.muted}" font-size="11" font-family="Verdana, Geneva, sans-serif">theme · ${STATS_THEME}</text>
  ${bars}
</svg>
`;
}

export function writeGeneratedAssets(data, rootDir = ROOT_DIR) {
  const assetsDir = join(rootDir, 'assets');
  mkdirSync(assetsDir, { recursive: true });
  writeFileSync(join(assetsDir, 'stats.svg'), renderStatsSvg(data.user, data.repos), 'utf-8');
  writeFileSync(join(assetsDir, 'langs.svg'), renderLangsSvg(data.repos), 'utf-8');
}

/**
 * Asia/Shanghai wall clock, not UTC ISO.
 */
export function getShanghaiTime(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).formatToParts(date);

  const get = (type) => parts.find((part) => part.type === type)?.value || '00';
  // Some ICU builds emit hour "24" for midnight; normalize to 00.
  const hour = get('hour') === '24' ? '00' : get('hour');
  return `${get('year')}-${get('month')}-${get('day')} ${hour}:${get('minute')}:${get('second')}`;
}

function replaceMarker(source, name, inner) {
  const pattern = new RegExp(`<!--${name}:START-->[\\s\\S]*?<!--${name}:END-->`);
  if (!pattern.test(source)) {
    throw new Error(`README 缺少 ${name} 标记`);
  }
  return source.replace(
    pattern,
    `<!--${name}:START-->\n${inner}\n<!--${name}:END-->`
  );
}

export function updateReadmeContent(readme, data, now = new Date()) {
  let next = readme;
  next = replaceMarker(next, 'PROJECTS', generateProjectsMarkdown(data.repos));
  next = replaceMarker(next, 'STATS', generateStatsMarkdown());
  next = replaceMarker(
    next,
    'TIMESTAMP',
    `*最后更新：${getShanghaiTime(now)} (Asia/Shanghai)*`
  );
  return next;
}

async function fetchGitHubData() {
  const headers = {
    Accept: 'application/vnd.github.v3+json',
    'User-Agent': 'webywz-profile-bot'
  };

  if (GITHUB_TOKEN) {
    headers.Authorization = `token ${GITHUB_TOKEN}`;
  }

  const userResponse = await fetch(`https://api.github.com/users/${USERNAME}`, { headers });
  if (!userResponse.ok) {
    throw new Error(`Failed to fetch user data: ${userResponse.status}`);
  }
  const user = await userResponse.json();

  const reposResponse = await fetch(
    `https://api.github.com/users/${USERNAME}/repos?sort=updated&per_page=100`,
    { headers }
  );
  if (!reposResponse.ok) {
    throw new Error(`Failed to fetch repos: ${reposResponse.status}`);
  }
  const repos = await reposResponse.json();

  const processedRepos = repos
    .filter((repo) => !repo.fork && !repo.private)
    .map((repo) => ({
      name: repo.name,
      fullName: repo.full_name,
      description: repo.description || '',
      htmlUrl: repo.html_url,
      stars: repo.stargazers_count,
      forks: repo.forks_count,
      language: repo.language,
      updatedAt: repo.updated_at,
      createdAt: repo.created_at
    }))
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

  return {
    user: {
      login: user.login,
      name: user.name,
      bio: user.bio,
      publicRepos: user.public_repos,
      followers: user.followers,
      following: user.following,
      avatarUrl: user.avatar_url,
      htmlUrl: user.html_url
    },
    repos: processedRepos,
    fetchedAt: new Date().toISOString()
  };
}

function updateReadme(data) {
  const readmePath = join(ROOT_DIR, 'README.md');
  const readme = readFileSync(readmePath, 'utf-8');
  writeFileSync(readmePath, updateReadmeContent(readme, data), 'utf-8');
  console.log('✅ README.md 已更新');
}

function saveProfileData(data) {
  const dataPath = join(ROOT_DIR, 'data', 'profile.json');
  writeFileSync(dataPath, JSON.stringify(data, null, 2) + '\n', 'utf-8');
  console.log('✅ profile.json 已保存');
}

export async function main() {
  try {
    console.log('🔄 开始刷新 GitHub profile...');
    console.log(`📡 获取用户 ${USERNAME} 的数据...`);

    const data = await fetchGitHubData();
    console.log(`✅ 成功获取 ${data.repos.length} 个仓库`);

    saveProfileData(data);
    writeGeneratedAssets(data);
    updateReadme(data);

    console.log('✨ 刷新完成！');
  } catch (error) {
    console.error('❌ 刷新失败:', error);
    process.exit(1);
  }
}

const isDirectRun =
  Boolean(process.argv[1]) &&
  import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirectRun) {
  main();
}
