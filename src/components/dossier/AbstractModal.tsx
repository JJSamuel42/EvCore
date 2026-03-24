'use client';

import React from 'react';
import { ExternalLink, Calendar, Users, BookOpen } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/Dialog';
import { LibraryArticle } from '@/types';
import { formatDate } from '@/lib/utils';

interface AbstractModalProps {
  article: LibraryArticle | null;
  open: boolean;
  onClose: () => void;
}

export function AbstractModal({ article, open, onClose }: AbstractModalProps) {
  if (!article) return null;

  const abstract =
    article.abstract ??
    article['col-default-9'] ??
    'No abstract available for this article.';

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent size="lg" title="Article Abstract" showClose>
        <div className="space-y-4">
          {/* Title */}
          <div>
            <h3 className="font-serif text-base font-semibold text-foreground leading-snug">
              {article.title}
            </h3>
          </div>

          {/* Meta */}
          <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground border-t border-b border-border py-3">
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3 shrink-0" />
              {article.authors}
            </span>
            <span className="flex items-center gap-1">
              <BookOpen className="w-3 h-3 shrink-0" />
              <em>{article.journal}</em>
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3 shrink-0" />
              {article.publicationDate
                ? formatDate(article.publicationDate)
                : 'Date not available'}
            </span>
          </div>

          {/* Abstract */}
          <div>
            <p className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground mb-2">
              Abstract
            </p>
            <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
              {abstract}
            </p>
          </div>

          {/* PMID / Link */}
          <div className="flex items-center justify-between pt-1">
            {article.pmid && (
              <span className="text-xs font-mono text-muted-foreground">
                PMID: {article.pmid}
              </span>
            )}
            {article.publicationLink && (
              <a
                href={article.publicationLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-accent hover:underline"
              >
                <ExternalLink className="w-3 h-3" />
                View on PubMed
              </a>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
