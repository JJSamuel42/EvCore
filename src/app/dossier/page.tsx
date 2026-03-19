'use client';

import React from 'react';
import { FileText, Layers, Globe, Clipboard } from 'lucide-react';
import { AuthGuard } from '@/components/layout/AuthGuard';
import { AppShell } from '@/components/layout/AppShell';
import { Card, CardBody } from '@/components/ui/Card';

export default function DossierPage() {
  const features = [
    { icon: <Layers className="w-5 h-5" />, title: 'Module Assembly', desc: 'Automatically assemble evidence modules from your libraries and search results into structured dossier sections.' },
    { icon: <Globe className="w-5 h-5" />, title: 'Country-Specific Dossiers', desc: 'Generate country-specific HTA submissions tailored to NICE, HAS, G-BA, and other agency requirements.' },
    { icon: <Clipboard className="w-5 h-5" />, title: 'AMCP Format', desc: 'Export dossiers in standard AMCP and CTD formats for US market access submissions.' },
    { icon: <FileText className="w-5 h-5" />, title: 'Template Library', desc: 'Access pre-built templates for common HTA submission formats across major markets.' },
  ];

  return (
    <AuthGuard>
      <AppShell>
        <div className="p-6 lg:p-8 max-w-5xl mx-auto">
          <div className="mb-8">
            <p className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground mb-1">
              Coming Soon
            </p>
            <h1 className="font-serif text-3xl font-semibold text-foreground mb-2">Dossier Builder</h1>
            <p className="text-sm text-muted-foreground max-w-lg">
              The EHCore Dossier Builder will enable seamless assembly of HTA submission materials directly from your evidence libraries and research data.
            </p>
          </div>

          <div className="relative mb-8 rounded-xl overflow-hidden border border-border bg-muted/50 p-8">
            <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-muted/20" />
            <div className="relative z-10 flex items-center justify-center min-h-[200px]">
              <div className="text-center">
                <div className="w-20 h-20 rounded-full bg-muted border border-border flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-8 h-8 text-muted-foreground/40" />
                </div>
                <p className="font-serif text-xl text-muted-foreground/60 mb-2">Dossier Builder Preview</p>
                <p className="text-xs font-mono text-muted-foreground/40 uppercase tracking-widest">
                  Available in a future release
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {features.map((feat) => (
              <Card key={feat.title} className="opacity-60">
                <CardBody>
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-md bg-muted flex items-center justify-center shrink-0 text-muted-foreground">
                      {feat.icon}
                    </div>
                    <div>
                      <h3 className="font-serif text-sm font-semibold text-foreground mb-1">{feat.title}</h3>
                      <p className="text-xs text-muted-foreground leading-relaxed">{feat.desc}</p>
                    </div>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        </div>
      </AppShell>
    </AuthGuard>
  );
}
