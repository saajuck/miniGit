import { NextRequest, NextResponse } from 'next/server';
import { GitService } from '@/services/git.service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { repoPath } = body;

    if (!repoPath) {
      return NextResponse.json(
        { error: 'Repository path is required' },
        { status: 400 }
      );
    }

    const branches = await GitService.listBranches(repoPath);

    return NextResponse.json({ branches });
  } catch (error) {
    console.error('Error listing branches:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to list branches' },
      { status: 500 }
    );
  }
}

