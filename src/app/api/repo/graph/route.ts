import { NextRequest, NextResponse } from "next/server";
import * as git from "isomorphic-git";
import fs from "fs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { repoPath, branchNames } = body;

    if (!repoPath || !fs.existsSync(repoPath)) {
      return NextResponse.json(
        { error: "Invalid repository path" },
        { status: 400 }
      );
    }

    // Fetch commits from all specified branches
    const allCommits = new Map<string, any>();
    const branchCommits: { [key: string]: string[] } = {};
    const branchTips: { [key: string]: string } = {}; // Last commit of each branch

    for (const branchName of branchNames || []) {
      try {
        const commits = await git.log({
          fs,
          dir: repoPath,
          ref: branchName,
          depth: 50,
        });

        if (commits.length > 0) {
          branchTips[branchName] = commits[0].oid; // First commit in log is the tip
        }

        for (const commit of commits) {
          if (!allCommits.has(commit.oid)) {
            allCommits.set(commit.oid, {
              id: commit.oid,
              branches: new Set<string>(), // Track all branches containing this commit
              parent: commit.commit.parent,
              author: {
                name: commit.commit.author.name,
                email: commit.commit.author.email,
              },
              message: commit.commit.message,
              timestamp: commit.commit.author.timestamp,
            });
          }

          // Add this branch to the commit's branches set
          allCommits.get(commit.oid)!.branches.add(branchName);

          // Track which branches contain this commit
          if (!branchCommits[branchName]) {
            branchCommits[branchName] = [];
          }
          branchCommits[branchName].push(commit.oid);
        }
      } catch (error) {
        console.error(`Error fetching commits for branch ${branchName}:`, error);
      }
    }

    // Convert to the format expected by the D3.js script
    // Simple array of commits with: oid, message, author, timestamp, parents, branches, primaryBranch
    const commits: any[] = [];
    
    for (const [oid, commitData] of allCommits.entries()) {
      const parents = Array.isArray(commitData.parent) 
        ? commitData.parent 
        : commitData.parent 
          ? [commitData.parent] 
          : [];

      // Determine primary branch: priority order:
      // 1. If commit is a tip of a branch, use that branch
      // 2. Prefer main/dev branches for shared commits
      // 3. Otherwise, use the first branch in the set
      const branchesArray = Array.from(commitData.branches);
      let primaryBranch = branchesArray[0];
      
      // Check if this commit is a tip
      for (const [branchName, tipOid] of Object.entries(branchTips)) {
        if (tipOid === oid) {
          primaryBranch = branchName;
          break;
        }
      }
      
      // If not a tip and commit is in multiple branches, prefer main/dev
      if (branchesArray.length > 1) {
        const priorityBranches = ['main', 'master', 'dev', 'develop'];
        for (const priorityBranch of priorityBranches) {
          if (branchesArray.includes(priorityBranch)) {
            // Only use priority branch if commit is not a tip of another branch
            if (!Object.values(branchTips).includes(oid)) {
              primaryBranch = priorityBranch;
              break;
            }
          }
        }
      }

      commits.push({
        oid: oid,
        message: commitData.message,
        author: commitData.author,
        timestamp: commitData.timestamp, // Already in Unix timestamp format
        parents: parents,
        branches: branchesArray,
        primaryBranch: primaryBranch, // The branch this commit "belongs to" primarily
      });
    }

    // Topological sort: ensure children appear BEFORE their parents
    // Algorithm: Reverse Kahn's algorithm - start from tips (commits without children)
    const commitMapByOid = new Map<string, any>();
    commits.forEach(c => commitMapByOid.set(c.oid, c));

    // Build graph: commit -> its parents (inverse of normal topological sort)
    const parentMap = new Map<string, string[]>();
    const outDegree = new Map<string, number>(); // Number of children not yet processed
    const childrenMap = new Map<string, string[]>(); // For building outDegree

    // Initialize out-degree and build children map
    commits.forEach(commit => {
      parentMap.set(commit.oid, commit.parents.filter((p: string) => commitMapByOid.has(p)));
      childrenMap.set(commit.oid, []);
      outDegree.set(commit.oid, 0);
    });

    // Build children map and calculate out-degree
    commits.forEach(commit => {
      commit.parents.forEach((parentOid: string) => {
        if (commitMapByOid.has(parentOid)) {
          childrenMap.get(parentOid)!.push(commit.oid);
          outDegree.set(parentOid, (outDegree.get(parentOid) || 0) + 1);
        }
      });
    });

    // Start with commits that have no children (tips) - newest first
    const queue: string[] = [];
    commits.forEach(commit => {
      const childrenCount = (childrenMap.get(commit.oid) || []).length;
      if (childrenCount === 0) {
        queue.push(commit.oid);
      }
    });

    // Sort by timestamp (newest first)
    queue.sort((a, b) => {
      const commitA = commitMapByOid.get(a)!;
      const commitB = commitMapByOid.get(b)!;
      return commitB.timestamp - commitA.timestamp;
    });

    const sortedCommits: any[] = [];

    // Process queue: add commit, then process its parents
    while (queue.length > 0) {
      // Re-sort queue by timestamp (newest first) before each iteration
      queue.sort((a, b) => {
        const commitA = commitMapByOid.get(a)!;
        const commitB = commitMapByOid.get(b)!;
        return commitB.timestamp - commitA.timestamp;
      });

      const currentOid = queue.shift()!;
      const currentCommit = commitMapByOid.get(currentOid)!;
      sortedCommits.push(currentCommit);

      // Process parents: reduce their out-degree
      const parents = parentMap.get(currentOid) || [];
      parents.forEach(parentOid => {
        const currentOutDegree = outDegree.get(parentOid)!;
        const newOutDegree = currentOutDegree - 1;
        outDegree.set(parentOid, newOutDegree);

        // If all children are processed, add parent to queue
        if (newOutDegree === 0) {
          queue.push(parentOid);
        }
      });
    }

    // Add any remaining commits (orphaned or cycles) at the end
    const processedOids = new Set(sortedCommits.map(c => c.oid));
    commits.forEach(commit => {
      if (!processedOids.has(commit.oid)) {
        sortedCommits.push(commit);
      }
    });

    return NextResponse.json({
      commits: sortedCommits, // Children before parents, newest first
      branchTips,
    });
  } catch (error) {
    console.error("Error fetching graph data:", error);
    return NextResponse.json(
      { error: "Failed to fetch graph data" },
      { status: 500 }
    );
  }
}

// D3.js category 10 color scheme
const d3SchemeCategory10 = [
  "#1f77b4",
  "#ff7f0e",
  "#2ca02c",
  "#d62728",
  "#9467bd",
  "#8c564b",
  "#e377c2",
  "#7f7f7f",
  "#bcbd22",
  "#17becf",
];

