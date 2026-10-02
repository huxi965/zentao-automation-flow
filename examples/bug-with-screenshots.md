# Example: Bug with Screenshots

Simplified walkthrough showing how the workflow handles bugs that include screenshot attachments.

## Bug Context

**Bug ID**: #42  
**Title**: Export feature fails with "missing metadata" error  
**Status**: Active  
**Assigned To**: You  
**Description**: Error occurs when exporting merged data collections

## Workflow Execution

### Step 1: List Bugs

```bash
zentao bug --project=5 --pick=id,title,status,assignedTo --format=json
```

**Output**:
```json
[
  {
    "id": "42",
    "title": "Export feature fails with missing metadata error",
    "status": "active",
    "assignedTo": "your-username"
  }
]
```

### Step 2: Fetch Details & Download Screenshots

```bash
zentao bug 42 --format=json
```

**Key finding**: Steps field contains `file-read-456.png` and `file-read-457.png` references → Download needed

```bash
cd ~/.claude/tools/zentao-mcp
npx tsx scripts/downloadBugImages.ts 42 --out ./zentao-bug-images
```

**Result**: 2 screenshots downloaded to `zentao-bug-images/#42/`

### Step 3: Analyze Screenshots

**Screenshot 1**: Error dialog showing "Export failed: missing metadata"

**Screenshot 2**: Browser DevTools showing:
- Request: `POST /api/collections/123/export`
- Response: `400 Bad Request`
- Error: `{"error": "collection_type is required"}`

**Root Cause Analysis**:
- Merged collections (from union/intersection operations) don't have `collection_type` field
- Export API requires this field but it's missing

### Step 4: Locate Code

```bash
grep -r "collection_type" backend-api/
```

**Findings**:
- `backend-api/src/services/collectionService.ts:145` — reads `collection.collection_type`
- `backend-api/src/services/collectionOperations.ts:67` — creates collection without setting the field

**Code excerpt** (simplified):
```typescript
// Bug location: collectionOperations.ts
async computeUnion(collectionA, collectionB, userId) {
  const mergedCollection = await db.collections.insert({
    name: `${collectionA.name} ∪ ${collectionB.name}`,
    createdBy: userId,
    items: [...collectionA.items, ...collectionB.items],
    // Missing: collection_type field ← Bug here
  });
  return mergedCollection;
}
```

### Step 5: Report Findings (Wait for Approval)

**AI Output**:

---

## Bug #42: Export feature fails with "missing metadata"

### Problem
Merged collections fail to export because `collection_type` field is not set during merge operation.

### Root Cause
`collectionOperations.ts:67` — `computeUnion()` doesn't set `collection_type`

### Proposed Fix
Add `collection_type` field, inherit from first source collection.

**Files to modify**:
- `backend-api/src/services/collectionOperations.ts:67`

Approve?

---

**User**: "Yes, go ahead."

### Step 6: Implement Fix

```typescript
// Fixed version
async computeUnion(collectionA, collectionB, userId) {
  const mergedCollection = await db.collections.insert({
    name: `${collectionA.name} ∪ ${collectionB.name}`,
    createdBy: userId,
    collection_type: collectionA.collection_type || collectionB.collection_type || 'default',  // ← Fixed
    items: [...collectionA.items, ...collectionB.items],
  });
  return mergedCollection;
}
```

**Validation**:
```bash
npx tsc --noEmit  # ✓ Pass
npx eslint src/services/collectionOperations.ts  # ✓ Pass
```

### Step 7: User Testing

**User** tests locally:
```bash
cd backend-api && npm run dev

# Test merge operation
curl -X POST http://localhost:3000/api/collections/123/operations/union \
  -H "Authorization: Bearer $TOKEN" -d '{"targetCollectionId": 456}'
# Result: Created collection ID 789

# Test export (previously failed)
curl -X POST http://localhost:3000/api/collections/789/export \
  -H "Authorization: Bearer $TOKEN"
# Result: 200 OK ✓
```

**User**: "Tests passed, export works now."

### Step 8: Commit

```bash
git add src/services/collectionOperations.ts
git commit -m "禅道Bug #42: Fix merged collection export failure

Merged collections were missing collection_type field,
causing export API to return 400 Bad Request.

Modified computeUnion() to inherit collection_type from source collections.

禅道 Bug #42: https://zentao.example.com/zentao/bug-view-42.html"

git push origin feature/collection-export-fix
```

## Key Takeaways

### What Worked Well
- ✅ Screenshots provided crucial context (error dialog + network tab)
- ✅ Approval gate caught the issue before implementation
- ✅ User testing verified the fix

### Time Breakdown

| Phase | Duration |
|-------|----------|
| Fetch + download screenshots | ~2 min |
| Analyze screenshots | ~3 min |
| Locate code | ~3 min |
| Report + wait for approval | ~2 min |
| Implement + validate | ~2 min |
| User testing | ~5 min |
| Commit | ~1 min |
| **Total** | **~18 min** |

**vs. Manual process** (~25 min): **30% time saved** with AI assistance

### Lessons Learned
- **Screenshots are critical** for UI bugs — error dialogs and network tabs provide exact API error messages
- **Approval gate prevents wrong fixes** — user confirmed the approach before implementation
- **Test with real data** — type checking passes doesn't mean integration works
