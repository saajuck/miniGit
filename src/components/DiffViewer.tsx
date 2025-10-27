"use client";

import { useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { html } from "diff2html";
import "diff2html/bundles/css/diff2html.min.css";

interface DiffViewerProps {
  diff: string;
  loading: boolean;
  title?: string;
  noWrapper?: boolean; // Pour affichage dans sidebar
}

export function DiffViewer({ diff, loading, title, noWrapper = false }: DiffViewerProps) {
  const diffContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (diff && diffContainerRef.current) {
      console.log("Rendering diff, length:", diff.length);
      try {
        const diffHtml = html(diff, {
          drawFileList: true,
          matching: 'lines',
          outputFormat: 'side-by-side',
          renderNothingWhenEmpty: false,
        });
        diffContainerRef.current.innerHTML = diffHtml;
        console.log("Diff rendered successfully");
      } catch (error) {
        console.error("Error rendering diff:", error);
        diffContainerRef.current.innerHTML = `<pre class="text-sm whitespace-pre-wrap">${diff}</pre>`;
      }
    }
  }, [diff]);

  // Pour sidebar: pas de wrapper
  if (noWrapper) {
    if (loading) {
      return <p className="text-sm text-muted-foreground">Loading diff...</p>;
    }
    if (!diff) {
      return null;
    }
    return <div ref={diffContainerRef} className="w-full" />;
  }

  // Pour affichage normal: avec Card
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Diff</CardTitle>
          <CardDescription>Loading diff...</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Please wait...</p>
        </CardContent>
      </Card>
    );
  }

  if (!diff) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Diff</CardTitle>
        {title && <CardDescription>{title}</CardDescription>}
      </CardHeader>
      <CardContent className="p-4">
        <div 
          ref={diffContainerRef} 
          className="w-full"
        />
      </CardContent>
    </Card>
  );
}
