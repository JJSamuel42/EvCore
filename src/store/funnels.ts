import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Funnel, FunnelLevel, FunnelArticle, FunnelState, CountryData } from '@/types';

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Population data sourced from national census bureaux and World Bank (2023 estimates).
// Age brackets: pediatric 0–12 (narrow) / under-18 (broad), adults 18+,
// elderly 50+, 60+, 65+.
export const COUNTRIES: CountryData[] = [
  {
    code: 'US', name: 'United States', flag: '🇺🇸',
    population: 335893238,
    dataSource: 'US Census Bureau 2023 estimate',
    dataYear: 2023,
    ageDistribution: {
      pediatric0to12:   49400000,  // ~14.7 %
      pediatricUnder18: 73700000,  // ~21.9 %
      adults18plus:    262200000,  // ~78.1 %
      elderly50plus:   121100000,  // ~36.1 %
      elderly60plus:    75900000,  // ~22.6 %
      elderly65plus:    58000000,  // ~17.3 %
    },
  },
  {
    code: 'GB', name: 'United Kingdom', flag: '🇬🇧',
    population: 67736802,
    dataSource: 'ONS Mid-year population estimates 2022',
    dataYear: 2022,
    ageDistribution: {
      pediatric0to12:    9400000,  // ~13.9 %
      pediatricUnder18: 13900000,  // ~20.5 %
      adults18plus:     53800000,  // ~79.5 %
      elderly50plus:    25300000,  // ~37.4 %
      elderly60plus:    16100000,  // ~23.8 %
      elderly65plus:    12600000,  // ~18.6 %
    },
  },
  {
    code: 'FR', name: 'France', flag: '🇫🇷',
    population: 68373433,
    dataSource: 'INSEE Bilan démographique 2023',
    dataYear: 2023,
    ageDistribution: {
      pediatric0to12:    9200000,  // ~13.5 %
      pediatricUnder18: 14000000,  // ~20.5 %
      adults18plus:     54400000,  // ~79.5 %
      elderly50plus:    24600000,  // ~36.0 %
      elderly60plus:    16900000,  // ~24.7 %
      elderly65plus:    13900000,  // ~20.3 %
    },
  },
  {
    code: 'DE', name: 'Germany', flag: '🇩🇪',
    population: 84482267,
    dataSource: 'Destatis (Federal Statistical Office) 2023',
    dataYear: 2023,
    ageDistribution: {
      pediatric0to12:    9700000,  // ~11.5 %
      pediatricUnder18: 14700000,  // ~17.4 %
      adults18plus:     69700000,  // ~82.6 %
      elderly50plus:    33700000,  // ~39.9 %
      elderly60plus:    22500000,  // ~26.7 %
      elderly65plus:    18700000,  // ~22.2 %
    },
  },
  {
    code: 'IT', name: 'Italy', flag: '🇮🇹',
    population: 58870762,
    dataSource: 'ISTAT Demographic Balance 2023',
    dataYear: 2023,
    ageDistribution: {
      pediatric0to12:    6300000,  // ~10.7 %
      pediatricUnder18:  9900000,  // ~16.8 %
      adults18plus:     49000000,  // ~83.2 %
      elderly50plus:    24400000,  // ~41.4 %
      elderly60plus:    17000000,  // ~28.9 %
      elderly65plus:    14200000,  // ~24.1 %
    },
  },
  {
    code: 'ES', name: 'Spain', flag: '🇪🇸',
    population: 47814906,
    dataSource: 'INE (Instituto Nacional de Estadística) 2023',
    dataYear: 2023,
    ageDistribution: {
      pediatric0to12:    5400000,  // ~11.3 %
      pediatricUnder18:  8300000,  // ~17.4 %
      adults18plus:     39500000,  // ~82.6 %
      elderly50plus:    17800000,  // ~37.2 %
      elderly60plus:    12100000,  // ~25.3 %
      elderly65plus:     9700000,  // ~20.3 %
    },
  },
  {
    code: 'CN', name: 'China', flag: '🇨🇳',
    population: 1409670000,
    dataSource: 'National Bureau of Statistics China / World Bank 2022',
    dataYear: 2022,
    ageDistribution: {
      pediatric0to12:  176200000,  // ~12.5 %
      pediatricUnder18: 234900000, // ~16.7 %
      adults18plus:   1174800000,  // ~83.3 %
      elderly50plus:   469700000,  // ~33.3 %
      elderly60plus:   297000000,  // ~21.1 %
      elderly65plus:   209000000,  // ~14.8 %
    },
  },
  {
    code: 'JP', name: 'Japan', flag: '🇯🇵',
    population: 124516650,
    dataSource: 'Statistics Bureau Japan 2023',
    dataYear: 2023,
    ageDistribution: {
      pediatric0to12:   11500000,  //  ~9.2 %
      pediatricUnder18: 17500000,  // ~14.1 %
      adults18plus:    107000000,  // ~85.9 %
      elderly50plus:    56500000,  // ~45.4 %
      elderly60plus:    41000000,  // ~32.9 %
      elderly65plus:    35900000,  // ~28.8 %
    },
  },
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
