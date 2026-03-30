'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Copy, Printer, Pencil, Eye, CheckCircle } from 'lucide-react';
import { AuthGuard } from '@/components/layout/AuthGuard';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/ui/SectionLabel';
import { NewsletterPreview } from '@/components/newsletter/NewsletterPreview';
import { NewsletterEditor } from '@/components/newsletter/NewsletterEditor';
import { useNewsletterStore, Newsletter } from '@/store/newsletter';
import { cn } from '@/lib/utils';

export default function NewsletterDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { newsletters, updateNewsletter, deleteNewsletter } = useNewsletterStore();
  const [mode, setMode] = useState<'preview' | 'edit'>('preview');
  const [copied, setCopied] = useState(false);

  const newsletter = newsletters.find((nl) => nl.id === params.id);

  if (!newsletter) {
    return (
      <AuthGuard>
        <AppShell>
          <div className="p-6 lg:p-8 max-w-3xl mx-auto">
            <p className="text-sm text-muted-foreground">Newsletter not found.</p>
            <Link href="/newsletter" className="text-sm text-accent hover:underline mt-2 inline-block">
              Back to Newsletters
            </Link>
          </div>
        </AppShell>
      </AuthGuard>
    );
  }

  const handleCopyHTML = async () => {
    const previewEl = document.getElementById('newsletter-preview');
    if (previewEl) {
      try {
        await navigator.clipboard.write([
          new ClipboardItem({
            'text/html': new Blob([previewEl.innerHTML], { type: 'text/html' }),
            'text/plain': new Blob([previewEl.innerText], { type: 'text/plain' }),
          }),
        ]);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        // Fallback: copy plain text
        await navigator.clipboard.writeText(previewEl.innerText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleFinalize = () => {
    updateNewsletter(newsletter.id, { status: 'finalized' });
  };

  return (
    <AuthGuard>
      <AppShell>
        <div className="p-6 lg:p-8 max-w-4xl mx-auto">
          <Link
            href="/newsletter"
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Newsletters</span>
          </Link>

          <div className="flex items-center justify-between mb-6">
            <PageHeader
              label="Newsletter"
              title={newsletter.title}
              subtitle={`${newsletter.articleIds.length} articles · ${newsletter.style} style`}
            />
            <div className="flex items-center gap-2">
              {/* Mode toggle */}
              <div className="flex border border-border rounded-md overflow-hidden">
                <button
                  onClick={() => setMode('preview')}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 text-xs transition-colors',
                    mode === 'preview' ? 'bg-accent text-white' : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <Eye className="w-3.5 h-3.5" />
                  Preview
                </button>
                <button
                  onClick={() => setMode('edit')}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 text-xs transition-colors',
                    mode === 'edit' ? 'bg-accent text-white' : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <Pencil className="w-3.5 h-3.5" />
                  Edit
                </button>
              </div>

              <Button
                size="sm"
                variant="ghost"
                onClick={handleCopyHTML}
                leftIcon={copied ? <CheckCircle className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
              >
                {copied ? 'Copied!' : 'Copy HTML'}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handlePrint}
                leftIcon={<Printer className="w-3.5 h-3.5" />}
              >
                Print / PDF
              </Button>
              {newsletter.status !== 'finalized' && (
                <Button
                  size="sm"
                  variant="primary"
                  onClick={handleFinalize}
                  leftIcon={<CheckCircle className="w-3.5 h-3.5" />}
                >
                  Finalize
                </Button>
              )}
            </div>
          </div>

          {mode === 'edit' ? (
            <div className="bg-card border border-border rounded-lg p-6">
              <NewsletterEditor
                newsletter={newsletter}
                onUpdate={(data) => updateNewsletter(newsletter.id, data)}
              />
            </div>
          ) : (
            <div className="print:m-0">
              <NewsletterPreview newsletter={newsletter} />
            </div>
          )}
        </div>
      </AppShell>
    </AuthGuard>
  );
}
