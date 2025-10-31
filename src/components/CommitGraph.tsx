"use client";

import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { GitBranch } from 'lucide-react';
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import md5 from 'blueimp-md5';

interface Commit {
  oid: string;
  message: string;
  author: { name: string; email: string };
  timestamp: number;
  parents: string[];
  branches?: string[];
  primaryBranch?: string;
}

interface CommitGraphProps {
  commits: any[];
  allBranches: string[];
  currentBranch: string | null;
  repoPath: string;
}

export function CommitGraph({ allBranches, currentBranch, repoPath }: CommitGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedBranches, setSelectedBranches] = useState<string[]>([]);
  const [commits, setCommits] = useState<Commit[]>([]);

  // Initialize selected branches with current branch
  useEffect(() => {
    if (currentBranch && selectedBranches.length === 0) {
      setSelectedBranches([currentBranch]);
    }
  }, [currentBranch, selectedBranches.length]);

  // React Query: fetch graph data
  const branchNames = selectedBranches.length === 0 ? allBranches : selectedBranches;
  
  interface GraphResponse {
    commits: Commit[];
    branchTips: { [key: string]: string };
  }
  
  const { data: graphData, isLoading: loading } = useQuery<GraphResponse>({
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
    enabled: branchNames.length > 0 && !!repoPath,
    staleTime: 60 * 1000,
  });

  // Update commits when data changes
  useEffect(() => {
    if (graphData?.commits) {
      setCommits(graphData.commits);
    }
  }, [graphData]);

  const handleBranchToggle = (branchName: string) => {
    setSelectedBranches((prev) =>
      prev.includes(branchName)
        ? prev.filter((b) => b !== branchName)
        : [...prev, branchName]
    );
  };

  useEffect(() => {
    if (!commits.length || !svgRef.current) return;

    // Configuration
    const margin = { top: 20, right: 300, bottom: 20, left: 60 };
    const rowHeight = 80;
    const columnWidth = 50;
    const dotRadius = 8;
    const width = containerRef.current?.offsetWidth 
      ? containerRef.current.offsetWidth - margin.left - margin.right 
      : 1200;
    const height = commits.length * rowHeight;

    // Nettoyer le SVG précédent
    d3.select(svgRef.current).selectAll('*').remove();

    const svg = d3.select(svgRef.current)
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom);

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Calcul des branches avec algorithme basé sur primaryBranch
    const commitMap = new Map(commits.map(c => [c.oid, c]));
    
    // Créer un mapping de branche -> colonne pour éviter les superpositions
    const branchColumnMap = new Map<string, number>();
    let nextAvailableColumn = 0;
    
    // Assigner une colonne unique à chaque branche unique
    const uniqueBranches = Array.from(new Set(commits.map(c => c.primaryBranch).filter(Boolean) as string[]));
    uniqueBranches.forEach(branchName => {
      if (!branchColumnMap.has(branchName)) {
        branchColumnMap.set(branchName, nextAvailableColumn++);
      }
    });

    // Assigner les colonnes aux commits basé sur primaryBranch
    const branchAssignments = new Map<string, number>();

    commits.forEach((commit, idx) => {
      let column: number;

      // Utiliser primaryBranch pour déterminer la colonne
      if (commit.primaryBranch && branchColumnMap.has(commit.primaryBranch)) {
        column = branchColumnMap.get(commit.primaryBranch)!;
      } else {
        // Fallback : si pas de primaryBranch, utiliser la logique topologique
        if (commit.parents.length === 0) {
          column = 0;
        } else if (commit.parents.length === 1) {
          const parentOid = commit.parents[0];
          const parentCommit = commitMap.get(parentOid);
          if (parentCommit?.primaryBranch && branchColumnMap.has(parentCommit.primaryBranch)) {
            column = branchColumnMap.get(parentCommit.primaryBranch)!;
          } else {
            const parentColumn = branchAssignments.get(parentOid);
            column = parentColumn !== undefined ? parentColumn : 0;
          }
        } else {
          // Merge commit - utiliser la branche du premier parent
          const firstParentOid = commit.parents[0];
          const firstParentCommit = commitMap.get(firstParentOid);
          if (firstParentCommit?.primaryBranch && branchColumnMap.has(firstParentCommit.primaryBranch)) {
            column = branchColumnMap.get(firstParentCommit.primaryBranch)!;
          } else {
            const mainParentColumn = branchAssignments.get(firstParentOid);
            column = mainParentColumn !== undefined ? mainParentColumn : 0;
          }
        }
      }

      branchAssignments.set(commit.oid, column);
      (commit as any).branchIndex = column;
      (commit as any).x = column * columnWidth;
      (commit as any).y = idx * rowHeight;
    });

    // Palette de couleurs
    const branchColors = d3.schemeCategory10;
    
    // Create mapping from branch name to color index
    const branchColorMap = new Map<string, number>();
    const allUniqueBranches = Array.from(new Set(commits.flatMap(c => c.primaryBranch ? [c.primaryBranch] : [])));
    allUniqueBranches.forEach((branchName, idx) => {
      branchColorMap.set(branchName, idx % branchColors.length);
    });

    // Créer les liens (lignes entre commits)
    const links: Array<{ source: Commit & { x: number; y: number; branchIndex: number }; target: Commit & { x: number; y: number; branchIndex: number }; isMerge: boolean }> = [];
    commits.forEach(commit => {
      commit.parents.forEach(parentOid => {
        const parent = commitMap.get(parentOid);
        if (parent) {
          links.push({
            source: commit as Commit & { x: number; y: number; branchIndex: number },
            target: parent as Commit & { x: number; y: number; branchIndex: number },
            isMerge: commit.parents.length > 1
          });
        }
      });
    });

    // Dessiner les liens avec des courbes de Bézier
    const linkGenerator = d3.linkVertical<{ x: number; y: number }, { x: number; y: number }>()
      .x((d: { x: number; y: number }) => d.x)
      .y((d: { x: number; y: number }) => d.y);

    g.append('g')
      .attr('class', 'links')
      .selectAll('path')
      .data(links)
      .join('path')
      .attr('d', (d) => {
        if (d.source.branchIndex === d.target.branchIndex) {
          // Ligne droite pour la même branche
          return linkGenerator({
            source: { x: d.source.x, y: d.source.y },
            target: { x: d.target.x, y: d.target.y }
          } as any);
        } else {
          // Courbe pour changement de branche
          const midY = (d.source.y + d.target.y) / 2;
          return `M${d.source.x},${d.source.y} 
                  C${d.source.x},${midY} 
                   ${d.target.x},${midY} 
                   ${d.target.x},${d.target.y}`;
        }
      })
      .attr('fill', 'none')
      .attr('stroke', (d) => {
        // Use primaryBranch for color, fallback to branchIndex
        const branchName = d.source.primaryBranch;
        if (branchName && branchColorMap.has(branchName)) {
          return branchColors[branchColorMap.get(branchName)!] as string;
        }
        return branchColors[d.source.branchIndex % branchColors.length] as string;
      })
      .attr('stroke-width', 2)
      .attr('opacity', 0.7);

    // Créer les groupes de commits
    const commitGroups = g.append('g')
      .attr('class', 'commits')
      .selectAll('g')
      .data(commits)
      .join('g')
      .attr('transform', (d: any) => `translate(${d.x},${d.y})`);

    // Dessiner les points de commit
    commitGroups.append('circle')
      .attr('r', dotRadius)
      .attr('fill', (d: any) => {
        // Use primaryBranch for color, fallback to branchIndex
        if (d.primaryBranch && branchColorMap.has(d.primaryBranch)) {
          return branchColors[branchColorMap.get(d.primaryBranch)!] as string;
        }
        return branchColors[d.branchIndex % branchColors.length] as string;
      })
      .attr('stroke', '#fff')
      .attr('stroke-width', 2.5)
      .style('cursor', 'pointer')
      .on('mouseenter', function() {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('r', dotRadius * 1.3);
      })
      .on('mouseleave', function() {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('r', dotRadius);
      });

    // Fonction pour générer l'URL Gravatar
    const getGravatarUrl = (email: string) => {
      const hash = md5(email.toLowerCase().trim());
      return `https://www.gravatar.com/avatar/${hash}?d=identicon&s=40`;
    };

    // Ajouter les avatars
    commitGroups.append('image')
      .attr('x', 70)
      .attr('y', -20)
      .attr('width', 40)
      .attr('height', 40)
      .attr('href', (d: Commit) => getGravatarUrl(d.author.email))
      .attr('clip-path', 'circle(20px)')
      .style('cursor', 'pointer');

    // Ajouter le message du commit
    commitGroups.append('text')
      .attr('x', 120)
      .attr('y', -5)
      .attr('class', 'commit-message')
      .style('font-size', '14px')
      .style('font-weight', '500')
      .style('fill', '#1f2937')
      .text((d: Commit) => d.message.length > 50 ? d.message.substring(0, 50) + '...' : d.message);

    // Ajouter les métadonnées (auteur, hash, date)
    commitGroups.append('text')
      .attr('x', 120)
      .attr('y', 12)
      .style('font-size', '12px')
      .style('fill', '#6b7280')
      .html((d: Commit) => {
        const date = new Date(d.timestamp * 1000).toLocaleDateString('fr-FR');
        const hash = d.oid.substring(0, 7);
        return `${d.author.name} • ${hash} • ${date}`;
      });

    // Badge pour les merges
    commitGroups.filter((d: Commit) => d.parents.length > 1)
      .append('rect')
      .attr('x', 120)
      .attr('y', 18)
      .attr('width', 50)
      .attr('height', 18)
      .attr('rx', 3)
      .attr('fill', '#8b5cf6')
      .attr('opacity', 0.1);

    commitGroups.filter((d: Commit) => d.parents.length > 1)
      .append('text')
      .attr('x', 145)
      .attr('y', 30)
      .style('font-size', '10px')
      .style('font-weight', '600')
      .style('fill', '#8b5cf6')
      .style('text-anchor', 'middle')
      .text('MERGE');

  }, [commits]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <GitBranch className="h-6 w-6" />
          <CardTitle>Historique Git avec D3.js</CardTitle>
        </div>
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

        {!loading && (!graphData || !graphData.commits || graphData.commits.length === 0) && (
          <p className="text-sm text-muted-foreground">
            {selectedBranches.length === 0 && allBranches.length > 0
              ? "Select at least one branch to display commits"
              : "No graph data available"}
          </p>
        )}

        {!loading && graphData && graphData.commits && graphData.commits.length > 0 && (
          <div ref={containerRef} className="w-full overflow-x-auto bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-6">
            <svg ref={svgRef} className="w-full"></svg>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
