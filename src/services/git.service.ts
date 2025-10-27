import * as git from 'isomorphic-git';
import fs from 'fs';
import path from 'path';
import * as Diff from 'diff';

export class GitService {
  /**
   * List all branches in the repository
   */
  static async listBranches(repoPath: string): Promise<string[]> {
    try {
      // Check if .git directory exists
      const gitDir = path.join(repoPath, '.git');
      if (!fs.existsSync(gitDir)) {
        throw new Error('Not a git repository (or any of the parent directories): .git');
      }

      const branches = await git.listBranches({
        fs,
        dir: repoPath,
      });

      return branches;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to list branches: ${error.message}`);
      }
      throw new Error('Failed to list branches: Unknown error');
    }
  }

  /**
   * List commits for a specific branch
   */
  static async listCommits(repoPath: string, branch: string = 'main', depth: number = 50) {
    try {
      const commits = await git.log({
        fs,
        dir: repoPath,
        ref: branch,
        depth,
      });

      return commits.map(commit => ({
        oid: commit.oid,
        commit: {
          message: commit.commit.message,
          author: {
            name: commit.commit.author.name,
            email: commit.commit.author.email,
            timestamp: commit.commit.author.timestamp,
          },
          parent: commit.commit.parent, // Add parent for graph visualization
        },
      }));
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to list commits: ${error.message}`);
      }
      throw new Error('Failed to list commits: Unknown error');
    }
  }

  /**
   * Get the diff between two commits with actual file content
   */
  static async getDiff(repoPath: string, commitOid1: string, commitOid2: string): Promise<string> {
    try {
      // Read both commits
      const commit1 = await git.readCommit({ fs, dir: repoPath, oid: commitOid1 });
      const commit2 = await git.readCommit({ fs, dir: repoPath, oid: commitOid2 });

      // Get changed files efficiently
      const changes = await this.getChangedFiles(repoPath, commit1.commit.tree, commit2.commit.tree);
      
      if (changes.length === 0) {
        return `diff --git a/${commitOid1} b/${commitOid2}\n\nNo changes found.`;
      }

      let diffOutput = '';
      
      // Limit to 10 files for performance (with actual content)
      const filesToShow = changes.slice(0, 10);
      
      for (const change of filesToShow) {
        diffOutput += `diff --git a/${change.path} b/${change.path}\n`;
        
        try {
          if (change.type === 'added') {
            // Read new file content
            const content = await this.readFileFromTree(repoPath, commit2.commit.tree, change.path);
            const lines = content.split('\n');
            
            diffOutput += `new file mode 100644\n`;
            diffOutput += `--- /dev/null\n`;
            diffOutput += `+++ b/${change.path}\n`;
            diffOutput += `@@ -0,0 +1,${lines.length} @@\n`;
            lines.forEach(line => {
              diffOutput += `+${line}\n`;
            });
          } else if (change.type === 'deleted') {
            // Read old file content
            const content = await this.readFileFromTree(repoPath, commit1.commit.tree, change.path);
            const lines = content.split('\n');
            
            diffOutput += `deleted file mode 100644\n`;
            diffOutput += `--- a/${change.path}\n`;
            diffOutput += `+++ /dev/null\n`;
            diffOutput += `@@ -1,${lines.length} +0,0 @@\n`;
            lines.forEach(line => {
              diffOutput += `-${line}\n`;
            });
          } else {
            // Try to read file content, but limit size for performance
            try {
              const content1 = await this.readFileFromTree(repoPath, commit1.commit.tree, change.path);
              const content2 = await this.readFileFromTree(repoPath, commit2.commit.tree, change.path);
              
              // Skip if file is too large (>1MB)
              if (content1.length > 1024 * 1024 || content2.length > 1024 * 1024) {
                diffOutput += `--- a/${change.path}\n`;
                diffOutput += `+++ b/${change.path}\n`;
                diffOutput += `@@ File too large to display @@\n`;
              } else {
                // Use JsDiff to create a unified diff with 3 lines of context
                const patch = Diff.createPatch(
                  change.path,
                  content1,
                  content2,
                  'a/' + change.path,
                  'b/' + change.path,
                  { context: 3 }
                );
                
                // Remove the first two header lines (Index and ===) to keep only the diff
                const patchLines = patch.split('\n');
                diffOutput += patchLines.slice(2).join('\n') + '\n';
              }
            } catch (fileError) {
              // If we can't read file (binary, etc.), show summary
              diffOutput += `--- a/${change.path}\n`;
              diffOutput += `+++ b/${change.path}\n`;
              diffOutput += `@@ Binary file or read error @@\n`;
            }
          }
        } catch (fileError) {
          // If we can't read file (binary, etc.), show summary
          diffOutput += `--- a/${change.path}\n`;
          diffOutput += `+++ b/${change.path}\n`;
          diffOutput += `@@ Binary file or read error @@\n`;
        }
        diffOutput += '\n';
      }

      if (changes.length > 10) {
        diffOutput += `\n# ${changes.length - 10} more file(s) changed (showing first 10 for performance)\n`;
      }

      return diffOutput;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to get diff: ${error.message}`);
      }
      throw new Error('Failed to get diff: Unknown error');
    }
  }

  /**
   * Read a file from a tree
   */
  private static async readFileFromTree(repoPath: string, treeOid: string, filepath: string): Promise<string> {
    const parts = filepath.split('/');
    let currentTreeOid = treeOid;
    
    // Navigate through directories
    for (let i = 0; i < parts.length - 1; i++) {
      const { tree } = await git.readTree({ fs, dir: repoPath, oid: currentTreeOid });
      const entry = tree.find(e => e.path === parts[i]);
      if (!entry || entry.type !== 'tree') {
        throw new Error(`Directory not found: ${parts.slice(0, i + 1).join('/')}`);
      }
      currentTreeOid = entry.oid;
    }
    
    // Read the file
    const { tree } = await git.readTree({ fs, dir: repoPath, oid: currentTreeOid });
    const filename = parts[parts.length - 1];
    const entry = tree.find(e => e.path === filename);
    
    if (!entry || entry.type !== 'blob') {
      throw new Error(`File not found: ${filepath}`);
    }
    
    const { blob } = await git.readBlob({ fs, dir: repoPath, oid: entry.oid });
    return new TextDecoder().decode(blob);
  }

  /**
   * Efficiently get only changed files between two trees
   */
  private static async getChangedFiles(
    repoPath: string, 
    tree1Oid: string, 
    tree2Oid: string, 
    prefix: string = ''
  ): Promise<Array<{ path: string; type: 'added' | 'deleted' | 'modified' }>> {
    const changes: Array<{ path: string; type: 'added' | 'deleted' | 'modified' }> = [];
    
    try {
      const tree1 = await git.readTree({ fs, dir: repoPath, oid: tree1Oid });
      const tree2 = await git.readTree({ fs, dir: repoPath, oid: tree2Oid });

      const entries1 = new Map(tree1.tree.map(e => [e.path, e]));
      const entries2 = new Map(tree2.tree.map(e => [e.path, e]));

      // Check for deleted and modified files
      for (const [path, entry1] of entries1) {
        const fullPath = prefix ? `${prefix}/${path}` : path;
        const entry2 = entries2.get(path);

        if (!entry2) {
          changes.push({ path: fullPath, type: 'deleted' });
        } else if (entry1.oid !== entry2.oid) {
          if (entry1.type === 'tree' && entry2.type === 'tree') {
            // Recursively check subdirectory
            const subChanges = await this.getChangedFiles(repoPath, entry1.oid, entry2.oid, fullPath);
            changes.push(...subChanges);
          } else {
            changes.push({ path: fullPath, type: 'modified' });
          }
        }
      }

      // Check for added files
      for (const [path, entry2] of entries2) {
        if (!entries1.has(path)) {
          const fullPath = prefix ? `${prefix}/${path}` : path;
          changes.push({ path: fullPath, type: 'added' });
        }
      }
    } catch (error) {
      // Ignore errors for individual trees
    }

    return changes;
  }

  /**
   * Compare two branches and get the diff
   */
  static async compareBranches(repoPath: string, branch1: string, branch2: string): Promise<string> {
    try {
      // Resolve both branches to their commit OIDs
      const oid1 = await git.resolveRef({ fs, dir: repoPath, ref: branch1 });
      const oid2 = await git.resolveRef({ fs, dir: repoPath, ref: branch2 });

      // Get the diff between the two commits
      return await this.getDiff(repoPath, oid1, oid2);
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to compare branches: ${error.message}`);
      }
      throw new Error('Failed to compare branches: Unknown error');
    }
  }

  /**
   * Get the diff for a single commit (compare with its parent)
   */
  static async getSingleCommitDiff(repoPath: string, commitOid: string): Promise<string> {
    try {
      // Read the commit
      const commit = await git.readCommit({ fs, dir: repoPath, oid: commitOid });
      
      // Get parent commit (if exists)
      if (commit.commit.parent.length === 0) {
        // Initial commit - use git diff command for performance
        return `diff --git (Initial Commit)\nCommit: ${commitOid.substring(0, 7)}\nInitial commit - showing all files\nThis is the first commit in the repository.\n`;
      }
      
      // Get parent commit OID (use first parent for merge commits)
      const parentOid = Array.isArray(commit.commit.parent) ? commit.commit.parent[0] : commit.commit.parent;
      
      // Compare with parent
      return await this.getDiff(repoPath, parentOid, commitOid);
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to get commit diff: ${error.message}`);
      }
      throw new Error('Failed to get commit diff: Unknown error');
    }
  }

  /**
   * Helper to recursively get all files from a tree
   */
  private static async getTreeFiles(repoPath: string, treeOid: string, prefix: string = ''): Promise<Record<string, string>> {
    const files: Record<string, string> = {};

    try {
      const { tree } = await git.readTree({ fs, dir: repoPath, oid: treeOid });

      for (const entry of tree) {
        const fullPath = prefix ? `${prefix}/${entry.path}` : entry.path;

        if (entry.type === 'blob') {
          try {
            const { blob } = await git.readBlob({ fs, dir: repoPath, oid: entry.oid });
            files[fullPath] = new TextDecoder().decode(blob);
          } catch (error) {
            // If we can't decode as text, skip this file
            files[fullPath] = '[Binary file]';
          }
        } else if (entry.type === 'tree') {
          const subFiles = await this.getTreeFiles(repoPath, entry.oid, fullPath);
          Object.assign(files, subFiles);
        }
      }
    } catch (error) {
      // Ignore errors for individual files
    }

    return files;
  }
}

