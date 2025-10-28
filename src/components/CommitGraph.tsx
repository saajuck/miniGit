"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useQuery } from "@tanstack/react-query";

interface GraphData {
  branches: { name: string; color: string }[];
  commits: {
    id: string;
    branch: string;
    parents: string[];
    children: string[];
    author: { name: string; email: string };
    message: string;
    date: string;
  }[];
}

interface CommitGraphProps {
  commits: any[];
  allBranches: string[];
  currentBranch: string | null;
}

export function CommitGraph({ commits, allBranches, currentBranch }: CommitGraphProps) {
  const [selectedBranches, setSelectedBranches] = useState<string[]>([]);
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const repoPath = "/home/benoit/dev/equinox/altered"; // TODO: get from context

  // Initialize selected branches with current branch
  useEffect(() => {
    if (currentBranch && selectedBranches.length === 0) {
      setSelectedBranches([currentBranch]);
    }
  }, [currentBranch, selectedBranches.length]);

  // React Query: fetch graph data
  const branchNames = selectedBranches.length === 0 ? allBranches : selectedBranches;
  
  const { data: graphData, isLoading: loading } = useQuery<GraphData>({
    queryKey: ["graph", repoPath, branchNames],
    queryFn: async () => {
      const response = await fetch("/api/repo/graph", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repoPath,
          branchNames,
        }),
      });

      if (!response.ok) throw new Error("Failed to fetch graph data");
      return response.json();
    },
    enabled: branchNames.length > 0,
    staleTime: 60 * 1000,
  });

  const handleBranchToggle = (branchName: string) => {
    setSelectedBranches((prev) =>
      prev.includes(branchName)
        ? prev.filter((b) => b !== branchName)
        : [...prev, branchName]
    );
  };

  // Render dendrogram
  useEffect(() => {
    if (!containerRef.current || !graphData) return;

    // Simple vertical dendrogram rendering
    const commits = graphData.commits
      .map(c => ({
        ...c,
        date: new Date(c.date),
      }))
      .sort((a, b) => a.date.getTime() - b.date.getTime()); // Oldest first

    const commitHeight = 60;
    const container = containerRef.current;
    
    // Clear previous content
    container.innerHTML = '';

    commits.forEach((commit, index) => {
      const commitDiv = document.createElement('div');
      commitDiv.style.cssText = `
        display: flex;
        align-items: center;
        padding: 8px 12px;
        border-left: 2px solid ${graphData.branches.find(b => b.name === commit.branch)?.color || '#3b82f6'};
        border-bottom: 1px solid #e5e7eb;
        margin-left: ${index * 4}px;
      `;

      commitDiv.innerHTML = `
        <div style="flex: 1;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-family: monospace; color: #3b82f6; font-weight: 600;">
              ${commit.id.substring(0, 7)}
            </span>
            <span style="font-size: 13px; color: #6b7280;">
              ${commit.author.name}
            </span>
            <span style="font-size: 12px; color: #9ca3af;">
              ${commit.date.toLocaleDateString('fr-FR')}
            </span>
          </div>
          <div style="font-size: 14px; color: #1f2937; margin-top: 4px;">
            ${commit.message.split('\n')[0]}
          </div>
        </div>
      `;

      container.appendChild(commitDiv);
    });
  }, [graphData]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Commit Graph</CardTitle>
        <CardDescription>
          Select branches to display in the graph
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Branch selection */}
        <div className="flex flex-wrap gap-2 p-3 border rounded">
          {allBranches.map((branch) => (
            <div key={branch} className="flex items-center gap-2">
              <Checkbox
                id={`branch-${branch}`}
                checked={selectedBranches.includes(branch)}
                onCheckedChange={() => handleBranchToggle(branch)}
              />
              <label
                htmlFor={`branch-${branch}`}
                className="text-sm cursor-pointer"
              >
                <Badge variant={selectedBranches.includes(branch) ? "default" : "secondary"}>
                  {branch}
                </Badge>
              </label>
            </div>
          ))}
        </div>

        {/* Graph display */}
        {loading && (
          <p className="text-sm text-muted-foreground">Loading graph...</p>
        )}

        {!loading && !graphData && (
          <p className="text-sm text-muted-foreground">
            {selectedBranches.length === 0 && allBranches.length > 0
              ? "Select at least one branch to display commits"
              : "No graph data available"}
          </p>
        )}

        {!loading && graphData && (
          <div 
            ref={containerRef}
            className="w-full border rounded bg-white" 
            style={{ maxHeight: '800px', overflow: 'auto' }}
          />
        )}
      </CardContent>
    </Card>
  );
}
