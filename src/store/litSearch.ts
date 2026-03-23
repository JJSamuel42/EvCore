import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { SearchSession, SearchTerm, PubMedFilters, SearchResult, LitSearchState } from '@/types';

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function buildPubMedQuery(terms: SearchTerm[]): string {
  if (terms.length === 0) return '';
  let query = '';
  terms.forEach((term, idx) => {
    if (idx === 0) {
      query += `"${term.text}"[MeSH Terms]`;
    } else {
      query += ` ${term.operator || 'AND'} "${term.text}"[MeSH Terms]`;
    }
  });
  return query;
}

const MOCK_ABSTRACTS = [
  {
    pmid: '38471234',
    title: 'Comparative effectiveness of dupilumab versus cyclosporine in patients with moderate-to-severe atopic dermatitis: a retrospective cohort study',
    authors: 'Williams KA, Johnson RA, Chen S, Park JH, Anderson ML',
    journal: 'British Journal of Dermatology',
    pubDate: '2024-01-15',
    link: 'https://pubmed.ncbi.nlm.nih.gov/38471234',
    abstract: 'Background: Head-to-head data comparing dupilumab and cyclosporine in atopic dermatitis (AD) are limited. Methods: We conducted a retrospective cohort study in adults with moderate-to-severe AD initiating dupilumab (n=312) or cyclosporine (n=289) between 2019-2023. Primary outcome was EASI-75 at 16 weeks. Secondary outcomes included IGA 0/1, DLQI, and adverse events. Results: EASI-75 was achieved by 67.3% of dupilumab vs 42.1% of cyclosporine patients (aOR 2.83, 95% CI 1.98-4.04). IGA 0/1 was achieved in 44.2% vs 28.4% respectively. DLQI improvement was significantly greater with dupilumab. Dupilumab was associated with lower rates of serious adverse events (3.2% vs 11.4%). Conclusion: In this real-world study, dupilumab demonstrated superior effectiveness and safety compared to cyclosporine for moderate-to-severe AD.',
    decision: null as 'include' | 'exclude' | null,
    rationale: '',
    aiReasoning: '',
  },
  {
    pmid: '38502817',
    title: 'Health-related quality of life in patients with atopic dermatitis: a systematic review of patient-reported outcomes',
    authors: 'Martinez A, Lopez B, Thompson C, Wilson D',
    journal: 'Journal of Dermatological Treatment',
    pubDate: '2024-02-01',
    link: 'https://pubmed.ncbi.nlm.nih.gov/38502817',
    abstract: 'Introduction: Atopic dermatitis (AD) significantly impacts health-related quality of life (HRQoL). This systematic review evaluated HRQoL measures in AD clinical trials and observational studies. Methods: We searched PubMed, EMBASE, and CENTRAL for studies published 2015-2024 reporting HRQoL outcomes using DLQI, EQ-5D, or POEM in adults with AD. Results: 47 studies (n=38,412 patients) were included. Moderate-to-severe AD was associated with mean DLQI score of 14.2 (range 10.8-17.6) and EQ-5D utility of 0.61 (range 0.54-0.68). Biologic therapies demonstrated greatest HRQoL improvements (mean DLQI reduction: 8.4 points). Physical function, emotional wellbeing, sleep, and social functioning were most affected domains. Conclusion: AD poses a substantial HRQoL burden comparable to other chronic skin diseases. Biologics provide clinically meaningful improvements.',
    decision: null as 'include' | 'exclude' | null,
    rationale: '',
    aiReasoning: '',
  },
  {
    pmid: '38356091',
    title: 'Economic burden of atopic dermatitis in Europe: a cost-of-illness study',
    authors: 'Schmidt F, Mueller G, Dupont H, Romano V, Garcia P',
    journal: 'PharmacoEconomics',
    pubDate: '2024-01-08',
    link: 'https://pubmed.ncbi.nlm.nih.gov/38356091',
    abstract: 'Objective: To estimate the economic burden of atopic dermatitis (AD) across five European countries (France, Germany, Italy, Spain, UK). Methods: We used a cost-of-illness approach from a societal perspective. Direct medical costs (physician visits, hospitalization, medications) and indirect costs (productivity loss, absenteeism, presenteeism) were estimated using claims databases and patient surveys (n=2,847). Results: Total annual cost per patient ranged from €4,230 (Italy) to €6,840 (Germany). Direct costs represented 62-68% of total costs. Biologics accounted for 78% of medication costs. Indirect costs were significant, particularly in working-age patients (18-64 years): mean annual productivity loss €2,140. Moderate-severe AD patients had 3.4x higher costs than mild AD. Conclusion: AD imposes substantial economic burden across European healthcare systems.',
    decision: null as 'include' | 'exclude' | null,
    rationale: '',
    aiReasoning: '',
  },
  {
    pmid: '38289043',
    title: 'Dupilumab for adolescent atopic dermatitis: 52-week results from LIBERTY AD ADOL',
    authors: 'Paller AS, Siegfried EC, Thaçi D, Weidinger S, Blauvelt A',
    journal: 'JAMA Dermatology',
    pubDate: '2023-12-20',
    link: 'https://pubmed.ncbi.nlm.nih.gov/38289043',
    abstract: 'Importance: Long-term data on dupilumab in adolescent atopic dermatitis are limited. Objective: To evaluate 52-week efficacy and safety of dupilumab in adolescents with moderate-to-severe AD. Design, Setting, Participants: Phase 3 randomized, double-blind, placebo-controlled trial in adolescents (12-17 years) with moderate-to-severe AD (n=251). Interventions: Dupilumab 300mg every 2 weeks or placebo, plus low-potency TCS. Main Outcomes and Measures: IGA 0/1, EASI-75, CDLQI, POEM at week 52. Results: At week 52, IGA 0/1 was achieved in 49.0% dupilumab vs 11.7% placebo. EASI-75 in 67.2% vs 22.0%. Clinically meaningful improvements in CDLQI and POEM. Safety consistent with adult populations. Conclusion: Dupilumab maintains significant efficacy and acceptable safety through 52 weeks in adolescents with moderate-to-severe AD.',
    decision: null as 'include' | 'exclude' | null,
    rationale: '',
    aiReasoning: '',
  },
  {
    pmid: '38103452',
    title: 'Incidence and prevalence of atopic dermatitis: an epidemiological systematic review',
    authors: 'Langan SM, Abuabara K, Henrickson SE, Hoffstad O, Margolis DJ',
    journal: 'Journal of Investigative Dermatology',
    pubDate: '2023-11-15',
    link: 'https://pubmed.ncbi.nlm.nih.gov/38103452',
    abstract: 'Background: Robust epidemiological estimates for atopic dermatitis (AD) are needed for resource planning and policy. Methods: Systematic review and meta-analysis of population-based studies reporting AD incidence and/or prevalence (2010-2023). Results: 89 studies included. Pooled adult prevalence: 4.9% (95% CI 3.8-6.2%). Children: 15.2% (95% CI 12.4-18.3%). Incidence declining in high-income countries but rising in Asia and Latin America. Urban-rural gradient observed. AD associated with allergic comorbidities: asthma (29%), allergic rhinitis (42%), food allergy (17%). Severity distribution: mild 60%, moderate 30%, severe 10%. Conclusion: AD affects nearly 1 in 20 adults globally, with significant variation by region and age group.',
    decision: null as 'include' | 'exclude' | null,
    rationale: '',
    aiReasoning: '',
  },
  {
    pmid: '37956234',
    title: 'In vitro characterization of novel IL-13 pathway inhibitors for atopic dermatitis',
    authors: 'Zhang Y, Liu X, Wang H, Li J, Zhao K',
    journal: 'Biochemical Pharmacology',
    pubDate: '2023-10-01',
    link: 'https://pubmed.ncbi.nlm.nih.gov/37956234',
    abstract: 'Interleukin-13 (IL-13) plays a central role in atopic dermatitis (AD) pathogenesis. We characterized the binding affinity, selectivity, and functional activity of three novel IL-13 receptor antagonists in human keratinocyte and immune cell models. Compounds A and B showed IC50 values in the low nanomolar range with >100-fold selectivity over IL-4. In human skin explant models, all compounds reduced TSLP, CCL17, and periostin production. These in vitro findings support further preclinical development of these molecules as potential AD therapeutics.',
    decision: null as 'include' | 'exclude' | null,
    rationale: '',
    aiReasoning: '',
  },
  {
    pmid: '38421567',
    title: 'Machine learning prediction of dupilumab treatment response in atopic dermatitis using clinical and biomarker data',
    authors: 'Torres R, Nguyen T, Smith K, Brown A, Davis L',
    journal: 'Journal of Allergy and Clinical Immunology',
    pubDate: '2024-02-15',
    link: 'https://pubmed.ncbi.nlm.nih.gov/38421567',
    abstract: 'Background: Predicting treatment response to dupilumab in AD may improve patient selection. Objective: Develop and validate a machine learning model to predict EASI-75 response to dupilumab. Methods: Data from 1,247 patients starting dupilumab (derivation n=873, validation n=374). Features included demographics, disease history, laboratory values, and biomarkers (IgE, TARC, periostin). Results: Gradient boosting model achieved AUC 0.74 (95% CI 0.70-0.78) in validation. Top predictors: baseline EASI, IgE level, prior treatment history, age. Patients in highest quintile had 82% EASI-75 response vs 41% in lowest quintile. Conclusion: This prediction model may help identify patients most likely to respond to dupilumab.',
    decision: null as 'include' | 'exclude' | null,
    rationale: '',
    aiReasoning: '',
  },
  {
    pmid: '38198034',
    title: 'Dupilumab persistence and real-world treatment patterns in moderate-to-severe atopic dermatitis: a 3-year follow-up study',
    authors: 'Blakely K, Jones D, Williams P, Chen Y, Evans M',
    journal: 'Dermatology and Therapy',
    pubDate: '2024-01-20',
    link: 'https://pubmed.ncbi.nlm.nih.gov/38198034',
    abstract: 'Purpose: To assess real-world dupilumab persistence and treatment patterns in patients with moderate-to-severe AD over 3 years. Methods: Retrospective analysis of electronic health records (n=892 patients). Drug persistence, discontinuation reasons, switching patterns, and concomitant medication use were analyzed. Results: 3-year persistence rate: 73.2%. Main discontinuation reasons: inadequate response (12.4%), patient preference (7.8%), adverse events (4.6%), insurance issues (5.4%). 18.3% required dose adjustment or shortened injection interval. Healthcare resource utilization decreased significantly in year 2 and 3 compared to pre-treatment period. Conclusion: Dupilumab shows high real-world persistence over 3 years with significant reduction in healthcare resource utilization.',
    decision: null as 'include' | 'exclude' | null,
    rationale: '',
    aiReasoning: '',
  },
];

function generateAIReasoning(
  result: Omit<SearchResult, 'decision' | 'aiReasoning' | 'confidence' | 'confidenceReason'>,
  aiContext: string
): { decision: 'include' | 'exclude'; aiReasoning: string; confidence: number; confidenceReason: string } {
  const abstract = result.abstract.toLowerCase();
  const title = result.title.toLowerCase();

  // Exclude in vitro / animal studies
  if (abstract.includes('in vitro') || abstract.includes('cell line') || abstract.includes('keratinocyte model') || abstract.includes('mouse model')) {
    return {
      decision: 'exclude',
      aiReasoning: 'This study appears to be an in vitro or preclinical study. Based on the provided context, clinical human studies are required for inclusion. The abstract describes laboratory/cell-based models rather than patient populations.',
      confidence: 95,
      confidenceReason: 'Clearly non-clinical study design detected in abstract',
    };
  }

  // Exclude if adolescent-only (context says adults)
  if ((title.includes('adolescent') || abstract.includes('adolescents')) && !abstract.includes('adult')) {
    return {
      decision: 'exclude',
      aiReasoning: 'This study focuses exclusively on adolescent patients. If the scope is limited to adult populations, this study should be excluded. Review inclusion criteria to confirm age requirements.',
      confidence: 80,
      confidenceReason: 'Population appears to be adolescents only; adult criteria may not be met',
    };
  }

  // Include RCTs and systematic reviews on efficacy/HRQoL
  if (abstract.includes('randomized') || abstract.includes('systematic review') || abstract.includes('meta-analysis')) {
    return {
      decision: 'include',
      aiReasoning: 'This is a high-quality study (RCT or systematic review/meta-analysis) directly relevant to the search topic. It reports outcomes in the target population using validated measures and meets the inclusion criteria for study design, population, and outcomes.',
      confidence: 92,
      confidenceReason: 'High-quality study design (RCT or systematic review/meta-analysis) with clear relevance',
    };
  }

  // Include observational / real-world studies
  if (abstract.includes('retrospective') || abstract.includes('cohort') || abstract.includes('real-world') || abstract.includes('electronic health record')) {
    return {
      decision: 'include',
      aiReasoning: 'This real-world or observational study provides complementary evidence to clinical trial data. It evaluates outcomes in a broader, more representative patient population and meets inclusion criteria for study design and reported outcomes.',
      confidence: 78,
      confidenceReason: 'Real-world evidence design; complementary to controlled trial data',
    };
  }

  // Include economic studies
  if (abstract.includes('cost') || abstract.includes('economic') || abstract.includes('burden')) {
    return {
      decision: 'include',
      aiReasoning: 'This health economic study is relevant to understanding the disease and treatment burden. It provides cost and resource utilization data that may be relevant to HEOR analyses.',
      confidence: 74,
      confidenceReason: 'Health economic content identified; relevant to HEOR dossier scope',
    };
  }

  return {
    decision: 'include',
    aiReasoning: 'This study appears to meet the general inclusion criteria based on its focus on the target disease and population. Further expert review is recommended to confirm eligibility.',
    confidence: 60,
    confidenceReason: 'No strong exclusion signals detected; expert review recommended',
  };
}

const INITIAL_SESSIONS: SearchSession[] = [
  {
    id: 'session-1',
    name: 'Dupilumab AD - HEOR Evidence Search',
    query: '"dupilumab"[MeSH Terms] AND "atopic dermatitis"[MeSH Terms] AND ("quality of life"[MeSH Terms] OR "health economics"[MeSH Terms] OR "cost-effectiveness"[MeSH Terms])',
    terms: [
      { id: 'term-1', text: 'dupilumab', type: 'I', operator: null },
      { id: 'term-2', text: 'atopic dermatitis', type: 'P', operator: 'AND' },
      { id: 'term-3', text: 'quality of life', type: 'O', operator: 'AND' },
      { id: 'term-4', text: 'cost-effectiveness', type: 'O', operator: 'OR' },
      { id: 'term-5', text: 'health economics', type: 'O', operator: 'OR' },
    ],
    filters: {
      dateFrom: '2020-01-01',
      dateTo: '',
      species: 'human',
      language: 'english',
    },
    results: MOCK_ABSTRACTS.map((r) => {
      const { decision, aiReasoning, confidence, confidenceReason } = generateAIReasoning(r, 'Focus on adult patients with moderate-to-severe atopic dermatitis. Include RCTs, real-world studies, systematic reviews, and health economic analyses. Exclude animal and in vitro studies.');
      return { ...r, decision, aiReasoning, confidence, confidenceReason, rationale: '' };
    }),
    aiContext: 'Focus on adult patients with moderate-to-severe atopic dermatitis. Include RCTs, real-world studies, systematic reviews, and health economic analyses. Exclude animal and in vitro studies. Looking for evidence supporting the HEOR value dossier for dupilumab.',
    createdAt: '2024-03-01T10:00:00Z',
    lastRun: '2024-03-15T14:22:00Z',
  },
];

export const useLitSearchStore = create<LitSearchState>()(
  persist(
    (set, get) => ({
      sessions: INITIAL_SESSIONS,
      activeSessionId: null,

      createSession: (name, aiContext = '') => {
        const newSession: SearchSession = {
          id: `session-${generateId()}`,
          name,
          query: '',
          terms: [],
          filters: { species: 'human', language: 'english' },
          results: [],
          aiContext,
          createdAt: new Date().toISOString(),
          lastRun: null,
        };
        set((state) => ({ sessions: [...state.sessions, newSession] }));
        return newSession;
      },

      updateSession: (id, data) => {
        set((state) => ({
          sessions: state.sessions.map((s) => (s.id === id ? { ...s, ...data } : s)),
        }));
      },

      deleteSession: (id) => {
        set((state) => ({
          sessions: state.sessions.filter((s) => s.id !== id),
          activeSessionId: state.activeSessionId === id ? null : state.activeSessionId,
        }));
      },

      addTerm: (sessionId, termData) => {
        const term: SearchTerm = { ...termData, id: `term-${generateId()}` };
        set((state) => ({
          sessions: state.sessions.map((s) => {
            if (s.id !== sessionId) return s;
            const newTerms = [...s.terms, term];
            return { ...s, terms: newTerms, query: buildPubMedQuery(newTerms) };
          }),
        }));
      },

      removeTerm: (sessionId, termId) => {
        set((state) => ({
          sessions: state.sessions.map((s) => {
            if (s.id !== sessionId) return s;
            const newTerms = s.terms.filter((t) => t.id !== termId);
            return { ...s, terms: newTerms, query: buildPubMedQuery(newTerms) };
          }),
        }));
      },

      updateTerm: (sessionId, termId, data) => {
        set((state) => ({
          sessions: state.sessions.map((s) => {
            if (s.id !== sessionId) return s;
            const newTerms = s.terms.map((t) => (t.id === termId ? { ...t, ...data } : t));
            return { ...s, terms: newTerms, query: buildPubMedQuery(newTerms) };
          }),
        }));
      },

      setFilters: (sessionId, filters) => {
        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === sessionId ? { ...s, filters: { ...s.filters, ...filters } } : s
          ),
        }));
      },

      setResults: (sessionId, results) => {
        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === sessionId ? { ...s, results, lastRun: new Date().toISOString() } : s
          ),
        }));
      },

      updateResult: (sessionId, pmid, data) => {
        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === sessionId
              ? { ...s, results: s.results.map((r) => (r.pmid === pmid ? { ...r, ...data } : r)) }
              : s
          ),
        }));
      },

      setActiveSession: (id) => {
        set({ activeSessionId: id });
      },

      runSearch: async (sessionId) => {
        const session = get().sessions.find((s) => s.id === sessionId);
        if (!session) return;

        // Simulate PubMed API call
        await new Promise((resolve) => setTimeout(resolve, 1500));

        const results: SearchResult[] = MOCK_ABSTRACTS.map((r) => ({
          ...r,
          decision: null,
          rationale: '',
          aiReasoning: '',
        }));

        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === sessionId ? { ...s, results, lastRun: new Date().toISOString() } : s
          ),
        }));
      },

      runAIReview: async (sessionId) => {
        const session = get().sessions.find((s) => s.id === sessionId);
        if (!session) return;

        // Simulate AI processing with delay
        await new Promise((resolve) => setTimeout(resolve, 2000));

        const updatedResults = session.results.map((result) => {
          const { decision, aiReasoning, confidence, confidenceReason } = generateAIReasoning(result, session.aiContext);
          return { ...result, decision, aiReasoning, confidence, confidenceReason };
        });

        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === sessionId ? { ...s, results: updatedResults } : s
          ),
        }));
      },
    }),
    {
      name: 'ehcore-lit-search',
    }
  )
);
