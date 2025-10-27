import { NextRequest, NextResponse } from 'next/server';
import { GitService } from '@/services/git.service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { repoPath, branch1, branch2 } = body;

    if (!repoPath) {
      return NextResponse.json(
        { error: 'Repository path is required' },
        { status: 400 }
      );
    }

    if (!branch1 || !branch2) {
      return NextResponse.json(
        { error: 'Two branch names are required' },
        { status: 400 }
      );
    }

    const diff = await GitService.compareBranches(repoPath, branch1, branch2);

    return NextResponse.json({ diff });
  } catch (error) {
    console.error('Error comparing branches:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to compare branches' },
      { status: 500 }
    );
  }
}

