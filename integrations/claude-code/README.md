# Claude Code Integration

This directory contains the Claude Code skill definition for ZenTao AI Development Workflow.

## Installation

### 1. Prerequisites

Ensure you have installed the base requirements:
- Node.js >= 16
- zentao-cli
- Git

See [main installation guide](../../docs/installation.md) for detailed setup.

### 2. Install the Skill

Copy the skill to Claude Code's skills directory:

```bash
# Create skills directory if not exists
mkdir -p ~/.claude/skills/zentao-auto-workflow

# Copy the skill file
cp integrations/claude-code/SKILL.md ~/.claude/skills/zentao-auto-workflow/

# Copy download script to tools directory
mkdir -p ~/.claude/tools/zentao-mcp/scripts
cp tools/downloadBugImages.ts ~/.claude/tools/zentao-mcp/scripts/
```

### 3. Install zentao-mcp (Screenshot Downloader)

```bash
cd ~/.claude/tools
git clone https://github.com/dyno-nexsoft/zentao_mcp.git
cd zentao-mcp
npm install
```

### 4. Configure Credentials

Create credentials file:

```bash
mkdir -p ~/.claude/config
nano ~/.claude/config/zentao-mcp.env
```

Add your ZenTao credentials:

```env
ZENTAO_BASE_URL=https://your-zentao-site.com/zentao/api.php/v1
ZENTAO_ACCOUNT=your-username
ZENTAO_PASSWORD=your-password
ZENTAO_ALLOW_INSECURE_SSL=false
```

Set proper permissions:

```bash
chmod 600 ~/.claude/config/zentao-mcp.env
```

### 5. Verify Installation

Test zentao-cli:

```bash
zentao --version
zentao login
```

Test download script:

```bash
cd ~/.claude/tools/zentao-mcp
npx tsx scripts/downloadBugImages.ts --help
```

## Usage

In Claude Code, trigger the skill by asking:

- "Process ZenTao bugs from project 5"
- "Fix bug #123 from ZenTao"
- "Develop story #456 from ZenTao"
- "Handle ZenTao task #789"

The workflow will automatically:
1. List and confirm tasks with you
2. Fetch details and download screenshots if needed
3. Analyze and report findings
4. Wait for your approval
5. Implement changes after approval
6. Guide you through testing and committing

## Workflow Details

See [workflow documentation](../../docs/workflow.md) for detailed steps.

## Troubleshooting

See [troubleshooting guide](../../docs/troubleshooting.md) for common issues.
