# Branch Comparison Feature

## 🎉 New Feature Added!

The MiniGit Viewer now supports **branch comparison** - compare any two branches to see all their differences!

## ✨ What's New

### User Interface
- ✅ **"Compare Branches" button** in the branch list card
- ✅ **Comparison mode** that highlights selected branches
- ✅ **Visual feedback** showing which branches are selected (2/2)
- ✅ **Compare button** appears when two branches are selected
- ✅ **Side-by-side diff view** of all changes between branches

### Backend
- ✅ New API endpoint: `POST /api/repo/compare-branches`
- ✅ New Git service method: `GitService.compareBranches()`
- ✅ Resolves branch references to commit OIDs automatically

## 🚀 How to Use

### Step 1: Load a Repository
Enter the path to your Git repository as usual.

### Step 2: Enter Comparison Mode
Click the **"Compare Branches"** button in the branch list.

### Step 3: Select Two Branches
- Click on the first branch you want to compare
- Click on the second branch
- The button will show: `Compare [branch1] ↔ [branch2]`

### Step 4: View the Diff
Click the compare button to see all differences between the two branches!

### Step 5: Exit Comparison Mode
Click **"Cancel Compare"** to return to normal commit viewing.

## 📸 UI Changes

### Normal Mode
```
┌────────────────────────────────────────────────────┐
│  Branches                    [Compare Branches]    │
│  Select a branch to view commits                   │
│  [main] [develop] [feature/xyz]                    │
└────────────────────────────────────────────────────┘
```

### Comparison Mode
```
┌────────────────────────────────────────────────────┐
│  Branches                    [Cancel Compare]      │
│  Select two branches to compare (2/2 selected)     │
│  [main✓] [develop✓] [feature/xyz]                 │
│                                                     │
│  [Compare main ↔ develop]                          │
└────────────────────────────────────────────────────┘
```

## 🔧 Technical Implementation

### Files Modified

1. **`src/services/git.service.ts`**
   - Added `compareBranches()` method
   - Resolves branch names to commit OIDs
   - Reuses existing `getDiff()` method

2. **`src/app/api/repo/compare-branches/route.ts`** (NEW)
   - POST endpoint for branch comparison
   - Validates branch names
   - Returns unified diff

3. **`src/components/BranchList.tsx`**
   - Added comparison mode UI
   - Added branch selection logic
   - Added compare button
   - GitCompare icon from lucide-react

4. **`src/app/page.tsx`**
   - Added comparison mode state
   - Added branch selection handlers
   - Added compare API call
   - Conditional rendering for comparison diff

## 📊 API Reference

### New Endpoint

**POST** `/api/repo/compare-branches`

**Request:**
```json
{
  "repoPath": "/path/to/repo",
  "branch1": "main",
  "branch2": "develop"
}
```

**Response:**
```json
{
  "diff": "diff --git a/file.txt b/file.txt\n--- a/file.txt\n+++ b/file.txt\n..."
}
```

**Error Response:**
```json
{
  "error": "Failed to compare branches: branch not found"
}
```

## 🎨 Features

- ✅ **Smooth UI transitions** between normal and comparison modes
- ✅ **Visual feedback** for selected branches
- ✅ **Disabled state** for non-selectable branches (when 2 already selected)
- ✅ **Clear button labels** showing what will be compared
- ✅ **Automatic clearing** of commit selections when entering comparison mode
- ✅ **Consistent diff viewer** reused for both commit and branch comparisons

## 🔍 Use Cases

1. **Feature branch review**: Compare `feature/new-feature` with `main` before merging
2. **Release preparation**: Compare `release/v2.0` with `main` to see what's new
3. **Divergence analysis**: Compare `develop` with `main` to see accumulated changes
4. **Hotfix verification**: Compare `hotfix/critical-bug` with `production`

## ⚡ Performance

- Fast branch resolution using `git.resolveRef()`
- Efficient diff generation (reuses existing logic)
- No unnecessary file loading
- Smooth UI with no blocking operations

## 🎯 Future Enhancements (Optional)

- Show number of changed files
- Show insertions/deletions statistics
- Filter diff by file type
- Export comparison as patch file
- Compare more than 2 branches (multi-way diff)
- Merge preview functionality

## ✅ Testing

Build Status: ✅ Successful
- No linting errors
- All TypeScript checks passed
- Build size: 25.2 kB (optimized)
- New API route registered: `/api/repo/compare-branches`

## 📚 Documentation Updated

- ✅ README.md - Added feature to list and usage guide
- ✅ QUICKSTART.md - Added comparison steps
- ✅ API documentation - New endpoint documented

---

**Enjoy comparing branches with MiniGit Viewer! 🚀**

