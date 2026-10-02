# Contributing to ZenTao Bug Fix Workflow

Thank you for your interest in contributing! This document provides guidelines for contributing to this project.

## Code of Conduct

Be respectful, constructive, and professional in all interactions.

## How to Contribute

### Reporting Issues

**Bug Reports**:
- Check [existing issues](https://github.com/huxi965/zentao-ai-dev-workflow/issues) first
- Use issue template (if available)
- Include:
  - ZenTao version
  - zentao-cli version (`zentao --version`)
  - Operating system
  - Steps to reproduce
  - Expected vs actual behavior
  - Error messages (full text)

**Feature Requests**:
- Describe the use case (why you need it)
- Explain current workaround (if any)
- Propose solution (optional)

### Submitting Pull Requests

1. **Fork the repository**

2. **Create a feature branch**:
   ```bash
   git checkout -b feature/my-new-feature
   ```

3. **Make changes**:
   - Follow existing code style
   - Update documentation if needed
   - Add examples if applicable

4. **Test your changes**:
   - Test with real ZenTao bugs
   - Verify screenshot download (if applicable)
   - Check that approval gates still work

5. **Commit with clear message**:
   ```bash
   git commit -m "feat: Add support for batch screenshot download

   - Add --batch flag to downloadBugImages.ts
   - Download up to 50 bugs in one session
   - Add progress bar for user feedback"
   ```

6. **Push and create PR**:
   ```bash
   git push origin feature/my-new-feature
   ```
   - Open PR on GitHub
   - Fill out PR template
   - Link related issues

## Development Setup

### Prerequisites
- Node.js 18+
- ZenTao test instance (for testing)
- zentao-cli installed

### Local Setup
```bash
# Clone your fork
git clone https://github.com/huxi965/zentao-ai-dev-workflow.git
cd zentao-ai-dev-workflow

# Initialize submodule
git submodule update --init --recursive

# Build tools
cd tools/zentao-mcp
npm install
npm run build
cd ../..
```

### Testing Changes

#### Test Skill Instructions
1. Copy skill to Claude Code's skills directory:
   ```bash
   cp -r . ~/.claude/skills/zentao-ai-dev-workflow-dev
   ```

2. In Claude Code, test the workflow:
   ```
   Process ZenTao bug #<test-bug-id>
   ```

3. Verify each step works as expected

#### Test Download Script
```bash
cd tools/zentao-mcp
npx tsx scripts/downloadBugImages.ts <test-bug-id> --out ./test-output
ls -la test-output/#<test-bug-id>/
```

## Code Style

### Markdown (Documentation)
- Use ATX-style headers (`#` not `===`)
- One sentence per line (easier diffs)
- Code blocks with language tags
- Max line length: 120 characters (except long URLs)

### TypeScript (Scripts)
- Follow zentao-mcp's existing style
- Use async/await (not callbacks)
- Add JSDoc comments for exported functions
- Prefer `const` over `let`

### Commit Messages
Follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat: Add new feature`
- `fix: Fix bug in screenshot download`
- `docs: Update installation guide`
- `refactor: Simplify workflow logic`
- `test: Add tests for edge cases`

## Areas for Contribution

### High Priority
- [ ] Add unit tests for downloadBugImages.ts
- [ ] Support ZenTao v2 REST API
- [ ] Add progress indicator for batch downloads
- [ ] Improve error messages

### Medium Priority
- [ ] Add Chinese language support for skill instructions (bilingual skill)
- [ ] Create video tutorial
- [ ] Add CI/CD for documentation linting
- [ ] Support custom commit message templates

### Low Priority
- [ ] Add screenshot annotation capability
- [ ] Generate fix summary reports
- [ ] Integration with other project management tools

### Good First Issues
(We'll tag issues with `good-first-issue` for newcomers)

- Documentation typos/improvements
- Add more examples
- Improve error messages
- Add validation for config files

## Documentation

When changing functionality:

- Update `README.md` if user-facing
- Update `docs/workflow.md` if workflow changes
- Update `docs/architecture.md` if design changes
- Add example to `examples/` if demonstrating new capability

## Testing Checklist

Before submitting PR, verify:

- [ ] Skill instructions load without syntax errors
- [ ] Screenshot download works for bugs with attachments
- [ ] Text-only bug workflow works (skips download)
- [ ] Approval gates pause for user input
- [ ] Commit message format is correct
- [ ] Documentation updated
- [ ] No hardcoded credentials or internal URLs in code

## Release Process

(For maintainers)

1. Update version in `skill/SKILL.md` metadata
2. Update `CHANGELOG.md` (if exists)
3. Create git tag: `git tag v1.1.0`
4. Push tag: `git push origin v1.1.0`
5. Create GitHub release with notes

## Questions?

- Check [Troubleshooting](docs/troubleshooting.md)
- Search [existing issues](https://github.com/huxi965/zentao-ai-dev-workflow/issues)
- Open a new issue with `question` label

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
