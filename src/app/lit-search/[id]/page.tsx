'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Search,
  Cpu,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  BookmarkPlus,
  Library,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Layers,
  Loader2,
  DatabaseZap,
} from 'lucide-react';
import { AuthGuard } from '@/components/layout/AuthGuard';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Textarea } from '@/components/ui/Input';
import { SectionLabel } from '@/components/ui/SectionLabel';
import { Dialog, DialogContent } from '@/components/ui/Dialog';
import { SearchBuilder } from '@/components/lit-search/SearchBuilder';
import { AbstractModal } from '@/components/lit-search/AbstractModal';
import { ReviewModal } from '@/components/lit-search/ReviewModal';
import { useLitSearchStore } from '@/store/litSearch';
import { useLibraryStore } from '@/store/libraries';
import { SearchResult, SearchTerm } from '@/types';
import { cn, truncate, formatDate } from '@/lib/utils';

const EXCLUSION_PRESETS = [
  'Irrelevant to topic',
  'Early phase study',
  'Inappropriate intervention/LOT',
  'Animal / in vitro study',
  'Scoping study / review',
];

export default function LitSearchSessionPage() {
  const { id } = useParams<{ id: string }>();
  const { sessions, addTerm, removeTerm, updateSession, setFilters, updateResult, runSearch, runAIReview } =
    useLitSearchStore();
  const { libraries, addArticle, bulkProcessArticles } = useLibraryStore();

  const session = sessions.find((s) => s.id === id);

  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isReviewing, setIsReviewing] = useState(false);
  const [abstractResult, setAbstractResult] = useState<SearchResult | null>(null);
  const [reviewResult, setReviewResult] = useState<SearchResult | null>(null);
  const [activePresets, setActivePresets] = useState<string[]>([]);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [sortCol, setSortCol] = useState<string | null>(null);
  const [resultsPage, setResultsPage] = useState(1);
  const [showPushDialog, setShowPushDialog] = useState(false);
  const [selectedLibraryId, setSelectedLibraryId] = useState<string>('');
  const [pushDone, setPushDone] = useState(false);
  const [pushDuplicates, setPushDuplicates] = useState<string[]>([]);
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);
  const [bulkProcessDone, setBulkProcessDone] = useState(false);
  const [pushedArticleIds, setPushedArticleIds] = useState<string[]>([]);

  if (!session) {
    return (
      <AuthGuard>
        <AppShell>
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <p className="text-muted-foreground font-mono text-sm">Session not found.</p>
              <Link href="/lit-search" className="text-accent text-sm hover:underline mt-2 inline-block">
                Back to Searches
              </Link>
            </div>
          </div>
        </AppShell>
      </AuthGuard>
    );
  }

  const handleRunSearch = async () => {
    setIsSearching(true);
    setSearchError(null);
    setResultsPage(1);
    try {
      await runSearch(session.id, 1);
    } catch {
      setSearchError('Failed to reach PubMed. Check your internet connection and try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleLoadMore = async () => {
    const nextPage = Math.floor(session.results.length / 25) + 1;
    setIsLoadingMore(true);
    try {
      await runSearch(session.id, nextPage);
      setResultsPage(nextPage);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleRunAI = async () => {
    setIsReviewing(true);
    try {
      await runAIReview(session.id);
    } finally {
      setIsReviewing(false);
    }
  };

  const togglePreset = (preset: string) => {
    setActivePresets((prev) =>
      prev.includes(preset) ? prev.filter((p) => p !== preset) : [...prev, preset]
    );
    const currentContext = session.aiContext;
    const combined = activePresets.includes(preset)
      ? currentContext.replace(`Exclude: ${preset}. `, '')
      : currentContext + `Exclude: ${preset}. `;
    updateSession(session.id, { aiContext: combined });
  };

  const RESULTS_PER_PAGE = 25;
  const sortedResults = [...session.results].sort((a, b) => {
    if (!sortCol) return 0;
    const av = (a as any)[sortCol] ?? '';
    const bv = (b as any)[sortCol] ?? '';
    const cmp = String(av).localeCompare(String(bv));
    return sortDir === 'asc' ? cmp : -cmp;
  });
  const pagedResults = sortedResults.slice(0, resultsPage * RESULTS_PER_PAGE);

  const included = session.results.filter((r) => r.decision === 'include').length;
  const excluded = session.results.filter((r) => r.decision === 'exclude').length;
  const pending = session.results.filter((r) => !r.decision).length;

  const handleSort = (col: string) => {
    if (sortCol === col) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortCol(col);
      setSortDir('asc');
    }
  };

  const SortIcon = ({ col }: { col: string }) => {
    if (sortCol !== col) return <ChevronUp className="w-3 h-3 opacity-20" />;
    return sortDir === 'asc' ? (
      <ChevronUp className="w-3 h-3 text-accent" />
    ) : (
      <ChevronDown className="w-3 h-3 text-accent" />
    );
  };

  const includedResults = session.results.filter((r) => r.decision === 'include');

  const handlePushToLibrary = () => {
    if (!selectedLibraryId) return;
    const targetLibrary = libraries.find((l) => l.id === selectedLibraryId);
    const existingPmids = new Set((targetLibrary?.articles ?? []).map((a) => a.pmid));

    const duplicates: string[] = [];
    const newIds: string[] = [];

    includedResults.forEach((r) => {
      if (existingPmids.has(r.pmid)) {
        duplicates.push(r.pmid);
        return;
      }
      const article = addArticle(selectedLibraryId, {
        pmid: r.pmid,
        title: r.title,
        authors: r.authors,
        journal: r.journal,
        publicationDate: r.pubDate,
        publicationLink: r.link,
      });
      if (article?.id) newIds.push(article.id);
    });

    setPushDuplicates(duplicates);
    setPushedArticleIds(newIds);
    setPushDone(true);
  };

  return (
    <AuthGuard>
      <AppShell>
        <div className="flex flex-col min-h-0 h-full">
          {/* Header */}
          <div className="px-6 py-3 border-b border-border bg-card shrink-0">
            <Link
              href="/lit-search"
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-1 transition-colors"
            >
              <ArrowLeft className="w-3 h-3" />
              Literature Search
            </Link>
            <div className="flex items-center justify-between">
              <h1 className="font-serif text-xl font-semibold text-foreground">{session.name}</h1>
              {session.results.length > 0 && (
                <div className="flex items-center gap-2">
                  <Badge variant="include">{included} included</Badge>
                  <Badge variant="exclude">{excluded} excluded</Badge>
                  {pending > 0 && <Badge variant="pending">{pending} pending</Badge>}
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-auto">
            <div className="p-6 space-y-6 max-w-7xl mx-auto">
              {/* Search Builder */}
              <SearchBuilder
                terms={session.terms}
                onAddTerm={(term) => addTerm(session.id, term)}
                onRemoveTerm={(termId) => removeTerm(session.id, termId)}
                query={session.query}
                onQueryChange={(q) => updateSession(session.id, { query: q })}
              />

              {/* Filters */}
              <div>
                <SectionLabel className="mb-4">Filters</SectionLabel>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground mb-2">
                      Publication Date
                    </p>
                    <div className="flex items-center gap-2">
                      <input
                        type="date"
                        value={session.filters.dateFrom || ''}
                        onChange={(e) => setFilters(session.id, { dateFrom: e.target.value })}
                        className="h-9 px-2 text-xs bg-card border border-border rounded focus:outline-none focus:ring-2 focus:ring-accent flex-1"
                      />
                      <span className="text-xs text-muted-foreground">to</span>
                      <input
                        type="date"
                        value={session.filters.dateTo || ''}
                        onChange={(e) => setFilters(session.id, { dateTo: e.target.value })}
                        className="h-9 px-2 text-xs bg-card border border-border rounded focus:outline-none focus:ring-2 focus:ring-accent flex-1"
                      />
                    </div>
                    <div className="flex gap-1 mt-1.5">
                      {[
                        { label: 'Past Year', years: 1 },
                        { label: 'Past 5 Years', years: 5 },
                      ].map(({ label, years }) => (
                        <button
                          key={label}
                          onClick={() => {
                            const from = new Date();
                            from.setFullYear(from.getFullYear() - years);
                            setFilters(session.id, {
                              dateFrom: from.toISOString().split('T')[0],
                              dateTo: new Date().toISOString().split('T')[0],
                            });
                          }}
                          className="text-[11px] px-2 py-0.5 rounded border border-border hover:border-accent/40 hover:text-accent transition-colors text-muted-foreground"
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground mb-2">
                      Species
                    </p>
                    <div className="flex gap-2">
                      {(['human', 'animal', 'both'] as const).map((v) => (
                        <button
                          key={v}
                          onClick={() => setFilters(session.id, { species: v })}
                          className={cn(
                            'flex-1 py-1.5 text-xs rounded border capitalize transition-all',
                            session.filters.species === v
                              ? 'bg-accent text-white border-accent'
                              : 'border-border text-muted-foreground hover:border-accent/40'
                          )}
                        >
                          {v}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground mb-2">
                      Language
                    </p>
                    <div className="flex gap-2">
                      {(['english', 'other', 'both'] as const).map((v) => (
                        <button
                          key={v}
                          onClick={() => setFilters(session.id, { language: v })}
                          className={cn(
                            'flex-1 py-1.5 text-xs rounded border capitalize transition-all',
                            session.filters.language === v
                              ? 'bg-accent text-white border-accent'
                              : 'border-border text-muted-foreground hover:border-accent/40'
                          )}
                        >
                          {v}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* AI Context */}
              <div>
                <SectionLabel className="mb-4">AI Review Instructions</SectionLabel>
                <div className="space-y-3">
                  <Textarea
                    label="Context & Instructions for AI Shortlisting"
                    value={session.aiContext}
                    onChange={(e) => updateSession(session.id, { aiContext: e.target.value })}
                    placeholder="Provide context and specific instructions for AI-assisted article screening..."
                    rows={3}
                  />

                  {/* Exclusion presets */}
                  <div>
                    <p className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground mb-2">
                      Quick Exclusion Criteria
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {EXCLUSION_PRESETS.map((preset) => (
                        <button
                          key={preset}
                          onClick={() => togglePreset(preset)}
                          className={cn(
                            'px-2.5 py-1 text-xs rounded-full border transition-all',
                            activePresets.includes(preset)
                              ? 'bg-exclude-bg border-exclude/30 text-exclude'
                              : 'border-border text-muted-foreground hover:border-border-hover hover:text-foreground'
                          )}
                        >
                          {preset}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Search error */}
              {searchError && (
                <div className="mb-3 px-4 py-2 bg-exclude-bg border border-exclude/20 rounded-md text-sm text-exclude">
                  {searchError}
                </div>
              )}

              {/* Action buttons */}
              <div className="flex items-center gap-3">
                <Button
                  variant="secondary"
                  leftIcon={<Search className="w-4 h-4" />}
                  isLoading={isSearching}
                  onClick={handleRunSearch}
                  disabled={session.terms.length === 0}
                >
                  {isSearching ? 'Searching PubMed…' : 'Search PubMed'}
                </Button>

                <Button
                  variant="primary"
                  leftIcon={<Cpu className="w-4 h-4" />}
                  isLoading={isReviewing}
                  onClick={handleRunAI}
                  disabled={session.results.length === 0}
                >
                  {isReviewing ? 'Running AI Review…' : 'Run AI Review'}
                </Button>

                {included > 0 && (
                  <Button
                    variant="ghost"
                    leftIcon={<BookmarkPlus className="w-4 h-4" />}
                    className="ml-auto"
                    onClick={() => { setShowPushDialog(true); setPushDone(false); setSelectedLibraryId(''); }}
                  >
                    Push to Library ({included})
                  </Button>
                )}
              </div>

              {/* Searching indicator */}
              {isSearching && (
                <div className="flex flex-col items-center justify-center gap-3 py-14 text-muted-foreground">
                  <Loader2 className="w-8 h-8 animate-spin text-accent" />
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <DatabaseZap className="w-4 h-4" />
                    Querying PubMed…
                  </div>
                  <p className="text-xs">Searching across millions of articles. This may take a few seconds.</p>
                </div>
              )}

              {/* No results state */}
              {!isSearching && session.lastRun && session.results.length === 0 && (
                <div className="flex flex-col items-center justify-center gap-2 py-14 text-muted-foreground">
                  <Search className="w-8 h-8 opacity-30" />
                  <p className="text-sm font-medium">No results found on PubMed</p>
                  <p className="text-xs">Try broadening your search terms or adjusting filters.</p>
                </div>
              )}

              {/* Results Table */}
              {!isSearching && session.results.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <SectionLabel>
                        Results — showing {session.results.length.toLocaleString()} loaded
                      </SectionLabel>
                      {session.totalHits != null && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-accent/10 text-accent border border-accent/20">
                          <DatabaseZap className="w-3 h-3" />
                          {session.totalHits.toLocaleString()} hits on PubMed
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="overflow-auto rounded-lg border border-border">
                    <table className="data-table min-w-full">
                      <thead>
                        <tr>
                          <th className="w-8">#</th>
                          <th
                            className="min-w-[300px] cursor-pointer"
                            onClick={() => handleSort('title')}
                          >
                            <div className="flex items-center gap-1">Title <SortIcon col="title" /></div>
                          </th>
                          <th className="min-w-[120px]">Authors</th>
                          <th
                            className="min-w-[120px] cursor-pointer"
                            onClick={() => handleSort('journal')}
                          >
                            <div className="flex items-center gap-1">Journal <SortIcon col="journal" /></div>
                          </th>
                          <th
                            className="min-w-[80px] cursor-pointer"
                            onClick={() => handleSort('pubDate')}
                          >
                            <div className="flex items-center gap-1">Date <SortIcon col="pubDate" /></div>
                          </th>
                          <th className="w-16">Link</th>
                          <th className="w-24">PMID</th>
                          <th className="w-20">Confidence</th>
                          <th className="w-28">Decision</th>
                          <th className="min-w-[180px]">Rationale</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pagedResults.map((result, idx) => (
                          <tr key={result.pmid}>
                            <td className="text-xs text-muted-foreground">{idx + 1}</td>
                            <td className="max-w-xs">
                              <button
                                onClick={() => setAbstractResult(result)}
                                className="text-xs text-left text-foreground hover:text-accent transition-colors leading-snug"
                              >
                                {truncate(result.title, 100)}
                              </button>
                            </td>
                            <td>
                              <p className="text-xs text-muted-foreground">{truncate(result.authors, 40)}</p>
                            </td>
                            <td>
                              <p className="text-xs text-foreground italic">{truncate(result.journal, 30)}</p>
                            </td>
                            <td>
                              <p className="text-xs text-muted-foreground">{result.pubDate}</p>
                            </td>
                            <td>
                              <a
                                href={result.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-accent hover:text-accent/80"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            </td>
                            <td>
                              <span className="text-xs font-mono text-muted-foreground">{result.pmid}</span>
                            </td>
                            <td>
                              {result.confidence != null ? (
                                <div className="flex flex-col gap-0.5">
                                  <span className="text-xs font-mono text-foreground">{result.confidence}%</span>
                                  <div className="h-1 w-12 rounded-full bg-border overflow-hidden">
                                    <div
                                      className={cn(
                                        'h-full rounded-full',
                                        result.confidence >= 85 ? 'bg-include' :
                                        result.confidence >= 65 ? 'bg-amber-500' : 'bg-exclude'
                                      )}
                                      style={{ width: `${result.confidence}%` }}
                                    />
                                  </div>
                                </div>
                              ) : (
                                <span className="text-xs text-muted-foreground">—</span>
                              )}
                            </td>
                            <td>
                              <button
                                onClick={() => setReviewResult(result)}
                                className="focus:outline-none"
                              >
                                {result.decision ? (
                                  <Badge variant={result.decision} size="sm">
                                    {result.decision}
                                  </Badge>
                                ) : (
                                  <span className="text-xs text-muted-foreground hover:text-foreground">
                                    — Review
                                  </span>
                                )}
                              </button>
                            </td>
                            <td>
                              <p className="text-xs text-muted-foreground leading-relaxed">
                                {truncate(result.rationale || result.aiReasoning, 80)}
                              </p>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination footer */}
                  <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
                    <span>
                      Showing {pagedResults.length.toLocaleString()} of {session.results.length.toLocaleString()} loaded
                      {session.totalHits && session.totalHits > session.results.length && (
                        <span> · {(session.totalHits - session.results.length).toLocaleString()} more on PubMed</span>
                      )}
                    </span>
                    <div className="flex items-center gap-2">
                      {pagedResults.length < session.results.length && (
                        <button
                          onClick={() => setResultsPage((p) => p + 1)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded border border-border hover:border-accent/40 hover:text-accent transition-colors"
                        >
                          <ChevronRight className="w-3.5 h-3.5" />
                          Show next 25
                        </button>
                      )}
                      {session.totalHits && session.results.length < session.totalHits && (
                        <Button
                          variant="ghost"
                          size="sm"
                          isLoading={isLoadingMore}
                          onClick={handleLoadMore}
                        >
                          {isLoadingMore ? 'Loading…' : `Fetch next 25 from PubMed`}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modals */}
        <AbstractModal
          result={abstractResult}
          terms={session.terms}
          open={!!abstractResult}
          onClose={() => setAbstractResult(null)}
        />

        <ReviewModal
          result={reviewResult}
          open={!!reviewResult}
          onClose={() => setReviewResult(null)}
          onUpdate={(decision, rationale) => {
            if (reviewResult) {
              updateResult(session.id, reviewResult.pmid, { decision, rationale });
            }
          }}
        />

        {/* Push to Library dialog */}
        <Dialog open={showPushDialog} onOpenChange={(o) => { setShowPushDialog(o); if (!o) { setPushDone(false); setBulkProcessDone(false); setPushedArticleIds([]); setPushDuplicates([]); } }}>
          <DialogContent
            size="sm"
            title="Push to Library"
            description={`Push ${includedResults.length} included article${includedResults.length !== 1 ? 's' : ''} to an evidence library.`}
          >
            {pushDone ? (
              <div className="space-y-4">
                {/* Success */}
                <div className="p-3 bg-include-bg border border-include/30 rounded-md text-sm text-include">
                  {pushedArticleIds.length} article{pushedArticleIds.length !== 1 ? 's' : ''} added to library.
                </div>

                {/* Duplicates warning */}
                {pushDuplicates.length > 0 && (
                  <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-md text-sm">
                    <div className="flex items-center gap-2 text-amber-600 font-medium mb-1">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      {pushDuplicates.length} duplicate{pushDuplicates.length !== 1 ? 's' : ''} skipped
                    </div>
                    <p className="text-xs text-muted-foreground">
                      The following PMIDs already exist in the library and were not added:
                    </p>
                    <p className="text-xs font-mono text-foreground mt-1">{pushDuplicates.join(', ')}</p>
                  </div>
                )}

                {/* Bulk AI processing */}
                {pushedArticleIds.length > 0 && (
                  <div className="p-3 border border-border rounded-md space-y-2">
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-muted-foreground" />
                      <p className="text-sm font-medium text-foreground">Bulk AI Column Processing</p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Run AI extraction to populate all columns for the {pushedArticleIds.length} newly added article{pushedArticleIds.length !== 1 ? 's' : ''}.
                    </p>
                    {bulkProcessDone ? (
                      <p className="text-xs text-include font-medium">Columns processed successfully.</p>
                    ) : (
                      <Button
                        variant="secondary"
                        size="sm"
                        leftIcon={<Cpu className="w-3.5 h-3.5" />}
                        isLoading={isBulkProcessing}
                        onClick={async () => {
                          setIsBulkProcessing(true);
                          try {
                            await bulkProcessArticles(selectedLibraryId, pushedArticleIds);
                            setBulkProcessDone(true);
                          } finally {
                            setIsBulkProcessing(false);
                          }
                        }}
                      >
                        {isBulkProcessing ? 'Processing…' : 'Process columns with AI'}
                      </Button>
                    )}
                  </div>
                )}

                <div className="flex justify-end">
                  <Button variant="primary" size="sm" onClick={() => setShowPushDialog(false)}>
                    Done
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <p className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground mb-2">
                    Select Library
                  </p>
                  <select
                    value={selectedLibraryId}
                    onChange={(e) => setSelectedLibraryId(e.target.value)}
                    className="w-full h-9 px-3 text-sm bg-card border border-border rounded focus:outline-none focus:ring-2 focus:ring-accent text-foreground"
                  >
                    <option value="">Choose a library…</option>
                    {libraries.map((lib) => (
                      <option key={lib.id} value={lib.id}>
                        {lib.name} — {lib.innName}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="max-h-40 overflow-y-auto space-y-1 border border-border rounded-md p-2">
                  {includedResults.map((r) => (
                    <p key={r.pmid} className="text-xs text-foreground truncate" title={r.title}>
                      {r.title}
                    </p>
                  ))}
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setShowPushDialog(false)}>
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    leftIcon={<Library className="w-3.5 h-3.5" />}
                    disabled={!selectedLibraryId}
                    onClick={handlePushToLibrary}
                  >
                    Push {includedResults.length} Article{includedResults.length !== 1 ? 's' : ''}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </AppShell>
    </AuthGuard>
  );
}
