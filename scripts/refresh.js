#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = join(__dirname, '..');

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const USERNAME = 'webywz';

/**
 * 从 GitHub API 获取用户数据
 */
async function fetchGitHubData() {
  const headers = {
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'webywz-profile-bot'
  };
  
  if (GITHUB_TOKEN) {
    headers['Authorization'] = `token ${GITHUB_TOKEN}`;
  }

  try {
    // 获取用户信息
    const userResponse = await fetch(`https://api.github.com/users/${USERNAME}`, { headers });
    if (!userResponse.ok) {
      throw new Error(`Failed to fetch user data: ${userResponse.status}`);
    }
    const user = await userResponse.json();

    // 获取仓库列表（按更新时间排序，只取公开仓库）
    const reposResponse = await fetch(
      `https://api.github.com/users/${USERNAME}/repos?sort=updated&per_page=100`,
      { headers }
    );
    if (!reposResponse.ok) {
      throw new Error(`Failed to fetch repos: ${reposResponse.status}`);
    }
    const repos = await reposResponse.json();

    // 过滤和处理仓库数据
    const processedRepos = repos
      .filter(repo => !repo.fork && !repo.private) // 只要非fork的公开仓库
      .map(repo => ({
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
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)); // 按更新时间降序

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
  } catch (error) {
    console.error('Error fetching GitHub data:', error);
    throw error;
  }
}

/**
 * 选择要高亮展示的项目
 */
function selectHighlightProjects(repos) {
  // 优先选择有stars或最近更新的项目
  const featured = ['nest-admin', 'lumi-relay', 'learn-fastapi', 'ClipboardHistoryMac'];
  
  const highlightRepos = [];
  
  // 先添加特色项目
  for (const name of featured) {
    const repo = repos.find(r => r.name === name);
    if (repo) {
      highlightRepos.push(repo);
    }
  }
  
  // 如果还不够，添加其他有stars的项目
  const remaining = repos
    .filter(r => !featured.includes(r.name) && r.stars > 0)
    .slice(0, 6 - highlightRepos.length);
  
  highlightRepos.push(...remaining);
  
  return highlightRepos.slice(0, 6); // 最多6个
}

/**
 * 生成项目列表的 Markdown
 */
function generateProjectsMarkdown(repos) {
  const highlights = selectHighlightProjects(repos);
  
  if (highlights.length === 0) {
    return '暂无公开项目';
  }
  
  return highlights.map(repo => {
    let line = `### [${repo.name}](${repo.htmlUrl})`;
    if (repo.description) {
      line += `\n${repo.description}`;
    }
    if (repo.language) {
      line += `\n- **语言：** ${repo.language}`;
    }
    if (repo.stars > 0) {
      line += ` | ⭐ ${repo.stars}`;
    }
    return line;
  }).join('\n\n');
}

/**
 * 获取上海时区的时间字符串
 */
function getShanghaiTime() {
  const now = new Date();
  // 转换为上海时区 (UTC+8)
  const shanghaiTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Shanghai' }));
  return shanghaiTime.toISOString().replace('T', ' ').split('.')[0];
}

/**
 * 更新 README.md 中的标记区域
 */
function updateReadme(data) {
  const readmePath = join(ROOT_DIR, 'README.md');
  let readme = readFileSync(readmePath, 'utf-8');
  
  // 更新项目列表
  const projectsMarkdown = generateProjectsMarkdown(data.repos);
  readme = readme.replace(
    /<!--PROJECTS:START-->[\s\S]*?<!--PROJECTS:END-->/,
    `<!--PROJECTS:START-->\n${projectsMarkdown}\n<!--PROJECTS:END-->`
  );
  
  // 更新时间戳
  const timestamp = getShanghaiTime();
  readme = readme.replace(
    /<!--TIMESTAMP:START-->[\s\S]*?<!--TIMESTAMP:END-->/,
    `<!--TIMESTAMP:START-->\n*最后更新：${timestamp} (Asia/Shanghai)*\n<!--TIMESTAMP:END-->`
  );
  
  writeFileSync(readmePath, readme, 'utf-8');
  console.log('✅ README.md 已更新');
}

/**
 * 保存数据到 profile.json
 */
function saveProfileData(data) {
  const dataPath = join(ROOT_DIR, 'data', 'profile.json');
  writeFileSync(dataPath, JSON.stringify(data, null, 2), 'utf-8');
  console.log('✅ profile.json 已保存');
}

/**
 * 主函数
 */
async function main() {
  try {
    console.log('🔄 开始刷新 GitHub profile...');
    console.log(`📡 获取用户 ${USERNAME} 的数据...`);
    
    const data = await fetchGitHubData();
    
    console.log(`✅ 成功获取 ${data.repos.length} 个仓库`);
    
    // 保存数据
    saveProfileData(data);
    
    // 更新 README
    updateReadme(data);
    
    console.log('✨ 刷新完成！');
  } catch (error) {
    console.error('❌ 刷新失败:', error);
    process.exit(1);
  }
}

main();
