'use client';

import React, { useState } from 'react';
import { Star, Trash2, Plus, BookOpen } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { FunnelLevel, FunnelArticle, ArticleRating } from '@/types';
import { cn, formatDate, generateId } from '@/lib/utils';

interface FunnelLevelModalProps {
  level: FunnelLevel | null;
  funnelId: string;
  open: boolean;
  adminMode?: boolean;
  onClose: () => void;
  onUpdateLevel: (levelId: string, data: Partial<FunnelLevel>) => void;
  onUpdateArticle: (levelId: string, articleId: string, data: Partial<FunnelArticle>) => void;
  onRemoveArticle: (levelId: string, articleId: string) => void;
  onAddArticle: (levelId: string, article: FunnelArticle) => void;
}

const RATING_ICONS: Record<ArticleRating, number> = { low: 1, medium: 2, high: 3 };

function StarRating({ rating, onChange }: { rating: ArticleRating; onChange: (r: ArticleRating) => void }) {
  const count = RATING_ICONS[rating];
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3].map((n) => (
        <button
          key={n}
          onClick={() => onChange(n === 1 ? 'low' : n === 2 ? 'medium' : 'high')}
          className="focus:outline-none"
        >
          <Star
            className={cn(
              'w-4 h-4 transition-colors',
              n <= count ? 'fill-accent text-accent' : 'text-border'
            )}
          />
        </button>
      ))}
    </div>
  );
}

export function FunnelLevelModal({
  level,
  funnelId,
  open,
  adminMode = false,
  onClose,
  onUpdateLevel,
  onUpdateArticle,
  onRemoveArticle,
  onAddArticle,
}: FunnelLevelModalProps) {
  const [localPercentage, setLocalPercentage] = useState<string>('');
  const [localValue, setLocalValue] = useState<string>('');
  const [addingArticle, setAddingArticle] = useState(false);
  const [newArticle, setNewArticle] = useState({
    title: '',
    pubDate: '',
    studyDetails: '',
    extractedData: '',
  });

  React.useEffect(() => {
    if (level && open) {
      setLocalPercentage(String(level.percentage || ''));
      setLocalValue(String(level.value || ''));
    }
  }, [level, open]);

  if (!level) return null;

  const handleSaveMeta = () => {
    onUpdateLevel(level.id, {
      percentage: parseFloat(localPercentage) || 0,
      value: parseFloat(localValue) || undefined,
    });
  };

  const handleAddArticle = () => {
    if (!newArticle.title) return;
    const article: FunnelArticle = {
      articleId: `fa-${generateId()}`,
      ...newArticle,
      rating: 'medium',
      selected: true,
    };
    onAddArticle(level.id, article);
    setNewArticle({ title: '', pubDate: '', studyDetails: '', extractedData: '' });
    setAddingArticle(false);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent size="xl" title={level.name} description={level.description}>
        <div className="space-y-5">
          {/* Level meta */}
          <div className="grid grid-cols-2 gap-4 p-3 bg-muted rounded-md">
            <Input
              label="Percentage (%)"
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={localPercentage}
              onChange={(e) => adminMode && setLocalPercentage(e.target.value)}
              readOnly={!adminMode}
            />
            <Input
              label="Absolute Value (patients)"
              type="number"
              value={localValue}
              onChange={(e) => adminMode && setLocalValue(e.target.value)}
              readOnly={!adminMode}
            />
          </div>
          {!adminMode && (
            <p className="text-[11px] text-muted-foreground font-mono -mt-1">
              Switch to Admin Mode to edit values and manage publications.
            </p>
          )}

          {/* Articles */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                <BookOpen className="w-3 h-3" />
                Tagged Publications ({level.linkedArticles.length})
              </p>
              {adminMode && (
                <button
                  onClick={() => setAddingArticle(true)}
                  className="flex items-center gap-1 text-xs text-accent hover:text-accent/80 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Publication
                </button>
              )}
            </div>

            {addingArticle && (
              <div className="mb-3 p-3 border border-accent/20 rounded-md bg-accent-muted space-y-2">
                <Input
                  label="Article Title"
                  value={newArticle.title}
                  onChange={(e) => setNewArticle((p) => ({ ...p, title: e.target.value }))}
                  placeholder="Enter article title..."
                />
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    label="Publication Date"
                    type="date"
                    value={newArticle.pubDate}
                    onChange={(e) => setNewArticle((p) => ({ ...p, pubDate: e.target.value }))}
                  />
                  <Input
                    label="Study Details"
                    value={newArticle.studyDetails}
                    onChange={(e) => setNewArticle((p) => ({ ...p, studyDetails: e.target.value }))}
                    placeholder="e.g. N=1,234 cohort study"
                  />
                </div>
                <Textarea
                  label="Extracted Data"
                  value={newArticle.extractedData}
                  onChange={(e) => setNewArticle((p) => ({ ...p, extractedData: e.target.value }))}
                  placeholder="Key data points extracted from this article..."
                  rows={2}
                />
                <div className="flex gap-2">
                  <Button size="sm" variant="primary" onClick={handleAddArticle}>Add</Button>
                  <Button size="sm" variant="ghost" onClick={() => setAddingArticle(false)}>Cancel</Button>
                </div>
              </div>
            )}

            <div className="space-y-2 max-h-64 overflow-y-auto">
              {level.linkedArticles.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">
                  No publications tagged to this level yet.
                </p>
              ) : (
                level.linkedArticles.map((article) => (
                  <div
                    key={article.articleId}
                    className={cn(
                      'p-3 rounded-md border transition-all',
                      article.selected ? 'border-accent/20 bg-accent-muted' : 'border-border bg-card opacity-60'
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-2">
                          <input
                            type="checkbox"
                            checked={article.selected}
                            onChange={(e) =>
                              onUpdateArticle(level.id, article.articleId, { selected: e.target.checked })
                            }
                            className="mt-0.5 rounded border-border accent-accent shrink-0"
                          />
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-foreground leading-snug">{article.title}</p>
                            <div className="flex items-center gap-2 mt-1">
                              {article.pubDate && (
                                <span className="text-[11px] text-muted-foreground">{article.pubDate}</span>
                              )}
                              {article.studyDetails && (
                                <span className="text-[11px] text-muted-foreground">· {article.studyDetails}</span>
                              )}
                            </div>
                            {article.extractedData && (
                              <p className="text-[11px] text-muted-foreground mt-1 leading-snug">
                                {article.extractedData}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                      {adminMode && (
                        <button
                          onClick={() => onRemoveArticle(level.id, article.articleId)}
                          className="text-muted-foreground hover:text-exclude transition-colors shrink-0"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="mt-2 flex items-center gap-3 pl-6">
                      <StarRating
                        rating={article.rating}
                        onChange={(r) =>
                          adminMode && onUpdateArticle(level.id, article.articleId, { rating: r })
                        }
                      />
                      <input
                        type="number"
                        value={article.appliedValue || ''}
                        readOnly={!adminMode}
                        onChange={(e) =>
                          adminMode &&
                          onUpdateArticle(level.id, article.articleId, {
                            appliedValue: parseFloat(e.target.value) || undefined,
                          })
                        }
                        placeholder={adminMode ? 'Applied value %' : '—'}
                        className="w-28 h-6 px-2 text-xs bg-card border border-border rounded focus:outline-none focus:ring-1 focus:ring-accent read-only:opacity-60 read-only:cursor-default"
                      />
                      <input
                        type="text"
                        value={article.comment || ''}
                        readOnly={!adminMode}
                        onChange={(e) =>
                          adminMode &&
                          onUpdateArticle(level.id, article.articleId, { comment: e.target.value })
                        }
                        placeholder={adminMode ? 'Comment...' : ''}
                        className="flex-1 h-6 px-2 text-xs bg-card border border-border rounded focus:outline-none focus:ring-1 focus:ring-accent read-only:opacity-60 read-only:cursor-default"
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button variant="ghost" size="sm" onClick={onClose}>
              Close
            </Button>
            {adminMode && (
              <Button variant="primary" size="sm" onClick={() => { handleSaveMeta(); onClose(); }}>
                Save Changes
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
