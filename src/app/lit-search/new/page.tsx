'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { AuthGuard } from '@/components/layout/AuthGuard';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/SectionLabel';
import { useLitSearchStore } from '@/store/litSearch';

export default function NewSearchPage() {
  const router = useRouter();
  const { createSession } = useLitSearchStore();

  const [name, setName] = useState('');
  const [aiContext, setAiContext] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [nameError, setNameError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setNameError('Session name is required');
      return;
    }
    setIsSubmitting(true);
    try {
      const session = createSession(name.trim(), aiContext.trim());
      router.push(`/lit-search/${session.id}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthGuard>
      <AppShell>
        <div className="p-6 lg:p-8 max-w-2xl mx-auto">
          <Link
            href="/lit-search"
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Searches
          </Link>

          <PageHeader
            label="Literature Search"
            title="New Search Session"
            subtitle="Create a new systematic literature search using the PICO framework."
            className="mb-6"
          />

          <form onSubmit={handleSubmit}>
            <Card>
              <CardHeader>
                <h2 className="font-serif text-base font-semibold">Session Details</h2>
              </CardHeader>
              <CardBody className="space-y-4">
                <Input
                  label="Session Name"
                  value={name}
                  onChange={(e) => { setName(e.target.value); setNameError(''); }}
                  placeholder="e.g. Dupilumab AD — HEOR Evidence Search 2024"
                  error={nameError}
                  required
                />
                <Textarea
                  label="AI Context & Instructions (Optional)"
                  value={aiContext}
                  onChange={(e) => setAiContext(e.target.value)}
                  placeholder="Provide context for AI-assisted screening, e.g. 'Focus on adult patients with moderate-to-severe atopic dermatitis. Include RCTs, systematic reviews, and real-world studies. Exclude animal studies and in vitro research.'"
                  rows={5}
                  hint="This context will guide the AI when screening and shortlisting articles."
                />
              </CardBody>
            </Card>

            <div className="mt-6 flex items-center justify-between">
              <Link href="/lit-search">
                <Button variant="ghost" type="button">Cancel</Button>
              </Link>
              <Button type="submit" variant="primary" isLoading={isSubmitting}>
                Create Session
              </Button>
            </div>
          </form>
        </div>
      </AppShell>
    </AuthGuard>
  );
}
