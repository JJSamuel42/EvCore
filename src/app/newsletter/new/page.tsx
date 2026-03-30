'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Loader2, ImagePlus } from 'lucide-react';
import Link from 'next/link';
import { AuthGuard } from '@/components/layout/AuthGuard';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { PageHeader } from '@/components/ui/SectionLabel';
import { ArticleSelector } from '@/components/newsletter/ArticleSelector';
import { useNewsletterStore, NewsletterStyle } from '@/store/newsletter';
import { useLibraryStore } from '@/store/libraries';
import { cn } from '@/lib/utils';

const STYLE_OPTIONS = [
  { value: 'clinical', label: 'Clinical — Detailed evidence summaries' },
  { value: 'executive', label: 'Executive — Strategic highlights' },
  { value: 'patient', label: 'Patient — Accessible language' },
];

export default function NewNewsletterPage() {
  return (
    <Suspense fallback={<AuthGuard><AppShell><div className="p-6 lg:p-8 max-w-3xl mx-auto"><p className="text-sm text-muted-foreground">Loading...</p></div></AppShell></AuthGuard>}>
      <NewNewsletterContent />
    </Suspense>
  );
}

function NewNewsletterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { libraries } = useLibraryStore();
  const { createNewsletter, generateContent } = useNewsletterStore();

  const preselectedArticleIds = searchParams.get('articleIds')?.split(',').filter(Boolean) || [];
  const preselectedLibraryId = searchParams.get('libraryId') || '';

  const [title, setTitle] = useState('');
  const [libraryId, setLibraryId] = useState(preselectedLibraryId || (libraries[0]?.id ?? ''));
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(preselectedArticleIds));
  const [style, setStyle] = useState<NewsletterStyle>('clinical');
  const [templateImage, setTemplateImage] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const library = libraries.find((l) => l.id === libraryId);
  const articles = library?.articles || [];

  // Update selected IDs when library changes
  useEffect(() => {
    if (preselectedLibraryId && libraryId === preselectedLibraryId) return;
    setSelectedIds(new Set());
  }, [libraryId]);

  const libraryOptions = libraries.map((lib) => ({
    value: lib.id,
    label: `${lib.name} (${lib.innName})`,
  }));

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setTemplateImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleToggle = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleToggleAll = () => {
    if (selectedIds.size === articles.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(articles.map((a) => a.id)));
    }
  };

  const handleGenerate = async () => {
    const errs: Record<string, string> = {};
    if (!title.trim()) errs.title = 'Title is required';
    if (selectedIds.size === 0) errs.articles = 'Select at least one article';
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setIsGenerating(true);
    try {
      const nl = createNewsletter({
        title: title.trim(),
        libraryId,
        articleIds: Array.from(selectedIds),
        style,
        templateImage,
      });

      const selectedArticles = articles.filter((a) => selectedIds.has(a.id));
      await generateContent(nl.id, selectedArticles);
      router.push(`/newsletter/${nl.id}`);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <AuthGuard>
      <AppShell>
        <div className="p-6 lg:p-8 max-w-3xl mx-auto">
          <Link
            href="/newsletter"
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Newsletters</span>
          </Link>

          <PageHeader
            label="Newsletter"
            title="Create Newsletter"
            subtitle="Generate an evidence newsletter from selected library articles."
            className="mb-6"
          />

          <div className="space-y-4">
            {/* Details */}
            <Card>
              <CardHeader>
                <h2 className="font-serif text-base font-semibold">Newsletter Details</h2>
              </CardHeader>
              <CardBody className="space-y-4">
                <Input
                  label="Title"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    setErrors((p) => ({ ...p, title: '' }));
                  }}
                  placeholder="e.g. Q1 2024 Evidence Update"
                  error={errors.title}
                  required
                />

                <Select
                  label="Style"
                  value={style}
                  onValueChange={(v) => setStyle(v as NewsletterStyle)}
                  options={STYLE_OPTIONS}
                />

                {/* Template image upload */}
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1.5">
                    Header Template (Optional)
                  </label>
                  {templateImage ? (
                    <div className="relative w-full h-32 rounded-md overflow-hidden border border-border">
                      <img src={templateImage} alt="Template" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setTemplateImage('')}
                        className="absolute top-2 right-2 px-2 py-1 bg-black/50 text-white text-xs rounded hover:bg-black/70"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <label className="flex items-center justify-center gap-2 w-full h-24 border-2 border-dashed border-border rounded-md cursor-pointer hover:border-accent/40 transition-colors">
                      <ImagePlus className="w-5 h-5 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Upload header image</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </CardBody>
            </Card>

            {/* Article Selection */}
            <Card>
              <CardHeader>
                <h2 className="font-serif text-base font-semibold">Select Articles</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Choose which articles to include in the newsletter.
                </p>
              </CardHeader>
              <CardBody className="space-y-3">
                {libraries.length > 1 && (
                  <Select
                    label="Library"
                    value={libraryId}
                    onValueChange={setLibraryId}
                    options={libraryOptions}
                  />
                )}
                <ArticleSelector
                  articles={articles}
                  selectedIds={selectedIds}
                  onToggle={handleToggle}
                  onToggleAll={handleToggleAll}
                />
                {errors.articles && (
                  <p className="text-xs text-exclude">{errors.articles}</p>
                )}
              </CardBody>
            </Card>

            <div className="flex items-center justify-between">
              <Link href="/newsletter">
                <Button variant="ghost">Cancel</Button>
              </Link>
              <Button
                variant="primary"
                onClick={handleGenerate}
                disabled={isGenerating}
                leftIcon={isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : undefined}
              >
                {isGenerating ? 'Generating...' : 'Generate Newsletter'}
              </Button>
            </div>
          </div>
        </div>
      </AppShell>
    </AuthGuard>
  );
}
