# Example: Bug with Screenshots

Real-world example of processing a bug that includes screenshot attachments.

## Bug Context

**Bug ID**: #26  
**Title**: collections运算生成的collections无法生成snapshots  
**Status**: Active  
**Assigned To**: You  
**Description**: Steps field contains "详见附图" (see attached images)

## Workflow Execution

### Step 1: List Bugs

```bash
zentao bug --project=5 --pick=id,title,status,assignedTo --format=json
```

**Output**:
```json
[
  {
    "id": "26",
    "title": "collections运算生成的collections无法生成snapshots",
    "status": "active",
    "assignedTo": "your-username"
  },
  ...
]
```

**AI**: "Found bug #26 assigned to you. Processing now."

### Step 2: Fetch Details

```bash
zentao bug 26 --format=json
```

**Output** (excerpt):
```json
{
  "id": "26",
  "title": "collections运算生成的collections无法生成snapshots",
  "steps": "复现步骤：\n1. 创建两个collections A 和 B\n2. 使用collections运算功能生成新collections C (A ∪ B)\n3. 尝试对collections C 生成snapshots\n\n预期：snapshots生成成功\n实际：报错 \"snapshots生成失败\"\n\n详见附图：\n![截图1](/zentao/file-read-456.png)\n![截图2](/zentao/file-read-457.png)",
  "status": "active",
  "assignedTo": "your-username",
  "product": "5",
  "project": "3"
}
```

**AI Decision**: Steps field contains `file-read-456.png` and `file-read-457.png` → Download screenshots

### Step 3: Download Screenshots

```bash
cd ~/.claude/tools/zentao-mcp
npx tsx scripts/downloadBugImages.ts 26 --out ./zentao-bug-images
```

**Output**:
```
Logging in to Zentao...
Logged in.

bug #26: file-read-456.png -> ./zentao-bug-images/#26/file-read-456.png (145832 bytes)
bug #26: file-read-457.png -> ./zentao-bug-images/#26/file-read-457.png (98234 bytes)
```

**Files downloaded**:
- `zentao-bug-images/#26/file-read-456.png` — Screenshot showing the error dialog
- `zentao-bug-images/#26/file-read-457.png` — Network tab showing 400 Bad Request

### Step 4: Analyze Screenshots

**AI reads images**:

**Screenshot 1** (file-read-456.png):
- Error dialog visible: "snapshots生成失败: missing queue metadata"
- Button "确定" (OK) highlighted

**Screenshot 2** (file-read-457.png):
- Browser DevTools Network tab open
- Request: `POST /api/queues/123/snapshots`
- Response: `400 Bad Request`
- Response body: `{"error": "queue_type is required"}`

**AI Analysis**:
- Symptom: Snapshot creation fails with "missing queue metadata"
- Root cause hypothesis: Computed queues (from operations like union) don't have `queue_type` field set
- API endpoint `/api/queues/{id}/snapshots` requires `queue_type` but computed queues don't store it

### Step 5: Locate Code

**AI searches**:
```bash
grep -r "queue_type" backend-api/
```

**Findings**:
- `backend-api/src/services/queueService.ts:145` — `createSnapshot()` reads `queue.queue_type`
- `backend-api/src/services/queueOperations.ts:67` — `computeUnion()` creates queue without setting `queue_type`

**AI reads files**:

**queueService.ts:145**:
```typescript
async createSnapshot(queueId: string, userId: string) {
  const queue = await this.getQueue(queueId);
  
  // Bug: queue_type is undefined for computed queues
  const snapshot = {
    queueId,
    queueType: queue.queue_type,  // ← undefined for computed queues
    createdBy: userId,
    data: await this.getQueueData(queueId),
  };
  
  return await db.snapshots.insert(snapshot);
}
```

**queueOperations.ts:67**:
```typescript
async computeUnion(queueA: Queue, queueB: Queue, userId: string) {
  const unionData = [...queueA.patients, ...queueB.patients];
  
  // Bug: Not setting queue_type
  const computedQueue = await db.queues.insert({
    name: `${queueA.name} ∪ ${queueB.name}`,
    createdBy: userId,
    source: 'computed',
    patients: unionData,
    // Missing: queue_type field
  });
  
  return computedQueue;
}
```

### Step 6: Report Findings

**AI Output**:

---

## Bug #26: collections运算生成的collections无法生成snapshots

### Problem
Computed queues (created via operations like union/intersection) fail to generate snapshots with error "queue_type is required". This is because computed queues don't have the `queue_type` field set during creation.

### Root Cause
**File**: `backend-api/src/services/queueOperations.ts:67`

When `computeUnion()` creates a new queue from operation results, it doesn't set `queue_type`. Later, when `createSnapshot()` tries to read `queue.queue_type`, it gets `undefined`, causing the API to reject the request.

### Proposed Fix
Set `queue_type` for computed queues. Two approaches:

**Option A (Recommended)**: Inherit `queue_type` from source queues
- If both source queues have same type → use that type
- If types differ or either is null → set to special type `'mixed'`

**Option B**: Always set computed queue type to `'computed'`
- Simpler logic
- But loses information about original queue types

**Files to modify**:
- `backend-api/src/services/queueOperations.ts:67` — Add `queue_type` field
- `backend-api/src/types/queue.ts:12` — Add `'mixed'` or `'computed'` to QueueType enum (if Option A/B)

Which approach do you prefer?

---

**User**: "Use Option A, but if types differ just use the first queue's type. We don't need a 'mixed' type."

**AI**: "Understood. Implementing Option A with inheritance from first queue."

### Step 7: Implement Fix

**AI modifies** `queueOperations.ts:67`:

```typescript
async computeUnion(queueA: Queue, queueB: Queue, userId: string) {
  const unionData = [...queueA.patients, ...queueB.patients];
  
  const computedQueue = await db.queues.insert({
    name: `${queueA.name} ∪ ${queueB.name}`,
    createdBy: userId,
    source: 'computed',
    queue_type: queueA.queue_type || queueB.queue_type || 'default',  // ← Fixed
    patients: unionData,
  });
  
  return computedQueue;
}
```

**AI runs validation**:
```bash
cd backend-api
npx tsc --noEmit
# ✓ No errors

npx eslint src/services/queueOperations.ts
# ✓ No errors
```

**AI Output**:
```
Changes implemented:
- Modified backend-api/src/services/queueOperations.ts:70
- Added queue_type field, inherits from first source queue
- Fallback to 'default' if both are null
- Typecheck passed ✓
- ESLint passed ✓

Ready for your local testing. Please:
1. Start the API server
2. Create two queues with queue_type set
3. Perform union operation
4. Try creating snapshot on the result queue
5. Verify snapshot creation succeeds
```

### Step 8: User Testing

**User** (in their terminal):
```bash
cd backend-api
npm run dev

# In another terminal, test the fix
curl -X POST http://localhost:3000/api/queues/123/operations/union \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"targetQueueId": 456}'

# Result: Created queue ID 789

curl -X POST http://localhost:3000/api/queues/789/snapshots \
  -H "Authorization: Bearer $TOKEN"

# Result: 200 OK, snapshot created successfully ✓
```

**User** (in Claude Code): "Tests passed, snapshot created successfully."

### Step 9: Commit

**AI**:
```bash
cd backend-api
git add src/services/queueOperations.ts
git commit -m "$(cat <<'EOF'
禅道Bug #26: 修复collections运算生成的collections无法生成snapshots的问题

collections运算（并集/交集）生成的新collections缺少 queue_type 字段，
导致后续创建snapshots时 API 返回 400 Bad Request。

修改 queueOperations.ts 中的 computeUnion() 等方法，
为计算生成的collections继承源collections的 queue_type。

禅道 Bug #26: https://zentao.example.com/zentao/bug-view-26.html
EOF
)"
```

**Output**:
```
[feature/queue-snapshot-fix a1b2c3d] 禅道Bug #26: 修复collections运算生成的collections无法生成snapshots的问题
 1 file changed, 1 insertion(+)
```

**AI**:
```bash
git push origin feature/queue-snapshot-fix
```

**AI Output**:
```
Changes committed and pushed:
- Branch: feature/queue-snapshot-fix
- Commit: a1b2c3d
- ZenTao Bug #26 referenced in commit message

Next steps (manual):
1. Update bug status in ZenTao to "resolved"
2. Assign to QA for verification (if your process requires it)
3. Create PR to merge into develop/main branch
```

## Key Takeaways

### What Worked Well
- ✅ Screenshots provided crucial context (error dialog + network tab)
- ✅ Text description + screenshots together gave complete picture
- ✅ Approval gate caught ambiguity (Option A vs B)
- ✅ User testing caught the fix before committing

### Lessons Learned
- **Always check network tab** in UI bug screenshots — often shows API error details
- **Inheritance logic needs clarification** — "what if types differ?" wasn't specified in bug report
- **Test with real data** — unit tests might pass but integration could fail

### Time Breakdown
- Analysis: ~5 min (fetch + download + read screenshots)
- Locate code: ~3 min (grep + read relevant files)
- Report + approval: ~2 min (write report, wait for response)
- Implement: ~2 min (one-line fix + validation)
- Test: ~5 min (user manual testing)
- Commit: ~1 min

**Total**: ~18 minutes from bug assignment to commit

Compare to manual process:
- Reading bug in ZenTao UI: ~2 min
- Download screenshots manually: ~1 min
- Locate code manually: ~10 min (grep, trial and error)
- Implement: ~5 min (think + code)
- Test: ~5 min
- Write commit message: ~2 min

**Manual total**: ~25 minutes

**Time saved**: ~7 minutes per bug (30% faster with AI assistance)
