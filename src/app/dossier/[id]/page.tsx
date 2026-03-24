'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ChevronRight,
  ChevronDown,
  Plus,
  Trash2,
  ChevronUp,
  Sparkles,
  Save,
  Clock,
  X,
  Edit3,
  FileText,
  Table,
  Image,
  AlertCircle,
  Loader2,
  Copy,
  Check,
  BookOpen,
  Calendar,
  ArrowUpRight,
} from 'lucide-react';
import { AuthGuard } from '@/components/layout/AuthGuard';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardBody } from '@/components/ui/Card';
import { Dialog, DialogContent } from '@/components/ui/Dialog';
import { AbstractModal } from '@/components/dossier/AbstractModal';
import { useDossierStore } from '@/store/dossier';
import { useLibraryStore } from '@/store/libraries';
import { DossierSection, DossierGenerateType, LibraryArticle } from '@/types';
import { cn, formatDate } from '@/lib/utils';

// ─── Outline Panel ───────────────────────────────────────────────────────────

interface OutlinePanelProps {
  sections: DossierSection[];
  activeSectionId: string | null;
  onSelect: (id: string) => void;
  onAdd: (parentId: string | null) => void;
  onDelete: (id: string) => void;
  onMove: (id: string, dir: 'up' | 'down') => void;
}

function OutlinePanel({
  sections,
  activeSectionId,
  onSelect,
  onAdd,
  onDelete,
  onMove,
}: OutlinePanelProps) {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const toggle = (id: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const renderSection = (sec: DossierSection, siblings: DossierSection[], idx: number) => {
    const children = sections
      .filter((s) => s.parentId === sec.id)
      .sort((a, b) => a.order - b.order);
    const isCollapsed = collapsed.has(sec.id);
    const isActive = activeSectionId === sec.id;
    const hasChildren = children.length > 0;

    const indentClass =
      sec.level === 1
        ? 'pl-2'
        : sec.level === 2
        ? 'pl-6'
        : sec.level === 3
        ? 'pl-10'
        : 'pl-14';

    return (
      <div key={sec.id}>
        <div
          className={cn(
            'group flex items-center gap-1 py-1 pr-1 rounded-md cursor-pointer transition-colors text-sm',
            indentClass,
            isActive
              ? 'bg-accent-muted text-accent'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          )}
          onClick={() => onSelect(sec.id)}
        >
          {/* Collapse toggle */}
          <button
            className={cn(
              'w-4 h-4 shrink-0 flex items-center justify-center rounded transition-colors',
              'hover:bg-border',
              !hasChildren && 'invisible'
            )}
            onClick={(e) => {
              e.stopPropagation();
              toggle(sec.id);
            }}
          >
            {isCollapsed ? (
              <ChevronRight className="w-3 h-3" />
            ) : (
              <ChevronDown className="w-3 h-3" />
            )}
          </button>

          {/* Outline number */}
          <span
            className={cn(
              'font-mono text-[10px] shrink-0 w-8',
              isActive ? 'text-accent' : 'text-muted-foreground/50'
            )}
          >
            {sec.outlineNumber}
          </span>

          {/* Title */}
          <span
            className={cn(
              'flex-1 truncate leading-tight',
              sec.level === 1 ? 'font-semibold font-serif text-[13px]' : 'text-xs'
            )}
            title={sec.title}
          >
            {sec.title}
          </span>

          {/* Actions (show on hover or active) */}
          <div
            className={cn(
              'flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity',
              isActive && 'opacity-100'
            )}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              title="Move up"
              disabled={idx === 0}
              onClick={() => onMove(sec.id, 'up')}
              className="p-0.5 rounded hover:bg-border disabled:opacity-20 transition-colors"
            >
              <ChevronUp className="w-3 h-3" />
            </button>
            <button
              title="Move down"
              disabled={idx === siblings.length - 1}
              onClick={() => onMove(sec.id, 'down')}
              className="p-0.5 rounded hover:bg-border disabled:opacity-20 transition-colors"
            >
              <ChevronDown className="w-3 h-3" />
            </button>
            {sec.level < 4 && (
              <button
                title="Add sub-section"
                onClick={() => onAdd(sec.id)}
                className="p-0.5 rounded hover:bg-border transition-colors"
              >
                <Plus className="w-3 h-3" />
              </button>
            )}
            <button
              title="Delete section"
              onClick={() => onDelete(sec.id)}
              className="p-0.5 rounded hover:bg-exclude-bg hover:text-exclude transition-colors"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        </div>

        {!isCollapsed && hasChildren && (
          <div>
            {children.map((child, ci) =>
              renderSection(child, children, ci)
            )}
          </div>
        )}
      </div>
    );
  };

  const topLevel = sections
    .filter((s) => s.parentId === null)
    .sort((a, b) => a.order - b.order);

  return (
    <div className="flex flex-col h-full">
      <div className="px-3 py-3 border-b border-border flex items-center justify-between">
        <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
          Contents
        </span>
        <button
          onClick={() => onAdd(null)}
          className="flex items-center gap-1 text-[10px] font-mono text-muted-foreground hover:text-accent transition-colors"
          title="Add top-level section"
        >
          <Plus className="w-3 h-3" />
          Section
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-1 py-2 space-y-0.5">
        {topLevel.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-xs text-muted-foreground">No sections yet.</p>
            <button
              onClick={() => onAdd(null)}
              className="mt-2 text-xs text-accent hover:underline"
            >
              Add first section
            </button>
          </div>
        ) : (
          topLevel.map((sec, i) => renderSection(sec, topLevel, i))
        )}
      </div>
    </div>
  );
}

// ─── Add Section Modal ────────────────────────────────────────────────────────

interface AddSectionModalProps {
  open: boolean;
  parentId: string | null;
  sections: DossierSection[];
  onConfirm: (title: string, parentId: string | null) => void;
  onClose: () => void;
}

function AddSectionModal({ open, parentId, sections, onConfirm, onClose }: AddSectionModalProps) {
  const [title, setTitle] = useState('');
  const parent = sections.find((s) => s.id === parentId);

  const handleConfirm = () => {
    if (!title.trim()) return;
    onConfirm(title.trim(), parentId);
    setTitle('');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        size="sm"
        title={parent ? `Add sub-section under ${parent.outlineNumber} ${parent.title}` : 'Add top-level section'}
        showClose
      >
        <div className="space-y-4">
          <Input
            label="Section Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Epidemiology and Disease Burden"
            autoFocus
            onKeyDown={(e) => e.key === 'Enter' && handleConfirm()}
          />
          <div className="flex justify-end gap-3">
            <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
            <Button variant="primary" size="sm" onClick={handleConfirm} disabled={!title.trim()}>
              Add Section
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Section Editor ───────────────────────────────────────────────────────────

interface SectionEditorProps {
  dossierId: string;
  section: DossierSection;
  articles: LibraryArticle[];
  onAbstractOpen: (article: LibraryArticle) => void;
}

function SectionEditor({ dossierId, section, articles, onAbstractOpen }: SectionEditorProps) {
  const {
    dossiers,
    updateSection,
    setSectionContent,
    setSectionPrompt,
    saveVersion,
    generateContent,
  } = useDossierStore();

  const dossier = dossiers.find((d) => d.id === dossierId)!;
  const content = dossier?.sectionContents[section.id];
  const draft = content?.currentDraft ?? '';
  const currentType = content?.currentType ?? 'text';
  const isGenerating = content?.isGenerating ?? false;
  const aiReasoning = content?.aiReasoning ?? '';
  const extractedData = content?.extractedData ?? '';
  const versions = content?.versions ?? [];
  const additionalPrompt = content?.additionalPrompt ?? '';

  const [activeTab, setActiveTab] = useState<'draft' | 'reasoning'>('draft');
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleVal, setTitleVal] = useState(section.title);
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesVal, setNotesVal] = useState<string[]>(section.guidanceNotes);
  const [generateType, setGenerateType] = useState<DossierGenerateType>('text');
  const [showVersions, setShowVersions] = useState(false);
  const [copied, setCopied] = useState(false);

  // Tagged articles for this section
  const tagged = articles.filter((a) => {
    const ds: string[] = a.dossierSections ?? [];
    return ds.includes(section.outlineNumber);
  });

  const handleGenerate = () => {
    generateContent(dossierId, section.id, generateType, tagged);
    setActiveTab('draft');
  };

  const handleSaveVersion = () => {
    saveVersion(dossierId, section.id);
  };

  const handleCopy = async () => {
    const textToCopy = draft.replace(/\[REF:[^\]]+\]/g, '').trim();
    await navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRestoreVersion = (vContent: string, vType: DossierGenerateType) => {
    setSectionContent(dossierId, section.id, vContent, vType);
    setShowVersions(false);
  };

  const handleTitleSave = () => {
    updateSection(dossierId, section.id, { title: titleVal });
    setEditingTitle(false);
  };

  const handleNotesSave = () => {
    updateSection(dossierId, section.id, { guidanceNotes: notesVal.filter((n) => n.trim()) });
    setEditingNotes(false);
  };

  const handleNoteChange = (idx: number, val: string) => {
    setNotesVal((prev) => prev.map((n, i) => (i === idx ? val : n)));
  };

  const handleNoteKeyDown = (e: React.KeyboardEvent, idx: number) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      setNotesVal((prev) => [...prev.slice(0, idx + 1), '', ...prev.slice(idx + 1)]);
    }
    if (e.key === 'Backspace' && notesVal[idx] === '' && notesVal.length > 1) {
      e.preventDefault();
      setNotesVal((prev) => prev.filter((_, i) => i !== idx));
    }
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Section header */}
      <div className="px-6 py-4 border-b border-border bg-card">
        <div className="flex items-start gap-3">
          <span className="font-mono text-sm text-muted-foreground/60 mt-0.5 shrink-0">
            {section.outlineNumber}
          </span>
          {editingTitle ? (
            <div className="flex-1 flex items-center gap-2">
              <input
                className="flex-1 font-serif text-xl font-semibold text-foreground bg-transparent border-b-2 border-accent outline-none"
                value={titleVal}
                onChange={(e) => setTitleVal(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleTitleSave()}
                autoFocus
              />
              <button onClick={handleTitleSave} className="text-xs text-accent hover:underline">Save</button>
              <button onClick={() => { setTitleVal(section.title); setEditingTitle(false); }} className="text-xs text-muted-foreground hover:underline">Cancel</button>
            </div>
          ) : (
            <div className="flex-1 flex items-center gap-2 group">
              <h2 className="font-serif text-xl font-semibold text-foreground leading-tight">
                {section.title}
              </h2>
              <button
                onClick={() => { setTitleVal(section.title); setEditingTitle(true); }}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-muted text-muted-foreground"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 px-6 py-5 space-y-6">
        {/* Guidance Notes */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
              Guidance Notes
            </p>
            {!editingNotes ? (
              <button
                onClick={() => { setNotesVal([...section.guidanceNotes, '']); setEditingNotes(true); }}
                className="flex items-center gap-1 text-[10px] font-mono text-muted-foreground hover:text-accent transition-colors"
              >
                <Edit3 className="w-3 h-3" />
                Edit
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button onClick={handleNotesSave} className="text-[10px] font-mono text-accent hover:underline">Save</button>
                <button onClick={() => setEditingNotes(false)} className="text-[10px] font-mono text-muted-foreground hover:underline">Cancel</button>
              </div>
            )}
          </div>

          {editingNotes ? (
            <div className="space-y-1 bg-muted/30 rounded-lg p-3 border border-border">
              {notesVal.map((note, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <span className="text-accent mt-2 shrink-0">•</span>
                  <textarea
                    className="flex-1 text-sm bg-transparent outline-none resize-none text-foreground placeholder:text-muted-foreground/40 leading-relaxed"
                    value={note}
                    onChange={(e) => handleNoteChange(idx, e.target.value)}
                    onKeyDown={(e) => handleNoteKeyDown(e, idx)}
                    placeholder="Guidance note..."
                    rows={1}
                    autoFocus={idx === notesVal.length - 1 && note === ''}
                  />
                </div>
              ))}
              <button
                onClick={() => setNotesVal((prev) => [...prev, ''])}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-accent transition-colors mt-1 ml-5"
              >
                <Plus className="w-3 h-3" />
                Add note
              </button>
            </div>
          ) : section.guidanceNotes.length > 0 ? (
            <ul className="space-y-1.5">
              {section.guidanceNotes.map((note, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <span className="text-accent shrink-0 mt-0.5">•</span>
                  <span className="leading-relaxed">{note}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-muted-foreground/50 italic">
              No guidance notes. Click Edit to add bullet points for writers.
            </p>
          )}
        </div>

        {/* Tagged References */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
              Tagged References
            </p>
            <span className="text-[10px] font-mono bg-muted text-muted-foreground px-1.5 py-0.5 rounded">
              {tagged.length}
            </span>
          </div>

          {tagged.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border bg-muted/20 px-4 py-3 text-center">
              <p className="text-xs text-muted-foreground/60">
                No publications tagged to section{' '}
                <span className="font-mono">{section.outlineNumber}</span>.
                Tag articles in the linked library.
              </p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {tagged.map((art, i) => (
                <div
                  key={art.id}
                  className="flex items-start gap-3 px-3 py-2.5 rounded-lg border border-border bg-card hover:border-accent/30 hover:bg-muted/30 transition-colors"
                >
                  <span className="font-mono text-[10px] text-muted-foreground/50 mt-0.5 shrink-0 w-5 text-right">
                    [{i + 1}]
                  </span>
                  <div className="flex-1 min-w-0">
                    <button
                      className="text-sm font-medium text-foreground hover:text-accent text-left leading-snug transition-colors"
                      onClick={() => onAbstractOpen(art)}
                    >
                      {art.title}
                    </button>
                    <div className="flex items-center gap-2 mt-0.5 text-[10px] text-muted-foreground">
                      <span className="truncate">{art.authors.split(',')[0]} et al.</span>
                      <span>·</span>
                      <span className="italic truncate">{art.journal}</span>
                      <span>·</span>
                      <span className="flex items-center gap-0.5">
                        <Calendar className="w-2.5 h-2.5" />
                        {art.publicationDate?.slice(0, 4) ?? 'n.d.'}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => onAbstractOpen(art)}
                    title="View abstract"
                    className="shrink-0 p-1 rounded text-muted-foreground/40 hover:text-accent hover:bg-muted transition-colors"
                  >
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Generate Controls */}
        <div className="rounded-lg border border-border bg-card p-4 space-y-3">
          <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1">
            Generate Content
          </p>

          {/* Type selector */}
          <div className="flex items-center gap-2">
            {(
              [
                { type: 'text', icon: <FileText className="w-3.5 h-3.5" />, label: 'Text' },
                { type: 'table', icon: <Table className="w-3.5 h-3.5" />, label: 'Table' },
                { type: 'visual', icon: <Image className="w-3.5 h-3.5" />, label: 'Visual' },
              ] as { type: DossierGenerateType; icon: React.ReactNode; label: string }[]
            ).map(({ type, icon, label }) => (
              <button
                key={type}
                onClick={() => setGenerateType(type)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border transition-colors',
                  generateType === type
                    ? 'bg-accent text-white border-accent'
                    : 'bg-transparent text-muted-foreground border-border hover:border-accent hover:text-accent'
                )}
              >
                {icon}
                {label}
              </button>
            ))}
          </div>

          {/* Additional prompt */}
          <textarea
            className="w-full text-sm bg-muted/30 border border-border rounded-md px-3 py-2 outline-none focus:ring-1 focus:ring-accent focus:border-accent resize-none text-foreground placeholder:text-muted-foreground/50 leading-relaxed"
            rows={2}
            placeholder="Optional: add direction for this iteration (e.g. 'Focus on paediatric subgroup data', 'Use more cautious language around p-values')…"
            value={additionalPrompt}
            onChange={(e) => setSectionPrompt(dossierId, section.id, e.target.value)}
          />

          <div className="flex items-center justify-between">
            {tagged.length === 0 && (
              <span className="flex items-center gap-1 text-xs text-amber-600">
                <AlertCircle className="w-3.5 h-3.5" />
                No references tagged — generation will use guidance notes only
              </span>
            )}
            <div className="ml-auto">
              <Button
                variant="primary"
                size="sm"
                leftIcon={isGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                onClick={handleGenerate}
                disabled={isGenerating}
              >
                {isGenerating ? 'Generating…' : 'Generate'}
              </Button>
            </div>
          </div>
        </div>

        {/* Draft / Reasoning Tabs */}
        {(draft || isGenerating) && (
          <div className="space-y-3">
            <div className="flex items-center gap-1 border-b border-border">
              {[
                { id: 'draft', label: 'Draft' },
                { id: 'reasoning', label: 'AI Reasoning & Data' },
              ].map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id as 'draft' | 'reasoning')}
                  className={cn(
                    'px-3 py-2 text-xs font-medium border-b-2 transition-colors -mb-px',
                    activeTab === id
                      ? 'border-accent text-accent'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  )}
                >
                  {label}
                </button>
              ))}
              {draft && (
                <div className="ml-auto flex items-center gap-2 pb-1">
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded hover:bg-muted"
                  >
                    {copied ? <Check className="w-3 h-3 text-include" /> : <Copy className="w-3 h-3" />}
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                  <Button
                    size="sm"
                    variant="secondary"
                    leftIcon={<Save className="w-3 h-3" />}
                    onClick={handleSaveVersion}
                    disabled={!draft}
                  >
                    Save Version
                  </Button>
                </div>
              )}
            </div>

            {activeTab === 'draft' ? (
              isGenerating ? (
                <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin text-accent" />
                  AI medical writer is reviewing references and drafting content…
                </div>
              ) : (
                <textarea
                  className="w-full text-sm font-sans bg-muted/20 border border-border rounded-lg px-4 py-3 outline-none focus:ring-1 focus:ring-accent focus:border-accent resize-none text-foreground leading-relaxed min-h-[240px]"
                  value={draft}
                  onChange={(e) => setSectionContent(dossierId, section.id, e.target.value, currentType)}
                  placeholder="Generated content will appear here…"
                />
              )
            ) : (
              <div className="space-y-4 text-sm">
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-2">
                    AI Reasoning
                  </p>
                  <pre className="whitespace-pre-wrap font-sans text-xs text-foreground/80 bg-muted/30 rounded-lg px-4 py-3 border border-border leading-relaxed">
                    {aiReasoning || 'Generate content to see AI reasoning.'}
                  </pre>
                </div>
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-2">
                    Extracted Data from Publications
                  </p>
                  <pre className="whitespace-pre-wrap font-sans text-xs text-foreground/80 bg-muted/30 rounded-lg px-4 py-3 border border-border leading-relaxed">
                    {extractedData || 'No data extracted yet.'}
                  </pre>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Version History */}
        {versions.length > 0 && (
          <div>
            <button
              onClick={() => setShowVersions((v) => !v)}
              className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors w-full"
            >
              <Clock className="w-3 h-3" />
              Saved Versions ({versions.length})
              {showVersions ? <ChevronDown className="w-3 h-3 ml-auto" /> : <ChevronRight className="w-3 h-3 ml-auto" />}
            </button>

            {showVersions && (
              <div className="mt-2 space-y-2">
                {versions.map((v, i) => (
                  <div
                    key={v.id}
                    className="rounded-lg border border-border bg-card p-3 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-[10px] font-mono text-muted-foreground">
                        <span className="bg-muted px-1.5 py-0.5 rounded">v{versions.length - i}</span>
                        <span>{formatDate(v.savedAt)}</span>
                        <span className="capitalize">{v.type}</span>
                      </div>
                      <button
                        onClick={() => handleRestoreVersion(v.content, v.type)}
                        className="text-xs text-accent hover:underline"
                      >
                        Restore
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                      {v.content.replace(/\[REF:[^\]]+\]/g, '').slice(0, 200)}…
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function DossierBuilderPage() {
  const params = useParams();
  const router = useRouter();
  const dossierId = params?.id as string;

  const { dossiers, addSection, deleteSection, moveSection } = useDossierStore();
  const { libraries } = useLibraryStore();

  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addParentId, setAddParentId] = useState<string | null>(null);
  const [abstractArticle, setAbstractArticle] = useState<LibraryArticle | null>(null);

  const dossier = dossiers.find((d) => d.id === dossierId);
  const library = dossier ? libraries.find((l) => l.id === dossier.libraryId) : null;
  const articles: LibraryArticle[] = library?.articles ?? [];

  // Auto-select first section
  useEffect(() => {
    if (dossier && !activeSectionId && dossier.sections.length > 0) {
      const first = [...dossier.sections]
        .filter((s) => s.parentId === null)
        .sort((a, b) => a.order - b.order)[0];
      if (first) setActiveSectionId(first.id);
    }
  }, [dossier?.id]);

  if (!dossier) {
    return (
      <AuthGuard>
        <AppShell>
          <div className="p-8 text-center text-muted-foreground">
            Dossier not found.{' '}
            <button onClick={() => router.push('/dossier')} className="text-accent hover:underline">
              Back to dossiers
            </button>
          </div>
        </AppShell>
      </AuthGuard>
    );
  }

  const activeSection = dossier.sections.find((s) => s.id === activeSectionId) ?? null;

  // Compute next outline number for a new section
  const computeOutlineNumber = (parentId: string | null): string => {
    const siblings = dossier.sections
      .filter((s) => s.parentId === parentId)
      .sort((a, b) => a.order - b.order);
    const parent = parentId ? dossier.sections.find((s) => s.id === parentId) : null;
    const base = parent ? parent.outlineNumber + '.' : '';
    return base + (siblings.length + 1);
  };

  const handleAddSection = (title: string, parentId: string | null) => {
    const parent = parentId ? dossier.sections.find((s) => s.id === parentId) : null;
    const siblings = dossier.sections.filter((s) => s.parentId === parentId);
    const maxOrder = siblings.reduce((max, s) => Math.max(max, s.order), -1);
    const outlineNumber = computeOutlineNumber(parentId);
    const sec = addSection(dossierId, {
      outlineNumber,
      title,
      level: parent ? parent.level + 1 : 1,
      parentId,
      guidanceNotes: [],
      order: maxOrder + 1,
    });
    setActiveSectionId(sec.id);
  };

  const handleDeleteSection = (id: string) => {
    if (activeSectionId === id) setActiveSectionId(null);
    deleteSection(dossierId, id);
  };

  return (
    <AuthGuard>
      <AppShell>
        <div className="flex flex-col h-full">
          {/* Top bar */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card shrink-0">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push('/dossier')}
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Dossiers</span>
              </button>
              <span className="text-border">/</span>
              <div>
                <p className="text-sm font-semibold text-foreground leading-tight truncate max-w-[300px] lg:max-w-[500px]">
                  {dossier.name}
                </p>
                {library && (
                  <p className="text-[10px] font-mono text-muted-foreground flex items-center gap-1">
                    <BookOpen className="w-2.5 h-2.5" />
                    {library.name} · {library.articles.length} articles
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => router.push(`/dossier/${dossierId}/compile`)}
              >
                Compiled View
              </Button>
            </div>
          </div>

          {/* Two-panel layout */}
          <div className="flex flex-1 overflow-hidden">
            {/* Left: Outline */}
            <aside className="w-56 shrink-0 border-r border-border bg-card overflow-hidden flex flex-col">
              <OutlinePanel
                sections={dossier.sections}
                activeSectionId={activeSectionId}
                onSelect={setActiveSectionId}
                onAdd={(parentId) => {
                  setAddParentId(parentId);
                  setAddModalOpen(true);
                }}
                onDelete={handleDeleteSection}
                onMove={(id, dir) => moveSection(dossierId, id, dir)}
              />
            </aside>

            {/* Right: Section Editor */}
            <main className="flex-1 overflow-hidden bg-background">
              {activeSection ? (
                <SectionEditor
                  dossierId={dossierId}
                  section={activeSection}
                  articles={articles}
                  onAbstractOpen={setAbstractArticle}
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center p-8">
                  <div className="w-14 h-14 rounded-full bg-muted border border-border flex items-center justify-center mb-4">
                    <FileText className="w-6 h-6 text-muted-foreground/30" />
                  </div>
                  <p className="font-serif text-lg text-muted-foreground mb-1">
                    Select a section to begin
                  </p>
                  <p className="text-sm text-muted-foreground/60 max-w-sm">
                    Choose a section from the outline to view guidance notes, tagged references,
                    and generate content.
                  </p>
                </div>
              )}
            </main>
          </div>
        </div>

        {/* Modals */}
        <AddSectionModal
          open={addModalOpen}
          parentId={addParentId}
          sections={dossier.sections}
          onConfirm={handleAddSection}
          onClose={() => setAddModalOpen(false)}
        />
        <AbstractModal
          article={abstractArticle}
          open={!!abstractArticle}
          onClose={() => setAbstractArticle(null)}
        />
      </AppShell>
    </AuthGuard>
  );
}
