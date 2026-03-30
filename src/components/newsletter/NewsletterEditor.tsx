'use client';

import React from 'react';
import { Newsletter, NewsletterSection } from '@/store/newsletter';

interface NewsletterEditorProps {
  newsletter: Newsletter;
  onUpdate: (data: Partial<Newsletter>) => void;
}

export function NewsletterEditor({ newsletter, onUpdate }: NewsletterEditorProps) {
  const updateSection = (sectionId: string, data: Partial<NewsletterSection>) => {
    onUpdate({
      sections: newsletter.sections.map((s) =>
        s.id === sectionId ? { ...s, ...data } : s
      ),
    });
  };

  return (
    <div className="space-y-4">
      {/* Headline */}
      <div>
        <label className="block text-[11px] font-mono uppercase tracking-wider text-muted-foreground mb-1">
          Headline
        </label>
        <input
          value={newsletter.headline}
          onChange={(e) => onUpdate({ headline: e.target.value })}
          className="w-full h-10 px-3 text-base font-serif font-semibold bg-card border border-border rounded focus:outline-none focus:ring-2 focus:ring-accent"
        />
      </div>

      {/* Intro */}
      <div>
        <label className="block text-[11px] font-mono uppercase tracking-wider text-muted-foreground mb-1">
          Introduction
        </label>
        <textarea
          value={newsletter.intro}
          onChange={(e) => onUpdate({ intro: e.target.value })}
          rows={3}
          className="w-full px-3 py-2 text-sm bg-card border border-border rounded focus:outline-none focus:ring-2 focus:ring-accent resize-y"
        />
      </div>

      {/* Sections */}
      {newsletter.sections.map((section, idx) => (
        <div key={section.id} className="border border-border rounded-md p-3 space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-muted-foreground">Section {idx + 1}</span>
            <input
              value={section.heading}
              onChange={(e) => updateSection(section.id, { heading: e.target.value })}
              className="flex-1 h-8 px-2 text-sm font-medium bg-card border border-border rounded focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
          <textarea
            value={section.body}
            onChange={(e) => updateSection(section.id, { body: e.target.value })}
            rows={4}
            className="w-full px-2 py-1.5 text-xs bg-card border border-border rounded focus:outline-none focus:ring-2 focus:ring-accent resize-y"
          />
        </div>
      ))}

      {/* Conclusion */}
      <div>
        <label className="block text-[11px] font-mono uppercase tracking-wider text-muted-foreground mb-1">
          Conclusion
        </label>
        <textarea
          value={newsletter.conclusion}
          onChange={(e) => onUpdate({ conclusion: e.target.value })}
          rows={3}
          className="w-full px-3 py-2 text-sm bg-card border border-border rounded focus:outline-none focus:ring-2 focus:ring-accent resize-y"
        />
      </div>
    </div>
  );
}
