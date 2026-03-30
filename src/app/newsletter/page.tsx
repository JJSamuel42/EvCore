'use client';

import React from 'react';
import Link from 'next/link';
import { Plus, Newspaper, Trash2, Calendar } from 'lucide-react';
import { AuthGuard } from '@/components/layout/AuthGuard';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/SectionLabel';
import { Badge } from '@/components/ui/Badge';
import { useNewsletterStore } from '@/store/newsletter';
import { useLibraryStore } from '@/store/libraries';
import { cn } from '@/lib/utils';

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
  generated: 'bg-accent/10 text-accent border-accent/20',
  finalized: 'bg-green-500/10 text-green-600 border-green-500/20',
};

export default function NewsletterListPage() {
  const { newsletters, deleteNewsletter } = useNewsletterStore();
  const { libraries } = useLibraryStore();

  const getLibraryName = (id: string) => libraries.find((l) => l.id === id)?.name || 'Unknown';

  return (
    <AuthGuard>
      <AppShell>
        <div className="p-6 lg:p-8 max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <PageHeader
              label="Newsletter"
              title="Newsletters"
              subtitle="Create and manage evidence newsletters from your library articles."
            />
            <Link href="/newsletter/new">
              <Button variant="primary" leftIcon={<Plus className="w-4 h-4" />}>
                New Newsletter
              </Button>
            </Link>
          </div>

          {newsletters.length === 0 ? (
            <Card>
              <CardBody>
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Newspaper className="w-10 h-10 text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground mb-4">
                    No newsletters yet. Create one from selected library articles.
                  </p>
                  <Link href="/newsletter/new">
                    <Button variant="primary" size="sm" leftIcon={<Plus className="w-3.5 h-3.5" />}>
                      Create Newsletter
                    </Button>
                  </Link>
                </div>
              </CardBody>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {newsletters.map((nl) => (
                <Link key={nl.id} href={`/newsletter/${nl.id}`}>
                  <Card className="hover:border-accent/30 transition-colors cursor-pointer h-full">
                    {nl.templateImage && (
                      <div className="w-full h-32 overflow-hidden rounded-t-lg">
                        <img src={nl.templateImage} alt="" className="w-full h-full object-cover" />
                      </div>
                    )}
                    <CardBody className="space-y-2">
                      <div className="flex items-start justify-between">
                        <h3 className="text-sm font-serif font-semibold text-foreground line-clamp-2">
                          {nl.title}
                        </h3>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            deleteNewsletter(nl.id);
                          }}
                          className="text-muted-foreground hover:text-exclude transition-colors p-1 shrink-0"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                        <span>{getLibraryName(nl.libraryId)}</span>
                        <span>·</span>
                        <span>{nl.articleIds.length} articles</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            'text-[10px] font-mono uppercase px-1.5 py-0.5 rounded border',
                            STATUS_COLORS[nl.status] || ''
                          )}
                        >
                          {nl.status}
                        </span>
                        <span className="text-[11px] text-muted-foreground capitalize">{nl.style}</span>
                      </div>
                      <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        {new Date(nl.updatedAt).toLocaleDateString()}
                      </div>
                    </CardBody>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </AppShell>
    </AuthGuard>
  );
}
