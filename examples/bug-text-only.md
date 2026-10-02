# Example: Text-Only Bug

Example of processing a bug with a clear text description and no screenshots.

## Bug Context

**Bug ID**: #24  
**Title**: 复制research datasets应该把原来的collectionssnapshots和条件都带过来  
**Status**: Active  
**Assigned To**: You  
**Description**: Complete text description with reproduction steps

## Workflow Execution

### Step 1: List Bugs

```bash
zentao bug --project=5 --pick=id,title,status,assignedTo --format=json
```

**Output**:
```json
[
  {
    "id": "24",
    "title": "复制research datasets应该把原来的collectionssnapshots和条件都带过来",
    "status": "active",
    "assignedTo": "your-username"
  }
]
```

### Step 2: Fetch Details

```bash
zentao bug 24 --format=json
```

**Output** (excerpt):
```json
{
  "id": "24",
  "title": "复制research datasets应该把原来的collectionssnapshots和条件都带过来",
  "steps": "复现步骤：\n1. 创建research datasets A，包含collectionssnapshots S1 和筛选条件 C1\n2. 使用「copy item」功能copy item A 为数据集 B\n3. 查看数据集 B 的详情\n\n预期结果：\n- 数据集 B 应该包含collectionssnapshots S1 的副本\n- 数据集 B 应该包含筛选条件 C1 的副本\n- 两者应该关联到数据集 B，而不是数据集 A\n\n实际结果：\n- 数据集 B 创建成功，但collectionssnapshots字段为空\n- 筛选条件字段也为空\n- 需要手动重新配置snapshots和条件\n\n影响：\ncopy item本意是为了快速基于已有数据集创建变体，但目前需要重新配置所有条件，失去了「复制」的意义。",
  "status": "active",
  "pri": "3"
}
```

**AI Decision**: Steps field has clear text description, no `file-read-N.png` references → Skip screenshot download, proceed to analysis

### Step 3: Analyze Issue

**AI Analysis** (no screenshot reading needed):

**Symptom**: When copying a research dataset, the queue snapshot and filter conditions are not copied to the new dataset.

**Expected behavior**: Copied dataset should have duplicates of:
- Queue snapshot (pointing to new dataset)
- Filter conditions (pointing to new dataset)

**Actual behavior**: Copied dataset is empty (no snapshot, no conditions)

**Impact**: Defeats the purpose of "copy" feature — user must manually reconfigure everything

### Step 4: Locate Code

**AI searches**:
```bash
grep -r "copyItem\|copy item" backend-api/
```

**Findings**:
- `backend-api/src/controllers/datasetController.ts:89` — `copyItem()` handler
- `backend-api/src/services/datasetService.ts:134` — `duplicateItem()` implementation

**AI reads** `datasetService.ts:134`:

```typescript
async duplicateItem(sourceId: string, userId: string) {
  const source = await this.getDataset(sourceId);
  
  // Bug: Only copying basic fields
  const newDataset = await db.datasets.insert({
    name: `${source.name} - 副本`,
    description: source.description,
    itemType: source.itemType,
    createdBy: userId,
    // Missing: snapshotId, filterConditions
  });
  
  return newDataset;
}
```

**AI also checks related tables**:
```bash
grep -r "snapshotId\|filterConditions" backend-api/src/models/
```

**Findings**:
- `dataset.model.ts` has `snapshotId` (foreign key to queue_snapshots table)
- `dataset.model.ts` has `filterConditions` (JSON field)

### Step 5: Report Findings

**AI Output**:

---

## Bug #24: 复制research datasets应该把原来的collectionssnapshots和条件都带过来

### Problem
When copying a research dataset, the queue snapshot and filter conditions are not duplicated to the new dataset. Users must manually reconfigure everything, defeating the purpose of the copy feature.

### Root Cause
**File**: `backend-api/src/services/datasetService.ts:134`

The `duplicateItem()` method only copies basic fields (name, description, itemType) but doesn't copy:
- `snapshotId` — reference to queue snapshot
- `filterConditions` — JSON object with filter rules

### Proposed Fix
Extend `duplicateItem()` to:
1. Copy `snapshotId` directly (same snapshot can be referenced by multiple datasets)
2. Deep-clone `filterConditions` JSON object

**Note**: We're copying the *reference* to the queue snapshot, not creating a new snapshot. This is correct because:
- Snapshots are immutable (point-in-time captures)
- Multiple datasets can share the same snapshot
- Creating a duplicate snapshot would waste storage

**Files to modify**:
- `backend-api/src/services/datasetService.ts:134` — Add missing fields

Does this approach work for you?

---

**User**: "Yes, go ahead."

### Step 6: Implement Fix

**AI modifies** `datasetService.ts:134`:

```typescript
async duplicateItem(sourceId: string, userId: string) {
  const source = await this.getDataset(sourceId);
  
  const newDataset = await db.datasets.insert({
    name: `${source.name} - 副本`,
    description: source.description,
    itemType: source.itemType,
    createdBy: userId,
    snapshotId: source.snapshotId,  // ← Fixed: Copy snapshot reference
    filterConditions: source.filterConditions ? 
      JSON.parse(JSON.stringify(source.filterConditions)) : null,  // ← Fixed: Deep clone
  });
  
  return newDataset;
}
```

**AI runs validation**:
```bash
cd backend-api
npx tsc --noEmit
# ✓ No errors

npx eslint src/services/datasetService.ts
# ✓ No errors
```

**AI Output**:
```
Changes implemented:
- Modified backend-api/src/services/datasetService.ts:134-140
- Added snapshotId field (copies reference to snapshot)
- Added filterConditions field (deep clone of JSON object)
- Typecheck passed ✓
- ESLint passed ✓

Ready for testing. Please:
1. Create a dataset A with queue snapshot and filter conditions
2. Copy dataset A to create dataset B
3. Verify dataset B has the same snapshot ID and filter conditions
4. Verify modifying B's conditions doesn't affect A (separate objects)
```

### Step 7: User Testing

**User**:
```bash
cd backend-api
npm run dev

# Test in another terminal
# 1. Create dataset A
curl -X POST http://localhost:3000/api/datasets \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "测试数据集A",
    "snapshotId": 123,
    "filterConditions": {"age": {"min": 18, "max": 65}}
  }'
# Result: Created dataset ID 456

# 2. Copy dataset A
curl -X POST http://localhost:3000/api/datasets/456/copy \
  -H "Authorization: Bearer $TOKEN"
# Result: Created dataset ID 789

# 3. Verify dataset B
curl http://localhost:3000/api/datasets/789 \
  -H "Authorization: Bearer $TOKEN"
# Result:
# {
#   "id": 789,
#   "name": "测试数据集A - 副本",
#   "snapshotId": 123,  ← Correct: same snapshot
#   "filterConditions": {"age": {"min": 18, "max": 65}}  ← Correct: copied
# }

# 4. Verify deep clone (modify B doesn't affect A)
curl -X PATCH http://localhost:3000/api/datasets/789 \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"filterConditions": {"age": {"min": 30, "max": 50}}}'

curl http://localhost:3000/api/datasets/456 \
  -H "Authorization: Bearer $TOKEN"
# Result: Dataset A still has {"age": {"min": 18, "max": 65}}  ← Correct: independent
```

**User** (in Claude Code): "Tests passed. Dataset copy now includes snapshot and conditions, and they're independent."

### Step 8: Commit

**AI**:
```bash
cd backend-api
git add src/services/datasetService.ts
git commit -m "$(cat <<'EOF'
禅道Bug #24: 复制research datasets应该把原来的collectionssnapshots和条件都带过来

修改 datasetService.ts 中的 duplicateItem() 方法：
- 复制 snapshotId（引用同一个snapshots）
- 深拷贝 filterConditions（JSON 对象独立）

确保复制后的数据集与原数据集功能一致，
修改副本的条件不影响原数据集。

禅道 Bug #24: https://zentao.example.com/zentao/bug-view-24.html
EOF
)"
git push origin develop
```

**Output**:
```
[develop b3c4d5e] 禅道Bug #24: 复制research datasets应该把原来的collectionssnapshots和条件都带过来
 1 file changed, 4 insertions(+), 1 deletion(-)

Changes committed and pushed to develop branch.

You can now update bug #24 status in ZenTao to "resolved".
```

## Key Differences from Screenshot Bug

### No Screenshot Download Step
- Text description was complete and unambiguous
- Skipped download, saved ~30 seconds
- Proceeded directly to code analysis

### Faster Analysis
- **Screenshot bug**: Need to visually interpret images, extract error messages, cross-reference with code
- **Text-only bug**: Direct parsing of expected vs actual behavior
- **Time saved**: ~2-3 minutes on analysis phase

### Clearer Root Cause
- Text explicitly states what's missing (snapshot + conditions)
- No need to infer from visual clues
- Less chance of misunderstanding

## When to Skip Screenshots

**Skip download if**:
- ✅ Bug description clearly states expected and actual behavior
- ✅ No `file-read-N.png` references in `steps` field
- ✅ Issue is data/logic-related, not UI visual

**Must download if**:
- ❌ Description says "详见附图" (see attached image)
- ❌ Description is vague/empty
- ❌ Issue is about visual layout, alignment, or appearance

**Mixed approach** (download + read text):
- Bug has both text explanation and supplementary screenshots
- Text explains logic, screenshots show visual impact

## Time Breakdown

| Phase | Screenshot Bug | Text-Only Bug |
|-------|----------------|---------------|
| Fetch details | 1 min | 1 min |
| Download screenshots | 1 min | **0 min** ✓ |
| Analyze | 5 min | **3 min** ✓ |
| Locate code | 3 min | 3 min |
| Report + approval | 2 min | 2 min |
| Implement | 2 min | 2 min |
| Test | 5 min | 5 min |
| Commit | 1 min | 1 min |
| **Total** | 20 min | **17 min** |

**Text-only bugs are ~15% faster** when description is clear.

## Best Practices for Bug Reporters

To maximize efficiency of this workflow:

### For Text-Only Bugs ✓
```
标题: copy item时snapshots和条件丢失

复现步骤:
1. 创建数据集A，配置snapshotsS1和条件C1
2. copy itemA
3. 查看复制的数据集B

预期: B包含S1和C1的副本
实际: B的snapshots和条件字段为空

影响: 必须手动重新配置，失去复制功能的意义
```

Clear, structured, includes expected vs actual.

### For Screenshot Bugs ✓
```
标题: snapshots生成失败

复现步骤: 详见附图
(Attach screenshots showing error dialog + browser network tab)
```

Visual issues need visual evidence.

### Poor Bug Reports ❌
```
标题: 数据集有问题

描述: 复制功能不好用，修一下

(No steps, no expected behavior, no screenshots)
```

AI must ask clarifying questions, slows down workflow.

## Conclusion

Text-only bugs are **ideal for AI-assisted workflows** when:
- Description is complete and structured
- Issue is about data/logic, not visual UI
- Reporter includes expected vs actual behavior

This bug (#24) is a perfect example: 3 lines of code fixed it, because the problem was clearly defined upfront.
