"use client";

import { GitCommit } from "@/types/git.types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Eye, GitCompare } from "lucide-react";
import { GravatarAvatar } from "@/components/GravatarAvatar";

interface CommitListProps {
  commits: GitCommit[];
  selectedCommits: string[];
  onCommitSelect: (commitOid: string) => void;
  onViewCommit?: (commitOid: string) => void;
  loading: boolean;
  mode?: 'compare' | 'view';
}

export function CommitList({ 
  commits, 
  selectedCommits, 
  onCommitSelect, 
  onViewCommit,
  loading,
  mode = 'compare'
}: CommitListProps) {
  const handleCheckboxChange = (commitOid: string) => {
    onCommitSelect(commitOid);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Commits</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Loading commits...</p>
        </CardContent>
      </Card>
    );
  }

  if (commits.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Commits</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No commits found. Select a branch to view commits.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Commits</CardTitle>
        <CardDescription>
          {mode === 'compare' 
            ? `Select two commits to compare (selected: ${selectedCommits.length}/2)`
            : 'Click on a commit to view its changes'
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              {mode === 'compare' && <TableHead className="w-[50px]">Select</TableHead>}
              <TableHead className="w-[100px]">Hash</TableHead>
              <TableHead>Message</TableHead>
              <TableHead className="w-[200px]">Author</TableHead>
              <TableHead className="w-[150px]">Date</TableHead>
              {mode === 'view' && <TableHead className="w-[100px]">Action</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {commits.map((commit) => (
              <TableRow key={commit.oid}>
                {mode === 'compare' && (
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={selectedCommits.includes(commit.oid)}
                      onChange={() => handleCheckboxChange(commit.oid)}
                      disabled={
                        selectedCommits.length >= 2 &&
                        !selectedCommits.includes(commit.oid)
                      }
                      className="cursor-pointer"
                    />
                  </TableCell>
                )}
                <TableCell>
                  <Badge variant="secondary" className="font-mono text-xs">
                    {commit.oid.substring(0, 7)}
                  </Badge>
                </TableCell>
                <TableCell className="font-medium">
                  {commit.commit.message.split('\n')[0]}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <GravatarAvatar 
                      email={commit.commit.author.email} 
                      name={commit.commit.author.name}
                      size={20}
                    />
                    <span className="text-sm">{commit.commit.author.name}</span>
                  </div>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {new Date(commit.commit.author.timestamp * 1000).toLocaleString()}
                </TableCell>
                {mode === 'view' && (
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onViewCommit?.(commit.oid)}
                      className="gap-2"
                    >
                      <Eye className="h-4 w-4" />
                      View
                    </Button>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

