# Installation Guide

Complete setup instructions for the ZenTao Bug Fix Workflow.

## Prerequisites

### Required

- **Node.js 18+** — [Download](https://nodejs.org/)
- **Git** — [Download](https://git-scm.com/)
- **zentao-cli** — Official ZenTao CLI
- **Claude Code** — [CLI](https://github.com/anthropics/claude-code), [Desktop](https://claude.ai/download), or [Web](https://claude.ai/code)

### ZenTao Access

- Valid ZenTao account with bug access permissions
- ZenTao server version 18.0+ recommended (for REST API v1 support)

## Step-by-Step Installation

### 1. Install zentao-cli

Install the official ZenTao CLI globally:

```bash
npm install -g zentao-cli
```

Verify installation:

```bash
zentao --version
```

### 2. Clone This Repository

Clone to Claude Code's skills directory:

```bash
cd ~/.claude/skills
git clone https://github.com/<your-username>/zentao-bug-fix-workflow.git
cd zentao-bug-fix-workflow
```

### 3. Initialize Submodules

The attachment downloader is included as a git submodule:

```bash
git submodule update --init --recursive
```

### 4. Build the Attachment Downloader

```bash
cd tools/zentao-mcp
npm install
npm run build
cd ../..
```

Verify build:

```bash
ls tools/zentao-mcp/build/
# Should see: index.js zentaoClient.js formatters/ tools/ utils/
```

### 5. Configure zentao-cli Credentials

Login interactively:

```bash
zentao login
```

Follow prompts:
- **ZenTao URL**: Your ZenTao server address (e.g., `https://zentao.example.com/zentao`)
- **Account**: Your username
- **Password or Token**: Your password (or API token if available)

Verify login:

```bash
zentao profile
```

Should display your account and server info.

### 6. Configure Attachment Downloader Credentials

Create credentials file:

```bash
mkdir -p ~/.claude/config
```

Create `~/.claude/config/zentao-mcp.env`:

```bash
ZENTAO_BASE_URL=https://your-zentao.com/zentao/api.php/v1
ZENTAO_ACCOUNT=your-username
ZENTAO_PASSWORD=your-password
ZENTAO_ALLOW_INSECURE_SSL=false
```

**Important Notes**:
- `ZENTAO_BASE_URL` must end with `/api.php/v1` (REST API v1 endpoint)
- Use the same account/password as zentao-cli
- Set `ZENTAO_ALLOW_INSECURE_SSL=true` only if your ZenTao uses self-signed certificates

Set secure permissions:

```bash
chmod 600 ~/.claude/config/zentao-mcp.env
```

### 7. Test the Setup

#### Test zentao-cli

List bugs in a project:

```bash
zentao bug --project=1 --pick=id,title,status --format=json
```

(Replace `1` with an actual project ID from your ZenTao)

#### Test Attachment Downloader

Download a bug's screenshots:

```bash
cd ~/.claude/skills/zentao-bug-fix-workflow/tools/zentao-mcp
npx tsx scripts/downloadBugImages.ts <bug-id> --out ./test-download
```

(Replace `<bug-id>` with a bug that has screenshot attachments)

Check output:

```bash
ls -la test-download/#<bug-id>/
# Should see: file-read-123.png file-read-456.png ...
rm -rf test-download  # Clean up test
```

## Verification Checklist

- [ ] `zentao --version` shows version
- [ ] `zentao profile` displays your account
- [ ] `zentao bug --project=X` returns bug list
- [ ] `~/.claude/config/zentao-mcp.env` exists with correct credentials
- [ ] `~/.claude/config/zentao-mcp.env` has `600` permissions
- [ ] Test screenshot download succeeded

## Troubleshooting

### zentao-cli: Command not found

**Solution**: Ensure `npm` global bin directory is in your PATH:

```bash
npm config get prefix
# Add <prefix>/bin to your PATH
```

### zentao login: E1005 Config file not writable

**Solution**: Check directory permissions:

```bash
mkdir -p ~/.config/zentao
chmod 755 ~/.config/zentao
```

### Screenshot download: Login failed

**Causes**:
1. Wrong credentials in `~/.claude/config/zentao-mcp.env`
2. Wrong `ZENTAO_BASE_URL` (must be REST API v1 endpoint)
3. ZenTao server doesn't support REST API v1

**Solutions**:
1. Double-check credentials match zentao-cli login
2. Verify URL format: `https://<server>/zentao/api.php/v1`
3. Check ZenTao version (18.0+ recommended)

### Screenshot download: 0-byte files

**Cause**: File IDs extracted from bug description don't match actual attachments

**Solution**: Check bug's `steps` field for actual `file-read-N.png` references:

```bash
zentao bug <id> --format=json | grep file-read
```

## Alternative Installation: Without Submodules

If you prefer not to use git submodules:

```bash
cd ~/.claude/skills/zentao-bug-fix-workflow/tools
git clone https://github.com/dyno-nexsoft/zentao_mcp.git
cd zentao_mcp
npm install
npm run build
```

The rest of the setup remains the same.

## Next Steps

- Read [Workflow Details](workflow.md) to understand how the skill works
- Try processing a bug: In Claude Code, say "Process ZenTao bugs assigned to me"
- Check [Troubleshooting](troubleshooting.md) if you encounter issues

## Uninstallation

To remove the skill:

```bash
cd ~/.claude/skills
rm -rf zentao-bug-fix-workflow
rm ~/.claude/config/zentao-mcp.env  # Optional: remove credentials
```

To keep zentao-cli for other uses, leave it installed globally.
