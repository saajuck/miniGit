import { NextRequest, NextResponse } from 'next/server';
import { GitService } from '@/services/git.service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { repoPath, commitOid } = body;

    if (!repoPath) {
      return NextResponse.json(
        { error: 'Repository path is required' },
        { status: 400 }
      );
    }

    if (!commitOid) {
      return NextResponse.json(
        { error: 'Commit OID is required' },
        { status: 400 }
      );
    }

    const diff = await GitService.getSingleCommitDiff(repoPath, commitOid);

    return NextResponse.json({ diff });
  } catch (error) {
    console.error('Error getting commit diff:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get commit diff' },
      { status: 500 }
    );
  }
}

