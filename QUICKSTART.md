# Quick Start Guide

## 🚀 Get Started in 3 Steps

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Development Server
```bash
npm run dev
```

### 3. Open Application
Open your browser and navigate to: http://localhost:3000

## 💡 First Use

The app uses **3 tabs** for different workflows:

### 📁 Tab 1: Repository
1. Enter the path to any local Git repository:
   - **Type the path**: Example: `/home/benoit/dev/some-project`
   - **OR click "Browse"** to open a folder picker
   - The directory must contain a `.git` folder
2. Click "Load" - you'll be taken to the Commit Diff tab

### 🔀 Tab 2: Commit Diff
1. **View a single commit's changes:**
   - Click "View" button next to any commit
   - See what changed in that commit

2. **Compare two commits:**
   - Check two commits in the comparison table
   - See the diff automatically

### 🌲 Tab 3: Branch Comparison
1. Click "Compare Branches" button
2. Select two branches
3. Click "Compare [branch1] ↔ [branch2]"
4. View all differences between branches

## 🐳 Using Docker

### Development Mode
```bash
docker-compose --profile dev up
```

### Production Mode
```bash
docker-compose up --build
```

## 📋 Example Usage

Try it with this project itself:
```
Repository Path: /home/benoit/dev/MiniGit
```

(After the first commit is made to this repository)

## 🔧 Available Commands

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## 📚 More Information

See [README.md](./README.md) for complete documentation.

