'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FileText, Plus, BookOpen, Calendar, ChevronRight } from 'lucide-react';
import { AuthGuard } from '@/components/layout/AuthGuard';
import { AppShell } from '@/components/layout/AppShell';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useDossierStore } from '@/store/dossier';
import { useLibraryStore } from '@/store/libraries';
import { formatDate } from '@/lib/utils';

export default function DossierListPage() {
  const router = useRouter();
  const { dossiers } = useDossierStore();
  const { libraries } = useLibraryStore();

  return (
    <AuthGuard>
      <AppShell>
        <div className="p-6 lg:p-8 max-w-5xl mx-auto">
          {/* Header */}
          <div className="flex items-start justify-between mb-8">
            <div>
              <p className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground mb-1">
                Dossier Builder
              </p>
              <h1 className="font-serif text-3xl font-semibold text-foreground">
                Core Value Dossiers
              </h1>
              <p className="text-sm text-muted-foreground mt-1 max-w-lg">
                Collaboratively assemble evidence-based HTA submissions linked to your evidence libraries.
              </p>
            </div>
            <Button
              variant="primary"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={() => router.push('/dossier/new')}
            >
              New Dossier
            </Button>
          </div>

          {dossiers.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-muted/30 p-12 text-center">
              <div className="w-14 h-14 rounded-full bg-muted border border-border flex items-center justify-center mx-auto mb-4">
                <FileText className="w-6 h-6 text-muted-foreground/40" />
              </div>
              <p className="font-serif text-lg text-muted-foreground mb-1">No dossiers yet</p>
              <p className="text-sm text-muted-foreground/60 mb-4">
                Create your first core value dossier to get started.
              </p>
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<Plus className="w-3.5 h-3.5" />}
                onClick={() => router.push('/dossier/new')}
              >
                Create Dossier
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {dossiers.map((dossier) => {
                const library = libraries.find((l) => l.id === dossier.libraryId);
                const topLevelCount = dossier.sections.filter((s) => s.level === 1).length;
                const totalCount = dossier.sections.length;
                const generatedCount = Object.values(dossier.sectionContents).filter(
                  (c) => c.currentDraft
                ).length;

                return (
                  <Card
                    key={dossier.id}
                    hoverEffect
                    accentTop
                    onClick={() => router.push(`/dossier/${dossier.id}`)}
                  >
                    <CardBody>
                      <div className="flex items-start justify-between mb-3">
                        <div className="w-10 h-10 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center shrink-0">
                          <FileText className="w-5 h-5 text-accent" />
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground/40 mt-1" />
                      </div>

                      <h3 className="font-serif text-base font-semibold text-foreground leading-snug mb-1">
                        {dossier.name}
                      </h3>
                      <p className="text-xs text-muted-foreground mb-3">
                        {dossier.product} · {dossier.indication}
                      </p>

                      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground border-t border-border pt-3">
                        {library && (
                          <span className="flex items-center gap-1">
                            <BookOpen className="w-3 h-3" />
                            {library.name}
                          </span>
                        )}
                        <span>{topLevelCount} chapters · {totalCount} sections</span>
                        {generatedCount > 0 && (
                          <span className="text-include font-medium">
                            {generatedCount} drafted
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1 mt-2 text-[10px] font-mono text-muted-foreground/50">
                        <Calendar className="w-3 h-3" />
                        Updated {formatDate(dossier.updatedAt)}
                      </div>
                    </CardBody>
                  </Card>
                );
              })}

              {/* New dossier card */}
              <Card
                hoverEffect
                onClick={() => router.push('/dossier/new')}
                className="border-dashed"
              >
                <CardBody className="flex flex-col items-center justify-center min-h-[160px] text-center">
                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center mb-3">
                    <Plus className="w-5 h-5 text-muted-foreground/50" />
                  </div>
                  <p className="text-sm font-medium text-muted-foreground">New Dossier</p>
                  <p className="text-xs text-muted-foreground/60 mt-0.5">
                    Link to an evidence library
                  </p>
                </CardBody>
              </Card>
            </div>
          )}
        </div>
      </AppShell>
    </AuthGuard>
  );
}
