"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useQuery } from "@tanstack/react-query";
import * as d3 from "d3";
import md5 from "blueimp-md5";

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

interface GraphNode extends d3.SimulationNodeDatum {
  id: string;
  branch: string;
  author: { name: string; email: string };
  gravatar: string;
  message: string;
  date: Date;
}

interface GraphLink extends d3.SimulationLinkDatum<GraphNode> {
  source: GraphNode;
  target: GraphNode;
  isMerge?: boolean;
}

export function CommitGraph({ commits, allBranches, currentBranch }: CommitGraphProps) {
  const [selectedBranches, setSelectedBranches] = useState<string[]>([]);
  const svgRef = useRef<SVGSVGElement>(null);
  const repoPath = "/home/benoit/dev/equinox/altered"; // TODO: get from context

  // Initialize selected branches with current branch
  useEffect(() => {
    if (currentBranch && selectedBranches.length === 0) {
      setSelectedBranches([currentBranch]);
    }
  }, [currentBranch, selectedBranches.length]);

  // React Query: fetch graph data with cache keys based on payload params
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
    staleTime: 60 * 1000, // Cache for 1 minute
  });

  const handleBranchToggle = (branchName: string) => {
    setSelectedBranches((prev) =>
      prev.includes(branchName)
        ? prev.filter((b) => b !== branchName)
        : [...prev, branchName]
    );
  };

  // Render D3 graph
  useEffect(() => {
    if (!svgRef.current || !graphData) return;

    // Clear previous render
    d3.select(svgRef.current).selectAll("*").remove();

    const width = 1200;
    const height = Math.max(800, graphData.commits.length * 60);

    const svg = d3.select(svgRef.current)
      .attr("width", width)
      .attr("height", height);

    // Create nodes with children info
    const nodes: GraphNode[] = graphData.commits.map((commit) => {
      const gravatarHash = md5(commit.author.email);
      const gravatar = `https://www.gravatar.com/avatar/${gravatarHash}?d=identicon&s=24`;
      
      return {
        id: commit.id,
        branch: commit.branch,
        author: commit.author,
        gravatar,
        message: commit.message,
        date: new Date(commit.date),
        x: 0,
        y: 0,
      };
    });

    // Create links from parents
    const links: GraphLink[] = [];
    const commitMap = new Map<string, GraphNode>();
    nodes.forEach(node => commitMap.set(node.id, node));

    graphData.commits.forEach(commit => {
      const sourceNode = commitMap.get(commit.id);
      if (!sourceNode) return;

      // Links go from parent to child (reverse of Git)
      commit.children.forEach(childOid => {
        const targetNode = commitMap.get(childOid);
        if (targetNode) {
          links.push({
            source: sourceNode,
            target: targetNode,
            isMerge: commit.parents.length > 1,
          });
        }
      });
    });

    console.log("Graph data:", { nodes: nodes.length, links: links.length, branches: graphData.branches });

    // Create branch mapping
    const branchMap = new Map(graphData.branches.map(b => [b.name, b]));
    
    // Initialize node positions
    nodes.forEach((node, i) => {
      const branchIndex = graphData.branches.findIndex(b => b.name === node.branch);
      node.x = branchIndex >= 0 ? branchIndex * 200 + 300 : width / 2;
      node.y = (i / nodes.length) * height;
    });

    // Create color function
    const color = d3.scaleOrdinal(graphData.branches.map(b => b.color))
      .domain(graphData.branches.map(b => b.name));

    // Create force simulation
    const simulation = d3.forceSimulation(nodes)
      .force("link", d3.forceLink<GraphNode, GraphLink>(links)
        .id(d => d.id)
        .distance(100))
      .force("charge", d3.forceManyBody().strength(-300))
      .force("y", d3.forceY<GraphNode>(d => d.date.getTime() / 86400000 * 100).strength(0.5))
      .force("x", d3.forceX<GraphNode>(d => {
        const branchIndex = graphData.branches.findIndex(b => b.name === d.branch);
        return branchIndex >= 0 ? branchIndex * 200 + 300 : width / 2;
      }).strength(0.3))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .alphaDecay(0.02)
      .velocityDecay(0.4);

    // Draw links
    const link = svg.append("g")
      .attr("stroke", "#94a3b8")
      .selectAll("path")
      .data(links)
      .join("path")
      .attr("stroke-width", (d: GraphLink) => d.isMerge ? 3 : 1.5)
      .attr("stroke-opacity", 0.6)
      .attr("d", (d: GraphLink) => {
        const sourceX = (d.source as GraphNode).x || 0;
        const sourceY = (d.source as GraphNode).y || 0;
        const targetX = (d.target as GraphNode).x || 0;
        const targetY = (d.target as GraphNode).y || 0;
        
        if (d.isMerge) {
          const midX = (sourceX + targetX) / 2;
          const midY = sourceY - 50;
          return `M ${sourceX} ${sourceY} Q ${midX} ${midY}, ${targetX} ${targetY}`;
        }
        return `M ${sourceX} ${sourceY} L ${targetX} ${targetY}`;
      });

    // Draw nodes
    const node = svg.append("g")
      .selectAll("g")
      .data(nodes)
      .join("g")
      .attr("transform", (d: GraphNode) => `translate(${d.x || 0},${d.y || 0})`);

    // Add circle for commits
    node.append("circle")
      .attr("r", 20)
      .attr("fill", d => color(d.branch))
      .attr("stroke", "#fff")
      .attr("stroke-width", 2);

    // Add gravatar image
    node.append("image")
      .attr("xlink:href", d => d.gravatar)
      .attr("x", -12)
      .attr("y", -12)
      .attr("width", 24)
      .attr("height", 24)
      .attr("clip-path", "circle(12px)")
      .on("error", function(d: any) {
        d3.select(this).style("display", "none");
      });

    // Add author name
    node.append("text")
      .text(d => d.author.name)
      .attr("dy", 35)
      .attr("font-size", 11)
      .attr("text-anchor", "middle")
      .attr("fill", "#64748b");

    // Add branch tag
    node.append("rect")
      .attr("x", 20)
      .attr("y", -10)
      .attr("width", d => d.branch.length * 7 + 8)
      .attr("height", 20)
      .attr("fill", d => color(d.branch))
      .attr("rx", 3)
      .attr("opacity", 0.8);

    node.append("text")
      .text(d => d.branch)
      .attr("x", 20)
      .attr("dx", 4)
      .attr("dy", 5)
      .attr("font-size", 10)
      .attr("text-anchor", "start")
      .attr("fill", "#fff")
      .attr("font-weight", "bold");

    // Add tooltip
    node.append("title")
      .text(d => `${d.message}\n${d.date.toLocaleString("fr-FR")}`);

    // Update positions on simulation tick
    simulation.on("tick", () => {
      link.attr("d", (d: any) => {
        const sourceX = (d.source as GraphNode).x || 0;
        const sourceY = (d.source as GraphNode).y || 0;
        const targetX = (d.target as GraphNode).x || 0;
        const targetY = (d.target as GraphNode).y || 0;
        
        if (d.isMerge) {
          const midX = (sourceX + targetX) / 2;
          const midY = sourceY - 50;
          return `M ${sourceX} ${sourceY} Q ${midX} ${midY}, ${targetX} ${targetY}`;
        }
        return `M ${sourceX} ${sourceY} L ${targetX} ${targetY}`;
      });
      
      node.attr("transform", (d: GraphNode) => `translate(${d.x || 0},${d.y || 0})`);
    });

    // Log simulation status
    simulation.on("end", () => console.log("Simulation ended"));

    // Cleanup
    return () => {
      simulation.stop();
      if (svgRef.current) {
        d3.select(svgRef.current).selectAll("*").remove();
      }
    };
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
          <div className="w-full overflow-auto border rounded bg-white" style={{ maxHeight: '800px' }}>
            {/* SVG container */}
            <div style={{ overflow: 'visible' }}>
              <svg ref={svgRef} />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
