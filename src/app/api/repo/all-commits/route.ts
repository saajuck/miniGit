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

    // Get commits from selected branches (limited to 50 per branch for performance)
    const allCommits: Array<{
      oid: string;
      message: string;
      author: { name: string; email: string; timestamp: number };
      parent?: string | string[];
      branches: string[];
    }> = [];

    // Create a map to track which branches contain each commit
    const commitMap = new Map<string, {
      oid: string;
      message: string;
      author: { name: string; email: string; timestamp: number };
      parent?: string | string[];
      branches: Set<string>;
    }>();

    // Get commits from each selected branch
    for (const branchName of branchNames) {
      try {
        const commits = await git.log({
          fs,
          dir: repoPath,
          ref: branchName,
          depth: 50, // Limit to 50 commits per branch
        });

        // Add commits to the map
        for (const commit of commits) {
          if (!commitMap.has(commit.oid)) {
            commitMap.set(commit.oid, {
              oid: commit.oid,
              message: commit.commit.message,
              author: {
                name: commit.commit.author.name,
                email: commit.commit.author.email,
                timestamp: commit.commit.author.timestamp,
              },
              parent: commit.commit.parent,
              branches: new Set(),
            });
          }
          // Add this branch to the commit
          commitMap.get(commit.oid)!.branches.add(branchName);
        }
      } catch (error) {
        console.error(`Error fetching commits for branch ${branchName}:`, error);
      }
    }

    // Convert map to array
    allCommits.push(...Array.from(commitMap.values()).map(c => ({
      ...c,
      branches: Array.from(c.branches),
    })));

    // Sort by timestamp (most recent first)
    allCommits.sort((a, b) => b.author.timestamp - a.author.timestamp);

    return NextResponse.json({ commits: allCommits });
  } catch (error) {
    console.error("Error fetching all commits:", error);
    return NextResponse.json(
      { error: "Failed to fetch commits" },
      { status: 500 }
    );
  }
}
