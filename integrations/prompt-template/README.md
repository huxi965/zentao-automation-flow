# Generic Prompt Template

This directory contains a universal AI prompt template for ZenTao development workflow, compatible with any AI coding assistant that accepts custom prompts.

## Supported Tools

This template works with:
- **GitHub Copilot Chat** (VS Code, JetBrains)
- **ChatGPT** (with Code Interpreter)
- **Claude** (via API or web interface)
- **Codeium Chat**
- **Tabnine Chat**
- **Any AI assistant** that accepts custom system prompts

## Installation

### 1. Prerequisites

Ensure you have installed the base requirements:
- Node.js >= 16
- zentao-cli
- Git

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

### 4. Use the Prompt Template

Copy the content of `zentao-dev-prompt.md` and:

**For GitHub Copilot / Codeium / Tabnine:**
- Paste it as a multi-line comment at the top of your file
- Or create a `.github/copilot-instructions.md` file in your project root

**For ChatGPT / Claude Web:**
- Copy the prompt and paste it at the beginning of your conversation
- Then ask: "Process ZenTao bug #123"

**For API Integration:**
- Use it as the system message in your API calls

### 5. Customize Paths

Edit the prompt template and update these variables:
- `ZENTAO_MCP_PATH`: Path to your zentao-mcp installation
- `ZENTAO_CREDENTIALS`: Path to your credentials file
- Project structure paths (frontend/backend locations)

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

### Basic Usage

Start your AI conversation with the prompt template, then use commands like:

- "Process ZenTao bugs from project 5"
- "Fix bug #123 from ZenTao"
- "Develop story #456 from ZenTao"
- "Handle ZenTao task #789"

### Example: GitHub Copilot

```javascript
/*
[Paste zentao-dev-prompt.md content here]
*/

// Then in Copilot Chat:
// "Fix ZenTao bug #42"
```

### Example: ChatGPT

```
[Paste zentao-dev-prompt.md content]

---

User: Fix ZenTao bug #42 from project 5
```

## Workflow Details

See [workflow documentation](../../docs/workflow.md) for detailed steps.

## Troubleshooting

See [troubleshooting guide](../../docs/troubleshooting.md) for common issues.

### Generic Template Issues

**AI doesn't follow the workflow**
- Ensure the full prompt is provided at conversation start
- Use explicit trigger phrases
- Remind AI of workflow rules if it deviates

**Path errors**
- Verify all paths in the prompt template are absolute
- Use `~` for home directory (expands correctly on Unix/Mac)
- On Windows, use forward slashes: `C:/Users/you/tools/zentao-mcp`

**Commands not executing**
- Some AI tools (ChatGPT web) can't execute shell commands directly
- Copy command suggestions and run them manually in your terminal
- Consider using code-capable tools (Copilot, Cursor, Claude Code)
