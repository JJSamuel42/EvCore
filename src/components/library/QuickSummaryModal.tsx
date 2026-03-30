'use client';

import React, { useMemo } from 'react';
import { Dialog, DialogContent, DialogClose } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { LibraryArticle, LibraryColumn } from '@/types';

interface QuickSummaryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  articles: LibraryArticle[];
  columns: LibraryColumn[];
}

export function QuickSummaryModal({ open, onOpenChange, articles, columns }: QuickSummaryModalProps) {
  const summary = useMemo(() => {
    if (articles.length === 0) return null;

    // Date range
    const dates = articles.map((a) => a.publicationDate).filter(Boolean).sort();
    const dateRange = dates.length > 0 ? `${dates[0]} to ${dates[dates.length - 1]}` : 'N/A';

    // Study type distribution
    const studyTypeCol = columns.find((c) => c.name === 'Study Type');
    const studyTypes: Record<string, number> = {};
    if (studyTypeCol) {
      for (const art of articles) {
        const val = art[studyTypeCol.id];
        if (val) studyTypes[val] = (studyTypes[val] || 0) + 1;
      }
    }

    // Category distribution
    const catCol = columns.find((c) => c.name === 'Category');
    const categories: Record<string, number> = {};
    if (catCol) {
      for (const art of articles) {
        const val = art[catCol.id];
        if (val) categories[val] = (categories[val] || 0) + 1;
      }
    }

    // Geography distribution
    const geoCol = columns.find((c) => c.name === 'Geography');
    const geographies: Record<string, number> = {};
    if (geoCol) {
      for (const art of articles) {
        const val = art[geoCol.id];
        if (val) geographies[val] = (geographies[val] || 0) + 1;
      }
    }

    // Unique journals
    const journals = new Set(articles.map((a) => a.journal).filter(Boolean));

    return { dateRange, studyTypes, categories, geographies, journals: Array.from(journals) };
  }, [articles, columns]);

  if (!summary) return null;

  const renderDistribution = (dist: Record<string, number>) =>
    Object.entries(dist)
      .sort((a, b) => b[1] - a[1])
      .map(([key, count]) => (
        <div key={key} className="flex items-center justify-between text-xs">
          <span className="text-foreground">{key}</span>
          <span className="text-muted-foreground font-mono">{count}</span>
        </div>
      ));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <h3 className="font-serif text-base font-semibold mb-4">
          Quick Summary — {articles.length} Article{articles.length !== 1 ? 's' : ''}
        </h3>

        <div className="space-y-4">
          <div>
            <p className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground mb-1">
              Publication Date Range
            </p>
            <p className="text-sm text-foreground">{summary.dateRange}</p>
          </div>

          {Object.keys(summary.studyTypes).length > 0 && (
            <div>
              <p className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground mb-1.5">
                Study Types
              </p>
              <div className="space-y-1">{renderDistribution(summary.studyTypes)}</div>
            </div>
          )}

          {Object.keys(summary.categories).length > 0 && (
            <div>
              <p className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground mb-1.5">
                Categories
              </p>
              <div className="space-y-1">{renderDistribution(summary.categories)}</div>
            </div>
          )}

          {Object.keys(summary.geographies).length > 0 && (
            <div>
              <p className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground mb-1.5">
                Geography
              </p>
              <div className="space-y-1">{renderDistribution(summary.geographies)}</div>
            </div>
          )}

          {summary.journals.length > 0 && (
            <div>
              <p className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground mb-1.5">
                Journals ({summary.journals.length})
              </p>
              <div className="flex flex-wrap gap-1">
                {summary.journals.map((j) => (
                  <span key={j} className="text-[11px] px-2 py-0.5 bg-muted rounded text-foreground">
                    {j}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end mt-4">
          <DialogClose asChild>
            <Button variant="ghost" size="sm">Close</Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
}
