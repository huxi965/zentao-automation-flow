# Installation Guide

Complete setup instructions for ZenTao AI Development Workflow.

## Prerequisites

### Required Software

- **Node.js >= 16** — [Download](https://nodejs.org/)
  - Verify: `node --version`
  - Required for running the screenshot download script
- **Git** — [Download](https://git-scm.com/)
  - Verify: `git --version`
  - Required for version control
- **zentao-cli** — Official ZenTao command-line tool
  - Installation: `npm install -g zentao-cli`
  - Verify: `zentao --version`
  - Used for querying tasks and task details

### ZenTao Server Requirements

- Valid ZenTao account with appropriate permissions (bug/story/task access)
- ZenTao server version 18.0+ recommended (for REST API v1 support)
- REST API v1 enabled on your ZenTao instance

### Choose Your Platform

Pick one integration method:

- **Claude Code** — AI-powered CLI/Desktop/Web app ([Installation](#claude-code-installation))
- **Cursor** — AI-first code editor ([Installation](#cursor-installation))
- **Other AI Tools** — Generic prompt template ([Installation](#generic-template-installation))

## Base Installation

These steps are required for all platforms:

### 1. Install zentao-cli

```bash
npm install -g zentao-cli
```

Verify installation:

```bash
zentao --version
# Should output: zentao-cli version X.X.X
```

Login to your ZenTao server:

```bash
zentao login
```

Follow the prompts:
- **ZenTao URL**: Your server address (e.g., `https://zentao.example.com/zentao`)
- **Account**: Your username
- **Password**: Your password or API token

Test the connection:

```bash
zentao my bugs
# Should list your assigned bugs
```

### 2. Clone This Repository

```bash
cd ~/projects  # or any directory you prefer
git clone https://github.com/huxi965/zentao-automation-flow.git
cd zentao-automation-flow
```

### 3. Install zentao-mcp (Screenshot Downloader)

Option A: Clone separately (recommended):

```bash
cd ~/tools  # or another permanent location
git clone https://github.com/dyno-nexsoft/zentao_mcp.git
cd zentao-mcp
npm install
```

Copy the download script:

```bash
cp ~/projects/zentao-automation-flow/tools/downloadBugImages.ts scripts/
```

Option B: Use git submodule (if the repository includes it):

```bash
cd ~/projects/zentao-automation-flow
git submodule update --init --recursive
cd tools/zentao-mcp
npm install
```

### 4. Configure zentao-mcp Credentials

The screenshot downloader needs separate credentials:

```bash
# For Claude Code
mkdir -p ~/.claude/config
nano ~/.claude/config/zentao-mcp.env

# For Cursor or other tools
mkdir -p ~/.config/zentao
nano ~/.config/zentao/credentials.env
```

Add your credentials (same format for both files):

```env
ZENTAO_BASE_URL=https://your-zentao-server.com/zentao/api.php/v1
ZENTAO_ACCOUNT=your-username
ZENTAO_PASSWORD=your-password
ZENTAO_ALLOW_INSECURE_SSL=false
```

**Important**: Replace with your actual values:
- `ZENTAO_BASE_URL`: Must end with `/api.php/v1` (this is the REST API endpoint)
- `ZENTAO_ACCOUNT`: Your ZenTao username
- `ZENTAO_PASSWORD`: Your ZenTao password
- `ZENTAO_ALLOW_INSECURE_SSL`: Set to `true` only for development servers with self-signed certificates

Set proper permissions:

```bash
# For Claude Code
chmod 600 ~/.claude/config/zentao-mcp.env

# For Cursor or other tools
chmod 600 ~/.config/zentao/credentials.env
```

### 5. Verify Installation

Test zentao-cli:

```bash
zentao --version
zentao my bugs
```

Test download script:

```bash
cd ~/tools/zentao-mcp  # or wherever you installed it
npx tsx scripts/downloadBugImages.ts --help
```

Expected output:
```
Usage: downloadBugImages.ts <bugId1> [bugId2] [...] [--out <output-dir>]

Downloads screenshots from ZenTao bug reports.
```

## Claude Code Installation

After completing [Base Installation](#base-installation):

### 1. Copy Skill to Claude Code

```bash
mkdir -p ~/.claude/skills/zentao-auto-workflow
cp ~/projects/zentao-automation-flow/integrations/claude-code/SKILL.md \
   ~/.claude/skills/zentao-auto-workflow/
```

### 2. Set Up Download Script Path

Ensure zentao-mcp is at the expected location:

```bash
mkdir -p ~/.claude/tools/zentao-mcp
# If you installed zentao-mcp elsewhere, create a symlink:
ln -s ~/tools/zentao-mcp ~/.claude/tools/zentao-mcp
```

Or copy the download script directly:

```bash
cp ~/projects/zentao-automation-flow/tools/downloadBugImages.ts \
   ~/.claude/tools/zentao-mcp/scripts/
```

### 3. Verify Skill Installation

In Claude Code, type:

```
What skills do I have?
```

You should see `zentao-auto-workflow` in the list.

### 4. Test the Workflow

```
Process ZenTao bugs from project 5
```

See [Usage Guide](../integrations/claude-code/README.md#usage) for detailed usage.

## Cursor Installation

After completing [Base Installation](#base-installation):

### 1. Copy Rules to Your Project

```bash
cd /path/to/your-project
cp ~/projects/zentao-automation-flow/integrations/cursor/.cursorrules .
```

Or append to existing rules:

```bash
cat ~/projects/zentao-automation-flow/integrations/cursor/.cursorrules >> .cursorrules
```

### 2. Update Paths in .cursorrules

Edit `.cursorrules` and update these variables:

```bash
ZENTAO_MCP_PATH="$HOME/tools/zentao-mcp"  # Match your installation path
ZENTAO_CREDENTIALS="$HOME/.config/zentao/credentials.env"
```

### 3. Restart Cursor

Close and reopen Cursor to load the new rules.

### 4. Test the Workflow

In Cursor's AI chat:

```
Process ZenTao bugs from project 5
```

See [Usage Guide](../integrations/cursor/README.md#usage) for detailed usage.

## Generic Template Installation

After completing [Base Installation](#base-installation):

### 1. Copy the Prompt Template

```bash
cp ~/projects/zentao-automation-flow/integrations/prompt-template/zentao-dev-prompt.md \
   ~/Documents/
```

### 2. Customize Paths

Edit the copied file and update:

```
ZENTAO_MCP_PATH="$HOME/tools/zentao-mcp"
ZENTAO_CREDENTIALS="$HOME/.config/zentao/credentials.env"
PROJECT_FRONTEND="src/"  # Your project structure
PROJECT_BACKEND="api/"   # Your project structure
```

### 3. Use with Your AI Tool

**GitHub Copilot:**
- Create `.github/copilot-instructions.md` in your project
- Paste the prompt template content

**ChatGPT / Claude Web:**
- Copy the prompt template
- Paste at the start of your conversation
- Then ask: "Process ZenTao bug #123"

See [Usage Guide](../integrations/prompt-template/README.md#usage) for tool-specific instructions.

## Environment Variables Reference

### zentao-cli Configuration

Stored in: `~/.zentaorc` (automatically created by `zentao login`)

Contains:
- ZenTao server URL
- Session token
- User preferences

### zentao-mcp Credentials

**Claude Code**: `~/.claude/config/zentao-mcp.env`
**Others**: `~/.config/zentao/credentials.env`

Required variables:
```env
ZENTAO_BASE_URL=https://zentao.example.com/zentao/api.php/v1
ZENTAO_ACCOUNT=username
ZENTAO_PASSWORD=password
ZENTAO_ALLOW_INSECURE_SSL=false
```

## Troubleshooting

### zentao-cli login fails

**Error**: "Connection refused" or "Invalid credentials"

**Solutions**:
- Verify server URL is correct (should end with `/zentao`, not `/zentao/api.php/v1`)
- Check your username and password
- Ensure your account has API access permissions
- Try accessing ZenTao web UI to confirm credentials

### Screenshot download fails

**Error**: "Login failed" or "401 Unauthorized"

**Solutions**:
- Check credentials file exists and has correct permissions (600)
- Verify `ZENTAO_BASE_URL` ends with `/api.php/v1`
- Confirm account has file download permissions
- Test API access: `curl -u username:password https://zentao.example.com/zentao/api.php/v1/bugs/1`

### Node.js version mismatch

**Error**: "Unsupported Node.js version"

**Solution**:
```bash
node --version  # Should be >= 16
# If older, download latest from nodejs.org
```

### Skill not loading (Claude Code)

**Error**: Skill not appearing in skill list

**Solutions**:
- Verify file is at: `~/.claude/skills/zentao-auto-workflow/SKILL.md`
- Check YAML frontmatter is valid (no syntax errors)
- Restart Claude Code
- Check Claude Code logs for errors

### Cursor rules not working

**Error**: AI doesn't follow workflow

**Solutions**:
- Ensure `.cursorrules` is in project root
- Restart Cursor after adding/updating rules
- Use explicit trigger phrases: "Follow ZenTao workflow to fix bug #123"
- Check for conflicting rules in parent directories

## Next Steps

- [Workflow Guide](workflow.md) - Understand the development workflow
- [Usage Examples](../examples/bug-with-screenshots.md) - See real-world usage
- [Troubleshooting Guide](troubleshooting.md) - Common issues and solutions
- [Architecture](architecture.md) - Design decisions and technical details

## Getting Help

- GitHub Issues: https://github.com/huxi965/zentao-automation-flow/issues
- Documentation: See `docs/` directory
- Examples: See `examples/` directory
