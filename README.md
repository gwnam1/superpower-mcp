# Superpowers MCP Server

An MCP (Model Context Protocol) server that brings the powerful [Superpowers](https://github.com/obra/superpowers) skills library to AI coding assistants like Antigravity, Claude Code, and Cursor. Access proven workflows, expert techniques, and best practices directly in your development environment.

[한국어 가이드는 여기를 클릭하세요 (README_KR.md)](./README_KR.md)

---

## What is This?

This MCP server exposes the Superpowers skills library as tools. Skills are expert-crafted workflows and processes that guide AI assistants to produce better results.

**Available Tools:**
- `find_skills` - List all available skills from both the superpowers library and your personal skills
- `use_skill` - Load a specific skill to guide your work

## Prerequisites

- **Node.js** v18 or higher
- **Git**
- **Homebrew** (Recommended for macOS)

```bash
# Install Node.js on macOS
brew install node
```

## Setup & Configuration

### 1. Installation

Clone this repository to your workspace or a suitable folder.

```bash
cd ~/your-workspace
git clone https://github.com/jmcdice/superpower-mcp.git
cd superpower-mcp
npm install
```

### 2. Connect Skills Data

Clone the original Superpowers skills library to the standard directory:

```bash
mkdir -p ~/.augment
git clone https://github.com/obra/superpowers.git ~/.augment/superpowers
mkdir -p ~/.augment/skills # For your personal custom skills
```

### 3. Add to MCP Config (`mcp_config.json`)

Add the following entry to your MCP configuration. Make sure to use **absolute paths**.

```json
{
  "mcpServers": {
    "superpowers": {
      "command": "/opt/homebrew/bin/node", 
      "args": [
        "/Users/YOUR_USER/PATH_TO_REPO/superpowers-mcp.js"
      ]
    }
  }
}
```

## Usage

Ask your AI agent:
- "What skills are available?"
- "Use the brainstorming skill to help me plan this feature."

## Management & Updates

### Update Skills
To get the latest skills from the upstream repository:
```bash
cd ~/.augment/superpowers
git pull
```

## History & Changelog

- **v1.1.0 (Current)**:
  - Full localization (Korean & English) for server code, comments, and tool descriptions.
  - Enhanced documentation with detailed setup guides.
  - General MCP support (Mac absolute path examples).
  - Cleaned up redundant install scripts.
- **v1.0.0**: 
  - Originally modified and enhanced from [jmcdice/superpower-mcp](https://github.com/jmcdice/superpower-mcp).
  - Integrated [obra/superpowers](https://github.com/obra/superpowers) as the backend skills library.

## License
MIT License. The upstream Superpowers repository by [Jesse Vincent](https://github.com/obra) has its own license.
