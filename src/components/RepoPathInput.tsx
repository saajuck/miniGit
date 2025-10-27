"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FolderOpen, X } from "lucide-react";

const REPO_PATH_STORAGE_KEY = "minigit-repo-path";

interface RepoPathInputProps {
  onPathSubmit: (path: string) => void;
  loading: boolean;
  error?: string;
  initialPath?: string;
}

export function RepoPathInput({ onPathSubmit, loading, error, initialPath }: RepoPathInputProps) {
  const [path, setPath] = useState("");
  const [browserSupportsFileAPI, setBrowserSupportsFileAPI] = useState(
    typeof window !== "undefined" && "showDirectoryPicker" in window
  );

  // Load saved path from localStorage on mount
  useEffect(() => {
    if (initialPath) {
      setPath(initialPath);
    } else if (typeof window !== "undefined") {
      const savedPath = localStorage.getItem(REPO_PATH_STORAGE_KEY);
      if (savedPath) {
        setPath(savedPath);
      }
    }
  }, [initialPath]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (path.trim()) {
      onPathSubmit(path.trim());
    }
  };

  const handleClearPath = () => {
    setPath("");
    if (typeof window !== "undefined") {
      localStorage.removeItem(REPO_PATH_STORAGE_KEY);
    }
  };

  const handleBrowseClick = async () => {
    try {
      // Use the modern File System Access API (Chrome, Edge, Opera)
      if ("showDirectoryPicker" in window) {
        // @ts-ignore - showDirectoryPicker is not in all TypeScript definitions yet
        const dirHandle = await window.showDirectoryPicker();
        
        // Try to reconstruct the path using the directory handle name
        // Note: Full paths are not exposed for security reasons in browsers
        // Users will need to manually enter or copy/paste the full path
        setPath(dirHandle.name);
        
        // Show a helpful message
        alert(
          `Selected folder: "${dirHandle.name}"\n\n` +
          `⚠️ Browser security prevents us from getting the full path.\n` +
          `Please manually enter or paste the complete path:\n` +
          `Example: /home/user/projects/${dirHandle.name}`
        );
      } else {
        // Fallback message for unsupported browsers
        alert(
          "Your browser doesn't support the folder picker.\n\n" +
          "Please manually type or copy/paste the full repository path.\n\n" +
          "💡 Tip: Use your file manager to copy the folder path:\n" +
          "- Right-click folder → Properties → Location\n" +
          "- Or navigate in terminal and use 'pwd' command"
        );
      }
    } catch (err) {
      // User cancelled or error occurred
      if (err instanceof Error && err.name !== "AbortError") {
        console.error("Error selecting directory:", err);
      }
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Git Repository</CardTitle>
        <CardDescription>
          Enter the path to a local Git repository (folder containing .git)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-2">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Input
                type="text"
                placeholder="/path/to/repo or ~/projects/my-repo"
                value={path}
                onChange={(e) => setPath(e.target.value)}
                disabled={loading}
                className="pr-8"
              />
              {path && !loading && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleClearPath}
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                  title="Clear path"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={handleBrowseClick}
              disabled={loading}
              className="gap-2"
              title="Open folder picker (limited by browser security)"
            >
              <FolderOpen className="h-4 w-4" />
              Browse
            </Button>
            <Button type="submit" disabled={loading || !path.trim()}>
              {loading ? "Loading..." : "Load"}
            </Button>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">
              💡 <strong>Quick tip:</strong> To get the full path:
            </p>
            <ul className="text-xs text-muted-foreground list-disc list-inside ml-2 space-y-0.5">
              <li>Open terminal in the folder and run: <code className="bg-muted px-1 rounded">pwd</code></li>
              <li>Or right-click folder → Properties → copy location</li>
              <li>Or drag folder into terminal to see its path</li>
            </ul>
          </div>
        </form>
        {error && (
          <p className="text-sm text-destructive mt-2">{error}</p>
        )}
      </CardContent>
    </Card>
  );
}

