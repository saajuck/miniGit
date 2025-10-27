# MiniGit Viewer

A modern, full-stack web application for browsing local Git repositories. View branches, commits, and diffs with a beautiful UI built with Next.js and shadcn/ui.

## Features

- 🔍 Browse any local Git repository
- 🌿 View all branches in a repository
- 📝 Display commit history with author and timestamp
- 👁️ **View changes in a single commit** (new!)
- 🔀 Compare two commits with side-by-side diff view
- 🌲 Compare two branches to see all differences
- 📑 **Tabbed interface** for organized workflow (new!)
- 🎨 Modern UI with Tailwind CSS and shadcn/ui components
- 🐳 Docker support for easy deployment

## Tech Stack

- **Frontend & Backend**: Next.js 14+ (App Router)
- **UI Library**: React with shadcn/ui components
- **Styling**: Tailwind CSS
- **Git Operations**: isomorphic-git
- **Diff Rendering**: diff2html
- **Language**: TypeScript

## Prerequisites

- Node.js 20+ (for local development)
- Docker & Docker Compose (for containerized deployment)

## Installation & Usage

### Option 1: Local Development

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the development server:**
   ```bash
   npm run dev
   ```

3. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

### Option 2: Docker (Production)

1. **Build and run with Docker Compose:**
   ```bash
   docker-compose up --build
   ```

2. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

### Option 3: Docker (Development with Hot Reload)

1. **Run the development container:**
   ```bash
   docker-compose --profile dev up
   ```

2. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

## How to Use

The application is organized into **3 tabs** for a clean workflow:

### Tab 1: Repository 📁

1. **Enter Repository Path**: 
   - **Option A - Type the path**: In the input field, enter the full path to a local Git repository
     - Example: `/home/user/projects/my-repo`
   - **Option B - Browse button**: Click the "Browse" button to open a folder picker
     - Note: Due to browser security restrictions, you may need to manually copy/paste the full path
   - The path should contain a `.git` directory

2. **Select a Branch**:
   - Once loaded, view all branches and select one to work with

### Tab 2: Commit Diff 🔀

1. **View a Single Commit**:
   - Click the "View" button next to any commit
   - See all changes made in that specific commit
   - Perfect for reviewing what changed in a commit

2. **Compare Two Commits**:
   - Select two commits using checkboxes
   - View side-by-side diff between the two commits
   - Automatic syntax highlighting

### Tab 3: Branch Comparison 🌲

1. **Compare Branches**:
   - Click the "Compare Branches" button
   - Select two branches by clicking on them
   - Click "Compare [branch1] ↔ [branch2]"
   - View complete diff between the branches

## API Endpoints

The application exposes the following API endpoints:

### POST `/api/repo/branches`
List all branches in a repository.

**Request Body:**
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
Get commit history for a specific branch.

**Request Body:**
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
        }
      }
    }
  ]
}
```

### POST `/api/repo/diff`
Get the diff between two commits.

**Request Body:**
```json
{
  "repoPath": "/path/to/repo",
  "commit1": "abc123...",
  "commit2": "def456..."
}
```

**Response:**
```json
{
  "diff": "diff --git a/file.txt b/file.txt\n..."
}
```

### POST `/api/repo/compare-branches`
Compare two branches and get their differences.

**Request Body:**
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

### POST `/api/repo/commit-diff`
Get the diff for a single commit (compares with parent commit).

**Request Body:**
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

## Project Structure

```
MiniGit/
├── src/
│   ├── app/
│   │   ├── page.tsx              # Main application page
│   │   ├── layout.tsx            # Root layout
│   │   ├── globals.css           # Global styles
│   │   └── api/
│   │       └── repo/
│   │           ├── branches/route.ts  # Branches API
│   │           ├── commits/route.ts   # Commits API
│   │           └── diff/route.ts      # Diff API
│   ├── components/
│   │   ├── ui/                   # shadcn/ui components
│   │   ├── BranchList.tsx
│   │   ├── CommitList.tsx
│   │   ├── DiffViewer.tsx
│   │   └── RepoPathInput.tsx
│   ├── services/
│   │   └── git.service.ts        # Git operations
│   ├── types/
│   │   └── git.types.ts          # TypeScript types
│   └── lib/
│       └── utils.ts              # Utility functions
├── public/                       # Static assets
├── Dockerfile                    # Production Docker image
├── docker-compose.yml            # Docker Compose config
└── README.md                     # This file
```

## Architecture

MiniGit Viewer is built as a full-stack Next.js application:

- **Frontend**: React components with shadcn/ui for a modern, accessible UI
- **Backend**: Next.js API routes handle Git operations server-side
- **Git Integration**: isomorphic-git provides pure JavaScript Git implementation
- **Diff Rendering**: diff2html creates beautiful, syntax-highlighted diffs

The application runs entirely locally and does not send any data to external servers.

## Development

### Building for Production

```bash
npm run build
npm start
```

### Linting

```bash
npm run lint
```

## Docker Configuration

The `docker-compose.yml` includes volume mounts to access host Git repositories:

- `/home:/home:ro` - Read-only access to user home directories
- `/tmp:/tmp:ro` - Read-only access to temp directory

**Security Note**: The mounted volumes are read-only (`:ro` flag) to prevent accidental modifications.

## Troubleshooting

### "Not a git repository" Error
- Ensure the path you entered contains a `.git` directory
- Use absolute paths, not relative paths
- Verify you have read permissions for the directory

### Commits Not Loading
- Verify the branch name is correct
- Some repositories may use `master` instead of `main`
- Check that the branch has commits

### Diff Not Showing
- Ensure you have selected exactly two commits
- Large diffs may take time to render
- Check the browser console for errors

## License

MIT License - Feel free to use this project for any purpose.

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

