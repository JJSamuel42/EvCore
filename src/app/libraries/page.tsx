'use client';

import React from 'react';
import Link from 'next/link';
import { BookOpen, Plus, Clock, FileText } from 'lucide-react';
import { AuthGuard } from '@/components/layout/AuthGuard';
import { AppShell } from '@/components/layout/AppShell';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/ui/SectionLabel';
import { useLibraryStore } from '@/store/libraries';
import { formatDate, getRelativeTime } from '@/lib/utils';

export default function LibrariesPage() {
  const { libraries } = useLibraryStore();

  return (
    <AuthGuard>
      <AppShell>
        <div className="p-6 lg:p-8 max-w-7xl mx-auto">
          <PageHeader
            label="Evidence Management"
            title="Libraries"
            subtitle="Manage your HEOR evidence libraries by product and indication."
            actions={
              <Link href="/libraries/new">
                <Button variant="primary" leftIcon={<Plus className="w-4 h-4" />}>
                  New Library
                </Button>
              </Link>
            }
          />

          <div className="h-px bg-border my-6" />

          {libraries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <BookOpen className="w-7 h-7 text-muted-foreground" />
              </div>
              <h3 className="font-serif text-xl text-foreground mb-2">No libraries yet</h3>
              <p className="text-sm text-muted-foreground mb-6 max-w-sm">
                Create your first evidence library to start organizing your HEOR research by product and indication.
              </p>
              <Link href="/libraries/new">
                <Button variant="primary" leftIcon={<Plus className="w-4 h-4" />}>
                  Create First Library
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {libraries.map((library) => (
                <Link key={library.id} href={`/libraries/${library.id}`}>
                  <Card
                    hoverEffect
                    accentTop
                    className="h-full"
                  >
                    <CardBody className="flex flex-col h-full">
                      <div className="flex-1">
                        <div className="mb-1">
                          <h2 className="font-serif text-xl font-semibold text-foreground leading-tight">
                            {library.name}
                          </h2>
                          <p className="text-sm text-muted-foreground font-light mt-0.5">
                            {library.innName}
                          </p>
                        </div>

                        <div className="mt-2 mb-3">
                          <span className="text-[11px] font-mono uppercase tracking-wider text-accent px-2 py-0.5 bg-accent-muted rounded border border-accent/10">
                            {library.indication}
                          </span>
                        </div>

                        {library.description && (
                          <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                            {library.description}
                          </p>
                        )}
                      </div>

                      <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <FileText className="w-3.5 h-3.5" />
                            <span className="font-medium text-foreground">{library.articles.length}</span>
                            <span>articles</span>
                          </div>
                          <div className="w-px h-3 bg-border" />
                          <div className="text-xs text-muted-foreground">
                            {library.columns.length} columns
                          </div>
                        </div>
                        <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          <span>{getRelativeTime(library.updatedAt)}</span>
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                </Link>
              ))}

              {/* Create new card */}
              <Link href="/libraries/new">
                <div className="h-full min-h-[160px] border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center gap-2 hover:border-accent/40 hover:bg-accent-muted transition-colors cursor-pointer group">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center group-hover:bg-accent/10 transition-colors">
                    <Plus className="w-5 h-5 text-muted-foreground group-hover:text-accent" />
                  </div>
                  <p className="text-sm text-muted-foreground group-hover:text-accent transition-colors font-medium">
                    Create New Library
                  </p>
                </div>
              </Link>
            </div>
          )}
        </div>
      </AppShell>
    </AuthGuard>
  );
}
