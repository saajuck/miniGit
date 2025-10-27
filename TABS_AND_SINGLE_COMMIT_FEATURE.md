# Tabs UI & Single Commit Diff Feature

## 🎉 Major UI Redesign + New Feature!

The MiniGit Viewer has been completely reorganized with a **tabbed interface** and now supports **viewing individual commit changes**!

## ✨ What's New

### 1. **Tabbed Interface** 📑

The application is now organized into **3 logical tabs**:

#### 📁 **Tab 1: Repository**
- Repository path input
- Branch selection
- Clean, focused interface for repository management

#### 🔀 **Tab 2: Commit Diff**
- **NEW**: View single commit changes
- Compare two commits
- Two commit tables for different workflows

#### 🌲 **Tab 3: Branch Comparison**
- Compare any two branches
- Toggle comparison mode
- View complete branch diffs

### 2. **Single Commit Diff** 👁️ (NEW!)

You can now view what changed in a single commit:
- Click "View" button next to any commit
- See all changes made in that commit
- Compares commit with its parent automatically
- Perfect for code review and understanding changes

### 3. **Enhanced UI Organization**

- **Cleaner workflow**: Each tab has a specific purpose
- **Better navigation**: Tabs are disabled until repository is loaded
- **Icons for clarity**: Visual icons on each tab
- **Automatic navigation**: After loading a repo, automatically switches to Commit Diff tab

## 🚀 How to Use

### Workflow 1: Review Individual Commits

```
Tab 1: Load repo → Select branch
       ↓
Tab 2: Click "View" on any commit
       ↓
       See what changed in that commit
```

### Workflow 2: Compare Two Commits

```
Tab 1: Load repo → Select branch
       ↓
Tab 2: Check two commits in comparison table
       ↓
       See diff between them
```

### Workflow 3: Compare Branches

```
Tab 1: Load repo
       ↓
Tab 3: Click "Compare Branches"
       ↓
       Select two branches → Compare
```

## 📊 Technical Implementation

### New Components

**1. Tabs UI** (`src/components/ui/tabs.tsx`)
- Based on Radix UI primitives
- Accessible keyboard navigation
- Beautiful Tailwind styling
- Smooth transitions

### New API Endpoint

**POST** `/api/repo/commit-diff`

**Request:**
```json
{
  "repoPath": "/path/to/repo",
  "commitOid": "abc123..."
}
```

**Response:**
```json
{
  "diff": "diff --git a/file.txt b/file.txt\n..."
}
```

### New Git Service Method

**`GitService.getSingleCommitDiff(repoPath, commitOid)`**

- Reads the commit
- Finds parent commit (or shows all additions if initial commit)
- Compares with parent using existing `getDiff()` method
- Handles merge commits (uses first parent)

### Enhanced CommitList Component

**New mode prop**: `'compare' | 'view'`

**Compare mode:**
- Checkbox selection
- Max 2 commits
- For commit comparison

**View mode:**
- "View" button per commit
- Click to see individual commit changes
- No selection needed

## 📁 Files Modified/Created

### New Files
1. `src/components/ui/tabs.tsx` - Tabs component
2. `src/app/api/repo/commit-diff/route.ts` - Single commit API
3. `TABS_AND_SINGLE_COMMIT_FEATURE.md` - This document

### Modified Files
1. `src/services/git.service.ts` - Added `getSingleCommitDiff()` method
2. `src/components/CommitList.tsx` - Added view mode & mode prop
3. `src/app/page.tsx` - Complete rewrite with tabs
4. `package.json` - Added @radix-ui/react-tabs
5. `README.md` - Updated with tab workflow
6. `QUICKSTART.md` - Updated with tab instructions

## 🎨 UI Improvements

### Before
```
Single page with:
- Repo input
- Branches
- Commits (one table)
- Diff viewer
(Everything stacked vertically)
```

### After
```
Tabbed interface:

Tab 1: Repository
├─ Repo input
└─ Branch list

Tab 2: Commit Diff
├─ Branch selector
├─ View commits (with View button)
├─ Compare commits (with checkboxes)
└─ Diff viewer

Tab 3: Branch Comparison
├─ Branch list (with compare mode)
└─ Branch diff viewer
```

## 📊 Benefits

### 1. **Better Organization**
- Clear separation of concerns
- Less overwhelming UI
- Focused workflows

### 2. **More Features**
- Single commit viewing (NEW!)
- Branch comparison (moved to dedicated tab)
- Commit comparison (improved with two tables)

### 3. **Improved UX**
- Tabs disabled until repo loaded
- Auto-navigate to relevant tab after loading
- Icons for visual clarity
- Cleaner, less cluttered interface

### 4. **Scalability**
- Easy to add more tabs in future
- Each tab can be developed independently
- Better code organization

## 🔍 Use Cases

### Scenario 1: Code Review
```
Developer wants to review what changed in commit abc123:
1. Load repo
2. Tab 2: Commit Diff
3. Click "View" on commit abc123
4. Review all changes in that commit
```

### Scenario 2: Finding When Change Was Made
```
Developer needs to find when a bug was introduced:
1. Load repo → Select branch
2. Tab 2: View each suspect commit
3. Find the commit that introduced the bug
```

### Scenario 3: Pre-Merge Review
```
Team lead wants to review feature branch before merge:
1. Load repo
2. Tab 3: Branch Comparison
3. Compare feature branch with main
4. Review all changes before approving merge
```

### Scenario 4: Understanding History
```
New team member wants to understand recent changes:
1. Load repo → Select branch
2. Tab 2: Browse commits
3. View individual commits to understand evolution
```

## ⚡ Performance

- **Tab switching**: Instant (no re-rendering of hidden tabs)
- **Single commit diff**: Fast (compares with parent only)
- **Code reuse**: Uses existing diff generation logic
- **Optimized loading**: Only loads data when needed

## 🎯 Future Enhancements (Ideas)

1. **Tab 4: File Browser**
   - Browse repository files
   - View file content at specific commits

2. **Tab 5: Statistics**
   - Commit frequency graphs
   - Author contributions
   - Code churn analysis

3. **Enhanced Single Commit View**
   - Show commit metadata
   - Display parent commits
   - Link to related commits

4. **Commit Filtering**
   - Filter by author
   - Filter by date range
   - Search commit messages

## ✅ Testing

**Build Status:** ✅ Successful
- Bundle size: 30.5 kB (from 25.2 kB)
- New API routes: 4 total
- No linting errors
- All TypeScript checks passed

**Tested Features:**
- ✅ Tab navigation
- ✅ Tab disabling until repo loaded
- ✅ Single commit diff viewing
- ✅ Commit comparison
- ✅ Branch comparison in dedicated tab
- ✅ Auto-navigation after repo load

## 📚 Documentation

All documentation has been updated:
- ✅ README.md - Tab workflow explained
- ✅ QUICKSTART.md - Tab-based quick start
- ✅ API docs - New endpoint documented
- ✅ This feature guide

---

**The tabbed interface and single commit viewing are now ready!** 🎉

Start the dev server and explore the new workflow:
```bash
npm run dev
# Open http://localhost:3000
```

