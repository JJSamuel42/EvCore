'use client';

import React, { useState, useMemo } from 'react';
import {
  Plus,
  Save,
  TrendingDown,
  Trash2,
  Download,
  ChevronRight,
  MessageSquare,
  Settings2,
  GitCompare,
  X,
  Info,
} from 'lucide-react';
import { AuthGuard } from '@/components/layout/AuthGuard';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Dialog, DialogContent } from '@/components/ui/Dialog';
import { SectionLabel } from '@/components/ui/SectionLabel';
import { FunnelVisualization } from '@/components/patient-funnels/FunnelVisualization';
import { FunnelLevelModal } from '@/components/patient-funnels/FunnelLevelModal';
import { useFunnelStore, COUNTRIES } from '@/store/funnels';
import { useAuthStore } from '@/store/auth';
import { FunnelLevel, AgeDistribution } from '@/types';
import { cn, getRelativeTime, generateId, formatNumber } from '@/lib/utils';

// ── Types ────────────────────────────────────────────────────────────────────

type PopGroupKey = 'total' | keyof AgeDistribution;

const POP_GROUPS: { value: PopGroupKey; label: string }[] = [
  { value: 'total',            label: 'Total Population' },
  { value: 'adults18plus',     label: 'Adults (18+ years)' },
  { value: 'pediatricUnder18', label: 'Pediatric (Under 18 years)' },
  { value: 'pediatric0to12',   label: 'Pediatric (0–12 years)' },
  { value: 'elderly50plus',    label: 'Elderly (50+ years)' },
  { value: 'elderly60plus',    label: 'Elderly (60+ years)' },
  { value: 'elderly65plus',    label: 'Elderly (65+ years)' },
];

const POP_GROUP_LABELS: Record<PopGroupKey, string> = {
  total:            'Total Population',
  adults18plus:     'Adults (18+ years)',
  pediatricUnder18: 'Under 18 years',
  pediatric0to12:   '0–12 years (Pediatric)',
  elderly50plus:    'Elderly (50+ years)',
  elderly60plus:    'Elderly (60+ years)',
  elderly65plus:    'Elderly (65+ years)',
};

function getStartingPop(countryCode: string, group: PopGroupKey): { value: number | undefined; name: string } {
  const c = COUNTRIES.find((x) => x.code === countryCode);
  if (!c) return { value: undefined, name: POP_GROUP_LABELS[group] };
  const value = group === 'total' ? c.population : c.ageDistribution[group as keyof AgeDistribution];
  return { value, name: POP_GROUP_LABELS[group] };
}

const COUNTRY_OPTIONS = COUNTRIES.map((c) => ({ value: c.code, label: `${c.flag} ${c.name}` }));
const POP_GROUP_OPTIONS = POP_GROUPS.map((g) => ({ value: g.value, label: g.label }));

// ── Page ─────────────────────────────────────────────────────────────────────

export default function PatientFunnelsPage() {
  const {
    funnels,
    activeFunnelId,
    setActiveFunnel,
    createFunnel,
    updateFunnel,
    deleteFunnel,
    addLevel,
    updateLevel,
    addArticleToLevel,
    updateArticleInLevel,
    removeArticleFromLevel,
  } = useFunnelStore();

  const { user } = useAuthStore();
  const canEdit = user?.role === 'admin' || user?.role === 'researcher';

  const activeFunnel = funnels.find((f) => f.id === activeFunnelId) || null;

  // ── UI state ─────────────────────────────────────────────────────────────
  const [adminMode, setAdminMode]           = useState(false);
  const [compareFunnelId, setCompareFunnelId] = useState<string | null>(null);
  const compareFunnel = compareFunnelId ? funnels.find((f) => f.id === compareFunnelId) || null : null;

  const [showNewFunnelModal, setShowNewFunnelModal] = useState(false);
  const [activeLevelModal, setActiveLevelModal]     = useState<FunnelLevel | null>(null);
  const [levelModalFunnelId, setLevelModalFunnelId] = useState<string | null>(null);

  // Saved-funnel filters
  const [filterCountry, setFilterCountry]       = useState('');
  const [filterIndication, setFilterIndication] = useState('');

  // ── New funnel form ───────────────────────────────────────────────────────
  const [newFunnelName,    setNewFunnelName]    = useState('');
  const [newFunnelCountry, setNewFunnelCountry] = useState('US');
  const [newFunnelGroup,   setNewFunnelGroup]   = useState<PopGroupKey>('total');
  const [newFunnelIndication, setNewFunnelIndication] = useState('');
  const [newFunnelDesc,    setNewFunnelDesc]    = useState('');
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'ai' | 'user'; content: string }>>([
    { role: 'ai', content: "Hello! I'll help you set up a new patient funnel. What product and indication would you like to model?" },
  ]);
  const [chatInput, setChatInput] = useState('');

  const handleChatSend = () => {
    if (!chatInput.trim()) return;
    const userMsg = chatInput.trim();
    setChatMessages((prev) => [...prev, { role: 'user', content: userMsg }]);
    setChatInput('');
    setTimeout(() => {
      const responses = [
        "Great! And what country or region would you like to model?",
        "Perfect. Can you describe the key patient journey steps?",
        "Excellent! I've noted the levels. Fill in the form details and create the funnel.",
        "Your funnel is ready to be created. Click 'Create Funnel' when you're ready!",
      ];
      const reply = responses[Math.min(chatMessages.length - 1, responses.length - 1)];
      setChatMessages((prev) => [...prev, { role: 'ai', content: reply }]);
    }, 800);
  };

  const handleCreateFunnel = () => {
    if (!newFunnelName.trim()) return;
    const { value: startPop, name: levelName } = getStartingPop(newFunnelCountry, newFunnelGroup);
    const country = COUNTRIES.find((c) => c.code === newFunnelCountry);
    const funnel = createFunnel({
      name: newFunnelName,
      country: newFunnelCountry,
      indication: newFunnelIndication,
      description: newFunnelDesc,
      levels: [
        {
          id: `level-${generateId()}`,
          name: levelName,
          description: country
            ? `${levelName} — ${country.name} (Source: ${country.dataSource})`
            : levelName,
          percentage: 100,
          value: startPop,
          linkedArticles: [],
        },
      ],
    });
    setActiveFunnel(funnel.id);
    setShowNewFunnelModal(false);
    setNewFunnelName(''); setNewFunnelIndication(''); setNewFunnelDesc('');
    setChatMessages([{ role: 'ai', content: "Hello! I'll help you set up a new patient funnel. What product and indication would you like to model?" }]);
  };

  const handleAddLevel = () => {
    if (!activeFunnel) return;
    addLevel(activeFunnel.id, { name: 'New Level', description: '', percentage: 0, linkedArticles: [] });
  };

  const openLevelModal = (funnelId: string, level: FunnelLevel) => {
    setActiveLevelModal(level);
    setLevelModalFunnelId(funnelId);
  };

  const countryData = (code: string) => COUNTRIES.find((c) => c.code === code);

  // ── Filtered saved funnels ────────────────────────────────────────────────
  const filteredFunnels = useMemo(() => {
    return funnels.filter((f) => {
      if (filterCountry && f.country !== filterCountry) return false;
      if (filterIndication && !f.indication.toLowerCase().includes(filterIndication.toLowerCase())) return false;
      return true;
    });
  }, [funnels, filterCountry, filterIndication]);

  const uniqueIndications = useMemo(
    () => Array.from(new Set(funnels.map((f) => f.indication).filter(Boolean))).sort(),
    [funnels]
  );

  // ── Funnel panel renderer (shared between primary and compare) ────────────
  const FunnelPanel = ({
    funnel,
    isPrimary,
  }: {
    funnel: NonNullable<typeof activeFunnel>;
    isPrimary: boolean;
  }) => {
    const cd = countryData(funnel.country);
    return (
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-start justify-between px-5 pt-4 pb-3 border-b border-border shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl">{cd?.flag}</span>
              <h2 className="font-serif text-lg font-semibold leading-tight">{funnel.name}</h2>
              {!isPrimary && (
                <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                  Comparison
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {funnel.indication && (
                <span className="text-[11px] font-mono uppercase tracking-wider text-accent px-2 py-0.5 bg-accent-muted rounded border border-accent/10">
                  {funnel.indication}
                </span>
              )}
              <span className="text-xs text-muted-foreground">{cd?.name}</span>
              <span className="text-xs text-muted-foreground">· {funnel.levels.length} levels</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {isPrimary ? (
              <>
                <Button size="sm" variant="ghost" leftIcon={<Download className="w-3.5 h-3.5" />}>Export</Button>
                {canEdit && (
                  <Button
                    size="sm"
                    variant={adminMode ? 'primary' : 'secondary'}
                    leftIcon={<Settings2 className="w-3.5 h-3.5" />}
                    onClick={() => setAdminMode((p) => !p)}
                  >
                    {adminMode ? 'Exit Admin' : 'Admin Mode'}
                  </Button>
                )}
                {adminMode && (
                  <>
                    <Button size="sm" variant="secondary" leftIcon={<Plus className="w-3.5 h-3.5" />} onClick={handleAddLevel}>Add Level</Button>
                    <Button size="sm" variant="primary" leftIcon={<Save className="w-3.5 h-3.5" />} onClick={() => updateFunnel(funnel.id, {})}>Save</Button>
                  </>
                )}
              </>
            ) : (
              <button
                onClick={() => setCompareFunnelId(null)}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-exclude transition-colors px-2 py-1 rounded hover:bg-muted"
              >
                <X className="w-3.5 h-3.5" /> Close
              </button>
            )}
          </div>
        </div>

        {/* Admin banner (primary only) */}
        {isPrimary && adminMode && (
          <div className="px-5 py-1.5 bg-accent-muted border-b border-accent/20 shrink-0">
            <p className="text-[11px] text-accent font-mono">Admin mode — click any level to edit values and linked publications</p>
          </div>
        )}

        {/* Funnel viz */}
        <div className="flex-1 overflow-auto px-4 py-3">
          <FunnelVisualization
            funnel={funnel}
            onLevelClick={(level) => openLevelModal(funnel.id, level)}
            adminMode={isPrimary && adminMode}
          />
          <p className="text-center text-xs text-muted-foreground mt-2">
            {isPrimary && adminMode ? 'Click any level to edit' : 'Click any level to view'}
          </p>
        </div>
      </div>
    );
  };

  // ── Country population info card (shown in create modal) ─────────────────
  const selectedCountry = COUNTRIES.find((c) => c.code === newFunnelCountry);
  const previewPop = newFunnelGroup === 'total'
    ? selectedCountry?.population
    : selectedCountry?.ageDistribution[newFunnelGroup as keyof AgeDistribution];

  return (
    <AuthGuard>
      <AppShell>
        <div className="flex flex-col h-full overflow-hidden">

          {/* ── Top: Funnel Workspace ──────────────────────────────────── */}
          <div className="flex-1 border-b border-border overflow-hidden">
            {!activeFunnel ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-16 px-4">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <TrendingDown className="w-7 h-7 text-muted-foreground" />
                </div>
                <h3 className="font-serif text-xl text-foreground mb-2">No Funnel Selected</h3>
                <p className="text-sm text-muted-foreground mb-6 max-w-sm">
                  Select an existing funnel from the list below or create a new one to start modelling patient pathways.
                </p>
                <Button variant="primary" leftIcon={<MessageSquare className="w-4 h-4" />} onClick={() => setShowNewFunnelModal(true)}>
                  New Funnel
                </Button>
              </div>
            ) : (
              <div className={cn('h-full', compareFunnel ? 'grid grid-cols-2 divide-x divide-border' : '')}>
                {/* Primary funnel */}
                <div className="overflow-auto">
                  <FunnelPanel funnel={activeFunnel} isPrimary={true} />
                </div>

                {/* Comparison funnel */}
                {compareFunnel && (
                  <div className="overflow-auto">
                    <FunnelPanel funnel={compareFunnel} isPrimary={false} />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Bottom: Saved Funnels ──────────────────────────────────── */}
          <div className="h-72 overflow-auto bg-card shrink-0">
            {/* Header + filters */}
            <div className="px-5 py-2.5 border-b border-border flex items-center gap-3 flex-wrap sticky top-0 bg-card z-10">
              <div className="flex items-center gap-2">
                <h3 className="font-serif text-sm font-semibold text-foreground">Saved Funnels</h3>
                <span className="text-xs text-muted-foreground">({filteredFunnels.length}{filteredFunnels.length !== funnels.length && `/${funnels.length}`})</span>
              </div>

              {/* Country filter */}
              <select
                value={filterCountry}
                onChange={(e) => setFilterCountry(e.target.value)}
                className={cn(
                  'h-6 px-2 text-xs bg-card border border-border rounded focus:outline-none focus:ring-1 focus:ring-accent',
                  filterCountry ? 'border-accent/50 text-accent' : 'text-muted-foreground'
                )}
              >
                <option value="">All Countries</option>
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>{c.flag} {c.name}</option>
                ))}
              </select>

              {/* Indication filter */}
              <select
                value={filterIndication}
                onChange={(e) => setFilterIndication(e.target.value)}
                className={cn(
                  'h-6 px-2 text-xs bg-card border border-border rounded focus:outline-none focus:ring-1 focus:ring-accent',
                  filterIndication ? 'border-accent/50 text-accent' : 'text-muted-foreground'
                )}
              >
                <option value="">All Indications</option>
                {uniqueIndications.map((ind) => (
                  <option key={ind} value={ind}>{ind}</option>
                ))}
              </select>

              {(filterCountry || filterIndication) && (
                <button
                  onClick={() => { setFilterCountry(''); setFilterIndication(''); }}
                  className="h-6 px-2 text-[11px] text-exclude hover:bg-exclude-bg rounded transition-colors flex items-center gap-1"
                >
                  <X className="w-3 h-3" /> Clear
                </button>
              )}

              <div className="ml-auto">
                <Button size="sm" variant="secondary" leftIcon={<Plus className="w-3.5 h-3.5" />} onClick={() => setShowNewFunnelModal(true)}>
                  New Funnel
                </Button>
              </div>
            </div>

            {filteredFunnels.length === 0 ? (
              <div className="flex items-center justify-center h-28 text-sm text-muted-foreground">
                {funnels.length === 0 ? 'No funnels saved yet.' : 'No funnels match the current filters.'}
              </div>
            ) : (
              <table className="data-table min-w-full">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Country</th>
                    <th>Indication</th>
                    <th>Levels</th>
                    <th>Last Saved</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFunnels.map((funnel) => {
                    const cd = countryData(funnel.country);
                    const isActive  = funnel.id === activeFunnelId;
                    const isCompare = funnel.id === compareFunnelId;
                    return (
                      <tr key={funnel.id} className={cn(isActive && 'bg-accent-muted', isCompare && 'bg-muted')}>
                        <td>
                          <button
                            onClick={() => setActiveFunnel(funnel.id)}
                            className={cn('text-xs font-medium text-left hover:text-accent transition-colors', isActive ? 'text-accent' : 'text-foreground')}
                          >
                            {funnel.name}
                          </button>
                        </td>
                        <td><span className="text-xs text-foreground">{cd?.flag} {cd?.name}</span></td>
                        <td><span className="text-xs text-muted-foreground">{funnel.indication}</span></td>
                        <td><span className="text-xs text-muted-foreground">{funnel.levels.length}</span></td>
                        <td><span className="text-xs text-muted-foreground">{getRelativeTime(funnel.updatedAt)}</span></td>
                        <td>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setActiveFunnel(funnel.id)}
                              className="text-xs text-accent hover:text-accent/80 flex items-center gap-0.5"
                            >
                              Open <ChevronRight className="w-3 h-3" />
                            </button>
                            {/* Compare — only when a primary funnel is selected and this isn't it */}
                            {activeFunnel && funnel.id !== activeFunnelId && (
                              <button
                                onClick={() => setCompareFunnelId(isCompare ? null : funnel.id)}
                                className={cn(
                                  'text-xs flex items-center gap-0.5 transition-colors',
                                  isCompare ? 'text-exclude hover:text-exclude/80' : 'text-muted-foreground hover:text-foreground'
                                )}
                                title={isCompare ? 'Remove comparison' : 'Compare side-by-side'}
                              >
                                <GitCompare className="w-3.5 h-3.5" />
                                {isCompare ? 'Remove' : 'Compare'}
                              </button>
                            )}
                            {canEdit && adminMode && (
                              <button
                                onClick={() => {
                                  if (confirm('Delete this funnel?')) {
                                    if (activeFunnelId === funnel.id) setActiveFunnel(null);
                                    if (compareFunnelId === funnel.id) setCompareFunnelId(null);
                                    deleteFunnel(funnel.id);
                                  }
                                }}
                                className="text-muted-foreground hover:text-exclude transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* ── New Funnel Modal ─────────────────────────────────────────── */}
        <Dialog open={showNewFunnelModal} onOpenChange={(o) => !o && setShowNewFunnelModal(false)}>
          <DialogContent size="lg" title="Create New Patient Funnel">
            <div className="space-y-4">
              {/* Chat */}
              <div className="bg-muted rounded-md p-3 space-y-2 max-h-36 overflow-y-auto">
                {chatMessages.map((msg, idx) => (
                  <div key={idx} className={cn('text-xs rounded-md px-3 py-2 max-w-[85%]', msg.role === 'ai' ? 'bg-card border border-border text-foreground' : 'bg-accent text-white ml-auto')}>
                    {msg.content}
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleChatSend()}
                  placeholder="Describe your funnel..."
                  className="flex-1 h-8 px-3 text-xs bg-card border border-border rounded focus:outline-none focus:ring-2 focus:ring-accent"
                />
                <Button size="sm" variant="primary" onClick={handleChatSend}>Send</Button>
              </div>

              {/* Form */}
              <div className="border-t border-border pt-4 space-y-3">
                <p className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">Funnel Details</p>
                <div className="grid grid-cols-2 gap-3">
                  <Input label="Funnel Name" value={newFunnelName} onChange={(e) => setNewFunnelName(e.target.value)} placeholder="e.g. AD Biologic-Eligible Patients" required />
                  <Select label="Country" value={newFunnelCountry} onValueChange={setNewFunnelCountry} options={COUNTRY_OPTIONS} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Input label="Indication" value={newFunnelIndication} onChange={(e) => setNewFunnelIndication(e.target.value)} placeholder="e.g. Atopic Dermatitis" />
                  <Select label="Starting Population Group" value={newFunnelGroup} onValueChange={(v) => setNewFunnelGroup(v as PopGroupKey)} options={POP_GROUP_OPTIONS} />
                </div>

                {/* Population preview */}
                {selectedCountry && (
                  <div className="rounded-lg border border-border bg-muted p-3 space-y-2">
                    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-mono uppercase tracking-wider">
                      <Info className="w-3 h-3" />
                      {selectedCountry.flag} {selectedCountry.name} — {selectedCountry.dataSource} ({selectedCountry.dataYear})
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {POP_GROUPS.map((g) => {
                        const pop = g.value === 'total' ? selectedCountry.population : selectedCountry.ageDistribution[g.value as keyof AgeDistribution];
                        const isSelected = newFunnelGroup === g.value;
                        return (
                          <button
                            key={g.value}
                            type="button"
                            onClick={() => setNewFunnelGroup(g.value)}
                            className={cn(
                              'text-left p-2 rounded border text-xs transition-colors',
                              isSelected ? 'border-accent bg-accent-muted' : 'border-border hover:border-accent/40'
                            )}
                          >
                            <p className={cn('font-semibold font-mono', isSelected ? 'text-accent' : 'text-foreground')}>
                              {formatNumber(pop)}
                            </p>
                            <p className="text-muted-foreground mt-0.5 leading-snug">{g.label}</p>
                          </button>
                        );
                      })}
                    </div>
                    {previewPop !== undefined && (
                      <p className="text-[11px] text-muted-foreground">
                        First funnel level will be initialised with <span className="font-semibold text-foreground">{formatNumber(previewPop)}</span> ({newFunnelGroup === 'total' ? 'Total Population' : POP_GROUP_LABELS[newFunnelGroup]}).
                      </p>
                    )}
                  </div>
                )}

                <Textarea label="Description (Optional)" value={newFunnelDesc} onChange={(e) => setNewFunnelDesc(e.target.value)} rows={2} />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setShowNewFunnelModal(false)}>Cancel</Button>
                <Button variant="primary" onClick={handleCreateFunnel} disabled={!newFunnelName.trim()}>Create Funnel</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* ── Level modal (shared for primary + compare) ───────────────── */}
        {levelModalFunnelId && (
          <FunnelLevelModal
            level={activeLevelModal}
            funnelId={levelModalFunnelId}
            open={!!activeLevelModal}
            adminMode={adminMode && levelModalFunnelId === activeFunnelId}
            onClose={() => { setActiveLevelModal(null); setLevelModalFunnelId(null); }}
            onUpdateLevel={(levelId, data) => updateLevel(levelModalFunnelId, levelId, data)}
            onUpdateArticle={(levelId, articleId, data) => updateArticleInLevel(levelModalFunnelId, levelId, articleId, data)}
            onRemoveArticle={(levelId, articleId) => removeArticleFromLevel(levelModalFunnelId, levelId, articleId)}
            onAddArticle={(levelId, article) => addArticleToLevel(levelModalFunnelId, levelId, article)}
          />
        )}
      </AppShell>
    </AuthGuard>
  );
}
