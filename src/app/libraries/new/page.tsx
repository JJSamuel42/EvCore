'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Copy } from 'lucide-react';
import Link from 'next/link';
import { AuthGuard } from '@/components/layout/AuthGuard';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { PageHeader } from '@/components/ui/SectionLabel';
import { useLibraryStore } from '@/store/libraries';

export default function NewLibraryPage() {
  const router = useRouter();
  const { libraries, createLibrary } = useLibraryStore();

  const [name, setName] = useState('');
  const [innName, setInnName] = useState('');
  const [indications, setIndications] = useState<string[]>([]);
  const [indicationInput, setIndicationInput] = useState('');
  const [description, setDescription] = useState('');
  const [copyFromId, setCopyFromId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const addIndication = () => {
    const val = indicationInput.trim();
    if (val && !indications.includes(val)) {
      setIndications((p) => [...p, val]);
      setErrors((p) => ({ ...p, indications: '' }));
    }
    setIndicationInput('');
  };

  const removeIndication = (ind: string) =>
    setIndications((p) => p.filter((i) => i !== ind));

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = 'Brand name is required';
    if (!innName.trim()) errs.innName = 'INN name is required';
    if (indications.length === 0) errs.indications = 'At least one indication is required';
    return errs;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setIsSubmitting(true);
    try {
      const library = createLibrary({
        name: name.trim(),
        innName: innName.trim(),
        indications,
        description: description.trim(),
      });
      router.push(`/libraries/${library.id}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const libraryOptions = [
    { value: '', label: 'Do not copy (start fresh)' },
    ...libraries.map((lib) => ({
      value: lib.id,
      label: `${lib.name} (${lib.innName}) — ${(lib.indications ?? []).join(', ')}`,
    })),
  ];

  return (
    <AuthGuard>
      <AppShell>
        <div className="p-6 lg:p-8 max-w-2xl mx-auto">
          <Link
            href="/libraries"
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Libraries</span>
          </Link>

          <PageHeader
            label="Libraries"
            title="Create New Library"
            subtitle="Set up a new HEOR evidence library for a product and indication."
            className="mb-6"
          />

          <form onSubmit={handleSubmit}>
            <Card>
              <CardHeader>
                <h2 className="font-serif text-base font-semibold">Library Details</h2>
              </CardHeader>
              <CardBody className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Brand Name"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      setErrors((p) => ({ ...p, name: '' }));
                    }}
                    placeholder="e.g. Dupixent"
                    error={errors.name}
                    required
                  />
                  <Input
                    label="INN Name"
                    value={innName}
                    onChange={(e) => {
                      setInnName(e.target.value);
                      setErrors((p) => ({ ...p, innName: '' }));
                    }}
                    placeholder="e.g. dupilumab"
                    error={errors.innName}
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">
                    Indications <span className="text-exclude">*</span>
                  </label>
                  {indications.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {indications.map((ind) => (
                        <span
                          key={ind}
                          className="flex items-center gap-1 text-[11px] font-mono uppercase tracking-wider text-accent px-2 py-0.5 bg-accent-muted rounded border border-accent/10"
                        >
                          {ind}
                          <button
                            type="button"
                            onClick={() => removeIndication(ind)}
                            className="text-accent/60 hover:text-exclude transition-colors ml-0.5"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={indicationInput}
                      onChange={(e) => setIndicationInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') { e.preventDefault(); addIndication(); }
                      }}
                      placeholder="e.g. Atopic Dermatitis — press Enter to add"
                      className="flex-1 h-9 px-3 text-sm bg-card border border-border rounded focus:outline-none focus:ring-2 focus:ring-accent text-foreground placeholder:text-muted-foreground"
                    />
                    <button
                      type="button"
                      onClick={addIndication}
                      disabled={!indicationInput.trim()}
                      className="h-9 px-3 text-xs text-accent border border-accent/30 rounded hover:bg-accent-muted transition-colors disabled:opacity-40"
                    >
                      Add
                    </button>
                  </div>
                  {errors.indications && (
                    <p className="text-xs text-exclude mt-1">{errors.indications}</p>
                  )}
                </div>

                <Textarea
                  label="Description (Optional)"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the scope and purpose of this evidence library..."
                  rows={3}
                />
              </CardBody>
            </Card>

            {libraries.length > 0 && (
              <Card className="mt-4">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Copy className="w-4 h-4 text-muted-foreground" />
                    <h2 className="font-serif text-base font-semibold">Copy Settings From</h2>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Optionally copy column configuration from an existing library.
                  </p>
                </CardHeader>
                <CardBody>
                  <Select
                    value={copyFromId}
                    onValueChange={setCopyFromId}
                    options={libraryOptions}
                    placeholder="Select a library to copy from..."
                  />
                </CardBody>
              </Card>
            )}

            <div className="mt-6 flex items-center justify-between">
              <Link href="/libraries">
                <Button variant="ghost" type="button">
                  Cancel
                </Button>
              </Link>
              <Button type="submit" variant="primary" isLoading={isSubmitting}>
                Create Library
              </Button>
            </div>
          </form>
        </div>
      </AppShell>
    </AuthGuard>
  );
}
