#!/usr/bin/env node

/**
 * [English]
 * Superpowers MCP Server (Enhanced & Localized)
 * 
 * This server acts as a bridge between the Superpowers skills library (expert prompt engineering frameworks)
 * and MCP-compatible AI agents. It allows the AI to discover and "load" professional workflows.
 * 
 * [한국어]
 * Superpowers MCP 서버 (기능 강화 및 한글화 버전)
 * 
 * 이 서버는 전문가들이 설계한 프롬프트 엔지니어링 프레임워크인 'Superpowers' 스킬 라이브러리와
 * MCP 호환 AI 에이전트를 연결하는 브릿지 역할을 합니다. AI가 전문적인 워크플로우를 스스로 찾고 적용할 수 있게 돕습니다.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';

// --- 환경 설정 (Environment Setup) ---

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const homeDir = os.homedir();
// 기본 스킬 저장 경로 (Default paths for skills)
const superpowersSkillsDir = path.join(homeDir, '.augment/superpowers/skills');
const personalSkillsDir = path.join(homeDir, '.augment/skills');

/**
 * [English] Extract YAML frontmatter (metadata) from a skill file.
 * [한국어] 스킬 파일 상단의 YAML 메타데이터(이름, 설명 등)를 추출합니다.
 */
function extractFrontmatter(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');

    let inFrontmatter = false;
    let name = '';
    let description = '';

    for (const line of lines) {
      if (line.trim() === '---') {
        if (inFrontmatter) break;
        inFrontmatter = true;
        continue;
      }

      if (inFrontmatter) {
        const match = line.match(/^(\w+):\s*(.*)$/);
        if (match) {
          const [, key, value] = match;
          if (key === 'name') name = value.trim();
          if (key === 'description') description = value.trim();
        }
      }
    }

    return { name, description };
  } catch (error) {
    return { name: '', description: '' };
  }
}

/**
 * [English] Strip YAML frontmatter to return only the raw instructions content.
 * [한국어] 메타데이터 부분을 제외한 순수 지침(Content) 내용만 반환합니다.
 */
function stripFrontmatter(content) {
  const lines = content.split('\n');
  let inFrontmatter = false;
  let frontmatterEnded = false;
  const contentLines = [];

  for (const line of lines) {
    if (line.trim() === '---') {
      if (inFrontmatter) {
        frontmatterEnded = true;
        continue;
      }
      inFrontmatter = true;
      continue;
    }

    if (frontmatterEnded || !inFrontmatter) {
      contentLines.push(line);
    }
  }

  return contentLines.join('\n').trim();
}

/**
 * [English] Recursively find all 'SKILL.md' files in a given directory.
 * [한국어] 지정된 디렉토리 내에서 모든 'SKILL.md' 파일을 재귀적으로 검색합니다.
 */
function findSkillsInDir(dir, sourceType, maxDepth = 3) {
  const skills = [];

  if (!fs.existsSync(dir)) return skills;

  function recurse(currentDir, depth) {
    if (depth > maxDepth) return;

    const entries = fs.readdirSync(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);

      if (entry.isDirectory()) {
        const skillFile = path.join(fullPath, 'SKILL.md');
        if (fs.existsSync(skillFile)) {
          const { name, description } = extractFrontmatter(skillFile);
          skills.push({
            path: fullPath,
            skillFile: skillFile,
            name: name || entry.name,
            description: description || '',
            sourceType: sourceType,
            dirName: entry.name
          });
        }

        recurse(fullPath, depth + 1);
      }
    }
  }

  recurse(dir, 0);
  return skills;
}

/**
 * [English] Resolve a requested skill name to its physical file path on the disk.
 * [한국어] 요청된 스킬 이름을 실제 디스크 상의 파일 경로로 연결합니다.
 */
function resolveSkillPath(skillName) {
  const forceSuperpowers = skillName.startsWith('superpowers:');
  const actualSkillName = forceSuperpowers ? skillName.replace(/^superpowers:/, '') : skillName;

  // 1. 개인 스킬 먼저 확인 (Personal skills first)
  if (!forceSuperpowers && personalSkillsDir) {
    const personalPath = path.join(personalSkillsDir, actualSkillName);
    const personalSkillFile = path.join(personalPath, 'SKILL.md');
    if (fs.existsSync(personalSkillFile)) {
      return {
        skillFile: personalSkillFile,
        sourceType: 'personal',
        skillPath: actualSkillName
      };
    }
  }

  // 2. Superpowers 공식 스킬 확인 (Official Superpowers skills)
  if (superpowersSkillsDir) {
    const superpowersPath = path.join(superpowersSkillsDir, actualSkillName);
    const superpowersSkillFile = path.join(superpowersPath, 'SKILL.md');
    if (fs.existsSync(superpowersSkillFile)) {
      return {
        skillFile: superpowersSkillFile,
        sourceType: 'superpowers',
        skillPath: actualSkillName
      };
    }
  }

  return null;
}

// --- MCP 서버 로직 (MCP Server Logic) ---

const server = new Server(
  {
    name: 'superpowers-localized',
    version: '1.1.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

/**
 * [English] Tool Definitions: Explains what AI can do with this server.
 * [한국어] 도구 정의: AI 에이전트가 이 서버를 통해 무엇을 할 수 있는지 정의합니다.
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
  const tools = [
    {
      name: 'find_skills',
      description: `[EN] List all available expert skills (workflows) in the library. Use this to discover which methodologies (like brainstorming, TDD, debugging) the agent can perform.
[KR] 사용 가능한 모든 전문가 스킬(워크플로우) 목록을 출력합니다. 브레인스토밍, TDD, 디버깅 등 에이전트가 수행할 수 있는 전문 방법론을 찾을 때 사용하세요.`,
      inputSchema: {
        type: 'object',
        properties: {},
        required: []
      }
    },
    {
      name: 'use_skill',
      description: `[EN] Master tool to active a specific expert methodology. This tool loads the full instructions, constraints, and professional techniques for the chosen skill. Use it before starting a complex task.
[KR] 특정 전문가 방법론을 활성화하는 핵심 도구입니다. 선택한 스킬에 대한 전체 지침, 제약 조건 및 전문 기술을 로드합니다. 복잡한 작업을 시작하기 전에 반드시 호출하여 지침을 숙지하세요.`,
      inputSchema: {
        type: 'object',
        properties: {
          skill_name: {
            type: 'string',
            description: '[EN] Full name of the skill (e.g., "superpowers:brainstorming"). [KR] 사용할 스킬의 전체 이름 (예: "superpowers:brainstorming")'
          }
        },
        required: ['skill_name']
      }
    }
  ];

  return { tools };
});

/**
 * [English] Tool Handler: Executes the requested tool.
 * [한국어] 도구 핸들러: 요청된 도구 기능을 실제로 실행합니다.
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  // 1. find_skills: 스킬 목록 조회 (Listing all skills)
  if (name === 'find_skills') {
    const personalSkills = findSkillsInDir(personalSkillsDir, 'personal', 3);
    const superpowersSkills = findSkillsInDir(superpowersSkillsDir, 'superpowers', 3);
    const allSkills = [...personalSkills, ...superpowersSkills];

    if (allSkills.length === 0) {
      return {
        content: [{
          type: 'text',
          text: `[EN] No skills found. Please ensure skills are installed in ~/.augment/superpowers/skills/
[KR] 스킬을 찾을 수 없습니다. 지침 파일들이 ~/.augment/superpowers/skills/ 경로에 있는지 확인하세요.`
        }]
      };
    }

    let output = '=== Available Expert Skills (사용 가능한 전문가 스킬 목록) ===\n\n';

    for (const skill of allSkills) {
      const namespace = skill.sourceType === 'personal' ? '' : 'superpowers:';
      const skillName = skill.name || path.basename(skill.path);

      output += `📍 ${namespace}${skillName}\n`;
      if (skill.description) {
        output += `   Description/설명: ${skill.description}\n`;
      }
      output += `   Path/경로: ${skill.path}\n\n`;
    }

    return {
      content: [{ type: 'text', text: output }]
    };
  }

  // 2. use_skill: 특정 스킬 로드 (Loading a specific skill)
  if (name === 'use_skill') {
    const { skill_name } = args;
    const resolved = resolveSkillPath(skill_name);

    if (!resolved) {
      return {
        content: [{
          type: 'text',
          text: `[EN] Error: Skill "${skill_name}" not found. Run find_skills to see available skills.
[KR] 오류: "${skill_name}" 스킬을 찾을 수 없습니다. find_skills를 실행해 목록을 확인하세요.`
        }]
      };
    }

    const fullContent = fs.readFileSync(resolved.skillFile, 'utf8');
    const { name: skillDisplayName, description } = extractFrontmatter(resolved.skillFile);
    const content = stripFrontmatter(fullContent);
    const skillDirectory = path.dirname(resolved.skillFile);

    // AI에게 전달될 헤더 (Header provided to the AI agent)
    const skillHeader = `
################################################################################
# SKILL ACTIVATED: ${skillDisplayName || skill_name}
# DESCRIPTION: ${description || ''}
# 
# [English] You are now operating under the following professional framework. 
# Follow the instructions below strictly to achieve expert results.
# [한국어] 당신은 이제 다음의 전문가 프레임워크 하에 동작합니다. 
# 전문가 수준의 결과를 위해 아래 지침을 엄격히 준수하십시오.
################################################################################
`;

    return {
      content: [{ type: 'text', text: `${skillHeader}\n\n${content}` }]
    };
  }

  throw new Error(`Unknown tool: ${name}`);
});

/**
 * [English] Server Execution
 * [한국어] 서버 실행
 */
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Superpowers Localized MCP server running on stdio');
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});
