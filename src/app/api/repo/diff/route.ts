import { NextRequest, NextResponse } from 'next/server';
import { GitService } from '@/services/git.service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { repoPath, commit1, commit2 } = body;

    if (!repoPath) {
      return NextResponse.json(
        { error: 'Repository path is required' },
        { status: 400 }
      );
    }

    if (!commit1 || !commit2) {
      return NextResponse.json(
        { error: 'Two commit IDs are required' },
        { status: 400 }
      );
    }

    const diff = await GitService.getDiff(repoPath, commit1, commit2);

    return NextResponse.json({ diff });
  } catch (error) {
    console.error('Error getting diff:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get diff' },
      { status: 500 }
    );
  }
}

