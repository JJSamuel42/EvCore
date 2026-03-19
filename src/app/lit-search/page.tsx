'use client';

import React from 'react';
import Link from 'next/link';
import { Search, Plus, Clock, FileSearch } from 'lucide-react';
import { AuthGuard } from '@/components/layout/AuthGuard';
import { AppShell } from '@/components/layout/AppShell';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { PageHeader } from '@/components/ui/SectionLabel';
import { useLitSearchStore } from '@/store/litSearch';
import { formatDate, getRelativeTime } from '@/lib/utils';

export default function LitSearchPage() {
  const { sessions } = useLitSearchStore();

  return (
    <AuthGuard>
      <AppShell>
        <div className="p-6 lg:p-8 max-w-7xl mx-auto">
          <PageHeader
            label="Literature"
            title="Literature Search"
            subtitle="Manage and run systematic literature searches using the PICO framework."
            actions={
              <Link href="/lit-search/new">
                <Button variant="primary" leftIcon={<Plus className="w-4 h-4" />}>
                  New Search
                </Button>
              </Link>
            }
          />

          <div className="h-px bg-border my-6" />

          {sessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Search className="w-7 h-7 text-muted-foreground" />
              </div>
              <h3 className="font-serif text-xl text-foreground mb-2">No searches yet</h3>
              <p className="text-sm text-muted-foreground mb-6 max-w-sm">
                Create a new literature search session to start building PICO search strategies and reviewing results.
              </p>
              <Link href="/lit-search/new">
                <Button variant="primary" leftIcon={<Plus className="w-4 h-4" />}>
                  Create First Search
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {sessions.map((session) => {
                const included = session.results.filter((r) => r.decision === 'include').length;
                const excluded = session.results.filter((r) => r.decision === 'exclude').length;
                const pending = session.results.filter((r) => !r.decision).length;

                return (
                  <Link key={session.id} href={`/lit-search/${session.id}`}>
                    <Card hoverEffect className="transition-all">
                      <CardBody>
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <FileSearch className="w-4 h-4 text-accent shrink-0" />
                              <h3 className="font-serif text-base font-semibold text-foreground truncate">
                                {session.name}
                              </h3>
                            </div>

                            {session.query && (
                              <p className="text-xs font-mono text-muted-foreground bg-muted px-2 py-1 rounded truncate mb-2">
                                {session.query}
                              </p>
                            )}

                            <div className="flex items-center gap-3 flex-wrap">
                              <span className="text-xs text-muted-foreground">
                                {session.terms.length} PICO terms
                              </span>
                              {session.results.length > 0 && (
                                <>
                                  <span className="text-xs text-muted-foreground">·</span>
                                  <span className="text-xs text-muted-foreground">
                                    {session.results.length} results
                                  </span>
                                  {included > 0 && <Badge variant="include">{included} included</Badge>}
                                  {excluded > 0 && <Badge variant="exclude">{excluded} excluded</Badge>}
                                  {pending > 0 && <Badge variant="pending">{pending} pending</Badge>}
                                </>
                              )}
                            </div>
                          </div>

                          <div className="shrink-0 text-right">
                            <p className="text-xs text-muted-foreground flex items-center gap-1 justify-end">
                              <Clock className="w-3 h-3" />
                              {session.lastRun
                                ? `Ran ${getRelativeTime(session.lastRun)}`
                                : `Created ${formatDate(session.createdAt)}`}
                            </p>
                          </div>
                        </div>
                      </CardBody>
                    </Card>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </AppShell>
    </AuthGuard>
  );
}
