"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GitCompare } from "lucide-react";

interface BranchListProps {
  branches: string[];
  selectedBranch: string | null;
  onBranchSelect: (branch: string) => void;
  loading: boolean;
  // Branch comparison props
  comparisonMode?: boolean;
  selectedBranchesForComparison?: string[];
  onBranchComparisonSelect?: (branch: string) => void;
  onCompareBranches?: () => void;
  onToggleComparisonMode?: () => void;
}

export function BranchList({ 
  branches, 
  selectedBranch, 
  onBranchSelect, 
  loading,
  comparisonMode = false,
  selectedBranchesForComparison = [],
  onBranchComparisonSelect,
  onCompareBranches,
  onToggleComparisonMode,
}: BranchListProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Branches</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Loading branches...</p>
        </CardContent>
      </Card>
    );
  }

  if (branches.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Branches</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No branches found</p>
        </CardContent>
      </Card>
    );
  }

  const handleBranchClick = (branch: string) => {
    if (comparisonMode && onBranchComparisonSelect) {
      onBranchComparisonSelect(branch);
    } else {
      onBranchSelect(branch);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Branches</CardTitle>
            <CardDescription>
              {comparisonMode 
                ? `Select two branches to compare (${selectedBranchesForComparison.length}/2 selected)`
                : "Select a branch to view commits"
              }
            </CardDescription>
          </div>
          <Button
            variant={comparisonMode ? "default" : "outline"}
            size="sm"
            onClick={onToggleComparisonMode}
            className="gap-2"
          >
            <GitCompare className="h-4 w-4" />
            {comparisonMode ? "Cancel Compare" : "Compare Branches"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {branches.map((branch) => {
            const isSelected = comparisonMode 
              ? selectedBranchesForComparison.includes(branch)
              : selectedBranch === branch;
            
            const isDisabled = comparisonMode 
              && selectedBranchesForComparison.length >= 2 
              && !selectedBranchesForComparison.includes(branch);

            return (
              <Badge
                key={branch}
                variant={isSelected ? "default" : "outline"}
                className={`cursor-pointer transition-all ${
                  isDisabled 
                    ? "opacity-50 cursor-not-allowed" 
                    : "hover:bg-accent"
                }`}
                onClick={() => !isDisabled && handleBranchClick(branch)}
              >
                {branch}
              </Badge>
            );
          })}
        </div>
        
        {comparisonMode && selectedBranchesForComparison.length === 2 && (
          <Button 
            onClick={onCompareBranches} 
            className="w-full"
            size="sm"
          >
            Compare {selectedBranchesForComparison[0]} ↔ {selectedBranchesForComparison[1]}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

