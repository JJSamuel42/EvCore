'use client';

import React from 'react';
import { Dialog, DialogContent } from '@/components/ui/Dialog';
import { Badge } from '@/components/ui/Badge';
import { SearchResult, SearchTerm, PICOType } from '@/types';
import { highlightPICOKeywords, getPICOColor } from '@/lib/utils';
import { ExternalLink } from 'lucide-react';

interface AbstractModalProps {
  result: SearchResult | null;
  terms: SearchTerm[];
  open: boolean;
  onClose: () => void;
}

export function AbstractModal({ result, terms, open, onClose }: AbstractModalProps) {
  if (!result) return null;

  const picoTerms = terms.map((t) => ({ text: t.text, type: t.type }));
  const segments = highlightPICOKeywords(result.abstract, picoTerms);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        size="lg"
        title={result.title}
        description={`${result.authors} · ${result.journal} · ${result.pubDate}`}
      >
        <div className="space-y-4">
          {/* Meta */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-mono text-muted-foreground">PMID: {result.pmid}</span>
            <a
              href={result.link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-accent hover:underline"
            >
              View on PubMed
              <ExternalLink className="w-3 h-3" />
            </a>
            {result.decision && (
              <Badge variant={result.decision}>{result.decision}</Badge>
            )}
          </div>

          {/* PICO Legend */}
          <div className="flex items-center gap-3 p-2 bg-muted rounded-md flex-wrap">
            <span className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider">Highlight:</span>
            {(['P', 'I', 'C', 'O'] as PICOType[]).map((type) => {
              const typeTerms = terms.filter((t) => t.type === type);
              if (typeTerms.length === 0) return null;
              return (
                <div key={type} className="flex items-center gap-1.5">
                  <span className={`text-[11px] font-mono px-1.5 py-0.5 rounded ${getPICOColor(type)}`}>
                    {type}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {typeTerms.map((t) => t.text).join(', ')}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Abstract with highlighting */}
          <div className="bg-muted/50 rounded-md p-4 text-sm leading-relaxed text-foreground">
            {segments.map((seg, idx) =>
              seg.type ? (
                <mark
                  key={idx}
                  className={`${getPICOColor(seg.type)} px-0.5 rounded-sm not-italic font-medium`}
                  title={`${seg.type}: ${seg.text}`}
                >
                  {seg.text}
                </mark>
              ) : (
                <span key={idx}>{seg.text}</span>
              )
            )}
          </div>

          {/* AI reasoning if available */}
          {result.aiReasoning && (
            <div className="border-t border-border pt-4">
              <p className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground mb-1.5">
                AI Assessment
              </p>
              <p className="text-sm text-foreground leading-relaxed">{result.aiReasoning}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
