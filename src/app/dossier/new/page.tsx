'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, FileText } from 'lucide-react';
import { AuthGuard } from '@/components/layout/AuthGuard';
import { AppShell } from '@/components/layout/AppShell';
import { Card, CardBody, CardHeader, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { useDossierStore } from '@/store/dossier';
import { useLibraryStore } from '@/store/libraries';

export default function NewDossierPage() {
  const router = useRouter();
  const { createDossier } = useDossierStore();
  const { libraries } = useLibraryStore();

  const [name, setName] = useState('');
  const [product, setProduct] = useState('');
  const [indication, setIndication] = useState('');
  const [libraryId, setLibraryId] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const libraryOptions = libraries.map((l) => ({
    value: l.id,
    label: `${l.name} (${l.innName})`,
  }));

  const selectedLibrary = libraries.find((l) => l.id === libraryId);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'Dossier name is required';
    if (!product.trim()) e.product = 'Product name is required';
    if (!indication.trim()) e.indication = 'Indication is required';
    if (!libraryId) e.libraryId = 'Please select a linked library';
    return e;
  };

  const handleCreate = () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    const dossier = createDossier({ name: name.trim(), product: product.trim(), indication: indication.trim(), libraryId });
    router.push(`/dossier/${dossier.id}`);
  };

  // Auto-fill from library selection
  const handleLibraryChange = (id: string) => {
    setLibraryId(id);
    const lib = libraries.find((l) => l.id === id);
    if (lib) {
      if (!product) setProduct(lib.name);
      if (!indication && lib.indications.length) setIndication(lib.indications[0]);
      if (!name) setName(`${lib.name} (${lib.innName}) — Core Value Dossier`);
    }
  };

  return (
    <AuthGuard>
      <AppShell>
        <div className="p-6 lg:p-8 max-w-2xl mx-auto">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>

          <div className="mb-6">
            <p className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground mb-1">
              Dossier Builder
            </p>
            <h1 className="font-serif text-2xl font-semibold text-foreground">New Core Value Dossier</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Link a dossier to an evidence library to begin tagging and assembling content.
            </p>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-md bg-accent/10 border border-accent/20 flex items-center justify-center">
                  <FileText className="w-4 h-4 text-accent" />
                </div>
                <span className="font-serif text-sm font-semibold text-foreground">Dossier Details</span>
              </div>
            </CardHeader>

            <CardBody className="space-y-4">
              <Select
                label="Linked Evidence Library"
                options={libraryOptions}
                value={libraryId}
                onValueChange={handleLibraryChange}
                placeholder="Select a library..."
                error={errors.libraryId}
              />
              {selectedLibrary && (
                <div className="text-xs text-muted-foreground bg-muted/50 rounded-md px-3 py-2">
                  {selectedLibrary.articleCount} articles · Indications: {selectedLibrary.indications.join(', ')}
                </div>
              )}

              <Input
                label="Dossier Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Dupixent (dupilumab) — Atopic Dermatitis Core Value Dossier"
                error={errors.name}
              />

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Product (Brand Name)"
                  value={product}
                  onChange={(e) => setProduct(e.target.value)}
                  placeholder="e.g. Dupixent"
                  error={errors.product}
                />
                <Input
                  label="Indication"
                  value={indication}
                  onChange={(e) => setIndication(e.target.value)}
                  placeholder="e.g. Atopic Dermatitis"
                  error={errors.indication}
                />
              </div>
            </CardBody>

            <CardFooter>
              <div className="flex items-center justify-end gap-3">
                <Button variant="ghost" onClick={() => router.back()}>
                  Cancel
                </Button>
                <Button variant="primary" onClick={handleCreate}>
                  Create Dossier
                </Button>
              </div>
            </CardFooter>
          </Card>
        </div>
      </AppShell>
    </AuthGuard>
  );
}
