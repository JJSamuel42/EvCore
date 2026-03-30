'use client';

import React, { useState, useRef, useCallback } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import * as Tabs from '@radix-ui/react-tabs';
import { X, Upload, Link as LinkIcon, Loader2, AlertCircle, FileSpreadsheet } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ImportPreview } from './ImportPreview';
import {
  ArticleMetadata,
  extractPMIDFromUrl,
  extractDOIFromText,
  extractIdentifiers,
  fetchArticlesByPMID,
  fetchArticleByDOI,
} from '@/lib/pubmed';
import { cn } from '@/lib/utils';

interface ImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (articles: ArticleMetadata[]) => void;
}

export function ImportModal({ open, onOpenChange, onImport }: ImportModalProps) {
  const [tab, setTab] = useState('url');
  const [urlInput, setUrlInput] = useState('');
  const [bulkInput, setBulkInput] = useState('');
  const [fetched, setFetched] = useState<ArticleMetadata[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState('');
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setFetched([]);
    setSelected(new Set());
    setError('');
    setProgress('');
    setUrlInput('');
    setBulkInput('');
  };

  const handleFetchSingle = async () => {
    const input = urlInput.trim();
    if (!input) return;

    setLoading(true);
    setError('');
    setProgress('Fetching article...');
    try {
      const pmid = extractPMIDFromUrl(input);
      if (pmid) {
        const results = await fetchArticlesByPMID([pmid]);
        if (results.length > 0) {
          setFetched(results);
          setSelected(new Set(results.map((a) => a.pmid || a.doi)));
        } else {
          setError('No article found for this PMID.');
        }
      } else {
        const doi = extractDOIFromText(input);
        if (doi) {
          const result = await fetchArticleByDOI(doi);
          if (result) {
            setFetched([result]);
            setSelected(new Set([result.doi]));
          } else {
            setError('No article found for this DOI.');
          }
        } else {
          setError('Could not detect a PMID or DOI in the input.');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch article.');
    } finally {
      setLoading(false);
      setProgress('');
    }
  };

  const handleFetchBulk = async () => {
    const { pmids, dois } = extractIdentifiers(bulkInput);
    const total = pmids.length + dois.length;
    if (total === 0) {
      setError('No PMIDs or DOIs found in the input.');
      return;
    }

    setLoading(true);
    setError('');
    const results: ArticleMetadata[] = [];

    try {
      // Fetch PMIDs in batches of 20
      for (let i = 0; i < pmids.length; i += 20) {
        const batch = pmids.slice(i, i + 20);
        setProgress(`Fetching PMIDs ${i + 1}–${Math.min(i + 20, pmids.length)} of ${pmids.length}...`);
        const articles = await fetchArticlesByPMID(batch);
        results.push(...articles);
      }

      // Fetch DOIs one by one
      for (let i = 0; i < dois.length; i++) {
        setProgress(`Fetching DOI ${i + 1} of ${dois.length}...`);
        const article = await fetchArticleByDOI(dois[i]);
        if (article) results.push(article);
      }

      if (results.length === 0) {
        setError('No articles could be fetched.');
      } else {
        setFetched(results);
        setSelected(new Set(results.map((a, idx) => a.pmid || a.doi || String(idx))));
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch articles.');
    } finally {
      setLoading(false);
      setProgress('');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError('');
    setProgress('Reading file...');

    try {
      const text = await file.text();
      // Try to extract PMIDs/DOIs from the CSV/text content
      const { pmids, dois } = extractIdentifiers(text);
      const total = pmids.length + dois.length;

      if (total === 0) {
        setError('No PMIDs or DOIs found in the uploaded file. Ensure the file contains PubMed IDs or DOIs.');
        setLoading(false);
        setProgress('');
        return;
      }

      setBulkInput(`Found ${pmids.length} PMIDs and ${dois.length} DOIs`);

      const results: ArticleMetadata[] = [];

      for (let i = 0; i < pmids.length; i += 20) {
        const batch = pmids.slice(i, i + 20);
        setProgress(`Fetching articles ${i + 1}–${Math.min(i + 20, pmids.length)} of ${pmids.length}...`);
        const articles = await fetchArticlesByPMID(batch);
        results.push(...articles);
      }

      for (let i = 0; i < dois.length; i++) {
        setProgress(`Fetching DOI ${i + 1} of ${dois.length}...`);
        const article = await fetchArticleByDOI(dois[i]);
        if (article) results.push(article);
      }

      if (results.length > 0) {
        setFetched(results);
        setSelected(new Set(results.map((a, idx) => a.pmid || a.doi || String(idx))));
      } else {
        setError('No articles could be fetched from the identifiers found in the file.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to process file.');
    } finally {
      setLoading(false);
      setProgress('');
    }
  };

  const handleToggle = (key: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const handleToggleAll = () => {
    if (selected.size === fetched.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(fetched.map((a, idx) => a.pmid || a.doi || String(idx))));
    }
  };

  const handleImport = () => {
    const toImport = fetched.filter((a, idx) => {
      const key = a.pmid || a.doi || String(idx);
      return selected.has(key);
    });
    onImport(toImport);
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 z-50" />
        <Dialog.Content className="fixed top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[700px] max-h-[85vh] bg-card border border-border rounded-lg shadow-xl z-50 flex flex-col focus:outline-none">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <Dialog.Title className="font-serif text-base font-semibold">
              Import Articles
            </Dialog.Title>
            <Dialog.Close className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted">
              <X className="w-4 h-4" />
            </Dialog.Close>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
            {fetched.length === 0 ? (
              <Tabs.Root value={tab} onValueChange={setTab}>
                <Tabs.List className="flex gap-1 border-b border-border mb-4">
                  <Tabs.Trigger
                    value="url"
                    className={cn(
                      'px-3 py-2 text-xs font-medium border-b-2 -mb-px transition-colors',
                      tab === 'url'
                        ? 'border-accent text-accent'
                        : 'border-transparent text-muted-foreground hover:text-foreground'
                    )}
                  >
                    <LinkIcon className="w-3.5 h-3.5 inline mr-1.5" />
                    Single URL / ID
                  </Tabs.Trigger>
                  <Tabs.Trigger
                    value="bulk"
                    className={cn(
                      'px-3 py-2 text-xs font-medium border-b-2 -mb-px transition-colors',
                      tab === 'bulk'
                        ? 'border-accent text-accent'
                        : 'border-transparent text-muted-foreground hover:text-foreground'
                    )}
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 inline mr-1.5" />
                    Bulk / File Upload
                  </Tabs.Trigger>
                </Tabs.List>

                <Tabs.Content value="url" className="space-y-3">
                  <p className="text-xs text-muted-foreground">
                    Enter a PubMed URL, PMID, or DOI to fetch article metadata.
                  </p>
                  <div className="flex gap-2">
                    <input
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleFetchSingle();
                        }
                      }}
                      placeholder="e.g. https://pubmed.ncbi.nlm.nih.gov/28892958 or 10.1056/NEJMoa1610524"
                      className="flex-1 h-9 px-3 text-sm bg-card border border-border rounded focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={handleFetchSingle}
                      disabled={loading || !urlInput.trim()}
                    >
                      {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Fetch'}
                    </Button>
                  </div>
                </Tabs.Content>

                <Tabs.Content value="bulk" className="space-y-3">
                  <p className="text-xs text-muted-foreground">
                    Paste multiple PMIDs or DOIs (one per line), or upload a CSV/text file containing them.
                  </p>
                  <textarea
                    value={bulkInput}
                    onChange={(e) => setBulkInput(e.target.value)}
                    placeholder="28892958&#10;34516098&#10;10.1056/NEJMoa1610524&#10;..."
                    rows={5}
                    className="w-full px-3 py-2 text-sm bg-card border border-border rounded focus:outline-none focus:ring-2 focus:ring-accent font-mono resize-y"
                  />
                  <div className="flex items-center gap-3">
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={handleFetchBulk}
                      disabled={loading || !bulkInput.trim()}
                    >
                      {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Fetch All'}
                    </Button>
                    <span className="text-xs text-muted-foreground">or</span>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={loading}
                      className="flex items-center gap-1.5 text-xs text-accent hover:text-accent/80 transition-colors"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      Upload CSV / Text File
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv,.txt,.tsv"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </div>
                </Tabs.Content>
              </Tabs.Root>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-foreground">
                    {fetched.length} article{fetched.length !== 1 ? 's' : ''} found
                  </p>
                  <button
                    type="button"
                    onClick={reset}
                    className="text-xs text-accent hover:text-accent/80 transition-colors"
                  >
                    Start over
                  </button>
                </div>
                <ImportPreview
                  articles={fetched}
                  selected={selected}
                  onToggle={handleToggle}
                  onToggleAll={handleToggleAll}
                />
              </div>
            )}

            {progress && (
              <div className="flex items-center gap-2 text-xs text-accent">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                {progress}
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 text-xs text-exclude bg-exclude/5 border border-exclude/20 rounded px-3 py-2">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                {error}
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-border">
            <Button variant="ghost" size="sm" onClick={() => { reset(); onOpenChange(false); }}>
              Cancel
            </Button>
            {fetched.length > 0 && (
              <Button
                variant="primary"
                size="sm"
                onClick={handleImport}
                disabled={selected.size === 0}
              >
                Import {selected.size} Article{selected.size !== 1 ? 's' : ''}
              </Button>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
