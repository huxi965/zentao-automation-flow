---
name: zentao-ai-dev
display_name: ZenTao AI Development Workflow
display_name_zh: 禅道AI开发工作流
description: Process ZenTao tasks (bugs, stories, tasks) — list → fetch details → download screenshots if present → analyze → report findings and plan → get approval → implement → test → commit. Use when the user asks to "process ZenTao tasks" or "develop from ZenTao."
description_zh: 按顺序处理禅道(ZenTao)里的任务(Bug/需求/任务)——列出待办,逐个查看详情;有截图/附件的先下载分析,纯文字描述的直接分析描述;分析后先汇报内容和解决方案,获得批准后才改代码;改完交用户测试,确认后才 commit/push。当用户要求"处理禅道任务""开发禅道需求""修复禅道bug"时使用。
license: MIT
version: 1.0.0
metadata:
  keywords: [zentao, ai-development, screenshot-download, workflow, bug-fix, feature-development]
  depends_on: zentao-cli
---

# ZenTao AI Development Workflow

Standard workflow for processing ZenTao tasks (bugs, stories, tasks) with AI assistance: **list tasks → fetch details → analyze (with screenshots if present) → report findings → get approval → implement → test → commit**.

## Core Principles

- **Always report before coding.** After analysis, report: what the task is (in your own words), root cause (for bugs) or requirements (for features), proposed solution, affected files. Wait for explicit approval before changing any code.
- **Never auto-commit or auto-push.** After code changes, user must test locally and explicitly confirm before committing.
- **Task status updates (resolve/close) are manual.** User updates ZenTao status themselves; this skill does not touch task lifecycle.
- **Screenshot download is selective.** Not every task needs screenshots. If the text description is clear, skip downloading. Only download when the description says "see attachment" or is empty.

This skill solves a specific technical problem: the official `zentao-cli` (see [zentao-cli](https://github.com/easysoft/zentao-cli)) can query task data but **cannot download attachments**. Many tasks have empty descriptions and only annotate issues in screenshots (e.g., "see attached image"). This skill provides screenshot download capability, but it's not mandatory for every task.

## Prerequisites

- Installed and working `zentao-cli` (for querying task lists, details, IDs/URLs)
- Local attachment downloader: `~/.claude/tools/zentao-mcp/` (from third-party open-source project [dyno-nexsoft/zentao_mcp](https://github.com/dyno-nexsoft/zentao_mcp), MIT license)
- Credentials file: `~/.claude/config/zentao-mcp.env` containing:
  ```
  ZENTAO_BASE_URL=https://<your-zentao>/zentao/api.php/v1
  ZENTAO_ACCOUNT=<username>
  ZENTAO_PASSWORD=<password>
  ZENTAO_ALLOW_INSECURE_SSL=false
  ```
  If this file doesn't exist on first use, ask user for credentials and create it with `chmod 600`. Never echo passwords in the chat, never commit this file to any git repository.

## Why Official CLI Fails on Attachments

ZenTao has two authentication mechanisms:

- **Old-style web paths** (`/zentao/file-read-N.png`) rely on session cookies. `zentao-cli`'s saved session gets 302-redirected to the login page when accessing these paths directly, even if the session is still valid.
- **RESTful API v1/v2** (`/zentao/api.php/v1/files/{fileId}`) uses Token header authentication and is the official attachment download channel, but `zentao-cli` doesn't expose this capability.

`dyno-nexsoft/zentao_mcp`'s internal `ZentaoClient.downloadFile(fileId, targetPath)` uses the second method, which is verified to work.

## Standard Workflow

### Step 1: Confirm Task Scope

Query with `zentao-cli`. Note that `zentao my bugs` aggregation endpoint may fail in some environments; reliable approach is to query by project scope and filter by `assignedTo`:

```bash
zentao bug --project=<projectID> --pick=id,title,status,assignedTo --format=json
zentao story --project=<projectID> --pick=id,title,status,assignedTo --format=json
zentao task --project=<projectID> --pick=id,name,status,assignedTo --format=json
```

Confirm with user which tasks to process and in what order (usually by ID or priority, one at a time).

### Step 2: Fetch Task Details, Check for Attachments

```bash
zentao bug <id> --format=json
zentao story <id> --format=json
zentao task <id> --format=json
```

Inspect `steps` (or other description fields):

- **Text description is complete and understandable** (e.g., clearly states "field X shows Z in scenario Y, should be W"): skip download, proceed directly to Step 3 analysis.
- **Text description is empty, placeholder-only ("see attachment"), or `steps` contains `file-read-N.png` image references**: issue description is in attachments, proceed to "Download Attachments" subsection.
- **Both present** (text describes part, attachments supplement with screenshots): need both, don't look at only one.

#### Download Attachments

```bash
cd ~/.claude/tools/zentao-mcp
npx tsx scripts/downloadBugImages.ts <taskId1> <taskId2> ... --out <output-dir>
```

- Without `--out`, defaults to `zentao-bug-images/` under current directory.
- Each task creates a `#<taskId>/` subdirectory in output dir, screenshots saved by original filename (`file-read-N.png`).
- Script prints download result and byte count for each file; 0-byte or error files indicate download failure, don't treat as "task has no attachments" — check if `steps` field actually contains `file-read-N.png` references first.
- If login fails (wrong account/password), prompt user to check `~/.claude/config/zentao-mcp.env`, don't attempt to guess or brute-force credentials.

### Step 3: Analyze Issue, Locate Code

- **With screenshots**: use Read tool to view downloaded images, understand annotated/highlighted issue points.
- **Without screenshots**: analyze directly from text description.
- Combined with task `title` and actual project code structure (frontend React pages in `frontend-app/src/`, backend in `backend-api/` / `data-service/`), locate specific files and code lines.
- If it's a UI display issue, identify which page component; if it's data content issue (wrong field values, empty data), trace to backend data mapping logic — don't just patch frontend display layer to hide the problem.

### Step 4: Report Findings and Implementation Plan, Wait for Approval

**Before changing any code**, report to user:
- What this task's objective is (explain in your own words, not just repeating the title)
- Root cause location (for bugs: which file, which logic, why) or implementation approach (for features: design, affected modules)
- Proposed solution (specific approach; if multiple solutions or tradeoffs exist, list them and ask user to choose)

Wait for explicit user approval (or modification suggestions) before proceeding to next step. User may propose different solutions, add requirements, or say "don't implement yet" — follow what user says, don't assume reporting equals approval.

### Step 5: Implement Code Changes

- Only change what's in this task's scope and already approved; don't clean up other uncommitted changes in the same file (this project often has multiple parallel unfinished feature branch content mixed in working directory).
- After changes, run project's existing type check/lint (e.g., `npx tsc --noEmit`, `npx eslint <file>`), confirm no errors.
- Clearly tell user which validations were done and which couldn't be done (e.g., can't actually login to browser to verify UI effects), don't pretend visual validation passed.

### Step 6: User Testing, Commit Only After Confirmation

Hand modified result to user for local testing. Only commit after user confirms no issues:
- Commit message format fixed: title starts with `禅道Bug #<id>: ` (or `禅道需求 #<id>: `, `禅道任务 #<id>: `) followed by actual change title; body (commit message body) includes one line for ZenTao address, format `禅道 Bug #<id>: https://<site>/zentao/bug-view-<id>.html`. Example:

  ```
  禅道Bug #2: Simplify generic web portal homepage, add placeholder entries for other business systems

  禅道 Bug #2: https://zentao.example.com/zentao/bug-view-2.html
  ```

- Precisely `git add` specific files involved this time, don't use `git add -A` or `.` to avoid including other unfinished changes in working directory.
- Before push, check if remote branch has new commits, merge as needed, don't use destructive operations (force push, reset --hard) to resolve conflicts.
- Task status in ZenTao (confirm/resolve/close) is completely user-operated, don't transition on their behalf.

## Batch Download Script Implementation

Script location: `~/.claude/tools/zentao-mcp/scripts/downloadBugImages.ts`

Core logic: Task's `steps` field contains screenshots in Markdown image syntax (`![xxx](/zentao/file-read-123.png)`), extract digits from `file-read-(\d+)\.png` as ZenTao file ID (fileID), then call logged-in `ZentaoClient.downloadFile(fileId, targetPath)` (REST API `/files/{fileId}`) to save to disk.

The tool's native "auto-embed local image links" feature (`imageLocalizer.ts`) only matches real HTML `<img>` tags, doesn't work with Markdown image syntax in this project's ZenTao, so we bypass it and directly call the underlying download method. If ZenTao's image syntax changes in the future (becomes real HTML img tags), this script's regex needs corresponding adjustment.

## Known Limitations

- `~/.claude/tools/zentao-mcp` is a third-party personal repository with 0 stars, only basic usability verified (login, download by fileID), no comprehensive security audit. Use only for attachment download, don't use for write operations (create/edit/delete tasks, status changes, etc.) — those operations uniformly use `zentao-cli`.
- Batch download script logs in once to process all passed task IDs, no concurrent rate limiting; number of task IDs passed at once should not be excessive (a few to dozen is appropriate) to avoid pressuring ZenTao server.

## Integration with Project

When called in a project context, adapt file paths and git operations to the actual project structure. The workflow remains the same: analyze → report → approve → code → test → commit.
