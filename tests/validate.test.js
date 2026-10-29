#!/usr/bin/env node

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

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
        const repo = data.repos[0];
        assert(repo.name !== undefined, '第一个 repo 有 name 字段');
        assert(repo.htmlUrl !== undefined, '第一个 repo 有 htmlUrl 字段');
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
  
  // 检查必需的标记
  assert(
    readme.includes('<!--PROJECTS:START-->'),
    'README 包含 PROJECTS:START 标记'
  );
  assert(
    readme.includes('<!--PROJECTS:END-->'),
    'README 包含 PROJECTS:END 标记'
  );
  assert(
    readme.includes('<!--TIMESTAMP:START-->'),
    'README 包含 TIMESTAMP:START 标记'
  );
  assert(
    readme.includes('<!--TIMESTAMP:END-->'),
    'README 包含 TIMESTAMP:END 标记'
  );
  assert(
    readme.includes('<!--STATS:START-->'),
    'README 包含 STATS:START 标记'
  );
  assert(
    readme.includes('<!--STATS:END-->'),
    'README 包含 STATS:END 标记'
  );
  
  // 检查必需的内容
  assert(
    readme.includes('关于我') || readme.includes('About'),
    'README 包含介绍部分'
  );
  assert(
    readme.length > 100,
    'README 有实质性内容（>100 字符）'
  );
  
  // 检查项目部分不为空
  const projectsMatch = readme.match(/<!--PROJECTS:START-->([\s\S]*?)<!--PROJECTS:END-->/);
  if (projectsMatch) {
    const projectsContent = projectsMatch[1].trim();
    assert(
      projectsContent.length > 0,
      'PROJECTS 部分有内容'
    );
  }
  
  // 检查时间戳部分不为空
  const timestampMatch = readme.match(/<!--TIMESTAMP:START-->([\s\S]*?)<!--TIMESTAMP:END-->/);
  if (timestampMatch) {
    const timestampContent = timestampMatch[1].trim();
    assert(
      timestampContent.length > 0,
      'TIMESTAMP 部分有内容'
    );
  }
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
      assert(
        startIdx < endIdx,
        `${start} 在 ${end} 之前`
      );
    }
  }
}

function runAllTests() {
  console.log('🧪 开始运行测试...\n');
  console.log('=' .repeat(50));
  
  testProfileJsonSchema();
  testReadmeStructure();
  testMarkerIntegrity();
  
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
