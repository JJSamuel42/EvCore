'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Clock } from 'lucide-react';
import { AuthGuard } from '@/components/layout/AuthGuard';
import { AppShell } from '@/components/layout/AppShell';
import { LibraryTable } from '@/components/library/LibraryTable';
import { useLibraryStore } from '@/store/libraries';
import { formatDate, getRelativeTime } from '@/lib/utils';

export default function LibraryPage() {
  const { id } = useParams<{ id: string }>();
  const { libraries } = useLibraryStore();
  const library = libraries.find((l) => l.id === id);

  if (!library) {
    return (
      <AuthGuard>
        <AppShell>
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <p className="text-muted-foreground font-mono text-sm">Library not found.</p>
              <Link href="/libraries" className="text-accent text-sm hover:underline mt-2 inline-block">
                Back to Libraries
              </Link>
            </div>
          </div>
        </AppShell>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <AppShell>
        <div className="flex flex-col h-full">
          {/* Library Header */}
          <div className="px-6 py-4 border-b border-border bg-card">
            <div className="flex items-start justify-between">
              <div>
                <Link
                  href="/libraries"
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-2 transition-colors"
                >
                  <ArrowLeft className="w-3 h-3" />
                  <span>Libraries</span>
                </Link>
                <div className="flex items-baseline gap-2">
                  <h1 className="font-serif text-2xl font-semibold text-foreground">
                    {library.name}
                  </h1>
                  <span className="text-base text-muted-foreground font-light">
                    ({library.innName})
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  {library.indications.map((ind) => (
                    <span
                      key={ind}
                      className="text-[11px] font-mono uppercase tracking-wider text-accent px-2 py-0.5 bg-accent-muted rounded border border-accent/10"
                    >
                      {ind}
                    </span>
                  ))}
                  <span className="text-xs text-muted-foreground">
                    {library.articles.length} articles
                  </span>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Updated {getRelativeTime(library.updatedAt)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Table fills remaining space */}
          <div className="flex-1 overflow-hidden">
            <LibraryTable library={library} />
          </div>
        </div>
      </AppShell>
    </AuthGuard>
  );
}
