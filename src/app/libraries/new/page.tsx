'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Copy, Settings, FolderTree, ChevronDown, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { AuthGuard } from '@/components/layout/AuthGuard';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { PageHeader } from '@/components/ui/SectionLabel';
import { ColumnSetupTable } from '@/components/library/ColumnSetupTable';
import { CategoryHierarchyEditor } from '@/components/library/CategoryHierarchyEditor';
import { useLibraryStore, DEFAULT_COLUMNS, DEFAULT_CATEGORY_HIERARCHY } from '@/store/libraries';
import { LibraryColumn, CategoryNode } from '@/types';
import { cn } from '@/lib/utils';

export default function NewLibraryPage() {
  const router = useRouter();
  const { libraries, createLibrary } = useLibraryStore();

  const [name, setName] = useState('');
  const [innName, setInnName] = useState('');
  const [indications, setIndications] = useState<string[]>([]);
  const [indicationInput, setIndicationInput] = useState('');
  const [description, setDescription] = useState('');
  const [copyFromId, setCopyFromId] = useState('__none__');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Column setup
  const [columns, setColumns] = useState<Omit<LibraryColumn, 'id' | 'order'>[]>([...DEFAULT_COLUMNS]);
  const [categoryHierarchy, setCategoryHierarchy] = useState<CategoryNode[]>(
    DEFAULT_CATEGORY_HIERARCHY.map((n) => ({ ...n }))
  );

  // Section visibility
  const [showColumns, setShowColumns] = useState(false);
  const [showCategories, setShowCategories] = useState(false);

  // Product predefined values (for the Product select column)
  const [productValues, setProductValues] = useState<string[]>([]);
  const [productInput, setProductInput] = useState('');

  // Copy from existing library
  useEffect(() => {
    if (copyFromId === '__none__') {
      setColumns([...DEFAULT_COLUMNS]);
      setCategoryHierarchy(DEFAULT_CATEGORY_HIERARCHY.map((n) => ({ ...n })));
      setProductValues([]);
      return;
    }
    const source = libraries.find((l) => l.id === copyFromId);
    if (!source) return;
    setColumns(
      source.columns.map(({ id, order, ...rest }) => rest)
    );
    setCategoryHierarchy(source.categoryHierarchy.map((n) => ({ ...n })));
    // Extract product values from source
    const productCol = source.columns.find((c) => c.name === 'Product');
    if (productCol?.predefinedValues?.length) {
      setProductValues([...productCol.predefinedValues]);
    }
  }, [copyFromId, libraries]);

  // Sync product values into the Product column
  useEffect(() => {
    setColumns((prev) =>
      prev.map((col) =>
        col.name === 'Product' ? { ...col, predefinedValues: productValues } : col
      )
    );
  }, [productValues]);

  // Sync indication values into the Indication column
  useEffect(() => {
    setColumns((prev) =>
      prev.map((col) =>
        col.name === 'Indication' ? { ...col, predefinedValues: indications } : col
      )
    );
  }, [indications]);

  // Sync category hierarchy into Category & Subcategory columns
  useEffect(() => {
    setColumns((prev) =>
      prev.map((col) => {
        if (col.name === 'Category') {
          return { ...col, predefinedValues: categoryHierarchy.map((n) => n.category) };
        }
        if (col.name === 'Subcategory') {
          return { ...col, predefinedValues: categoryHierarchy.flatMap((n) => n.subcategories) };
        }
        return col;
      })
    );
  }, [categoryHierarchy]);

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

  const addProductValue = () => {
    const val = productInput.trim();
    if (val && !productValues.includes(val)) {
      setProductValues((p) => [...p, val]);
    }
    setProductInput('');
  };

  const removeProductValue = (val: string) =>
    setProductValues((p) => p.filter((v) => v !== val));

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
      const builtColumns: LibraryColumn[] = columns.map((col, idx) => ({
        ...col,
        id: `col-default-${idx}`,
        order: idx,
      }));
      const library = createLibrary({
        name: name.trim(),
        innName: innName.trim(),
        indications,
        description: description.trim(),
        columns: builtColumns,
        categoryHierarchy,
      });
      router.push(`/libraries/${library.id}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const libraryOptions = [
    { value: '__none__', label: 'Do not copy (start fresh)' },
    ...libraries.map((lib) => ({
      value: lib.id,
      label: `${lib.name} (${lib.innName}) — ${(lib.indications ?? []).join(', ')}`,
    })),
  ];

  return (
    <AuthGuard>
      <AppShell>
        <div className="p-6 lg:p-8 max-w-3xl mx-auto">
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
            {/* Library Details */}
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

                {/* Indications */}
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

                {/* Product Values */}
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">
                    Product Values (for the Product column dropdown)
                  </label>
                  {productValues.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {productValues.map((val) => (
                        <span
                          key={val}
                          className="flex items-center gap-1 text-[11px] font-mono uppercase tracking-wider text-foreground px-2 py-0.5 bg-muted rounded border border-border"
                        >
                          {val}
                          <button
                            type="button"
                            onClick={() => removeProductValue(val)}
                            className="text-muted-foreground hover:text-exclude transition-colors ml-0.5"
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
                      value={productInput}
                      onChange={(e) => setProductInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') { e.preventDefault(); addProductValue(); }
                      }}
                      placeholder="e.g. Dupixent (dupilumab) — press Enter to add"
                      className="flex-1 h-9 px-3 text-sm bg-card border border-border rounded focus:outline-none focus:ring-2 focus:ring-accent text-foreground placeholder:text-muted-foreground"
                    />
                    <button
                      type="button"
                      onClick={addProductValue}
                      disabled={!productInput.trim()}
                      className="h-9 px-3 text-xs text-accent border border-accent/30 rounded hover:bg-accent-muted transition-colors disabled:opacity-40"
                    >
                      Add
                    </button>
                  </div>
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

            {/* Copy from existing */}
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

            {/* Column Setup */}
            <Card className="mt-4">
              <CardHeader>
                <button
                  type="button"
                  onClick={() => setShowColumns(!showColumns)}
                  className="flex items-center gap-2 w-full text-left"
                >
                  <Settings className="w-4 h-4 text-muted-foreground" />
                  <h2 className="font-serif text-base font-semibold flex-1">
                    Column Configuration
                  </h2>
                  <span className="text-xs text-muted-foreground mr-2">
                    {columns.length} columns
                  </span>
                  {showColumns ? (
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  )}
                </button>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Configure which columns appear in the evidence table. Defaults are pre-loaded.
                </p>
              </CardHeader>
              {showColumns && (
                <CardBody>
                  <ColumnSetupTable columns={columns} onChange={setColumns} />
                </CardBody>
              )}
            </Card>

            {/* Category Hierarchy */}
            <Card className="mt-4">
              <CardHeader>
                <button
                  type="button"
                  onClick={() => setShowCategories(!showCategories)}
                  className="flex items-center gap-2 w-full text-left"
                >
                  <FolderTree className="w-4 h-4 text-muted-foreground" />
                  <h2 className="font-serif text-base font-semibold flex-1">
                    Category Hierarchy
                  </h2>
                  <span className="text-xs text-muted-foreground mr-2">
                    {categoryHierarchy.length} categories
                  </span>
                  {showCategories ? (
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  )}
                </button>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Define the category and subcategory structure for classifying articles.
                </p>
              </CardHeader>
              {showCategories && (
                <CardBody>
                  <CategoryHierarchyEditor
                    hierarchy={categoryHierarchy}
                    onChange={setCategoryHierarchy}
                  />
                </CardBody>
              )}
            </Card>

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
