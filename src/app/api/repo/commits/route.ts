import { NextRequest, NextResponse } from 'next/server';
import { GitService } from '@/services/git.service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { repoPath, branch } = body;

    if (!repoPath) {
      return NextResponse.json(
        { error: 'Repository path is required' },
        { status: 400 }
      );
    }

    if (!branch) {
      return NextResponse.json(
        { error: 'Branch name is required' },
        { status: 400 }
      );
    }

    const commits = await GitService.listCommits(repoPath, branch);

    return NextResponse.json({ commits });
  } catch (error) {
    console.error('Error listing commits:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to list commits' },
      { status: 500 }
    );
  }
}

