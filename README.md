# MiniGit Viewer

A web application for browsing local Git repositories. View branches, commits, diffs, and commit graphs.

**Note**: This project was entirely coded by AI (Claude with Cursor).

## Features

- Browse local Git repositories by path
- List all branches in a repository
- Display commit history with author, timestamp, and Gravatar avatars
- Interactive Git graph visualization using D3.js
  - Topological sorting (children appear before parents)
  - Branch-specific colors and column positioning
  - Supports merge commits and fast-forward merges
- View single commit diffs in a resizable sidebar
  - Width adjustable from 25% to 75% of screen
  - Closes with Escape key, X button, or overlay click
- Compare two commits with side-by-side diff view
- Compare two branches to view differences
- React Query for API call caching
- Repository path saved to localStorage
- Docker support for deployment

## Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **UI Components**: shadcn/ui
- **Styling**: Tailwind CSS
- **Data Fetching**: React Query (TanStack Query)
- **Git Operations**: isomorphic-git
- **Diff Rendering**: diff2html
- **Graph Visualization**: D3.js
- **Avatar Generation**: Gravatar (MD5 hash)
- **Language**: TypeScript

## Requirements

- Node.js 20+ (for local development)
- Docker & Docker Compose (for containerized deployment)

## Installation

### Local Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Docker Production

```bash
docker-compose up --build
```

Open [http://localhost:3000](http://localhost:3000)

## Usage

### Repository Selection

1. Enter the absolute path to a local Git repository
2. Path must contain a `.git` directory
3. Repository path is saved to localStorage

### Diff Viewer

**List View**:
- Table of commits with hash, message, author, date
- Click "View" to see a single commit diff
- Select two commits to compare

**Graph View**:
- D3.js visualization of commit graph
- Select branches to display (all shown if none selected)
- Each branch has unique color and column
- Click commit nodes to view diffs
- Commits ordered topologically (children before parents)

**Single Commit Diff**:
- Opens in resizable sidebar (25%-75% width)
- Close with Escape key, X button, or overlay click

**Branch Comparison**:
- Click "Compare Branches"
- Select two branches
- View complete diff between branches

## API Endpoints

All endpoints use POST with JSON body.

### POST `/api/repo/branches`

List branches in repository.

**Request:**
```json
{
  "repoPath": "/path/to/repo"
}
```

**Response:**
```json
{
  "branches": ["main", "develop", "feature/xyz"]
}
```

### POST `/api/repo/commits`

Get commit history for a branch.

**Request:**
```json
{
  "repoPath": "/path/to/repo",
  "branch": "main"
}
```

**Response:**
```json
{
  "commits": [
    {
      "oid": "abc123...",
      "commit": {
        "message": "Initial commit",
        "author": {
          "name": "John Doe",
          "email": "john@example.com",
          "timestamp": 1234567890
        },
        "parent": ["parent-oid"]
      }
    }
  ]
}
```

### POST `/api/repo/graph`

Get commit graph data for visualization (supports multiple branches).

**Request:**
```json
{
  "repoPath": "/path/to/repo",
  "branchNames": ["main", "develop"]
}
```

**Response:**
```json
{
  "commits": [
    {
      "oid": "abc123...",
      "message": "Initial commit",
      "author": {
        "name": "John Doe",
        "email": "john@example.com"
      },
      "timestamp": 1234567890,
      "parents": [],
      "branches": ["main"],
      "primaryBranch": "main"
    }
  ],
  "branchTips": {
    "main": "latest-commit-oid",
    "develop": "another-commit-oid"
  }
}
```

### POST `/api/repo/commit-diff`

Get diff for a single commit (compared with parent).

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

### POST `/api/repo/compare-branches`

Compare two branches.

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
  "diff": "diff --git a/file.txt b/file.txt\n..."
}
```

## Project Structure

```
src/
├── app/
│   ├── page.tsx              # Main page
│   ├── layout.tsx            # Root layout with providers
│   ├── providers.tsx         # React Query provider
│   ├── globals.css           # Global styles
│   └── api/repo/
│       ├── branches/route.ts
│       ├── commits/route.ts
│       ├── commit-diff/route.ts
│       ├── compare-branches/route.ts
│       ├── diff/route.ts
│       └── graph/route.ts
├── components/
│   ├── ui/                   # shadcn/ui components
│   ├── BranchList.tsx
│   ├── CommitList.tsx
│   ├── CommitGraph.tsx        # D3.js graph
│   ├── DiffViewer.tsx
│   ├── ResizableDiffSidebar.tsx
│   ├── GravatarAvatar.tsx
│   └── RepoPathInput.tsx
├── services/
│   └── git.service.ts        # Git operations
├── types/
│   └── git.types.ts
└── lib/
    ├── utils.ts
    └── gravatar.ts
```

## Implementation Details

### Topological Sorting

Uses reverse Kahn's algorithm:
- Starts with tip commits (no children)
- Processes commits, then their parents
- Ensures children appear before parents
- Maintains chronological order when possible

### Branch Visualization

- Each branch assigned unique color and column
- Primary branch determined by: branch tip > priority branch (main/dev) > first branch
- Prevents line overlapping with branch-specific columns

### Performance

- React Query caching (1 minute stale time)
- Limited to 50 commits per branch
- Files > 1MB skipped in diffs
- Optimized diff calculation for initial commits

## Docker Configuration

`docker-compose.yml` mounts:
- `/home:/home:ro` - Read-only access to home directories
- `/tmp:/tmp:ro` - Read-only access to temp directory

## Troubleshooting

**"Not a git repository" Error**
- Path must contain `.git` directory
- Use absolute paths
- Verify read permissions

**Commits Not Loading**
- Verify branch name
- Check branch has commits
- Graph API limits to 50 commits per branch

**Graph Not Displaying**
- Select at least one branch
- Check browser console for errors

**Diff Not Showing**
- For comparison: select exactly two commits
- Large diffs may take time to render
- Files > 1MB are skipped

**Sidebar Not Closing**
- Press Escape key
- Click X button
- Click overlay

## License

MIT License
