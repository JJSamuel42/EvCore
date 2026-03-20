'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Settings2,
  Plus,
  ChevronUp,
  ChevronDown,
  ExternalLink,
  Upload,
  Download,
  Cpu,
  ChevronLeft,
  ChevronRight,
  Columns,
  X,
  Calendar,
  Pencil,
  GripVertical,
  Eye,
  EyeOff,
} from 'lucide-react';
import { Library, LibraryArticle, LibraryColumn, SortState, DateQuickAction } from '@/types';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ColumnEditor } from './ColumnEditor';
import { Dialog, DialogContent, DialogClose } from '@/components/ui/Dialog';
import { Input } from '@/components/ui/Input';
import { useLibraryStore } from '@/store/libraries';
import { cn, truncate, formatDate, formatNumber } from '@/lib/utils';
import { useAuthStore } from '@/store/auth';

interface LibraryTableProps {
  library: Library;
}

const PAGE_SIZE = 25;

const SYSTEM_COLS = [
  { id: 'articleNumber', name: '#' },
  { id: 'pmid', name: 'Article ID' },
  { id: 'title', name: 'Title' },
  { id: 'authors', name: 'Authors' },
  { id: 'journal', name: 'Journal' },
  { id: 'publicationDate', name: 'Date' },
];

function getDateFromQuickAction(action: DateQuickAction): { from: string; to: string } {
  if (action.type === 'relative_months' && action.months) {
    const d = new Date();
    d.setMonth(d.getMonth() - action.months);
    return { from: d.toISOString().slice(0, 10), to: '' };
  }
  if (action.type === 'since_date' && action.date) {
    return { from: action.date, to: '' };
  }
  return { from: '', to: '' };
}

export function LibraryTable({ library }: LibraryTableProps) {
  const { updateColumn, deleteColumn, addColumn, updateArticle, updateDateQuickActions } = useLibraryStore();
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin' || user?.role === 'researcher';

  // ── UI mode ──────────────────────────────────────────────────────────
  const [adminMode, setAdminMode] = useState(false);
  const [showColumnPanel, setShowColumnPanel] = useState(false);
  const [editingQuickActions, setEditingQuickActions] = useState(false);
  const [processingCol, setProcessingCol] = useState<string | null>(null);
  const [expandedAbstract, setExpandedAbstract] = useState<string | null>(null);
  const columnPanelRef = useRef<HTMLDivElement>(null);

  // ── Column visibility & order ────────────────────────────────────────
  const [hiddenCols, setHiddenCols] = useState<Set<string>>(new Set());
  const [colOrder, setColOrder] = useState<string[]>(() =>
    [...library.columns].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)).map((c) => c.id)
  );

  // Sync when columns are added in admin mode
  useEffect(() => {
    setColOrder((prev) => {
      const known = new Set(prev);
      const newIds = library.columns.map((c) => c.id).filter((id) => !known.has(id));
      return [
        ...prev.filter((id) => library.columns.some((c) => c.id === id)),
        ...newIds,
      ];
    });
  }, [library.columns]);

  // Close column panel on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (columnPanelRef.current && !columnPanelRef.current.contains(e.target as Node)) {
        setShowColumnPanel(false);
      }
    }
    if (showColumnPanel) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showColumnPanel]);

  const orderedVisibleLibraryCols = useMemo(
    () =>
      colOrder
        .map((id) => library.columns.find((c) => c.id === id))
        .filter((c): c is LibraryColumn => !!c && !hiddenCols.has(c.id)),
    [colOrder, library.columns, hiddenCols]
  );

  const toggleColVisibility = (id: string) => {
    setHiddenCols((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const moveCol = (idx: number, dir: -1 | 1) => {
    setColOrder((prev) => {
      const next = [...prev];
      const swap = idx + dir;
      if (swap < 0 || swap >= next.length) return prev;
      [next[idx], next[swap]] = [next[swap], next[idx]];
      return next;
    });
  };

  // ── Named filter columns ─────────────────────────────────────────────
  const productCol = library.columns.find((c) => c.name === 'Product');
  const indicationCol = library.columns.find((c) => c.name === 'Indication');
  const categoryCol = library.columns.find((c) => c.name === 'Category');
  const subCategoryCol = library.columns.find((c) => c.name === 'Subcategory');
  const pubTypeCol = library.columns.find((c) => c.name === 'Publication Type');
  const studyTypeCol = library.columns.find((c) => c.name === 'Study Type');
  const regionCol = library.columns.find((c) => c.name === 'Region');

  // ── Filter state ─────────────────────────────────────────────────────
  const [productFilter, setProductFilter] = useState('');
  const [indicationFilter, setIndicationFilter] = useState('');
  const [colFilters, setColFilters] = useState<Record<string, string>>({});
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [activeQuickId, setActiveQuickId] = useState<string | null>(null);

  const setColFilter = (colId: string, val: string) =>
    setColFilters((p) => ({ ...p, [colId]: val }));

  const clearAllFilters = () => {
    setProductFilter('');
    setIndicationFilter('');
    setColFilters({});
    setDateFrom('');
    setDateTo('');
    setActiveQuickId(null);
  };

  const hasActiveFilters =
    productFilter || indicationFilter || Object.values(colFilters).some(Boolean) || dateFrom || dateTo;

  const applyQuickDate = (action: DateQuickAction) => {
    if (activeQuickId === action.id) {
      setActiveQuickId(null);
      setDateFrom('');
      setDateTo('');
      return;
    }
    const { from, to } = getDateFromQuickAction(action);
    if (!from && !to) return; // GVD with no date set — ignore
    setActiveQuickId(action.id);
    setDateFrom(from);
    setDateTo(to);
  };

  // ── Dynamic filter options ────────────────────────────────────────────
  const productValues = useMemo(() => {
    if (!productCol) return [];
    const vals = new Set<string>();
    library.articles.forEach((a) => {
      const v = a[productCol.id];
      if (v && String(v) !== 'Not Applicable') vals.add(String(v));
    });
    return Array.from(vals).sort();
  }, [library.articles, productCol]);

  const indicationValues = useMemo(() => {
    const vals = new Set<string>(library.indications);
    if (indicationCol) {
      library.articles.forEach((a) => {
        const v = a[indicationCol.id];
        if (v) vals.add(String(v));
      });
    }
    return Array.from(vals).sort();
  }, [library.indications, library.articles, indicationCol]);

  // ── Quick actions editing ─────────────────────────────────────────────
  const [localQA, setLocalQA] = useState<DateQuickAction[]>(() => library.dateQuickActions);
  useEffect(() => setLocalQA(library.dateQuickActions), [library.dateQuickActions]);

  const saveQuickActions = () => {
    updateDateQuickActions(library.id, localQA);
    setEditingQuickActions(false);
  };

  const updateLocalQA = (id: string, patch: Partial<DateQuickAction>) =>
    setLocalQA((prev) => prev.map((a) => (a.id === id ? { ...a, ...patch } : a)));

  // ── Sort & pagination ────────────────────────────────────────────────
  const [sort, setSort] = useState<SortState>({ columnId: null, direction: 'asc' });
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(0);

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
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    setSelectedIds(
      selectedIds.size === pageArticles.length
        ? new Set()
        : new Set(pageArticles.map((a) => a.id))
    );
  };

  // ── Filtered + sorted articles ────────────────────────────────────────
  const filteredArticles = useMemo(() => {
    let arts = [...library.articles];

    if (productFilter && productCol) {
      arts = arts.filter((a) =>
        String(a[productCol.id] ?? '').toLowerCase().includes(productFilter.toLowerCase())
      );
    }
    if (indicationFilter && indicationCol) {
      arts = arts.filter((a) =>
        String(a[indicationCol.id] ?? '').toLowerCase().includes(indicationFilter.toLowerCase())
      );
    }
    Object.entries(colFilters).forEach(([colId, val]) => {
      if (!val) return;
      arts = arts.filter((a) => String(a[colId] ?? '') === val);
    });
    if (dateFrom) arts = arts.filter((a) => a.publicationDate >= dateFrom);
    if (dateTo) arts = arts.filter((a) => a.publicationDate <= dateTo);

    if (sort.columnId) {
      arts.sort((a, b) => {
        const av = a[sort.columnId!] ?? '';
        const bv = b[sort.columnId!] ?? '';
        const cmp = String(av).localeCompare(String(bv), undefined, { numeric: true });
        return sort.direction === 'asc' ? cmp : -cmp;
      });
    }
    return arts;
  }, [library.articles, productFilter, indicationFilter, colFilters, dateFrom, dateTo, sort, productCol, indicationCol]);

  const totalPages = Math.ceil(filteredArticles.length / PAGE_SIZE);
  const pageArticles = filteredArticles.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  useEffect(() => setPage(0), [filteredArticles.length]);

  const simulateAIProcess = async (colId: string) => {
    setProcessingCol(colId);
    await new Promise((r) => setTimeout(r, 1500));
    library.articles.forEach((art) => {
      if (!art[colId]) updateArticle(library.id, art.id, { [colId]: 'AI-generated value' });
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

  const filterSelect = (
    label: string,
    value: string,
    onChange: (v: string) => void,
    options: string[]
  ) => (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        'h-7 px-2 text-xs bg-card border border-border rounded focus:outline-none focus:ring-1 focus:ring-accent',
        value ? 'border-accent/50 text-accent' : 'text-muted-foreground'
      )}
    >
      <option value="">{label}</option>
      {options.map((v) => (
        <option key={v} value={v}>{v}</option>
      ))}
    </select>
  );

  // ── All col panel items (system + library) ────────────────────────────
  const allPanelCols = [
    ...SYSTEM_COLS,
    ...colOrder
      .map((id) => library.columns.find((c) => c.id === id))
      .filter((c): c is LibraryColumn => !!c),
  ];

  const visibleSystemCols = SYSTEM_COLS.filter((c) => !hiddenCols.has(c.id));

  return (
    <div className="flex flex-col h-full">

      {/* ── Row 1: Action bar ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-card gap-2 flex-wrap">
        <span className="text-xs text-muted-foreground">
          {filteredArticles.length} of {library.articles.length} articles
          {hasActiveFilters && ' (filtered)'}
        </span>
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

          {/* Column panel */}
          <div className="relative" ref={columnPanelRef}>
            <Button
              size="sm"
              variant={showColumnPanel ? 'secondary' : 'ghost'}
              leftIcon={<Columns className="w-3.5 h-3.5" />}
              onClick={() => setShowColumnPanel((p) => !p)}
            >
              Columns
            </Button>
            {showColumnPanel && (
              <div className="absolute right-0 top-full mt-1 z-50 bg-card border border-border rounded-lg shadow-lg w-60">
                <div className="flex items-center justify-between px-3 pt-3 pb-2 border-b border-border">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Manage Columns
                  </span>
                  <button onClick={() => setShowColumnPanel(false)} className="text-muted-foreground hover:text-foreground">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="px-2 py-1">
                  <p className="text-[10px] text-muted-foreground px-1 py-1 uppercase tracking-wider font-mono">System</p>
                  {SYSTEM_COLS.map((sc) => (
                    <div key={sc.id} className="flex items-center gap-2 px-1 py-1 rounded hover:bg-muted">
                      <button
                        onClick={() => toggleColVisibility(sc.id)}
                        className={cn('transition-colors', hiddenCols.has(sc.id) ? 'text-muted-foreground' : 'text-accent')}
                      >
                        {hiddenCols.has(sc.id) ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                      <span className={cn('text-xs flex-1', hiddenCols.has(sc.id) && 'text-muted-foreground line-through')}>
                        {sc.name}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="px-2 py-1 border-t border-border">
                  <p className="text-[10px] text-muted-foreground px-1 py-1 uppercase tracking-wider font-mono">Custom</p>
                  <div className="max-h-52 overflow-y-auto space-y-0.5">
                    {colOrder.map((id, idx) => {
                      const col = library.columns.find((c) => c.id === id);
                      if (!col) return null;
                      return (
                        <div key={id} className="flex items-center gap-1 px-1 py-1 rounded hover:bg-muted">
                          <button
                            onClick={() => moveCol(idx, -1)}
                            disabled={idx === 0}
                            className="text-muted-foreground hover:text-foreground disabled:opacity-20"
                          >
                            <ChevronUp className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => moveCol(idx, 1)}
                            disabled={idx === colOrder.length - 1}
                            className="text-muted-foreground hover:text-foreground disabled:opacity-20"
                          >
                            <ChevronDown className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => toggleColVisibility(id)}
                            className={cn('transition-colors ml-0.5', hiddenCols.has(id) ? 'text-muted-foreground' : 'text-accent')}
                          >
                            {hiddenCols.has(id) ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                          <span className={cn('text-xs flex-1 truncate', hiddenCols.has(id) && 'text-muted-foreground line-through')}>
                            {col.name}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {hiddenCols.size > 0 && (
                  <div className="px-3 py-2 border-t border-border">
                    <button
                      onClick={() => setHiddenCols(new Set())}
                      className="text-xs text-accent hover:underline"
                    >
                      Show all columns
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

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

      {/* ── Row 2: Column filters ─────────────────────────────────────── */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-border bg-card flex-wrap">
        {productCol && filterSelect(
          'All Products', productFilter, setProductFilter, productValues
        )}
        {indicationCol && filterSelect(
          'All Indications', indicationFilter, setIndicationFilter, indicationValues
        )}
        {categoryCol?.predefinedValues && filterSelect(
          'Category', colFilters[categoryCol.id] || '', (v) => setColFilter(categoryCol.id, v), categoryCol.predefinedValues
        )}
        {subCategoryCol?.predefinedValues && filterSelect(
          'Sub Category', colFilters[subCategoryCol.id] || '', (v) => setColFilter(subCategoryCol.id, v), subCategoryCol.predefinedValues
        )}
        {pubTypeCol?.predefinedValues && filterSelect(
          'Publication Type', colFilters[pubTypeCol.id] || '', (v) => setColFilter(pubTypeCol.id, v), pubTypeCol.predefinedValues
        )}
        {studyTypeCol?.predefinedValues && filterSelect(
          'Study Type', colFilters[studyTypeCol.id] || '', (v) => setColFilter(studyTypeCol.id, v), studyTypeCol.predefinedValues
        )}
        {regionCol?.predefinedValues && filterSelect(
          'Region', colFilters[regionCol.id] || '', (v) => setColFilter(regionCol.id, v), regionCol.predefinedValues
        )}
        {hasActiveFilters && (
          <button
            onClick={clearAllFilters}
            className="h-7 px-2 text-xs text-exclude hover:bg-exclude-bg rounded transition-colors flex items-center gap-1"
          >
            <X className="w-3 h-3" />
            Clear all
          </button>
        )}
      </div>

      {/* ── Row 3: Date filter ────────────────────────────────────────── */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-border bg-card flex-wrap">
        <Calendar className="w-3.5 h-3.5 text-muted-foreground shrink-0" />

        <input
          type="date"
          value={dateFrom}
          onChange={(e) => { setDateFrom(e.target.value); setActiveQuickId(null); }}
          className="h-7 px-2 text-xs bg-card border border-border rounded focus:outline-none focus:ring-1 focus:ring-accent text-muted-foreground"
          placeholder="From"
        />
        <span className="text-xs text-muted-foreground">–</span>
        <input
          type="date"
          value={dateTo}
          onChange={(e) => { setDateTo(e.target.value); setActiveQuickId(null); }}
          className="h-7 px-2 text-xs bg-card border border-border rounded focus:outline-none focus:ring-1 focus:ring-accent text-muted-foreground"
          placeholder="To"
        />

        <div className="w-px h-4 bg-border mx-1" />

        {library.dateQuickActions.map((action) => {
          const isActive = activeQuickId === action.id;
          const isGvdNoDate = action.type === 'since_date' && !action.date;
          return (
            <button
              key={action.id}
              onClick={() => applyQuickDate(action)}
              disabled={isGvdNoDate}
              title={isGvdNoDate ? 'GVD date not set — edit in Admin Mode' : undefined}
              className={cn(
                'h-7 px-3 text-xs rounded border transition-colors',
                isActive
                  ? 'bg-accent text-white border-accent'
                  : 'bg-card border-border text-muted-foreground hover:border-accent/50 hover:text-foreground',
                isGvdNoDate && 'opacity-40 cursor-not-allowed'
              )}
            >
              {action.label}
            </button>
          );
        })}

        {isAdmin && adminMode && (
          <button
            onClick={() => setEditingQuickActions(true)}
            className="h-7 px-2 text-xs text-accent border border-accent/30 rounded hover:bg-accent-muted transition-colors flex items-center gap-1"
          >
            <Pencil className="w-3 h-3" />
            Edit
          </button>
        )}
      </div>

      {adminMode && (
        <div className="px-4 py-2 bg-accent-muted border-b border-accent/20">
          <p className="text-xs text-accent font-mono">
            Admin mode — click column headers to edit settings, use date Edit button to configure quick filters
          </p>
        </div>
      )}

      {/* ── Table ────────────────────────────────────────────────────── */}
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
              {!hiddenCols.has('articleNumber') && (
                <th className="w-10 cursor-pointer" onClick={() => handleSort('articleNumber')}>
                  <div className="flex items-center gap-1">#<SortIcon colId="articleNumber" /></div>
                </th>
              )}
              {!hiddenCols.has('pmid') && (
                <th className="w-24 cursor-pointer" onClick={() => handleSort('pmid')}>
                  <div className="flex items-center gap-1">Article ID<SortIcon colId="pmid" /></div>
                </th>
              )}
              {!hiddenCols.has('title') && (
                <th className="min-w-[200px] cursor-pointer" onClick={() => handleSort('title')}>
                  <div className="flex items-center gap-1">Title<SortIcon colId="title" /></div>
                </th>
              )}
              {!hiddenCols.has('authors') && <th className="min-w-[120px]">Authors</th>}
              {!hiddenCols.has('journal') && (
                <th className="min-w-[120px] cursor-pointer" onClick={() => handleSort('journal')}>
                  <div className="flex items-center gap-1">Journal<SortIcon colId="journal" /></div>
                </th>
              )}
              {!hiddenCols.has('publicationDate') && (
                <th className="min-w-[90px] cursor-pointer" onClick={() => handleSort('publicationDate')}>
                  <div className="flex items-center gap-1">Date<SortIcon colId="publicationDate" /></div>
                </th>
              )}

              {orderedVisibleLibraryCols.map((col) => (
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
                    onClick={() =>
                      addColumn(library.id, {
                        name: 'New Column',
                        description: '',
                        type: 'text',
                        isFilter: false,
                        aiPrompt: '',
                      })
                    }
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
                  colSpan={8 + orderedVisibleLibraryCols.length}
                  className="text-center py-12 text-sm text-muted-foreground"
                >
                  {library.articles.length === 0
                    ? 'No articles yet. Upload an Excel file to get started.'
                    : 'No articles match the current filters.'}
                </td>
              </tr>
            ) : (
              pageArticles.map((article) => (
                <tr
                  key={article.id}
                  className={cn('transition-colors', selectedIds.has(article.id) && 'bg-accent-muted')}
                >
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedIds.has(article.id)}
                      onChange={() => toggleSelect(article.id)}
                      className="rounded border-border accent-accent"
                    />
                  </td>
                  {!hiddenCols.has('articleNumber') && (
                    <td className="text-xs text-muted-foreground">{article.articleNumber}</td>
                  )}
                  {!hiddenCols.has('pmid') && (
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
                  )}
                  {!hiddenCols.has('title') && (
                    <td className="max-w-xs">
                      <p
                        className="text-xs text-foreground leading-snug cursor-pointer hover:text-accent transition-colors"
                        onClick={() =>
                          setExpandedAbstract(expandedAbstract === article.id ? null : article.id)
                        }
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
                  )}
                  {!hiddenCols.has('authors') && (
                    <td>
                      <p className="text-xs text-muted-foreground">{truncate(article.authors, 40)}</p>
                    </td>
                  )}
                  {!hiddenCols.has('journal') && (
                    <td>
                      <p className="text-xs text-foreground italic">{truncate(article.journal, 30)}</p>
                    </td>
                  )}
                  {!hiddenCols.has('publicationDate') && (
                    <td>
                      <p className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatDate(article.publicationDate, 'short')}
                      </p>
                    </td>
                  )}

                  {orderedVisibleLibraryCols.map((col) => {
                    const val = article[col.id];
                    return (
                      <td key={col.id}>
                        {col.type === 'number' ? (
                          <span className="text-xs font-mono text-foreground">{formatNumber(val)}</span>
                        ) : col.type === 'select' && val ? (
                          <Badge variant="neutral" size="sm">{val}</Badge>
                        ) : (
                          <p className="text-xs text-foreground leading-snug">
                            {truncate(String(val ?? ''), 60)}
                          </p>
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

      {/* ── Pagination ───────────────────────────────────────────────── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-2 border-t border-border bg-card text-xs text-muted-foreground">
          <span>
            Page {page + 1} of {totalPages}
          </span>
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page === totalPages - 1}
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      )}

      {/* ── Quick Actions Edit Dialog (Admin only) ───────────────────── */}
      <Dialog open={editingQuickActions} onOpenChange={setEditingQuickActions}>
        <DialogContent
          title="Edit Date Quick Filters"
          description="Customise the quick date filter buttons shown in the library toolbar."
          size="sm"
        >
          <div className="space-y-5">
            {localQA.map((action) => (
              <div key={action.id} className="space-y-2 p-3 border border-border rounded-lg">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Button Label</label>
                  <input
                    type="text"
                    value={action.label}
                    onChange={(e) => updateLocalQA(action.id, { label: e.target.value })}
                    className="w-full h-8 px-2 text-xs bg-card border border-border rounded focus:outline-none focus:ring-1 focus:ring-accent text-foreground"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs font-medium text-muted-foreground">Type</label>
                  <select
                    value={action.type}
                    onChange={(e) =>
                      updateLocalQA(action.id, { type: e.target.value as DateQuickAction['type'] })
                    }
                    className="h-7 px-2 text-xs bg-card border border-border rounded focus:outline-none focus:ring-1 focus:ring-accent text-foreground"
                  >
                    <option value="relative_months">Relative (last N months)</option>
                    <option value="since_date">Since specific date</option>
                  </select>
                </div>
                {action.type === 'relative_months' && (
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">
                      Number of months
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={120}
                      value={action.months ?? ''}
                      onChange={(e) =>
                        updateLocalQA(action.id, { months: Number(e.target.value) })
                      }
                      className="w-24 h-8 px-2 text-xs bg-card border border-border rounded focus:outline-none focus:ring-1 focus:ring-accent text-foreground"
                    />
                  </div>
                )}
                {action.type === 'since_date' && (
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">
                      GVD / reference date
                    </label>
                    <input
                      type="date"
                      value={action.date ?? ''}
                      onChange={(e) => updateLocalQA(action.id, { date: e.target.value || undefined })}
                      className="w-full h-8 px-2 text-xs bg-card border border-border rounded focus:outline-none focus:ring-1 focus:ring-accent text-foreground"
                    />
                    {!action.date && (
                      <p className="text-[11px] text-muted-foreground mt-1">
                        No date set — button will be disabled until a date is saved.
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="mt-5 flex justify-end gap-2">
            <DialogClose asChild>
              <Button variant="ghost" size="sm">Cancel</Button>
            </DialogClose>
            <Button variant="primary" size="sm" onClick={saveQuickActions}>
              Save
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
