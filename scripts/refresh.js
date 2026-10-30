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
  'vibe-commit': '有品味的 conventional commit；examples 含 pair-workflow',
  'diff-vibe': 'git diff 成 PR；支持 CI --github / Job Summary',
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
/** Hand-crafted product wall (亮点 Demo) — static catalog, regenerable SVGs. */
export const PRODUCT_WALL = [
  {
    name: 'contrib-aquarium',
    tag: 'CLI',
    href: 'https://github.com/webywz/contrib-aquarium',
    en: ['A year of commits as a living SVG aquarium.'],
    zh: ['一年的 commit 变成会呼吸的 SVG 水族馆。'],
    cmd: 'npx contrib-aquarium'
  },
  {
    name: 'vibe-commit',
    tag: 'CLI',
    href: 'https://github.com/webywz/vibe-commit',
    en: ['Tasteful commits — examples include pair-workflow.'],
    zh: ['有品味的 commit；examples 含成对 pair-workflow。'],
    cmd: 'npx @webywz/vibe-commit'
  },
  {
    name: 'agent-trace',
    tag: 'CLI',
    href: 'https://github.com/webywz/agent-trace',
    en: ['Messy agent logs → readable timeline + Mermaid.'],
    zh: ['杂乱 agent 日志变成可读时间线与 Mermaid。'],
    cmd: 'npx @webywz/agent-trace'
  },
  {
    name: 'eval-smoke',
    tag: 'CLI',
    href: 'https://github.com/webywz/eval-smoke',
    en: ['One-minute smoke evals for prompts and models.'],
    zh: ['一分钟跑通 prompt / 模型冒烟评测。'],
    cmd: 'npx @webywz/eval-smoke'
  },
  {
    name: 'diff-vibe',
    tag: 'CLI',
    href: 'https://github.com/webywz/diff-vibe',
    en: ['git diff → PR; CI --github + Job Summary.'],
    zh: ['git diff 成 PR；CI --github 与 Job Summary。'],
    cmd: 'npx @webywz/diff-vibe'
  },
  {
    name: 'context-diet',
    tag: 'CLI',
    href: 'https://github.com/webywz/context-diet',
    en: ['Slim LLM context before you send it.'],
    zh: ['发之前先给上下文瘦身，估算 token。'],
    cmd: 'npx @webywz/context-diet'
  },
  {
    name: 'llm-roast',
    tag: 'CLI',
    href: 'https://github.com/webywz/llm-roast',
    en: ['Roast prompts & answers — fluff, hallucination, score.'],
    zh: ['烤烤 prompt / 回答：废话、幻觉感、过度自信分。'],
    cmd: 'npx @webywz/llm-roast'
  },
  {
    name: 'prompt-diff',
    tag: 'CLI',
    href: 'https://github.com/webywz/prompt-diff',
    en: ['Diff two prompts like code — intent, tokens, risk.'],
    zh: ['像 diff 代码一样对比两段 prompt：意图与风险。'],
    cmd: 'npx @webywz/prompt-diff'
  }
];



export const STATS_THEME = 'tokyonight';

const THEME = {
  bg: '#1a1b26',
  fg: '#a9b1d6',
  fgStrong: '#c0caf5',
  muted: '#565f89',
  blue: '#7aa2f7',
  cyan: '#7dcfff',
  border: '#3b4261',
  track: '#12131c',
  inset: '#16161e'
};

/** Clinical bar hues only — no brand yellow/green/red. Rank → cool scale. */
const CLINICAL_BARS = ['#7aa2f7', '#7dcfff', '#89b4fa', '#a9b1d6', '#738fd9', '#565f89'];

const LANGUAGE_COLORS = {
  TypeScript: '#7aa2f7',
  JavaScript: '#7dcfff',
  Python: '#89b4fa',
  Dart: '#a9b1d6',
  HTML: '#9aa5ce',
  Vue: '#7dcfff',
  Go: '#7aa2f7',
  CSS: '#738fd9',
  Shell: '#a9b1d6',
  SVG: '#7dcfff'
};

const FONT_UI = 'Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif';
const FONT_NUM = 'ui-monospace, SFMono-Regular, Menlo, Consolas, Liberation Mono, monospace';

/** Shared card chrome: soft shadow + thin breath edge (glow only). */
function cardChrome(idPrefix, width, height, edgeColor = THEME.blue) {
  return `<defs>
    <filter id="${idPrefix}Shadow" x="-6%" y="-8%" width="112%" height="120%">
      <feDropShadow dx="0" dy="2" stdDeviation="3.5" flood-color="#000000" flood-opacity="0.35"/>
      <feDropShadow dx="0" dy="0" stdDeviation="2.5" flood-color="${edgeColor}" flood-opacity="0.18"/>
    </filter>
    <linearGradient id="${idPrefix}Edge" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="${THEME.blue}" stop-opacity="0.12"/>
      <stop offset="50%" stop-color="${THEME.cyan}" stop-opacity="0.55"/>
      <stop offset="100%" stop-color="${THEME.blue}" stop-opacity="0.12"/>
    </linearGradient>
  </defs>
  <g filter="url(#${idPrefix}Shadow)">
    <rect width="${width}" height="${height}" rx="14" fill="${THEME.bg}" stroke="${THEME.border}" stroke-width="1"/>
  </g>
  <rect x="20" y="1" width="${width - 40}" height="2" rx="1" fill="url(#${idPrefix}Edge)">
    ${breathOpacity(BREATH.border, '0.35;0.85;0.35')}
  </rect>`;
}

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

function shippingAssetName(repoName) {
  return `ship-${String(repoName).replace(/[^a-zA-Z0-9._-]/g, '-')}.svg`;
}

function productAssetName(repoName) {
  return `product-${String(repoName).replace(/[^a-zA-Z0-9._-]/g, '-')}.svg`;
}

/** Soft-wrap to ≤maxLen units, ≤maxLines lines. CJK glyphs count as ~1.7 units. */
export function wrapLines(text, maxLen = 44, maxLines = 2) {
  const raw = String(text || '').trim();
  if (!raw) return [];
  const units = (s) => [...s].reduce((n, ch) => n + (/[\u3400-\u9fff\uf900-\ufaff]/.test(ch) ? 1.7 : 1), 0);
  if (units(raw) <= maxLen) return [raw];
  const lines = [];
  let rest = raw;
  while (rest && lines.length < maxLines) {
    if (units(rest) <= maxLen) {
      lines.push(rest);
      rest = '';
      break;
    }
    let cut = 0;
    let w = 0;
    const chars = [...rest];
    for (let i = 0; i < chars.length; i += 1) {
      const add = /[\u3400-\u9fff\uf900-\ufaff]/.test(chars[i]) ? 1.7 : 1;
      if (w + add > maxLen) break;
      w += add;
      cut = i + 1;
    }
    let slice = chars.slice(0, cut).join('');
    const breakAt = Math.max(
      slice.lastIndexOf(' '),
      slice.lastIndexOf('，'),
      slice.lastIndexOf('。'),
      slice.lastIndexOf('、'),
      slice.lastIndexOf('·'),
      slice.lastIndexOf('-'),
      slice.lastIndexOf('/')
    );
    if (breakAt >= Math.floor(slice.length * 0.4)) {
      cut = breakAt + (slice[breakAt] === ' ' ? 0 : 1);
      slice = chars.slice(0, cut).join('');
    }
    let piece = slice.trim();
    rest = chars.slice(cut).join('').trim();
    // Avoid orphan tails (e.g. "水族馆。") — pull them onto this line when short.
    if (rest && units(rest) <= 10 && lines.length < maxLines - 1) {
      piece = (piece + (piece.endsWith('-') ? '' : ' ') + rest).trim();
      rest = '';
    } else if (rest && units(rest) <= 10 && lines.length === maxLines - 1) {
      piece = (piece + (piece.endsWith('-') ? '' : ' ') + rest).trim();
      rest = '';
    }
    if (lines.length === maxLines - 1 && rest) {
      piece = piece.replace(/[.,，。、\s]+$/u, '') + '…';
      rest = '';
    }
    lines.push(piece);
  }
  return lines;
}

/**
 * Product wall card — full SVG tile (no markdown H3 links → no cheap blue underline).
 * Light terminal strip for npx; breath only on chrome/edge.
 */
export function renderProductCardSvg(product) {
  const W = 420;
  const H = 208;
  const name = product?.name || 'project';
  const tag = product?.tag || 'CLI';
  const enLines = Array.isArray(product?.en) ? product.en : wrapLines(product?.en || '', 48, 2);
  const zhLines = Array.isArray(product?.zh) ? product.zh : wrapLines(product?.zh || '', 34, 2);
  const cmd = product?.cmd || `npx @webywz/${name}`;
  const id = `pw${name.replace(/[^a-zA-Z0-9]/g, '')}`;

  const enBlock = enLines.map((line, i) =>
    `<text x="22" y="${58 + i * 16}" fill="${THEME.fg}" font-size="12" font-weight="500" font-family="${FONT_UI}">${svgText(line)}</text>`
  ).join('\n  ');
  const zhY0 = 58 + enLines.length * 16 + 4;
  const zhBlock = zhLines.map((line, i) =>
    `<text x="22" y="${zhY0 + i * 16}" fill="${THEME.muted}" font-size="12" font-weight="500" font-family="${FONT_UI}">${svgText(line)}</text>`
  ).join('\n  ');

  const termY = 158;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${svgText(name)}">
  ${cardChrome(id, W, H, THEME.blue)}
  <text x="22" y="34" fill="${THEME.fgStrong}" font-size="15" font-weight="700" font-family="${FONT_UI}">${svgText(name)}</text>
  <rect x="${W - 58}" y="20" width="36" height="18" rx="9" fill="${THEME.inset}" stroke="${THEME.border}" stroke-width="1"/>
  <text x="${W - 40}" y="33" text-anchor="middle" fill="${THEME.cyan}" font-size="9" font-weight="600" font-family="${FONT_NUM}" letter-spacing="0.06em">${svgText(tag)}</text>
  ${enBlock}
  ${zhBlock}
  <rect x="18" y="${termY}" width="${W - 36}" height="34" rx="8" fill="${THEME.inset}" stroke="#292e42" stroke-width="1"/>
  <text x="30" y="${termY + 21}" font-family="${FONT_NUM}" font-size="12" fill="${THEME.blue}">›</text>
  <text x="46" y="${termY + 21}" font-family="${FONT_NUM}" font-size="12" fill="${THEME.fgStrong}">${svgText(cmd)}</text>
  <rect x="${46 + Math.min(cmd.length, 28) * 7.2}" y="${termY + 10}" width="7" height="14" rx="1.5" fill="${THEME.blue}">
    <animate attributeName="opacity" values="1;0.12;1" dur="1.1s" repeatCount="indefinite"/>
  </rect>
</svg>
`;
}

/**
 * Also-shipping card — same clinical chrome as product wall, compact (no terminal).
 */
export function renderShippingCardSvg(repo) {
  const W = 420;
  const H = 156;
  const name = repo?.name || 'project';
  const desc = resolveDescription(repo);
  const language = repo?.language || FALLBACK_LANGUAGES[name] || '—';
  const stars = Number.isFinite(repo?.stars) ? repo.stars : 0;
  const demo = DEMO_LINKS[name];
  const id = `sh${name.replace(/[^a-zA-Z0-9]/g, '')}`;
  const descLines = wrapLines(desc, 40, 2);

  const descBlock = descLines.map((line, i) =>
    `<text x="22" y="${58 + i * 17}" fill="${THEME.fg}" font-size="12" font-weight="500" font-family="${FONT_UI}">${svgText(line)}</text>`
  ).join('\n  ');

  const pillW = Math.max(52, 14 + language.length * 7.2);
  const demoBit = demo
    ? `<text x="396" y="132" text-anchor="end" fill="${THEME.blue}" font-size="11" font-weight="600" font-family="${FONT_UI}">${svgText(demo.label)} →</text>`
    : '';

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${svgText(name)}">
  ${cardChrome(id, W, H, THEME.cyan)}
  <text x="22" y="34" fill="${THEME.fgStrong}" font-size="15" font-weight="700" font-family="${FONT_UI}">${svgText(name)}</text>
  ${descBlock}
  <rect x="22" y="116" width="${pillW}" height="20" rx="10" fill="${THEME.inset}" stroke="${THEME.border}" stroke-width="1"/>
  <text x="${22 + pillW / 2}" y="130" text-anchor="middle" fill="${THEME.cyan}" font-size="10" font-weight="600" font-family="${FONT_NUM}">${svgText(language)}</text>
  <text x="${22 + pillW + 14}" y="130" fill="${THEME.fgStrong}" font-size="12" font-weight="600" font-family="${FONT_NUM}">★ ${svgText(stars)}</text>
  ${demoBit}
</svg>
`;
}

function projectCardMarkdown(repo) {
  const file = shippingAssetName(repo.name);
  const href = repo.htmlUrl || `https://github.com/${USERNAME}/${repo.name}`;
  return `<a href="${href}">
<img src="assets/${file}" width="420" height="156" alt="${escapeHtml(repo.name)}" />
</a>`;
}

/**
 * Rich 2-column Also-shipping cards — SVG tiles matching product wall language.
 */
export function generateProjectsMarkdown(repos) {
  const highlights = selectHighlightProjects(repos);

  if (highlights.length === 0) {
    return '暂无公开项目';
  }

  const cells = highlights.map((repo) => `<td width="50%" align="center" valign="top">

${projectCardMarkdown(repo)}

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

/** Product wall markdown table (hand section uses committed SVGs). */
export function generateProductWallMarkdown(products = PRODUCT_WALL) {
  const cells = products.map((p) => {
    const file = productAssetName(p.name);
    return `<td width="50%" align="center" valign="top">

<a href="${p.href}">
<img src="assets/${file}" width="420" height="208" alt="${escapeHtml(p.name)}" />
</a>

</td>`;
  });
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
<td width="50%" align="center" valign="top">
<img src="assets/stats.svg" width="420" height="188" alt="GitHub Stats" />
</td>
<td width="50%" align="center" valign="top">
<img src="assets/langs.svg" width="420" height="188" alt="Top Languages" />
</td>
</tr>
</table>

<img src="assets/streak.svg" width="852" height="148" alt="GitHub Streak" />

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

/** Shared breath: quieter than hero (3.8–4.8s). */
const BREATH = {
  border: '4.2s',
  number: '3.8s',
  bar: '4.6s',
  ring: '4.8s'
};

function breathOpacity(dur, values = '0.55;1;0.55', begin = '0s') {
  return `<animate attributeName="opacity" values="${values}" dur="${dur}" begin="${begin}" repeatCount="indefinite"/>`;
}

/**
 * Compute current / longest streak from contribution calendar days (oldest→newest).
 * Empty today does not break the streak; empty earlier days do.
 */
export function computeStreakFromDays(days = []) {
  const list = Array.isArray(days) ? days : [];
  let longest = 0;
  let run = 0;
  for (const day of list) {
    if ((day?.contributionCount || 0) > 0) {
      run += 1;
      longest = Math.max(longest, run);
    } else {
      run = 0;
    }
  }

  let idx = list.length - 1;
  if (idx >= 0 && (list[idx]?.contributionCount || 0) === 0) idx -= 1;
  let current = 0;
  for (let i = idx; i >= 0; i -= 1) {
    if ((list[i]?.contributionCount || 0) > 0) current += 1;
    else break;
  }

  return { current, longest };
}

export function renderStatsSvg(user = {}, repos = []) {
  const publicRepos = user.publicRepos ?? repos.length;
  const followers = user.followers ?? 0;
  const stars = repos.reduce((sum, repo) => sum + (repo.stars || 0), 0);
  const forks = repos.reduce((sum, repo) => sum + (repo.forks || 0), 0);
  const rows = [
    ['Repos', '仓库', publicRepos, THEME.blue],
    ['Stars', '星标', stars, THEME.cyan],
    ['Followers', '关注', followers, THEME.blue],
    ['Forks', '派生', forks, THEME.cyan]
  ];

  const W = 420;
  const H = 188;
  const rowStart = 56;
  const rowGap = 30;

  const itemsFixed = rows.map(([en, zh, value, color], index) => {
    const y = rowStart + index * rowGap;
    const delay = `${(index * 0.18).toFixed(2)}s`;
    const rule = index < rows.length - 1
      ? `<line x1="36" y1="${y + 14}" x2="396" y2="${y + 14}" stroke="${THEME.border}" stroke-opacity="0.28" stroke-width="1"/>`
      : '';
    return `<rect x="22" y="${y - 11}" width="3" height="16" rx="1.5" fill="${color}">
    ${breathOpacity(BREATH.number, '0.45;0.85;0.45', delay)}
  </rect>
  <text x="36" y="${y}" font-size="13" font-family="${FONT_UI}"><tspan fill="${THEME.fgStrong}" font-weight="600">${svgText(en)}</tspan><tspan fill="${THEME.muted}" font-weight="500"> · ${svgText(zh)}</tspan></text>
  <text x="396" y="${y}" text-anchor="end" fill="${THEME.fgStrong}" font-size="15" font-weight="600" font-family="${FONT_NUM}" letter-spacing="0.05em">${svgText(value)}</text>
  ${rule}`;
  }).join('\n  ');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="GitHub Stats">
  ${cardChrome('stats', W, H, THEME.blue)}
  <text x="22" y="30" fill="${THEME.blue}" font-size="13" font-weight="700" font-family="${FONT_UI}" letter-spacing="0.08em">STATS</text>
  <text x="74" y="30" fill="${THEME.muted}" font-size="13" font-weight="500" font-family="${FONT_UI}">· 统计</text>
  <text x="396" y="30" text-anchor="end" fill="${THEME.muted}" font-size="10" font-family="${FONT_UI}" letter-spacing="0.08em">tokyo-night</text>
  ${itemsFixed}
</svg>
`;
}

export function renderLangsSvg(repos = []) {
  const langs = aggregateLanguages(repos);
  const W = 420;
  const H = 188;
  const barX = 112;
  const barMax = 236;
  const pctX = 396;

  const bars = langs.length === 0
    ? `<text x="22" y="100" fill="${THEME.muted}" font-size="13" font-family="${FONT_UI}">暂无语言数据 · no language data</text>`
    : langs.map((lang, index) => {
      const y = 56 + index * 24;
      const width = Math.max(6, Math.round((lang.pct / 100) * barMax));
      const color = CLINICAL_BARS[index % CLINICAL_BARS.length];
      const delay = `${(index * 0.16).toFixed(2)}s`;
      return `<text x="22" y="${y}" fill="${THEME.fgStrong}" font-size="12" font-weight="500" font-family="${FONT_UI}">${svgText(lang.name)}</text>
  <rect x="${barX}" y="${y - 8}" width="${barMax}" height="7" rx="3.5" fill="${THEME.track}"/>
  <rect x="${barX}" y="${y - 8}" width="${width}" height="7" rx="3.5" fill="${color}" opacity="0.9">
    ${breathOpacity(BREATH.bar, '0.75;0.95;0.75', delay)}
  </rect>
  <text x="${pctX}" y="${y}" text-anchor="end" fill="${THEME.muted}" font-size="11" font-weight="600" font-family="${FONT_NUM}" letter-spacing="0.04em">${lang.pct}%</text>`;
    }).join('\n  ');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Top Languages">
  ${cardChrome('langs', W, H, THEME.cyan)}
  <text x="22" y="30" fill="${THEME.cyan}" font-size="13" font-weight="700" font-family="${FONT_UI}" letter-spacing="0.08em">LANGUAGES</text>
  <text x="118" y="30" fill="${THEME.muted}" font-size="13" font-weight="500" font-family="${FONT_UI}">· 语言</text>
  <text x="396" y="30" text-anchor="end" fill="${THEME.muted}" font-size="10" font-family="${FONT_UI}" letter-spacing="0.08em">tokyo-night</text>
  ${bars}
</svg>
`;
}

/**
 * Local tokyo-night streak card — compact dashboard tile aligned to dual-card width.
 * @param {{ current?: number, longest?: number, total?: number }} streak
 */
export function renderStreakSvg(streak = {}) {
  const current = Number.isFinite(streak.current) ? streak.current : 0;
  const longest = Number.isFinite(streak.longest) ? streak.longest : current;
  const total = Number.isFinite(streak.total) ? streak.total : 0;
  const ringMax = Math.max(longest, 1);
  const progress = Math.min(1, current / ringMax);
  const r = 34;
  const c = 2 * Math.PI * r;
  const dash = Math.max(6, Math.round(c * progress * 0.75));
  const gap = Math.round(c - dash);
  const W = 852;
  const H = 148;

  // Equal metric columns after the ring (ring occupies ~0–160).
  const colXs = [198, 420, 642];
  const metrics = [
    { labelEn: 'Current', labelZh: '当前', value: current, unit: 'days', color: THEME.cyan },
    { labelEn: 'Longest', labelZh: '最长', value: longest, unit: 'days', color: THEME.blue },
    { labelEn: 'Total', labelZh: '本年', value: total, unit: 'contribs', color: THEME.fgStrong }
  ];

  const dividers = [350, 572].map((x) =>
    `<line x1="${x}" y1="48" x2="${x}" y2="128" stroke="${THEME.border}" stroke-opacity="0.4" stroke-width="1"/>`
  ).join('\n  ');

  const metricBlocks = metrics.map((m, index) => {
    const x = colXs[index];
    const delay = `${(index * 0.18).toFixed(2)}s`;
    return `<text x="${x}" y="60" fill="${THEME.muted}" font-size="11" font-weight="500" font-family="${FONT_UI}">${svgText(m.labelEn)} · ${svgText(m.labelZh)}</text>
    <text x="${x}" y="94" fill="${m.color}" font-size="28" font-weight="600" font-family="${FONT_NUM}" letter-spacing="0.04em">${svgText(m.value)}</text>
    <text x="${x}" y="114" fill="${THEME.muted}" font-size="10" font-weight="500" font-family="${FONT_UI}">${svgText(m.unit)}</text>
    <rect x="${x}" y="122" width="40" height="2" rx="1" fill="${m.color}" opacity="0.5">
      ${breathOpacity(BREATH.border, '0.3;0.7;0.3', delay)}
    </rect>`;
  }).join('\n    ');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="GitHub Streak">
  ${cardChrome('streak', W, H, THEME.blue)}
  <defs>
    <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${THEME.blue}"/>
      <stop offset="100%" stop-color="${THEME.cyan}"/>
    </linearGradient>
    <filter id="ringGlow" x="-40%" y="-40%" width="180%" height="180%">
      <feDropShadow dx="0" dy="0" stdDeviation="2.5" flood-color="${THEME.cyan}" flood-opacity="0.32"/>
    </filter>
  </defs>
  <text x="22" y="28" fill="${THEME.blue}" font-size="13" font-weight="700" font-family="${FONT_UI}" letter-spacing="0.08em">STREAK</text>
  <text x="86" y="28" fill="${THEME.muted}" font-size="13" font-weight="500" font-family="${FONT_UI}">· 连续</text>
  <text x="830" y="28" text-anchor="end" fill="${THEME.muted}" font-size="10" font-family="${FONT_UI}" letter-spacing="0.08em">tokyo-night · ${svgText(USERNAME)}</text>

  <g transform="translate(88, 90)" filter="url(#ringGlow)">
    <circle cx="0" cy="0" r="${r}" fill="none" stroke="${THEME.track}" stroke-width="6"/>
    <circle cx="0" cy="0" r="${r}" fill="none" stroke="url(#ringGrad)" stroke-width="6"
      stroke-linecap="round" stroke-dasharray="${dash} ${gap}" transform="rotate(-90)">
      <animate attributeName="stroke-opacity" values="0.55;1;0.55" dur="${BREATH.ring}" repeatCount="indefinite"/>
    </circle>
    <circle cx="0" cy="0" r="22" fill="${THEME.inset}" stroke="${THEME.blue}" stroke-width="1" stroke-opacity="0.25"/>
    <text x="0" y="5" text-anchor="middle" fill="${THEME.fgStrong}" font-size="17" font-weight="600" font-family="${FONT_NUM}" letter-spacing="0.04em">${svgText(current)}</text>
  </g>

  ${dividers}
  <g>
    ${metricBlocks}
  </g>
</svg>
`;
}

export function writeProductWallAssets(rootDir = ROOT_DIR, products = PRODUCT_WALL) {
  const assetsDir = join(rootDir, 'assets');
  mkdirSync(assetsDir, { recursive: true });
  for (const product of products) {
    writeFileSync(
      join(assetsDir, productAssetName(product.name)),
      renderProductCardSvg(product),
      'utf-8'
    );
  }
}

export function writeShippingAssets(repos, rootDir = ROOT_DIR) {
  const assetsDir = join(rootDir, 'assets');
  mkdirSync(assetsDir, { recursive: true });
  const highlights = selectHighlightProjects(repos);
  for (const repo of highlights) {
    writeFileSync(
      join(assetsDir, shippingAssetName(repo.name)),
      renderShippingCardSvg(repo),
      'utf-8'
    );
  }
  return highlights;
}

export function writeGeneratedAssets(data, rootDir = ROOT_DIR) {
  const assetsDir = join(rootDir, 'assets');
  mkdirSync(assetsDir, { recursive: true });
  writeFileSync(join(assetsDir, 'stats.svg'), renderStatsSvg(data.user, data.repos), 'utf-8');
  writeFileSync(join(assetsDir, 'langs.svg'), renderLangsSvg(data.repos), 'utf-8');
  writeFileSync(
    join(assetsDir, 'streak.svg'),
    renderStreakSvg(data.streak || {}),
    'utf-8'
  );
  writeProductWallAssets(rootDir);
  writeShippingAssets(data.repos || [], rootDir);
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

/**
 * Pull contribution calendar via GraphQL when a token is available.
 * Falls back to a clean placeholder the next refresh can overwrite.
 */
export async function fetchContributionStreak(headers = {}) {
  const placeholder = { current: 0, longest: 0, total: 0 };
  if (!GITHUB_TOKEN && !headers.Authorization) {
    return placeholder;
  }

  const query = `query($login: String!) {
    user(login: $login) {
      contributionsCollection {
        contributionCalendar {
          totalContributions
          weeks {
            contributionDays {
              date
              contributionCount
            }
          }
        }
      }
    }
  }`;

  try {
    const response = await fetch('https://api.github.com/graphql', {
      method: 'POST',
      headers: {
        ...headers,
        Accept: 'application/vnd.github+json',
        'Content-Type': 'application/json',
        Authorization: headers.Authorization || `bearer ${GITHUB_TOKEN}`
      },
      body: JSON.stringify({ query, variables: { login: USERNAME } })
    });
    if (!response.ok) {
      console.warn(`⚠️ streak GraphQL HTTP ${response.status} — using placeholder`);
      return placeholder;
    }
    const payload = await response.json();
    const calendar = payload?.data?.user?.contributionsCollection?.contributionCalendar;
    if (!calendar) {
      console.warn('⚠️ streak GraphQL returned no calendar — using placeholder');
      return placeholder;
    }
    const days = (calendar.weeks || []).flatMap((week) => week.contributionDays || []);
    const { current, longest } = computeStreakFromDays(days);
    return {
      current,
      longest,
      total: calendar.totalContributions || 0
    };
  } catch (error) {
    console.warn(`⚠️ streak fetch failed: ${error.message}`);
    return placeholder;
  }
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

  const streak = await fetchContributionStreak(headers);

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
    streak,
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
