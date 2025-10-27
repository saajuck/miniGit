"use client";

import { useState, useRef, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DiffViewer } from "@/components/DiffViewer";

interface ResizableDiffSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  diff: string;
  loading: boolean;
  title?: string;
}

export function ResizableDiffSidebar({
  isOpen,
  onClose,
  diff,
  loading,
  title,
}: ResizableDiffSidebarProps) {
  const [width, setWidth] = useState(75); // Percentage, starting at 75%
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Handle ESC key to close sidebar
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!sidebarRef.current) return;
      
      const windowWidth = window.innerWidth;
      const newWidth = ((windowWidth - e.clientX) / windowWidth) * 100;
      
      // Limit between 25% and 100%
      if (newWidth >= 25 && newWidth <= 100) {
        setWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing]);

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/20 z-40"
        onClick={onClose}
      />

      {/* Sidebar */}
      <div
        ref={sidebarRef}
        className="fixed top-0 right-0 h-full bg-background border-l shadow-lg z-50 flex"
        style={{ width: `${width}%` }}
      >
        {/* Resize handle */}
        <div
          className="w-1 bg-border hover:bg-primary cursor-col-resize flex-shrink-0"
          onMouseDown={() => setIsResizing(true)}
        />

        {/* Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b flex items-center justify-between flex-shrink-0">
            <div>
              <h2 className="text-lg font-semibold">Diff</h2>
              {title && <p className="text-sm text-muted-foreground">{title}</p>}
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Diff content */}
          <div className="flex-1 overflow-auto p-4">
            <DiffViewer 
              diff={diff} 
              loading={loading} 
              noWrapper={true}
            />
          </div>
        </div>
      </div>
    </>
  );
}

