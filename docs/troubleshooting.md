# Troubleshooting

Common issues and solutions when using the ZenTao Bug Fix Workflow.

## Installation Issues

### zentao-cli not found after installation

**Symptoms**:
```bash
zentao --version
# bash: zentao: command not found
```

**Cause**: npm global bin directory not in PATH

**Solution**:

```bash
# Find npm global prefix
npm config get prefix
# Output: /usr/local (or similar)

# Add to PATH (Linux/macOS)
echo 'export PATH="$PATH:/usr/local/bin"' >> ~/.bashrc
source ~/.bashrc

# Add to PATH (Windows)
# Add C:\Users\<username>\AppData\Roaming\npm to System PATH
```

### Submodule initialization failed

**Symptoms**:
```bash
git submodule update --init --recursive
# fatal: No url found for submodule path 'tools/zentao-mcp'
```

**Cause**: Submodule not configured in `.gitmodules`

**Solution**:

```bash
# Add submodule manually
cd tools
git clone https://github.com/dyno-nexsoft/zentao_mcp.git zentao-mcp
cd zentao-mcp
npm install && npm run build
```

### npm install fails in zentao-mcp

**Symptoms**:
```
npm ERR! code ENOENT
npm ERR! syscall open
```

**Cause**: Node.js version too old

**Solution**:
```bash
node --version  # Should be 18.0.0 or higher
# Upgrade Node.js if needed
```

## Authentication Issues

### E1003: Account or password error (zentao-cli)

**Symptoms**:
```bash
zentao bug --project=1
# Error: E1003 - Account or password error
```

**Solutions**:

1. **Re-login interactively**:
   ```bash
   zentao login
   ```

2. **Check saved profile**:
   ```bash
   zentao profile
   # Verify account and URL are correct
   ```

3. **Use environment variables** (for automation):
   ```bash
   export ZENTAO_URL=https://zentao.example.com/zentao
   export ZENTAO_ACCOUNT=your-username
   export ZENTAO_PASSWORD=your-password
   zentao login --useEnv
   ```

### E1004: Token expired

**Solution**: Re-login to refresh token:
```bash
zentao login
```

### Attachment downloader login failed

**Symptoms**:
```bash
npx tsx scripts/downloadBugImages.ts 42
# Error: Login failed: 401 Unauthorized
```

**Solutions**:

1. **Check credentials file**:
   ```bash
   cat ~/.claude/config/zentao-mcp.env
   # Verify ZENTAO_ACCOUNT and ZENTAO_PASSWORD are correct
   ```

2. **Verify REST API endpoint**:
   ```bash
   # Test API v1 endpoint
   curl https://your-zentao.com/zentao/api.php/v1/products \
     -H "Token: your-token"
   
   # Should return JSON, not HTML login page
   ```

3. **Check ZenTao version**:
   - REST API v1 requires ZenTao 18.0+
   - Check your ZenTao's help/about page

## Screenshot Download Issues

### 0-byte files downloaded

**Symptoms**:
```bash
npx tsx scripts/downloadBugImages.ts 42
# bug #42: file-read-123.png -> /path/to/file (0 bytes)
```

**Causes & Solutions**:

1. **File ID doesn't exist**:
   ```bash
   # Check bug's actual file references
   zentao bug 42 --format=json | grep file-read
   # Look for: file-read-123.png (extract 123)
   ```

2. **Wrong ZENTAO_BASE_URL**:
   ```bash
   # Must end with /api.php/v1
   ZENTAO_BASE_URL=https://zentao.example.com/zentao/api.php/v1
   ```

3. **File was deleted from ZenTao**:
   - Bug description still references it, but file no longer exists
   - Check in ZenTao UI if attachment is still present

### Script reports "未发现截图附件" (No screenshots found)

**Causes**:
1. Bug description doesn't contain `file-read-N.png` pattern
2. Screenshots use different format (HTML `<img>` tags)

**Solution**:

Check raw bug data:
```bash
zentao bug 42 --format=json | jq '.steps'
```

If screenshots exist but pattern doesn't match, modify `downloadBugImages.ts` regex:

```typescript
// Current pattern
const regex = /file-read-(\d+)\.png/g;

// For HTML img tags
const regex = /<img[^>]+src="[^"]*file-read-(\d+)\.png"/g;
```

## Workflow Issues

### AI changes code without approval

**Symptom**: Claude starts editing files immediately after analyzing bug

**Cause**: Skill instruction not clear or user message ambiguous

**Solution**:

1. **Stop the action**: Type "stop" or "wait"
2. **Clarify expectations**:
   ```
   Please analyze bug #42 but don't change any code yet.
   Report your findings first.
   ```

3. **Check skill is loaded**: In Claude Code, verify skill appears in available skills list

### Commit includes unrelated changes

**Symptom**: `git diff --staged` shows files not related to this bug

**Cause**: AI used `git add .` instead of staging specific files

**Prevention**: In skill instructions, emphasize:
> Only stage files explicitly changed for this bug. Never use `git add -A` or `git add .`

**Recovery**:
```bash
# Unstage everything
git reset

# Stage only the files you want
git add path/to/file1.ts path/to/file2.tsx

# Commit
git commit -m "禅道Bug #42: ..."
```

### Tests pass locally but fail in CI

**Cause**: AI's lint/typecheck validation used different config than CI

**Solution**:

1. **Run exact CI commands locally**:
   ```bash
   # Check CI config (.github/workflows/*, .gitlab-ci.yml)
   # Run same commands locally before commit
   ```

2. **Add pre-commit hooks**:
   ```bash
   # .git/hooks/pre-commit
   #!/bin/bash
   npm run lint
   npm run typecheck
   npm test
   ```

## ZenTao-Specific Issues

### E2010: Server version not supported

**Symptoms**:
```bash
zentao execution projectExecutions --projectID=5
# Error: E2010 - This action requires ZenTao 22.5+, current version: 18.12
```

**Solutions**:

1. **Use equivalent older API**:
   - Instead of `execution projectExecutions`, use `project` to list, then filter executions manually
   
2. **Check actual server version**:
   ```bash
   zentao version
   # Note: This shows cached version, may be outdated
   ```

3. **Upgrade ZenTao** (if you control the server)

### E2002: Object not found

**Symptoms**:
```bash
zentao bug 999
# Error: E2002 - Object not found: /bugs/999
```

**Causes**:
1. Bug ID doesn't exist
2. Bug exists but you don't have permission
3. Bug is in a product/project you don't have access to

**Solution**: Verify bug ID in ZenTao UI first

### Bug status not updating

**Expected behavior**: After fixing, bug status should change to "resolved"

**Actual behavior**: Bug status remains "active"

**Explanation**: This is **by design**. The workflow does NOT auto-update bug status. User manually updates status in ZenTao UI after verifying the fix.

**Why**: AI might misunderstand fix requirements; manual status update ensures user confirms fix is actually correct.

## Performance Issues

### Screenshot download is slow

**Symptoms**: Takes >10 seconds per bug with 3-4 screenshots

**Causes**:
1. Network latency to ZenTao server
2. Large screenshot file sizes

**Mitigation**:
```bash
# Download in batch (one login session for multiple bugs)
npx tsx scripts/downloadBugImages.ts 42 43 44 45 --out ./batch-download
```

### AI workflow times out

**Symptoms**: Claude stops responding mid-workflow

**Solutions**:

1. **Process fewer bugs at once**:
   ```
   Process bugs #42, #43, and #44 one at a time.
   After each commit, wait for my confirmation before starting the next.
   ```

2. **Break into sub-tasks**:
   ```
   1. First, just analyze bugs #42-45 and report findings
   2. (After review) Now implement fixes for bugs #42 and #43
   ```

## Need More Help?

### Check Logs

**zentao-cli logs**: Not persisted by default; re-run with `--verbose` for debug output

**Attachment downloader**: Check script output for specific error messages

### Report Issues

- **This workflow**: [GitHub Issues](https://github.com/huxi965/zentao-ai-dev-workflow/issues)
- **zentao-cli**: [Official repo](https://github.com/easysoft/zentao-cli/issues)
- **zentao_mcp**: [Third-party repo](https://github.com/dyno-nexsoft/zentao_mcp/issues)
- **Claude Code**: [Support page](https://support.anthropic.com/)

### Community Resources

- [ZenTao Official Forum](https://www.zentao.net/forum/)
- [ZenTao Documentation](https://www.zentao.net/book/zentaopms/38.html)

## Quick Reference

### Essential Commands

```bash
# Check zentao-cli version and profile
zentao --version
zentao profile

# Test bug query
zentao bug --project=<id> --pick=id,title,status --format=json

# Test screenshot download
cd ~/.claude/skills/zentao-ai-dev-workflow/tools/zentao-mcp
npx tsx scripts/downloadBugImages.ts <bug-id> --out ./test

# Verify credentials
cat ~/.claude/config/zentao-mcp.env

# Re-login
zentao login
```

### Emergency Recovery

```bash
# Discard uncommitted changes
git stash -u

# Undo last commit (keep changes)
git reset --soft HEAD~1

# Force-update from remote (DESTRUCTIVE)
git fetch origin
git reset --hard origin/<branch>
```

Use destructive commands only when certain no important changes will be lost.
