"use client";

import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { RepoPathInput } from "@/components/RepoPathInput";
import { BranchList } from "@/components/BranchList";
import { CommitList } from "@/components/CommitList";
import { CommitGraph } from "@/components/CommitGraph";
import { ResizableDiffSidebar } from "@/components/ResizableDiffSidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GitCommit } from "@/types/git.types";
import { FolderGit2, GitCompareArrows, List, Network } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Home() {
  // Repository state
  const [repoPath, setRepoPath] = useState<string>("");
  const [branches, setBranches] = useState<string[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<string | null>(null);
  const [commits, setCommits] = useState<GitCommit[]>([]);
  
  // Diff state - SIMPLIFIÉ
  const [currentDiff, setCurrentDiff] = useState<string>("");
  const [diffTitle, setDiffTitle] = useState<string>("");
  
  // Branch comparison state
  const [branchComparisonMode, setBranchComparisonMode] = useState(false);
  const [selectedBranchesForComparison, setSelectedBranchesForComparison] = useState<string[]>([]);
  
  // View mode state (list or graph)
  const [commitsViewMode, setCommitsViewMode] = useState<'list' | 'graph'>('list');
  
  // Loading states
  const [loadingRepo, setLoadingRepo] = useState(false);
  const [loadingCommits, setLoadingCommits] = useState(false);
  const [loadingDiff, setLoadingDiff] = useState(false);
  const [error, setError] = useState<string>("");
  const [activeTab, setActiveTab] = useState("repo");
  const [currentCommitOid, setCurrentCommitOid] = useState<string | null>(null);
  const [comparePair, setComparePair] = useState<{ b1: string; b2: string } | null>(null);
  const queryClient = useQueryClient();

  // Load repo from localStorage on mount
  useEffect(() => {
    const loadSavedRepo = async () => {
      if (typeof window === "undefined") return;

      const savedPath = localStorage.getItem("minigit-repo-path");
      if (savedPath) {
        console.log("Loading saved repo from localStorage:", savedPath);
        setError("");
        setRepoPath(savedPath);
        setActiveTab("diff");
      }
    };

    loadSavedRepo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // React Query: branches
  const { data: branchesData, isLoading: branchesLoading } = useQuery<{ branches: string[] }>({
    queryKey: ["branches", repoPath],
    enabled: !!repoPath,
    queryFn: async () => {
      const response = await fetch("/api/repo/branches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repoPath }),
      });
      if (!response.ok) throw new Error("Failed to load branches");
      return response.json();
    },
    staleTime: 60_000,
  });

  // Sync branches state and auto-select first
  useEffect(() => {
    if (branchesData?.branches) {
      setBranches(branchesData.branches);
      if (!selectedBranch && branchesData.branches.length > 0) {
        setSelectedBranch(branchesData.branches[0]);
      }
    }
  }, [branchesData, selectedBranch]);

  const handlePathSubmit = async (path: string) => {
    setLoadingRepo(true);
    setError("");
    setBranches([]);
    setSelectedBranch(null);
    setCommits([]);
    setCurrentDiff("");
    setDiffTitle("");
    setBranchComparisonMode(false);
    setSelectedBranchesForComparison([]);

    try {
      setRepoPath(path);
      
      // Save to localStorage on successful load
      if (typeof window !== "undefined") {
        localStorage.setItem("minigit-repo-path", path);
      }
      
      // Switch to diff tab after successful load
      setActiveTab("diff");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load repository");
    } finally {
      setLoadingRepo(false);
    }
  };

  const handleBranchSelect = async (path: string, branch: string) => {
    setSelectedBranch(branch);
    setCommits([]);
    setCurrentDiff("");
    setDiffTitle("");
    setBranchComparisonMode(false);
  };

  // React Query: commits
  const { data: commitsData, isLoading: commitsLoading } = useQuery<{ commits: GitCommit[] }>({
    queryKey: ["commits", repoPath, selectedBranch],
    enabled: !!repoPath && !!selectedBranch,
    queryFn: async () => {
      const response = await fetch("/api/repo/commits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repoPath, branch: selectedBranch }),
      });
      if (!response.ok) throw new Error("Failed to load commits");
      return response.json();
    },
    staleTime: 60_000,
  });

  // Sync commits state
  useEffect(() => {
    if (commitsData?.commits) {
      setCommits(commitsData.commits);
    }
    setLoadingCommits(commitsLoading);
  }, [commitsData, commitsLoading]);

  // View single commit - Opens sidebar
  const handleViewCommit = async (commitOid: string) => {
    setBranchComparisonMode(false);
    setCurrentDiff("");
    setDiffTitle(`Commit ${commitOid.substring(0, 7)}`);
    setCurrentCommitOid(commitOid);
    // Force refetch so reopening the same commit works
    queryClient.invalidateQueries({ queryKey: ["commit-diff", repoPath, commitOid] });
  };

  // React Query: commit diff
  const { data: diffData, isLoading: diffLoading } = useQuery<{ diff: string }>({
    queryKey: ["commit-diff", repoPath, currentCommitOid],
    enabled: !!repoPath && !!currentCommitOid,
    queryFn: async () => {
      const response = await fetch("/api/repo/commit-diff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repoPath, commitOid: currentCommitOid }),
      });
      if (!response.ok) throw new Error("Failed to load commit diff");
      return response.json();
    },
  });

  // Sync diff state
  useEffect(() => {
    setLoadingDiff(diffLoading);
    if (diffData?.diff) setCurrentDiff(diffData.diff);
  }, [diffData, diffLoading]);

  const handleCloseDiffSidebar = () => {
    setCurrentDiff("");
    setDiffTitle("");
    // Clear selected commit so clicking the same one retriggers fetch
    setCurrentCommitOid(null);
  };

  // Branch comparison handlers
  const handleToggleBranchComparisonMode = () => {
    const newMode = !branchComparisonMode;
    setBranchComparisonMode(newMode);
    setSelectedBranchesForComparison([]);
    setCurrentDiff("");
    setDiffTitle("");
  };

  const handleBranchComparisonSelect = (branch: string) => {
    if (selectedBranchesForComparison.includes(branch)) {
      setSelectedBranchesForComparison(
        selectedBranchesForComparison.filter((b) => b !== branch)
      );
    } else if (selectedBranchesForComparison.length < 2) {
      setSelectedBranchesForComparison([...selectedBranchesForComparison, branch]);
    }
  };

  const handleCompareBranches = async () => {
    if (selectedBranchesForComparison.length !== 2) return;
    setCurrentDiff("");
    setDiffTitle(`${selectedBranchesForComparison[0]} ↔ ${selectedBranchesForComparison[1]}`);
    setComparePair({ b1: selectedBranchesForComparison[0], b2: selectedBranchesForComparison[1] });
  };

  // React Query: compare branches diff
  const { data: compareData, isLoading: compareLoading } = useQuery<{ diff: string }>({
    queryKey: ["compare-branches", repoPath, comparePair?.b1, comparePair?.b2],
    enabled: !!repoPath && !!comparePair?.b1 && !!comparePair?.b2,
    queryFn: async () => {
      const response = await fetch("/api/repo/compare-branches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repoPath,
          branch1: comparePair!.b1,
          branch2: comparePair!.b2,
        }),
      });
      if (!response.ok) throw new Error("Failed to compare branches");
      return response.json();
    },
  });

  // Sync compare diff state
  useEffect(() => {
    setLoadingDiff(compareLoading);
    if (compareData?.diff) setCurrentDiff(compareData.diff);
  }, [compareData, compareLoading]);

  return (
    <main className="container mx-auto p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold">MiniGit Viewer</h1>
        <p className="text-muted-foreground">
          Browse Git repositories, view commits, compare branches and diffs
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="repo" className="gap-2">
            <FolderGit2 className="h-4 w-4" />
            Repository
          </TabsTrigger>
          <TabsTrigger value="diff" disabled={!repoPath} className="gap-2">
            <GitCompareArrows className="h-4 w-4" />
            Diff Viewer
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Repository Selection */}
        <TabsContent value="repo" className="space-y-4">
          <RepoPathInput
            onPathSubmit={handlePathSubmit}
            loading={loadingRepo}
            error={error}
          />

          {branches.length > 0 && (
              <BranchList
              branches={branches}
              selectedBranch={selectedBranch}
              onBranchSelect={(branch) => handleBranchSelect(repoPath, branch)}
                loading={branchesLoading}
            />
          )}
        </TabsContent>

        {/* Tab 2: Diff Viewer */}
        <TabsContent value="diff" className="space-y-4">
          {/* Branch selector */}
          {branches.length > 0 && (
              <BranchList
              branches={branches}
              selectedBranch={selectedBranch}
              onBranchSelect={(branch) => handleBranchSelect(repoPath, branch)}
                loading={branchesLoading}
              comparisonMode={branchComparisonMode}
              selectedBranchesForComparison={selectedBranchesForComparison}
              onBranchComparisonSelect={handleBranchComparisonSelect}
              onCompareBranches={handleCompareBranches}
              onToggleComparisonMode={handleToggleBranchComparisonMode}
            />
          )}

          {/* View mode toggle */}
          {commits.length > 0 && !branchComparisonMode && (
            <div className="flex gap-2 items-center mb-4">
              <Button
                variant={commitsViewMode === 'list' ? 'default' : 'outline'}
                onClick={() => setCommitsViewMode('list')}
              >
                <List className="h-4 w-4 mr-2" />
                List
              </Button>
              <Button
                variant={commitsViewMode === 'graph' ? 'default' : 'outline'}
                onClick={() => setCommitsViewMode('graph')}
              >
                <Network className="h-4 w-4 mr-2" />
                Graph
              </Button>
            </div>
          )}

          {/* Commit list - only when NOT in branch comparison mode */}
          {commits.length > 0 && !branchComparisonMode && commitsViewMode === 'list' && (
            <CommitList
              commits={commits}
              selectedCommits={[]}
              onCommitSelect={() => {}}
              onViewCommit={handleViewCommit}
              loading={commitsLoading}
              mode="view"
            />
          )}

          {/* Commit graph */}
          {commits.length > 0 && !branchComparisonMode && commitsViewMode === 'graph' && (
            <CommitGraph
              commits={commits}
              allBranches={branches}
              currentBranch={selectedBranch}
            />
          )}

        </TabsContent>
      </Tabs>

      {/* Sidebar resizable pour le diff */}
      <ResizableDiffSidebar
        isOpen={!!(currentDiff || loadingDiff)}
        onClose={handleCloseDiffSidebar}
        diff={currentDiff}
        loading={loadingDiff}
        title={diffTitle}
      />
    </main>
  );
}
