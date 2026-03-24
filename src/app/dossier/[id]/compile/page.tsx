'use client';

import React, { useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Copy, Check, Download, BookOpen, ChevronRight } from 'lucide-react';
import { AuthGuard } from '@/components/layout/AuthGuard';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/Button';
import { useDossierStore } from '@/store/dossier';
import { useLibraryStore } from '@/store/libraries';
import { DossierSection, LibraryArticle } from '@/types';
import { cn } from '@/lib/utils';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getLatestContent(dossier: import('@/types').Dossier, sectionId: string): string {
  const c = dossier.sectionContents[sectionId];
  if (!c) return '';
  // Use last saved version, falling back to current draft
  return c.versions[0]?.content ?? c.currentDraft ?? '';
}

/** Walk sections in outline order (depth-first, ordered by section.order) */
function walkSections(sections: DossierSection[]): DossierSection[] {
  const result: DossierSection[] = [];
  const byParent: Record<string, DossierSection[]> = {};
  for (const sec of sections) {
    const key = sec.parentId ?? '__root__';
    if (!byParent[key]) byParent[key] = [];
    byParent[key].push(sec);
  }
  const visit = (parentId: string) => {
    const children = (byParent[parentId] ?? []).sort((a, b) => a.order - b.order);
    for (const child of children) {
      result.push(child);
      visit(child.id);
    }
  };
  visit('__root__');
  return result;
}

/** Extract all [REF:id] markers from a string, in order of first appearance */
function extractRefIds(text: string): string[] {
  const seen = new Set<string>();
  const ids: string[] = [];
  const re = /\[REF:([^\]]+)\]/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (!seen.has(m[1])) {
      seen.add(m[1]);
      ids.push(m[1]);
    }
  }
  return ids;
}

/** Replace [REF:id] tokens with superscript numbers based on global ref map */
function resolveRefs(text: string, refMap: Map<string, number>): string {
  return text.replace(/\[REF:([^\]]+)\]/g, (_, id) => {
    const n = refMap.get(id);
    return n !== undefined ? `[${n}]` : '';
  });
}

/** Format a Vancouver-style reference */
function vancouverRef(art: LibraryArticle, num: number): string {
  const year = art.publicationDate?.slice(0, 4) ?? 'n.d.';
  const authors = art.authors.endsWith('.')
    ? art.authors
    : art.authors + '.';
  return `${num}. ${authors} ${art.title}. ${art.journal}. ${year}. PMID: ${art.pmid}.`;
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CompiledViewPage() {
  const params = useParams();
  const router = useRouter();
  const dossierId = params?.id as string;

  const { dossiers } = useDossierStore();
  const { libraries } = useLibraryStore();

  const dossier = dossiers.find((d) => d.id === dossierId);
  const library = dossier ? libraries.find((l) => l.id === dossier.libraryId) : null;
  const articles: LibraryArticle[] = library?.articles ?? [];

  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [copiedAll, setCopiedAll] = useState(false);

  // Build ordered section list and global reference map
  const { orderedSections, refMap, refList } = useMemo(() => {
    if (!dossier) return { orderedSections: [], refMap: new Map<string, number>(), refList: [] };

    const ordered = walkSections(dossier.sections);
    const globalRefMap = new Map<string, number>();
    let refCounter = 1;

    for (const sec of ordered) {
      const content = getLatestContent(dossier, sec.id);
      if (!content) continue;
      const ids = extractRefIds(content);
      for (const id of ids) {
        if (!globalRefMap.has(id)) {
          globalRefMap.set(id, refCounter++);
        }
      }
    }

    const list = Array.from(globalRefMap.entries())
      .sort((a, b) => a[1] - b[1])
      .map(([id, num]) => {
        const art = articles.find((a) => a.id === id);
        return { id, num, art };
      });

    return { orderedSections: ordered, refMap: globalRefMap, refList: list };
  }, [dossier, articles]);

  const topLevelSections = orderedSections.filter((s) => s.parentId === null);

  const handleCopySection = async (sectionId: string) => {
    const content = getLatestContent(dossier!, sectionId);
    const resolved = resolveRefs(content, refMap);
    await navigator.clipboard.writeText(resolved);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyAll = async () => {
    if (!dossier) return;
    const parts: string[] = [];
    for (const sec of orderedSections) {
      const content = getLatestContent(dossier, sec.id);
      if (!content) continue;
      const heading = `${'#'.repeat(sec.level)} ${sec.outlineNumber} ${sec.title}`;
      const resolved = resolveRefs(content, refMap);
      parts.push(heading + '\n\n' + resolved);
    }
    if (refList.length) {
      parts.push('\n\nREFERENCES\n\n' + refList.map(({ art, num }) =>
        art ? vancouverRef(art, num) : `${num}. [Unknown reference]`
      ).join('\n'));
    }
    await navigator.clipboard.writeText(parts.join('\n\n---\n\n'));
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  const handleDownloadRefs = () => {
    if (!refList.length) return;
    const header = 'Number,Authors,Title,Journal,Year,PMID,Link';
    const rows = refList.map(({ art, num }) => {
      if (!art) return `${num},,Unknown,,,,`;
      const year = art.publicationDate?.slice(0, 4) ?? '';
      const esc = (s: string) => `"${(s ?? '').replace(/"/g, '""')}"`;
      return [num, esc(art.authors), esc(art.title), esc(art.journal), year, art.pmid, art.publicationLink].join(',');
    });
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${dossier?.name ?? 'dossier'}-references.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!dossier) {
    return (
      <AuthGuard>
        <AppShell>
          <div className="p-8 text-center text-muted-foreground">Dossier not found.</div>
        </AppShell>
      </AuthGuard>
    );
  }

  const activeSection = orderedSections.find((s) => s.id === activeSectionId) ?? null;

  return (
    <AuthGuard>
      <AppShell>
        <div className="flex flex-col h-full">
          {/* Top bar */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card shrink-0">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push(`/dossier/${dossierId}`)}
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Builder
              </button>
              <span className="text-border">/</span>
              <span className="text-sm font-semibold text-foreground">Compiled View</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                leftIcon={<Download className="w-3.5 h-3.5" />}
                onClick={handleDownloadRefs}
                disabled={!refList.length}
              >
                References CSV
              </Button>
              <Button
                variant="secondary"
                size="sm"
                leftIcon={copiedAll ? <Check className="w-3.5 h-3.5 text-include" /> : <Copy className="w-3.5 h-3.5" />}
                onClick={handleCopyAll}
              >
                {copiedAll ? 'Copied' : 'Copy All'}
              </Button>
            </div>
          </div>

          <div className="flex flex-1 overflow-hidden">
            {/* Left: Table of Contents */}
            <aside className="w-56 shrink-0 border-r border-border bg-card overflow-y-auto">
              <div className="px-3 py-3 border-b border-border">
                <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                  Table of Contents
                </p>
              </div>
              <nav className="px-1 py-2 space-y-0.5">
                {orderedSections.map((sec) => {
                  const hasContent = !!getLatestContent(dossier, sec.id);
                  const indentClass =
                    sec.level === 1 ? 'pl-2' : sec.level === 2 ? 'pl-6' : sec.level === 3 ? 'pl-10' : 'pl-14';
                  const isActive = activeSectionId === sec.id;

                  return (
                    <button
                      key={sec.id}
                      onClick={() => setActiveSectionId(sec.id)}
                      className={cn(
                        'w-full flex items-center gap-2 py-1 pr-2 rounded-md text-left transition-colors',
                        indentClass,
                        isActive
                          ? 'bg-accent-muted text-accent'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                      )}
                    >
                      <span className="font-mono text-[9px] text-muted-foreground/40 shrink-0 w-7">
                        {sec.outlineNumber}
                      </span>
                      <span
                        className={cn(
                          'truncate leading-tight',
                          sec.level === 1
                            ? 'text-[12px] font-semibold font-serif'
                            : 'text-[11px]',
                          !hasContent && 'opacity-40'
                        )}
                      >
                        {sec.title}
                      </span>
                      {hasContent && (
                        <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-include ml-auto" />
                      )}
                    </button>
                  );
                })}

                {/* References anchor */}
                <button
                  onClick={() => setActiveSectionId('__references__')}
                  className={cn(
                    'w-full flex items-center gap-2 py-1 px-2 rounded-md text-left transition-colors mt-2',
                    activeSectionId === '__references__'
                      ? 'bg-accent-muted text-accent'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  <BookOpen className="w-3 h-3 shrink-0" />
                  <span className="text-[12px] font-semibold font-serif">References</span>
                  <span className="ml-auto text-[9px] font-mono bg-muted px-1.5 py-0.5 rounded">
                    {refList.length}
                  </span>
                </button>
              </nav>
            </aside>

            {/* Right: Content */}
            <main className="flex-1 overflow-y-auto bg-background px-8 py-8">
              <div className="max-w-3xl mx-auto">
                {/* Dossier title */}
                <div className="mb-8 pb-6 border-b border-border">
                  <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1">
                    Core Value Dossier
                  </p>
                  <h1 className="font-serif text-3xl font-semibold text-foreground">
                    {dossier.name}
                  </h1>
                  <p className="text-sm text-muted-foreground mt-1">
                    {dossier.product} · {dossier.indication}
                  </p>
                </div>

                {/* Section display */}
                {activeSectionId && activeSectionId !== '__references__' ? (
                  <SectionView
                    section={activeSection}
                    dossier={dossier}
                    refMap={refMap}
                    articles={articles}
                    onCopy={() => activeSection && handleCopySection(activeSection.id)}
                    copied={copied}
                  />
                ) : activeSectionId === '__references__' ? (
                  <ReferencesView refList={refList} articles={articles} />
                ) : (
                  /* Overview: show all sections inline */
                  <div className="space-y-10">
                    {topLevelSections.map((topSec) => (
                      <ChapterBlock
                        key={topSec.id}
                        topSection={topSec}
                        orderedSections={orderedSections}
                        dossier={dossier}
                        refMap={refMap}
                        onSectionClick={setActiveSectionId}
                      />
                    ))}

                    {refList.length > 0 && (
                      <div>
                        <h2 className="font-serif text-xl font-semibold text-foreground mb-4 pb-2 border-b border-border">
                          References
                        </h2>
                        <ReferencesView refList={refList} articles={articles} />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </main>
          </div>
        </div>
      </AppShell>
    </AuthGuard>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ChapterBlock({
  topSection,
  orderedSections,
  dossier,
  refMap,
  onSectionClick,
}: {
  topSection: DossierSection;
  orderedSections: DossierSection[];
  dossier: import('@/types').Dossier;
  refMap: Map<string, number>;
  onSectionClick: (id: string) => void;
}) {
  const chapterSections = orderedSections.filter(
    (s) => s.id === topSection.id || isDescendant(s, topSection.id, orderedSections)
  );

  return (
    <div>
      {chapterSections.map((sec) => {
        const content = getLatestContent(dossier, sec.id);
        const resolved = content ? resolveRefs(content, refMap) : '';

        const HeadingTag =
          sec.level === 1 ? 'h2' : sec.level === 2 ? 'h3' : sec.level === 3 ? 'h4' : 'h5';
        const headingClass =
          sec.level === 1
            ? 'font-serif text-xl font-semibold text-foreground mb-3 mt-8 first:mt-0 pb-1 border-b border-border'
            : sec.level === 2
            ? 'font-serif text-base font-semibold text-foreground mb-2 mt-5'
            : 'font-serif text-sm font-semibold text-foreground mb-1.5 mt-4';

        return (
          <div key={sec.id}>
            <button
              onClick={() => onSectionClick(sec.id)}
              className="text-left w-full group"
            >
              <HeadingTag
                className={cn(headingClass, 'group-hover:text-accent transition-colors cursor-pointer flex items-center gap-2')}
              >
                <span className="font-mono text-muted-foreground/40 text-[11px] font-normal">
                  {sec.outlineNumber}
                </span>
                {sec.title}
                <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
              </HeadingTag>
            </button>

            {resolved ? (
              <ContentWithRefs text={resolved} />
            ) : (
              <p className="text-sm text-muted-foreground/40 italic mb-4">
                [No content drafted for this section]
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}

function SectionView({
  section,
  dossier,
  refMap,
  articles,
  onCopy,
  copied,
}: {
  section: DossierSection | null;
  dossier: import('@/types').Dossier;
  refMap: Map<string, number>;
  articles: LibraryArticle[];
  onCopy: () => void;
  copied: boolean;
}) {
  if (!section) return null;
  const content = getLatestContent(dossier, section.id);
  const resolved = content ? resolveRefs(content, refMap) : '';

  const tagged = articles.filter((a) => {
    const ds: string[] = a.dossierSections ?? [];
    return ds.includes(section.outlineNumber);
  });

  const refsInSection = Array.from(new Set(extractRefIds(content || '')))
    .map((id) => ({ id, num: refMap.get(id), art: articles.find((a) => a.id === id) }))
    .filter((r) => r.num !== undefined && r.art);

  return (
    <div>
      <div className="flex items-start justify-between mb-4">
        <div>
          <span className="font-mono text-xs text-muted-foreground/50 block mb-1">
            {section.outlineNumber}
          </span>
          <h2 className="font-serif text-2xl font-semibold text-foreground">{section.title}</h2>
        </div>
        <button
          onClick={onCopy}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded border border-border hover:border-border-hover bg-card mt-1"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-include" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'Copied' : 'Copy text'}
        </button>
      </div>

      {resolved ? (
        <ContentWithRefs text={resolved} />
      ) : (
        <div className="rounded-lg border border-dashed border-border bg-muted/20 p-8 text-center">
          <p className="text-sm text-muted-foreground/60">No content has been drafted for this section yet.</p>
        </div>
      )}

      {/* Section references */}
      {refsInSection.length > 0 && (
        <div className="mt-6 pt-4 border-t border-border">
          <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-3">
            References cited in this section
          </p>
          <ol className="space-y-1.5">
            {refsInSection.map(({ num, art }) => (
              <li key={num} className="flex items-start gap-2 text-xs text-muted-foreground">
                <span className="font-mono shrink-0 text-muted-foreground/50">[{num}]</span>
                <span className="leading-relaxed">
                  {art ? vancouverRef(art, num!) : '[Unknown reference]'}
                </span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}

function ContentWithRefs({ text }: { text: string }) {
  // Render inline ref numbers as styled superscripts
  const parts = text.split(/(\[\d+\])/g);
  return (
    <div className="text-sm text-foreground leading-relaxed mb-4 space-y-3">
      {text.split('\n\n').map((para, pi) => {
        if (!para.trim()) return null;

        // Table detection (markdown)
        if (para.trim().startsWith('|')) {
          return (
            <div key={pi} className="overflow-x-auto">
              <MarkdownTable raw={para} />
            </div>
          );
        }

        // Bold header detection
        if (para.trim().startsWith('**') && para.includes('\n')) {
          const [header, ...rest] = para.split('\n');
          return (
            <div key={pi}>
              <p className="font-semibold text-foreground mb-1">
                <InlineRefs text={header.replace(/\*\*/g, '')} />
              </p>
              {rest.map((line, li) => (
                <p key={li} className={cn('leading-relaxed', line.startsWith('•') ? 'pl-2' : '')}>
                  <InlineRefs text={line} />
                </p>
              ))}
            </div>
          );
        }

        return (
          <p key={pi} className="leading-relaxed">
            <InlineRefs text={para} />
          </p>
        );
      })}
    </div>
  );
}

function InlineRefs({ text }: { text: string }) {
  const parts = text.split(/(\[\d+\])/g);
  return (
    <>
      {parts.map((part, i) => {
        const m = part.match(/^\[(\d+)\]$/);
        if (m) {
          return (
            <sup key={i} className="font-mono text-[9px] text-accent font-semibold ml-0.5">
              [{m[1]}]
            </sup>
          );
        }
        return <React.Fragment key={i}>{part}</React.Fragment>;
      })}
    </>
  );
}

function MarkdownTable({ raw }: { raw: string }) {
  const lines = raw.trim().split('\n').filter((l) => l.trim());
  if (lines.length < 2) return <pre className="text-xs">{raw}</pre>;
  const parseRow = (line: string) =>
    line
      .split('|')
      .map((c) => c.trim())
      .filter((_, i, arr) => i > 0 && i < arr.length - 1);

  const headers = parseRow(lines[0]);
  const rows = lines.slice(2).map(parseRow);

  return (
    <table className="w-full text-xs border-collapse border border-border rounded-lg overflow-hidden">
      <thead>
        <tr className="bg-muted/50">
          {headers.map((h, i) => (
            <th key={i} className="border border-border px-3 py-2 text-left font-semibold text-foreground">
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, ri) => (
          <tr key={ri} className={ri % 2 === 0 ? '' : 'bg-muted/20'}>
            {row.map((cell, ci) => (
              <td key={ci} className="border border-border px-3 py-2 text-foreground/80">
                <InlineRefs text={cell} />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function ReferencesView({
  refList,
  articles,
}: {
  refList: { id: string; num: number; art?: LibraryArticle }[];
  articles: LibraryArticle[];
}) {
  if (!refList.length) {
    return (
      <p className="text-sm text-muted-foreground/60 italic">
        No references cited in the current compiled content.
      </p>
    );
  }

  return (
    <ol className="space-y-3">
      {refList.map(({ num, art }) => (
        <li key={num} className="flex items-start gap-3 text-sm text-muted-foreground">
          <span className="font-mono text-xs shrink-0 text-muted-foreground/50 mt-0.5">{num}.</span>
          {art ? (
            <span className="leading-relaxed">
              {art.authors.endsWith('.') ? art.authors : art.authors + '.'}{' '}
              <em className="not-italic font-medium text-foreground">{art.title}.</em>{' '}
              <em>{art.journal}.</em>{' '}
              {art.publicationDate?.slice(0, 4) ?? 'n.d.'}.
              {art.pmid && (
                <span className="font-mono text-xs text-muted-foreground/50 ml-2">
                  PMID: {art.pmid}.
                </span>
              )}
              {art.publicationLink && (
                <a
                  href={art.publicationLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-2 text-accent text-xs hover:underline"
                >
                  ↗
                </a>
              )}
            </span>
          ) : (
            <span className="text-muted-foreground/50 italic">[Reference not found in library]</span>
          )}
        </li>
      ))}
    </ol>
  );
}

function isDescendant(
  sec: DossierSection,
  ancestorId: string,
  sections: DossierSection[]
): boolean {
  if (sec.parentId === ancestorId) return true;
  if (!sec.parentId) return false;
  const parent = sections.find((s) => s.id === sec.parentId);
  return parent ? isDescendant(parent, ancestorId, sections) : false;
}
