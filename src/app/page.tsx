"use client";

import { useState, useEffect } from "react";
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

  // Load repo from localStorage on mount
  useEffect(() => {
    const loadSavedRepo = async () => {
      if (typeof window === "undefined") return;

      const savedPath = localStorage.getItem("minigit-repo-path");
      if (savedPath) {
        console.log("Loading saved repo from localStorage:", savedPath);
        setLoadingRepo(true);
        setError("");

        try {
          const response = await fetch("/api/repo/branches", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ repoPath: savedPath }),
          });

          if (response.ok) {
            const data = await response.json();
            setRepoPath(savedPath);
            setBranches(data.branches);
            
            // Auto-select first branch if available
            if (data.branches.length > 0) {
              // Load commits for the first branch
              const commitsResponse = await fetch("/api/repo/commits", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ repoPath: savedPath, branch: data.branches[0] }),
              });

              if (commitsResponse.ok) {
                const commitsData = await commitsResponse.json();
                setCommits(commitsData.commits);
                setSelectedBranch(data.branches[0]);
              }
            }
            
            // Switch to diff tab
            setActiveTab("diff");
          } else {
            // Remove invalid path from localStorage
            localStorage.removeItem("minigit-repo-path");
          }
        } catch (err) {
          console.error("Failed to load saved repo:", err);
          // Remove invalid path from localStorage
          localStorage.removeItem("minigit-repo-path");
        } finally {
          setLoadingRepo(false);
        }
      }
    };

    loadSavedRepo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      const response = await fetch("/api/repo/branches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repoPath: path }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to load repository");
      }

      const data = await response.json();
      setRepoPath(path);
      setBranches(data.branches);
      
      // Save to localStorage on successful load
      if (typeof window !== "undefined") {
        localStorage.setItem("minigit-repo-path", path);
      }
      
      // Auto-select first branch if available
      if (data.branches.length > 0) {
        handleBranchSelect(path, data.branches[0]);
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
    setLoadingCommits(true);
    setCommits([]);
    setCurrentDiff("");
    setDiffTitle("");
    setBranchComparisonMode(false);

    try {
      const response = await fetch("/api/repo/commits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repoPath: path || repoPath, branch }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to load commits");
      }

      const data = await response.json();
      setCommits(data.commits);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load commits");
    } finally {
      setLoadingCommits(false);
    }
  };

  // View single commit - Opens sidebar
  const handleViewCommit = async (commitOid: string) => {
    console.log("View commit clicked:", commitOid);
    setLoadingDiff(true);
    setCurrentDiff("");
    setBranchComparisonMode(false);

    try {
      const response = await fetch("/api/repo/commit-diff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repoPath, commitOid }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to load commit diff");
      }

      const data = await response.json();
      console.log("Diff received, length:", data.diff?.length);
      setCurrentDiff(data.diff);
      setDiffTitle(`Commit ${commitOid.substring(0, 7)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load commit diff");
      console.error("Error loading diff:", err);
    } finally {
      setLoadingDiff(false);
    }
  };

  const handleCloseDiffSidebar = () => {
    setCurrentDiff("");
    setDiffTitle("");
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

    setLoadingDiff(true);
    setCurrentDiff("");

    try {
      const response = await fetch("/api/repo/compare-branches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repoPath,
          branch1: selectedBranchesForComparison[0],
          branch2: selectedBranchesForComparison[1],
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to compare branches");
      }

      const data = await response.json();
      setCurrentDiff(data.diff);
      setDiffTitle(`${selectedBranchesForComparison[0]} ↔ ${selectedBranchesForComparison[1]}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to compare branches");
    } finally {
      setLoadingDiff(false);
    }
  };

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
              loading={loadingRepo}
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
              loading={loadingRepo}
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
              loading={loadingCommits}
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
