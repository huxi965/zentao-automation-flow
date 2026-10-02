# Cursor Integration

This directory contains Cursor editor rules for ZenTao AI Development Workflow.

## Installation

### 1. Prerequisites

Ensure you have installed the base requirements:
- Node.js >= 16
- zentao-cli
- Git
- Cursor editor >= 0.30

See [main installation guide](../../docs/installation.md) for detailed setup.

### 2. Install zentao-mcp (Screenshot Downloader)

```bash
# Clone the tool
cd ~/tools  # or any directory you prefer
git clone https://github.com/dyno-nexsoft/zentao_mcp.git
cd zentao-mcp
npm install

# Copy download script
cp /path/to/zentao-automation-flow/tools/downloadBugImages.ts scripts/
```

### 3. Configure Credentials

Create credentials file:

```bash
mkdir -p ~/.config/zentao
nano ~/.config/zentao/credentials.env
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
chmod 600 ~/.config/zentao/credentials.env
```

### 4. Install Cursor Rules

Copy the rules file to your project root:

```bash
cp integrations/cursor/.cursorrules /path/to/your-project/.cursorrules
```

Or append to existing `.cursorrules`:

```bash
cat integrations/cursor/.cursorrules >> /path/to/your-project/.cursorrules
```

### 5. Update Paths in Rules

Edit `.cursorrules` in your project and update the `ZENTAO_MCP_PATH` variable to match your installation:

```bash
ZENTAO_MCP_PATH="$HOME/tools/zentao-mcp"
ZENTAO_CREDENTIALS="$HOME/.config/zentao/credentials.env"
```

### 6. Verify Installation

Test zentao-cli:

```bash
zentao --version
zentao login
```

Test download script:

```bash
cd ~/tools/zentao-mcp
npx tsx scripts/downloadBugImages.ts --help
```

## Usage

In Cursor, use the AI chat to trigger the workflow:

- "Process ZenTao bugs from project 5"
- "Fix bug #123 from ZenTao"
- "Develop story #456 from ZenTao"
- "Handle ZenTao task #789"

The AI will follow the workflow rules automatically:
1. List and confirm tasks with you
2. Fetch details and download screenshots if needed
3. Analyze and report findings
4. Wait for your approval before coding
5. Implement changes after approval
6. Guide you through testing and committing

## Workflow Details

See [workflow documentation](../../docs/workflow.md) for detailed steps.

## Troubleshooting

See [troubleshooting guide](../../docs/troubleshooting.md) for common issues.

### Cursor-Specific Issues

**AI doesn't follow the rules**
- Ensure `.cursorrules` is in your project root
- Restart Cursor after adding/updating rules
- Use explicit trigger phrases like "follow ZenTao workflow"

**Path errors in download script**
- Verify `ZENTAO_MCP_PATH` in `.cursorrules` matches your installation
- Use absolute paths, not relative paths
- Check file permissions: `ls -la ~/tools/zentao-mcp/scripts/`

**Credentials not loaded**
- Verify `ZENTAO_CREDENTIALS` path in `.cursorrules`
- Check file permissions: `chmod 600 ~/.config/zentao/credentials.env`
- Try sourcing manually: `source ~/.config/zentao/credentials.env && echo $ZENTAO_ACCOUNT`
