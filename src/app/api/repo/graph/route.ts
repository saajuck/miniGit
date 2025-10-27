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

    for (const branchName of branchNames || []) {
      try {
        const commits = await git.log({
          fs,
          dir: repoPath,
          ref: branchName,
          depth: 50,
        });

        for (const commit of commits) {
          if (!allCommits.has(commit.oid)) {
            allCommits.set(commit.oid, {
              id: commit.oid,
              branch: branchName,
              parent: commit.commit.parent,
              author: {
                name: commit.commit.author.name,
                email: commit.commit.author.email,
              },
              message: commit.commit.message,
              date: new Date(commit.commit.author.timestamp * 1000).toISOString(),
            });
          }

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

    // Convert to the format D3.js expects
    const branches = Object.keys(branchCommits).map((branchName, index) => ({
      name: branchName,
      color: d3SchemeCategory10[index % 10],
    }));

    const commits: any[] = [];
    
    // Build commits array with parents and children
    for (const [oid, commitData] of allCommits.entries()) {
      const parents = Array.isArray(commitData.parent) 
        ? commitData.parent 
        : commitData.parent 
          ? [commitData.parent] 
          : [];

      // Find children (commits that have this commit as a parent)
      const children: string[] = [];
      for (const [otherOid, otherCommit] of allCommits.entries()) {
        const otherParents = Array.isArray(otherCommit.parent)
          ? otherCommit.parent
          : otherCommit.parent
            ? [otherCommit.parent]
            : [];
        
        if (otherParents.includes(oid)) {
          children.push(otherOid);
        }
      }

      commits.push({
        id: oid,
        branch: commitData.branch,
        parents,
        children,
        author: commitData.author,
        message: commitData.message,
        date: commitData.date,
      });
    }

    return NextResponse.json({
      branches,
      commits,
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

