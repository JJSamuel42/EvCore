import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Funnel, FunnelLevel, FunnelArticle, FunnelState, CountryData } from '@/types';

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export const COUNTRIES: CountryData[] = [
  { code: 'US', name: 'United States', flag: '🇺🇸', population: 331000000 },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧', population: 67000000 },
  { code: 'FR', name: 'France', flag: '🇫🇷', population: 68000000 },
  { code: 'DE', name: 'Germany', flag: '🇩🇪', population: 83000000 },
  { code: 'IT', name: 'Italy', flag: '🇮🇹', population: 60000000 },
  { code: 'ES', name: 'Spain', flag: '🇪🇸', population: 47000000 },
  { code: 'CN', name: 'China', flag: '🇨🇳', population: 1412000000 },
  { code: 'JP', name: 'Japan', flag: '🇯🇵', population: 126000000 },
];

const INITIAL_FUNNELS: Funnel[] = [
  {
    id: 'funnel-1',
    name: 'AD Biologic-Eligible Patients - US',
    country: 'US',
    indication: 'Atopic Dermatitis',
    description: 'Patient funnel estimating the number of biologic-eligible adults with moderate-to-severe atopic dermatitis in the United States.',
    createdAt: '2024-02-10T09:00:00Z',
    updatedAt: '2024-03-12T15:30:00Z',
    levels: [
      {
        id: 'level-1',
        name: 'Total US Adult Population',
        description: 'Total US adult population (18+ years)',
        percentage: 100,
        value: 258300000,
        linkedArticles: [],
      },
      {
        id: 'level-2',
        name: 'Atopic Dermatitis Prevalence',
        description: 'Adults with diagnosed atopic dermatitis (prevalence ~7.3%)',
        percentage: 7.3,
        value: 18856000,
        linkedArticles: [
          {
            articleId: 'art-8',
            title: 'Epidemiology and burden of atopic dermatitis in the US adult population: a cross-sectional study',
            pubDate: '2017-01-01',
            studyDetails: 'Cross-sectional study, N=34,613 US adults',
            extractedData: 'AD prevalence: 7.3% (95% CI 6.9-7.7%) in US adults',
            rating: 'high',
            appliedValue: 7.3,
            comment: 'Large nationally representative sample, consistent with other US estimates',
            selected: true,
          },
        ],
      },
      {
        id: 'level-3',
        name: 'Moderate-to-Severe AD',
        description: 'Subset with moderate-to-severe disease severity (IGA ≥3)',
        percentage: 40,
        value: 7542400,
        linkedArticles: [
          {
            articleId: 'art-8',
            title: 'Epidemiology and burden of atopic dermatitis in the US adult population: a cross-sectional study',
            pubDate: '2017-01-01',
            studyDetails: 'Cross-sectional study, US adults with AD',
            extractedData: 'Moderate-severe severity: ~40% of AD patients',
            rating: 'high',
            appliedValue: 40,
            comment: 'Consistent with published severity distribution data',
            selected: true,
          },
        ],
      },
      {
        id: 'level-4',
        name: 'Failed Conventional Therapy',
        description: 'Patients who have failed or are intolerant to topical corticosteroids and/or systemic immunosuppressants',
        percentage: 35,
        value: 2639840,
        linkedArticles: [
          {
            articleId: 'ref-1',
            title: 'Treatment patterns and biologic utilization in moderate-to-severe atopic dermatitis',
            pubDate: '2023-01-01',
            studyDetails: 'Claims database analysis, US commercial insurance',
            extractedData: '~35% of moderate-severe AD patients fail or are intolerant to conventional systemic therapy',
            rating: 'medium',
            appliedValue: 35,
            comment: 'Based on treatment pattern data from US claims databases',
            selected: true,
          },
        ],
      },
      {
        id: 'level-5',
        name: 'Biologic-Eligible (No Contraindications)',
        description: 'Patients with no contraindications to biologic therapy and meeting label criteria',
        percentage: 85,
        value: 2243864,
        linkedArticles: [],
      },
      {
        id: 'level-6',
        name: 'Estimated Biologic-Treated Patients',
        description: 'Patients currently receiving or expected to receive biologic treatment (market penetration ~45%)',
        percentage: 45,
        value: 1009739,
        linkedArticles: [],
      },
    ],
  },
];

export const useFunnelStore = create<FunnelState>()(
  persist(
    (set, get) => ({
      funnels: INITIAL_FUNNELS,
      activeFunnelId: null,

      createFunnel: (data) => {
        const newFunnel: Funnel = {
          ...data,
          id: `funnel-${generateId()}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        set((state) => ({ funnels: [...state.funnels, newFunnel] }));
        return newFunnel;
      },

      updateFunnel: (id, data) => {
        set((state) => ({
          funnels: state.funnels.map((f) =>
            f.id === id ? { ...f, ...data, updatedAt: new Date().toISOString() } : f
          ),
        }));
      },

      deleteFunnel: (id) => {
        set((state) => ({
          funnels: state.funnels.filter((f) => f.id !== id),
          activeFunnelId: state.activeFunnelId === id ? null : state.activeFunnelId,
        }));
      },

      addLevel: (funnelId, levelData) => {
        const level: FunnelLevel = { ...levelData, id: `level-${generateId()}` };
        set((state) => ({
          funnels: state.funnels.map((f) =>
            f.id === funnelId
              ? { ...f, levels: [...f.levels, level], updatedAt: new Date().toISOString() }
              : f
          ),
        }));
      },

      updateLevel: (funnelId, levelId, data) => {
        set((state) => ({
          funnels: state.funnels.map((f) =>
            f.id === funnelId
              ? {
                  ...f,
                  levels: f.levels.map((l) => (l.id === levelId ? { ...l, ...data } : l)),
                  updatedAt: new Date().toISOString(),
                }
              : f
          ),
        }));
      },

      deleteLevel: (funnelId, levelId) => {
        set((state) => ({
          funnels: state.funnels.map((f) =>
            f.id === funnelId
              ? {
                  ...f,
                  levels: f.levels.filter((l) => l.id !== levelId),
                  updatedAt: new Date().toISOString(),
                }
              : f
          ),
        }));
      },

      addArticleToLevel: (funnelId, levelId, article) => {
        set((state) => ({
          funnels: state.funnels.map((f) =>
            f.id === funnelId
              ? {
                  ...f,
                  levels: f.levels.map((l) =>
                    l.id === levelId
                      ? { ...l, linkedArticles: [...l.linkedArticles, article] }
                      : l
                  ),
                  updatedAt: new Date().toISOString(),
                }
              : f
          ),
        }));
      },

      updateArticleInLevel: (funnelId, levelId, articleId, data) => {
        set((state) => ({
          funnels: state.funnels.map((f) =>
            f.id === funnelId
              ? {
                  ...f,
                  levels: f.levels.map((l) =>
                    l.id === levelId
                      ? {
                          ...l,
                          linkedArticles: l.linkedArticles.map((a) =>
                            a.articleId === articleId ? { ...a, ...data } : a
                          ),
                        }
                      : l
                  ),
                  updatedAt: new Date().toISOString(),
                }
              : f
          ),
        }));
      },

      removeArticleFromLevel: (funnelId, levelId, articleId) => {
        set((state) => ({
          funnels: state.funnels.map((f) =>
            f.id === funnelId
              ? {
                  ...f,
                  levels: f.levels.map((l) =>
                    l.id === levelId
                      ? { ...l, linkedArticles: l.linkedArticles.filter((a) => a.articleId !== articleId) }
                      : l
                  ),
                  updatedAt: new Date().toISOString(),
                }
              : f
          ),
        }));
      },

      setActiveFunnel: (id) => {
        set({ activeFunnelId: id });
      },
    }),
    {
      name: 'ehcore-funnels',
    }
  )
);
