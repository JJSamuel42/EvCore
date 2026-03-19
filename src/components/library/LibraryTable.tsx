'use client';

import React, { useState, useMemo } from 'react';
import {
  Settings2,
  Plus,
  ChevronUp,
  ChevronDown,
  ExternalLink,
  Upload,
  Download,
  Cpu,
  Check,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Library, LibraryArticle, LibraryColumn, FilterState, SortState } from '@/types';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { SectionLabel } from '@/components/ui/SectionLabel';
import { ColumnEditor } from './ColumnEditor';
import { useLibraryStore } from '@/store/libraries';
import { cn, truncate, formatDate, formatNumber, generateId } from '@/lib/utils';
import { useAuthStore } from '@/store/auth';

interface LibraryTableProps {
  library: Library;
}

const PAGE_SIZE = 25;

export function LibraryTable({ library }: LibraryTableProps) {
  const { updateColumn, deleteColumn, addColumn, updateArticle } = useLibraryStore();
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin' || user?.role === 'researcher';

  const [adminMode, setAdminMode] = useState(false);
  const [filters, setFilters] = useState<FilterState>({});
  const [sort, setSort] = useState<SortState>({ columnId: null, direction: 'asc' });
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(0);
  const [expandedAbstract, setExpandedAbstract] = useState<string | null>(null);
  const [processingCol, setProcessingCol] = useState<string | null>(null);

  const filterColumns = library.columns.filter((c) => c.isFilter);

  const filteredArticles = useMemo(() => {
    let arts = [...library.articles];

    // Apply filters
    Object.entries(filters).forEach(([colId, value]) => {
      if (!value) return;
      arts = arts.filter((art) => {
        const cellVal = art[colId];
        if (!cellVal) return false;
        return String(cellVal).toLowerCase().includes(String(value).toLowerCase());
      });
    });

    // Sort
    if (sort.columnId) {
      arts.sort((a, b) => {
        const av = a[sort.columnId!] ?? '';
        const bv = b[sort.columnId!] ?? '';
        const cmp = String(av).localeCompare(String(bv), undefined, { numeric: true });
        return sort.direction === 'asc' ? cmp : -cmp;
      });
    }

    return arts;
  }, [library.articles, filters, sort]);

  const totalPages = Math.ceil(filteredArticles.length / PAGE_SIZE);
  const pageArticles = filteredArticles.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const handleSort = (colId: string) => {
    setSort((prev) =>
      prev.columnId === colId
        ? { columnId: colId, direction: prev.direction === 'asc' ? 'desc' : 'asc' }
        : { columnId: colId, direction: 'asc' }
    );
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === pageArticles.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(pageArticles.map((a) => a.id)));
    }
  };

  const simulateAIProcess = async (colId: string) => {
    setProcessingCol(colId);
    await new Promise((r) => setTimeout(r, 1500));
    // Simulate filling in values for articles that don't have a value for this column
    library.articles.forEach((art) => {
      if (!art[colId]) {
        updateArticle(library.id, art.id, { [colId]: 'AI-generated value' });
      }
    });
    setProcessingCol(null);
  };

  const SortIcon = ({ colId }: { colId: string }) => {
    if (sort.columnId !== colId) return <ChevronUp className="w-3 h-3 opacity-20" />;
    return sort.direction === 'asc' ? (
      <ChevronUp className="w-3 h-3 text-accent" />
    ) : (
      <ChevronDown className="w-3 h-3 text-accent" />
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-card gap-2 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Quick filters */}
          {filterColumns.slice(0, 5).map((col) => {
            const uniqueVals = col.predefinedValues || [];
            if (uniqueVals.length === 0) return null;
            return (
              <select
                key={col.id}
                value={(filters[col.id] as string) || ''}
                onChange={(e) => setFilters((p) => ({ ...p, [col.id]: e.target.value || null }))}
                className={cn(
                  'h-7 px-2 text-xs bg-card border border-border rounded',
                  'focus:outline-none focus:ring-1 focus:ring-accent',
                  filters[col.id] ? 'border-accent/50 text-accent' : 'text-muted-foreground'
                )}
              >
                <option value="">{col.name}</option>
                {uniqueVals.map((v) => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            );
          })}
          {Object.values(filters).some(Boolean) && (
            <button
              onClick={() => setFilters({})}
              className="h-7 px-2 text-xs text-exclude hover:bg-exclude-bg rounded transition-colors"
            >
              Clear filters
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {selectedIds.size > 0 && (
            <span className="text-xs text-muted-foreground">{selectedIds.size} selected</span>
          )}
          <Button size="sm" variant="ghost" leftIcon={<Download className="w-3.5 h-3.5" />}>
            Export
          </Button>
          <Button size="sm" variant="ghost" leftIcon={<Upload className="w-3.5 h-3.5" />}>
            Upload Excel
          </Button>
          {isAdmin && (
            <Button
              size="sm"
              variant={adminMode ? 'primary' : 'secondary'}
              leftIcon={<Settings2 className="w-3.5 h-3.5" />}
              onClick={() => setAdminMode(!adminMode)}
            >
              {adminMode ? 'Exit Admin' : 'Admin Mode'}
            </Button>
          )}
        </div>
      </div>

      {adminMode && (
        <div className="px-4 py-2 bg-accent-muted border-b border-accent/20">
          <p className="text-xs text-accent font-mono">
            Admin mode active — click column headers to edit settings
          </p>
        </div>
      )}

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="data-table min-w-full">
          <thead className="sticky top-0 z-10">
            <tr>
              <th className="w-8">
                <input
                  type="checkbox"
                  checked={selectedIds.size === pageArticles.length && pageArticles.length > 0}
                  onChange={toggleSelectAll}
                  className="rounded border-border accent-accent"
                />
              </th>
              <th className="w-10 cursor-pointer" onClick={() => handleSort('articleNumber')}>
                <div className="flex items-center gap-1">#<SortIcon colId="articleNumber" /></div>
              </th>
              <th className="w-24 cursor-pointer" onClick={() => handleSort('pmid')}>
                <div className="flex items-center gap-1">Article ID<SortIcon colId="pmid" /></div>
              </th>
              <th className="min-w-[200px] cursor-pointer" onClick={() => handleSort('title')}>
                <div className="flex items-center gap-1">Title<SortIcon colId="title" /></div>
              </th>
              <th className="min-w-[120px]">Authors</th>
              <th className="min-w-[120px] cursor-pointer" onClick={() => handleSort('journal')}>
                <div className="flex items-center gap-1">Journal<SortIcon colId="journal" /></div>
              </th>
              <th className="min-w-[90px] cursor-pointer" onClick={() => handleSort('publicationDate')}>
                <div className="flex items-center gap-1">Date<SortIcon colId="publicationDate" /></div>
              </th>

              {library.columns.map((col) => (
                <th key={col.id} className="min-w-[100px]">
                  {adminMode ? (
                    <ColumnEditor
                      column={col}
                      onUpdate={(data) => updateColumn(library.id, col.id, data)}
                      onDelete={() => deleteColumn(library.id, col.id)}
                    >
                      <button className="flex items-center gap-1 w-full text-left group">
                        <span className="group-hover:text-accent transition-colors">{col.name}</span>
                        <Settings2 className="w-3 h-3 opacity-0 group-hover:opacity-100 text-accent transition-opacity" />
                        {processingCol === col.id && (
                          <span className="text-accent animate-pulse">...</span>
                        )}
                      </button>
                    </ColumnEditor>
                  ) : (
                    <div className="flex items-center gap-1 cursor-pointer" onClick={() => handleSort(col.id)}>
                      <span>{col.name}</span>
                      <SortIcon colId={col.id} />
                    </div>
                  )}
                  {adminMode && (
                    <button
                      onClick={() => simulateAIProcess(col.id)}
                      className="flex items-center gap-0.5 mt-1 text-[9px] text-accent/70 hover:text-accent transition-colors"
                    >
                      <Cpu className="w-2.5 h-2.5" />
                      Process
                    </button>
                  )}
                </th>
              ))}

              {adminMode && (
                <th className="w-10">
                  <button
                    onClick={() => {
                      addColumn(library.id, {
                        name: 'New Column',
                        description: '',
                        type: 'text',
                        isFilter: false,
                        aiPrompt: '',
                      });
                    }}
                    className="flex items-center gap-1 text-accent hover:text-accent/80 transition-colors whitespace-nowrap"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add
                  </button>
                </th>
              )}
            </tr>
          </thead>

          <tbody>
            {pageArticles.length === 0 ? (
              <tr>
                <td
                  colSpan={8 + library.columns.length}
                  className="text-center py-12 text-sm text-muted-foreground"
                >
                  {library.articles.length === 0
                    ? 'No articles in this library yet. Upload an Excel file to get started.'
                    : 'No articles match the current filters.'}
                </td>
              </tr>
            ) : (
              pageArticles.map((article) => (
                <tr
                  key={article.id}
                  className={cn(
                    'transition-colors',
                    selectedIds.has(article.id) && 'bg-accent-muted'
                  )}
                >
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedIds.has(article.id)}
                      onChange={() => toggleSelect(article.id)}
                      className="rounded border-border accent-accent"
                    />
                  </td>
                  <td className="text-xs text-muted-foreground">{article.articleNumber}</td>
                  <td>
                    <div className="flex items-center gap-1">
                      <a
                        href={article.publicationLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-accent hover:underline font-mono"
                      >
                        {article.pmid}
                      </a>
                      <ExternalLink className="w-2.5 h-2.5 text-muted-foreground" />
                    </div>
                  </td>
                  <td className="max-w-xs">
                    <p
                      className="text-xs text-foreground leading-snug cursor-pointer hover:text-accent transition-colors"
                      onClick={() => setExpandedAbstract(expandedAbstract === article.id ? null : article.id)}
                      title={article.title}
                    >
                      {truncate(article.title, 80)}
                    </p>
                    {expandedAbstract === article.id && (
                      <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed border-t border-border pt-1.5">
                        {article.title}
                      </p>
                    )}
                  </td>
                  <td>
                    <p className="text-xs text-muted-foreground">{truncate(article.authors, 40)}</p>
                  </td>
                  <td>
                    <p className="text-xs text-foreground italic">{truncate(article.journal, 30)}</p>
                  </td>
                  <td>
                    <p className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatDate(article.publicationDate, 'short')}
                    </p>
                  </td>

                  {library.columns.map((col) => {
                    const val = article[col.id];
                    return (
                      <td key={col.id}>
                        {col.type === 'number' ? (
                          <span className="text-xs font-mono text-foreground">
                            {formatNumber(val)}
                          </span>
                        ) : col.type === 'select' && val ? (
                          <Badge variant="neutral" size="sm">{val}</Badge>
                        ) : (
                          <p className="text-xs text-foreground leading-snug">{truncate(String(val ?? ''), 60)}</p>
                        )}
                      </td>
                    );
                  })}

                  {adminMode && <td />}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-2 border-t border-border bg-card text-xs text-muted-foreground">
          <span>
            {filteredArticles.length} articles — Page {page + 1} of {totalPages}
          </span>
          <div className="flex items-center gap-1">
            <Button size="sm" variant="ghost" onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}>
              <ChevronLeft className="w-3.5 h-3.5" />
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page === totalPages - 1}>
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
