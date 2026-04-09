# Superpowers MCP Server (한국어 가이드)

이 문서는 [Superpowers](https://github.com/obra/superpowers) 스킬 라이브러리를 Antigravity, Claude Code, Cursor 등의 AI 에이전트에서 도구로 사용할 수 있게 해주는 MCP 서버 설정 가이드입니다.

[English README satisfies here](./README.md)

---

## 🚀 무엇을 위한 서비스인가요?

이 MCP 서버는 전문가들이 설계한 개발 프로세스와 워크플로우(Skills)를 AI 에이전트가 직접 호출할 수 있는 '도구'로 제공합니다. 이를 통해 더 정교한 기획과 체계적인 디버깅이 가능해집니다.

**제공되는 도구:**
- `find_skills`: 사용 가능한 모든 스킬(기본 라이브러리 + 개인 커스텀 스킬) 목록을 확인합니다.
- `use_skill`: 특정 스킬을 불러와서 현재 작업에 적용합니다.

## 🛠️ 사전 준비 사항

- **Node.js**: v18 이상 (런타임)
- **Git**: 레포지토리 동기화용
- **Homebrew**: Mac 사용자용 패키지 관리자 (권장)

```bash
# macOS에서 Node.js 설치
brew install node
```

## 📦 설치 및 설정 (Setup)

### 1. 브릿지 서버 설치
AI 에이전트가 상주하는 폴더에 본 레포지토리를 복제하고 의존성을 설치합니다.

```bash
cd ~/your-workspace
git clone https://github.com/jmcdice/superpower-mcp.git
cd superpower-mcp
npm install
```

### 2. 스킬 데이터 연결
오리지널 Superpowers 스킬 폴더를 표준 경로에 동기화합니다.

```bash
mkdir -p ~/.augment
git clone https://github.com/obra/superpowers.git ~/.augment/superpowers
mkdir -p ~/.augment/skills # 개인 커스텀 스킬용 폴더
```

### 3. MCP 설정 등록 (`mcp_config.json`)
사용 중인 에이전트 설정 파일에 아래 내용을 추가하세요. 반드시 **절대 경로**를 사용해야 합니다.

```json
{
  "mcpServers": {
    "superpowers": {
      "command": "/opt/homebrew/bin/node", 
      "args": [
        "/Users/사용자계정/경로/superpower-mcp/superpowers-mcp.js"
      ]
    }
  }
}
```

## 💡 사용 예시

에이전트에게 다음과 같이 물어보세요:
- "어떤 **superpowers 스킬**들이 있어?"
- "**brainstorming** 스킬을 사용해서 이 기능 개발을 도와줘."

## 🔄 업데이트 및 관리

### 스킬 업데이트
원본 라이브러리에 새로운 지침이 추가되면 아래 명령으로 즉시 업데이트할 수 있습니다.
```bash
cd ~/.augment/superpowers
git pull
```

## 히스토리 및 변경 사항 (History)

- **v1.1.0 (현재)**:
  - 서버 코드, 주석, 도구 설명 전체 한글화 및 영문 보강.
  - 상세한 설치 가이드(`README_KR.md`) 추가.
  - 범용 MCP 지원 강화 (Mac 절대 경로 예시 포함).
  - 불필요한 레거시 스크립트 정리.
- **v1.0.0**: 
  - [jmcdice/superpower-mcp](https://github.com/jmcdice/superpower-mcp) 프로젝트를 기반으로 초기 환경 구축 및 수정.
  - [obra/superpowers](https://github.com/obra/superpowers) 스킬 라이브러리 연동.

---
*Jesse Vincent의 Superpowers 프로젝트를 기반으로 구현되었습니다.*
