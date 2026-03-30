import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type NewsletterStyle = 'clinical' | 'executive' | 'patient';
export type NewsletterStatus = 'draft' | 'generated' | 'finalized';

export interface NewsletterSection {
  id: string;
  heading: string;
  body: string;
  articleIds: string[];
}

export interface Newsletter {
  id: string;
  title: string;
  libraryId: string;
  articleIds: string[];
  templateImage: string; // base64 or URL
  style: NewsletterStyle;
  headline: string;
  intro: string;
  sections: NewsletterSection[];
  conclusion: string;
  status: NewsletterStatus;
  createdAt: string;
  updatedAt: string;
}

interface NewsletterState {
  newsletters: Newsletter[];
  activeNewsletterId: string | null;
  createNewsletter: (data: {
    title: string;
    libraryId: string;
    articleIds: string[];
    style: NewsletterStyle;
    templateImage?: string;
  }) => Newsletter;
  updateNewsletter: (id: string, data: Partial<Newsletter>) => void;
  deleteNewsletter: (id: string) => void;
  generateContent: (id: string, articles: Array<{ title: string; authors: string; journal: string; publicationDate: string; [key: string]: any }>) => Promise<void>;
  setActiveNewsletter: (id: string | null) => void;
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export const useNewsletterStore = create<NewsletterState>()(
  persist(
    (set, get) => ({
      newsletters: [],
      activeNewsletterId: null,

      createNewsletter: (data) => {
        const newsletter: Newsletter = {
          id: `nl-${generateId()}`,
          title: data.title,
          libraryId: data.libraryId,
          articleIds: data.articleIds,
          templateImage: data.templateImage || '',
          style: data.style,
          headline: '',
          intro: '',
          sections: [],
          conclusion: '',
          status: 'draft',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        set((state) => ({ newsletters: [...state.newsletters, newsletter] }));
        return newsletter;
      },

      updateNewsletter: (id, data) => {
        set((state) => ({
          newsletters: state.newsletters.map((nl) =>
            nl.id === id ? { ...nl, ...data, updatedAt: new Date().toISOString() } : nl
          ),
        }));
      },

      deleteNewsletter: (id) => {
        set((state) => ({
          newsletters: state.newsletters.filter((nl) => nl.id !== id),
          activeNewsletterId: state.activeNewsletterId === id ? null : state.activeNewsletterId,
        }));
      },

      generateContent: async (id, articles) => {
        // Simulate AI generation delay
        await new Promise((resolve) => setTimeout(resolve, 2000));

        const nl = get().newsletters.find((n) => n.id === id);
        if (!nl) return;

        const style = nl.style;
        const articleCount = articles.length;

        // Generate content based on style
        const headline =
          style === 'clinical'
            ? `Clinical Evidence Update: ${articleCount} New Publications`
            : style === 'executive'
              ? `Executive Summary: Key Evidence Highlights`
              : `What\'s New in Treatment Research`;

        const intro =
          style === 'clinical'
            ? `This newsletter summarizes ${articleCount} recently published articles relevant to the evidence base. The publications span clinical trials, real-world evidence, health economic analyses, and systematic reviews.`
            : style === 'executive'
              ? `This executive brief highlights the most impactful findings from ${articleCount} recent publications, focusing on strategic implications for market access and value communication.`
              : `We\'ve compiled ${articleCount} recent research updates to help you stay informed about the latest developments in treatment options and outcomes.`;

        // Group articles by study type or category for sections
        const sections: NewsletterSection[] = [];
        const grouped: Record<string, typeof articles> = {};
        for (const art of articles) {
          const category = art['col-default-6'] || art.category || 'Other';
          if (!grouped[category]) grouped[category] = [];
          grouped[category].push(art);
        }

        for (const [category, catArticles] of Object.entries(grouped)) {
          const bullets = catArticles
            .map(
              (a) =>
                `**${a.authors}** published "${a.title}" in *${a.journal}* (${a.publicationDate?.substring(0, 4) || 'N/A'}).`
            )
            .join('\n\n');

          sections.push({
            id: `sec-${generateId()}`,
            heading: category,
            body: bullets,
            articleIds: catArticles.map((a: any) => a.id).filter(Boolean),
          });
        }

        const conclusion =
          style === 'clinical'
            ? 'These publications contribute to the growing body of evidence supporting treatment decisions. Readers are encouraged to review the full texts for detailed methodology and results.'
            : style === 'executive'
              ? 'The evidence landscape continues to evolve with new data strengthening the value proposition. These findings should be incorporated into upcoming market access submissions and value dossier updates.'
              : 'Research continues to advance our understanding of treatment options. Speak with your healthcare provider about how these findings may relate to your care.';

        set((state) => ({
          newsletters: state.newsletters.map((n) =>
            n.id === id
              ? {
                  ...n,
                  headline,
                  intro,
                  sections,
                  conclusion,
                  status: 'generated' as NewsletterStatus,
                  updatedAt: new Date().toISOString(),
                }
              : n
          ),
        }));
      },

      setActiveNewsletter: (id) => {
        set({ activeNewsletterId: id });
      },
    }),
    {
      name: 'ehcore-newsletter',
      version: 1,
    }
  )
);
