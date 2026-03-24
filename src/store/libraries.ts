import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Library, LibraryColumn, LibraryArticle, DateQuickAction, CategoryNode } from '@/types';

const DEFAULT_QUICK_ACTIONS: DateQuickAction[] = [
  { id: 'q1', label: 'Last 3 months', type: 'relative_months', months: 3 },
  { id: 'q2', label: 'Last 6 months', type: 'relative_months', months: 6 },
  { id: 'q3', label: 'Since last GVD', type: 'since_date', date: undefined },
];

export const DEFAULT_CATEGORY_HIERARCHY: CategoryNode[] = [
  { id: 'cat-1', category: 'Disease Burden – Clinical',       subcategories: ['Epidemiology', 'Morbidity / mortality'] },
  { id: 'cat-2', category: 'Disease Burden – Humanistic',     subcategories: ['Caregiver impact', 'Patient insight', 'PROs'] },
  { id: 'cat-3', category: 'Disease Burden – Socioeconomic',  subcategories: ['Direct costs', 'Indirect costs', 'Health resource utilisation', 'Caregiver impact', 'Productivity impact', 'Societal burden'] },
  { id: 'cat-4', category: 'Management',                      subcategories: ['Guidelines / recommendations', 'Treatment patterns', 'HTA reports'] },
  { id: 'cat-5', category: 'Product specific',                subcategories: ['Mechanism of action', 'Dosing / utilisation', 'Regulatory', 'Pivotal study'] },
  { id: 'cat-6', category: 'Efficacy / effectiveness',        subcategories: ['Clinical efficacy / effectiveness', 'Comparative effectiveness', 'Clinical assessment outcomes'] },
  { id: 'cat-7', category: 'Safety',                          subcategories: ['Safety – General', 'Safety – Specific'] },
  { id: 'cat-8', category: 'Economic value',                  subcategories: ['Budget impact', 'Cost effectiveness', 'HCRU / Cost of care'] },
];

interface LibraryState {
  libraries: Library[];
  activeLibraryId: string | null;
  createLibrary: (data: { name: string; innName: string; indications: string[]; description: string }) => Library;
  updateLibrary: (id: string, data: Partial<Library>) => void;
  updateDateQuickActions: (libraryId: string, actions: DateQuickAction[]) => void;
  updateCategoryHierarchy: (libraryId: string, hierarchy: CategoryNode[]) => void;
  deleteLibrary: (id: string) => void;
  addColumn: (libraryId: string, column: Omit<LibraryColumn, 'id' | 'order'>) => void;
  updateColumn: (libraryId: string, columnId: string, data: Partial<LibraryColumn>) => void;
  deleteColumn: (libraryId: string, columnId: string) => void;
  addArticle: (libraryId: string, article: Omit<LibraryArticle, 'id' | 'articleNumber'>) => void;
  updateArticle: (libraryId: string, articleId: string, data: Partial<LibraryArticle>) => void;
  updateArticleDossierSections: (libraryId: string, articleId: string, sections: string[]) => void;
  deleteArticle: (libraryId: string, articleId: string) => void;
  setActiveLibrary: (id: string | null) => void;
}

const DEFAULT_COLUMNS: Omit<LibraryColumn, 'id' | 'order'>[] = [
  {
    name: 'Product',
    description: 'Brand name or product studied',
    type: 'text',
    isFilter: true,
    aiPrompt: 'Extract the product or drug name being studied in this article.',
    isDefault: true,
  },
  {
    name: 'Indication',
    description: 'Disease or condition studied',
    type: 'text',
    isFilter: true,
    aiPrompt: 'Extract the primary indication or disease being studied.',
    isDefault: true,
  },
  {
    name: 'Category',
    description: 'Broad study category (use the hierarchical category picker to filter)',
    type: 'select',
    predefinedValues: DEFAULT_CATEGORY_HIERARCHY.map((n) => n.category),
    isFilter: true,
    aiPrompt: 'Classify this article into one of the following categories: Disease Burden – Clinical, Disease Burden – Humanistic, Disease Burden – Socioeconomic, Management, Product specific, Efficacy / effectiveness, Safety, Economic value.',
    isDefault: true,
  },
  {
    name: 'Subcategory',
    description: 'Specific study subcategory within the selected category',
    type: 'select',
    predefinedValues: DEFAULT_CATEGORY_HIERARCHY.flatMap((n) => n.subcategories),
    isFilter: true,
    aiPrompt: 'Classify this article subcategory. Options include: Epidemiology, Morbidity / mortality, Caregiver impact, Patient insight, PROs, Direct costs, Indirect costs, Health resource utilisation, Productivity impact, Societal burden, Guidelines / recommendations, Treatment patterns, HTA reports, Mechanism of action, Dosing / utilisation, Regulatory, Pivotal study, Clinical efficacy / effectiveness, Comparative effectiveness, Clinical assessment outcomes, Safety – General, Safety – Specific, Budget impact, Cost effectiveness, HCRU / Cost of care.',
    isDefault: true,
  },
  {
    name: 'Publication Type',
    description: 'Type of publication',
    type: 'select',
    predefinedValues: ['Journal Article', 'Congress Abstract', 'Poster', 'Oral Presentation', 'Review', 'Letter', 'Editorial'],
    isFilter: true,
    aiPrompt: 'Identify the publication type: Journal Article, Congress Abstract, Poster, Oral Presentation, Review, Letter, or Editorial.',
    isDefault: true,
  },
  {
    name: 'Study Type',
    description: 'Methodology classification',
    type: 'select',
    predefinedValues: ['Randomized Controlled Trial', 'Open-Label Extension', 'Cohort Study', 'Case-Control', 'Cross-Sectional', 'Case Series', 'Modeling Study', 'Literature Review'],
    isFilter: true,
    aiPrompt: 'Identify the study type from: Randomized Controlled Trial, Open-Label Extension, Cohort Study, Case-Control, Cross-Sectional, Case Series, Modeling Study, Literature Review.',
    isDefault: true,
  },
  {
    name: 'Region',
    description: 'Geographic region of study',
    type: 'select',
    predefinedValues: ['North America', 'Europe', 'Asia-Pacific', 'Latin America', 'Middle East', 'Global', 'Multi-Regional'],
    isFilter: true,
    aiPrompt: 'Identify the geographic region of the study.',
    isDefault: true,
  },
  {
    name: 'N (Patients)',
    description: 'Number of patients enrolled',
    type: 'number',
    isFilter: false,
    aiPrompt: 'Extract the total number of patients enrolled in this study.',
    isDefault: true,
  },
  {
    name: 'Primary Endpoint',
    description: 'Primary study endpoint',
    type: 'text',
    isFilter: false,
    aiPrompt: 'Extract the primary endpoint or outcome measure of this study.',
    isDefault: true,
  },
  {
    name: 'Key Results',
    description: 'Summary of key results',
    type: 'text',
    isFilter: false,
    aiPrompt: 'Summarize the key results of this study in 2-3 sentences.',
    isDefault: true,
  },
  {
    name: 'Follow-up Duration',
    description: 'Duration of patient follow-up',
    type: 'text',
    isFilter: false,
    aiPrompt: 'Extract the follow-up duration of this study.',
    isDefault: true,
  },
  {
    name: 'Line of Therapy',
    description: 'Treatment line studied',
    type: 'select',
    predefinedValues: ['1L', '2L', '3L+', 'Maintenance', 'Adjuvant', 'Neoadjuvant', 'Not Applicable'],
    isFilter: true,
    aiPrompt: 'Identify the line of therapy studied: 1L, 2L, 3L+, Maintenance, Adjuvant, Neoadjuvant, or Not Applicable.',
    isDefault: true,
  },
];

function createDefaultColumns(): LibraryColumn[] {
  return DEFAULT_COLUMNS.map((col, idx) => ({
    ...col,
    id: `col-default-${idx}`,
    order: idx,
  }));
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

const INITIAL_LIBRARIES: Library[] = [
  {
    id: 'lib-1',
    name: 'Dupixent',
    innName: 'dupilumab',
    indications: ['Atopic Dermatitis', 'Asthma', 'CRSwNP', 'Prurigo Nodularis'],
    description: 'Comprehensive HEOR evidence library for dupilumab (Dupixent) in atopic dermatitis, including efficacy, safety, real-world evidence, and health economics studies.',
    createdAt: '2024-01-10T09:00:00Z',
    updatedAt: '2024-03-15T14:30:00Z',
    articleCount: 9,
    columns: createDefaultColumns(),
    dateQuickActions: DEFAULT_QUICK_ACTIONS,
    categoryHierarchy: DEFAULT_CATEGORY_HIERARCHY.map((n) => ({ ...n })),
    articles: [
      {
        id: 'art-1',
        articleNumber: 1,
        pmid: '28892958',
        title: 'Two Phase 3 Trials of Dupilumab versus Placebo in Atopic Dermatitis',
        authors: 'Simpson EL, Bieber T, Guttman-Yassky E, et al.',
        journal: 'New England Journal of Medicine',
        publicationDate: '2016-12-15',
        publicationLink: 'https://pubmed.ncbi.nlm.nih.gov/28892958',
        'col-default-0': 'Dupilumab',
        'col-default-1': 'Atopic Dermatitis',
        'col-default-2': 'Efficacy / effectiveness',
        'col-default-3': 'Clinical efficacy / effectiveness',
        'col-default-4': 'Journal Article',
        'col-default-5': 'Randomized Controlled Trial',
        'col-default-6': 'Multi-Regional',
        'col-default-7': 671,
        'col-default-8': 'IGA 0/1, EASI-75 at Week 16',
        'col-default-9': 'Dupilumab significantly improved all primary and secondary endpoints vs placebo. IGA 0/1 achieved in 36-38% vs 8-10% placebo. EASI-75 in 44-52% vs 12-15%.',
        'col-default-10': '16 weeks',
        'col-default-11': '1L',
        dossierSections: ['4.1', '4.1.1'],
      },
      {
        id: 'art-2',
        articleNumber: 2,
        pmid: '34516098',
        title: 'Dupilumab efficacy and safety in adults with moderate-to-severe atopic dermatitis: a pooled analysis of two phase 3 randomized clinical trials',
        authors: 'Wollenberg A, Blauvelt A, Guttman-Yassky E, et al.',
        journal: 'British Journal of Dermatology',
        publicationDate: '2022-02-01',
        publicationLink: 'https://pubmed.ncbi.nlm.nih.gov/34516098',
        'col-default-0': 'Dupilumab',
        'col-default-1': 'Atopic Dermatitis',
        'col-default-2': 'Efficacy / effectiveness',
        'col-default-3': 'Comparative effectiveness',
        'col-default-4': 'Journal Article',
        'col-default-5': 'Modeling Study',
        'col-default-6': 'Multi-Regional',
        'col-default-7': 1379,
        'col-default-8': 'IGA 0/1, EASI-75, NRS itch improvement',
        'col-default-9': 'Pooled analysis confirmed superiority of dupilumab across all efficacy endpoints. NNT for IGA 0/1 was 3.6.',
        'col-default-10': '52 weeks',
        'col-default-11': '1L',
        dossierSections: ['4.1', '4.1.1'],
      },
      {
        id: 'art-3',
        articleNumber: 3,
        pmid: '35879812',
        title: 'Real-world effectiveness and safety of dupilumab for atopic dermatitis: systematic review and meta-analysis',
        authors: 'Hagberg N, Liedholm R, Lonne-Rahm SB, et al.',
        journal: 'JAMA Dermatology',
        publicationDate: '2022-07-20',
        publicationLink: 'https://pubmed.ncbi.nlm.nih.gov/35879812',
        'col-default-0': 'Dupilumab',
        'col-default-1': 'Atopic Dermatitis',
        'col-default-2': 'Efficacy / effectiveness',
        'col-default-3': 'Comparative effectiveness',
        'col-default-4': 'Journal Article',
        'col-default-5': 'Systematic Review',
        'col-default-6': 'Europe',
        'col-default-7': 4837,
        'col-default-8': 'EASI, IGA, DLQI, POEM',
        'col-default-9': 'Real-world data confirmed effectiveness consistent with clinical trials. EASI-75 achieved in 61% at 16 weeks.',
        'col-default-10': '16-52 weeks',
        'col-default-11': '1L',
        dossierSections: ['4.3'],
      },
      {
        id: 'art-4',
        articleNumber: 4,
        pmid: '31893385',
        title: 'Cost-effectiveness of dupilumab for the treatment of moderate-to-severe atopic dermatitis in adults in the UK',
        authors: 'Silverberg JI, Vakharia PP, Chopra R, et al.',
        journal: 'PharmacoEconomics',
        publicationDate: '2020-03-01',
        publicationLink: 'https://pubmed.ncbi.nlm.nih.gov/31893385',
        'col-default-0': 'Dupilumab',
        'col-default-1': 'Atopic Dermatitis',
        'col-default-2': 'Economic value',
        'col-default-3': 'Cost effectiveness',
        'col-default-4': 'Journal Article',
        'col-default-5': 'Modeling Study',
        'col-default-6': 'Europe',
        'col-default-7': null,
        'col-default-8': 'ICER per QALY gained',
        'col-default-9': 'Dupilumab demonstrated cost-effectiveness at £30,000/QALY threshold for patients with moderate-to-severe AD who failed conventional therapy.',
        'col-default-10': 'Lifetime',
        'col-default-11': '2L',
        dossierSections: ['6.1'],
      },
      {
        id: 'art-5',
        articleNumber: 5,
        pmid: '33852137',
        title: 'Patient-reported outcomes with dupilumab vs placebo in moderate-to-severe atopic dermatitis: LIBERTY AD CHRONOS',
        authors: 'Blauvelt A, de Bruin-Weller M, Gooderham M, et al.',
        journal: 'Journal of the American Academy of Dermatology',
        publicationDate: '2021-08-01',
        publicationLink: 'https://pubmed.ncbi.nlm.nih.gov/33852137',
        'col-default-0': 'Dupilumab',
        'col-default-1': 'Atopic Dermatitis',
        'col-default-2': 'Disease Burden – Humanistic',
        'col-default-3': 'PROs',
        'col-default-4': 'Journal Article',
        'col-default-5': 'Randomized Controlled Trial',
        'col-default-6': 'Multi-Regional',
        'col-default-7': 740,
        'col-default-8': 'DLQI, HADS, PSQI',
        'col-default-9': 'Dupilumab significantly improved quality of life, anxiety/depression scores, and sleep quality vs placebo + TCS at week 52.',
        'col-default-10': '52 weeks',
        'col-default-11': '1L',
        dossierSections: ['4.1', '4.1.2'],
      },
      {
        id: 'art-6',
        articleNumber: 6,
        pmid: '36427004',
        title: 'Long-term safety of dupilumab in adults with moderate-to-severe atopic dermatitis: analysis of pooled data from 7 phase 2 and 3 trials',
        authors: 'Deleuran M, Thaçi D, Beck LA, et al.',
        journal: 'Journal of the European Academy of Dermatology and Venereology',
        publicationDate: '2023-01-15',
        publicationLink: 'https://pubmed.ncbi.nlm.nih.gov/36427004',
        'col-default-0': 'Dupilumab',
        'col-default-1': 'Atopic Dermatitis',
        'col-default-2': 'Safety',
        'col-default-3': 'Safety – General',
        'col-default-4': 'Journal Article',
        'col-default-5': 'Modeling Study',
        'col-default-6': 'Multi-Regional',
        'col-default-7': 2932,
        'col-default-8': 'TEAE, TRAE, SAE rates',
        'col-default-9': 'Long-term safety profile favorable. Most common TEAEs: conjunctivitis (13.6%), injection site reactions (5.2%). No increase in serious infections.',
        'col-default-10': 'Up to 3 years',
        'col-default-11': '1L',
        dossierSections: ['5.1'],
      },
      {
        id: 'art-7',
        articleNumber: 7,
        pmid: '34623382',
        title: 'Budget impact of dupilumab for atopic dermatitis in the United States',
        authors: 'Boggs RL, Bartels W, Bhatt V, et al.',
        journal: 'Journal of Managed Care & Specialty Pharmacy',
        publicationDate: '2021-11-01',
        publicationLink: 'https://pubmed.ncbi.nlm.nih.gov/34623382',
        'col-default-0': 'Dupilumab',
        'col-default-1': 'Atopic Dermatitis',
        'col-default-2': 'Economic value',
        'col-default-3': 'Budget impact',
        'col-default-4': 'Journal Article',
        'col-default-5': 'Modeling Study',
        'col-default-6': 'North America',
        'col-default-7': null,
        'col-default-8': 'Total budget impact, per member per month cost',
        'col-default-9': 'Budget impact of dupilumab formulary inclusion estimated at $0.27 PMPM increase. Offset by reduced healthcare resource utilization.',
        'col-default-10': '5 years',
        'col-default-11': '2L',
        dossierSections: ['6.2'],
      },
      {
        id: 'art-8',
        articleNumber: 8,
        pmid: '36193423',
        title: 'Epidemiology and burden of atopic dermatitis in the US adult population: a cross-sectional study',
        authors: 'Drucker AM, Wang AR, Li WQ, et al.',
        journal: 'Journal of Investigative Dermatology',
        publicationDate: '2017-01-01',
        publicationLink: 'https://pubmed.ncbi.nlm.nih.gov/36193423',
        'col-default-0': 'Not Applicable',
        'col-default-1': 'Atopic Dermatitis',
        'col-default-2': 'Disease Burden – Clinical',
        'col-default-3': 'Epidemiology',
        'col-default-4': 'Journal Article',
        'col-default-5': 'Cross-Sectional',
        'col-default-6': 'North America',
        'col-default-7': 34613,
        'col-default-8': 'Prevalence, incidence, disease burden',
        'col-default-9': 'AD prevalence in US adults: 7.3%. Moderate-severe AD: 40% of cases. Significant burden on QoL and work productivity.',
        'col-default-10': 'Cross-sectional',
        'col-default-11': 'Not Applicable',
        dossierSections: ['2.1'],
      },
      {
        id: 'art-9',
        articleNumber: 9,
        pmid: '35445695',
        title: 'Comparative effectiveness of dupilumab vs. conventional systemic treatments for moderate-to-severe atopic dermatitis',
        authors: 'Guttman-Yassky E, Bissonnette R, Ungar B, et al.',
        journal: 'Allergy',
        publicationDate: '2022-09-01',
        publicationLink: 'https://pubmed.ncbi.nlm.nih.gov/35445695',
        'col-default-0': 'Dupilumab',
        'col-default-1': 'Atopic Dermatitis',
        'col-default-2': 'Efficacy / effectiveness',
        'col-default-3': 'Comparative effectiveness',
        'col-default-4': 'Journal Article',
        'col-default-5': 'Cohort Study',
        'col-default-6': 'North America',
        'col-default-7': 892,
        'col-default-8': 'EASI, IGA, DLQI vs cyclosporine, methotrexate, azathioprine',
        'col-default-9': 'Dupilumab demonstrated superior outcomes vs conventional immunosuppressants at 16 and 52 weeks in real-world setting.',
        'col-default-10': '52 weeks',
        'col-default-11': '2L',
        dossierSections: ['4.2', '4.3'],
      },
    ],
  },
  {
    id: 'lib-2',
    name: 'Ozempic',
    innName: 'semaglutide',
    indications: ['Type 2 Diabetes', 'Obesity', 'Cardiovascular Disease'],
    description: 'HEOR evidence library for semaglutide (Ozempic/Wegovy) across type 2 diabetes and obesity indications, including CVOT outcomes, weight reduction, and economic evidence.',
    createdAt: '2024-02-05T10:00:00Z',
    updatedAt: '2024-03-18T16:00:00Z',
    articleCount: 8,
    columns: createDefaultColumns(),
    dateQuickActions: DEFAULT_QUICK_ACTIONS,
    categoryHierarchy: DEFAULT_CATEGORY_HIERARCHY.map((n) => ({ ...n })),
    articles: [
      {
        id: 'art-s1',
        articleNumber: 1,
        pmid: '29634964',
        title: 'Semaglutide and Cardiovascular Outcomes in Patients with Type 2 Diabetes (SUSTAIN-6)',
        authors: 'Marso SP, Bain SC, Consoli A, et al.',
        journal: 'New England Journal of Medicine',
        publicationDate: '2016-11-10',
        publicationLink: 'https://pubmed.ncbi.nlm.nih.gov/29634964',
        'col-default-0': 'Semaglutide',
        'col-default-1': 'Type 2 Diabetes',
        'col-default-2': 'Efficacy / effectiveness',
        'col-default-3': 'Clinical efficacy / effectiveness',
        'col-default-4': 'Journal Article',
        'col-default-5': 'Randomized Controlled Trial',
        'col-default-6': 'Multi-Regional',
        'col-default-7': 3297,
        'col-default-8': 'MACE (CV death, non-fatal MI, non-fatal stroke)',
        'col-default-9': 'Semaglutide reduced MACE by 26% vs placebo (HR 0.74, 95% CI 0.58–0.95). Significant reductions in HbA1c and body weight.',
        'col-default-10': '104 weeks',
        'col-default-11': '1L',
      },
      {
        id: 'art-s2',
        articleNumber: 2,
        pmid: '34633860',
        title: 'Once-weekly semaglutide in adults with overweight or obesity (STEP 1)',
        authors: 'Wilding JPH, Batterham RL, Calanna S, et al.',
        journal: 'New England Journal of Medicine',
        publicationDate: '2021-03-18',
        publicationLink: 'https://pubmed.ncbi.nlm.nih.gov/34633860',
        'col-default-0': 'Semaglutide 2.4mg',
        'col-default-1': 'Obesity',
        'col-default-2': 'Efficacy / effectiveness',
        'col-default-3': 'Clinical efficacy / effectiveness',
        'col-default-4': 'Journal Article',
        'col-default-5': 'Randomized Controlled Trial',
        'col-default-6': 'Multi-Regional',
        'col-default-7': 1961,
        'col-default-8': '≥5% body weight reduction at 68 weeks',
        'col-default-9': 'Mean weight loss: 14.9% semaglutide vs 2.4% placebo. 86.4% achieved ≥5% weight reduction. Significant improvements in cardiometabolic risk factors.',
        'col-default-10': '68 weeks',
        'col-default-11': '1L',
      },
      {
        id: 'art-s3',
        articleNumber: 3,
        pmid: '36622835',
        title: 'Cost-effectiveness of semaglutide 2.4 mg for the treatment of obesity in the United States',
        authors: 'Capehorn MS, Catarig AM, Furberg JK, et al.',
        journal: 'Diabetes, Obesity and Metabolism',
        publicationDate: '2023-04-01',
        publicationLink: 'https://pubmed.ncbi.nlm.nih.gov/36622835',
        'col-default-0': 'Semaglutide 2.4mg',
        'col-default-1': 'Obesity',
        'col-default-2': 'Economic value',
        'col-default-3': 'Cost effectiveness',
        'col-default-4': 'Journal Article',
        'col-default-5': 'Modeling Study',
        'col-default-6': 'North America',
        'col-default-7': null,
        'col-default-8': 'ICER per QALY gained',
        'col-default-9': 'Semaglutide was cost-effective vs lifestyle intervention at $150,000/QALY threshold. ICER: $108,000/QALY. Driven by reduced CV events and comorbidities.',
        'col-default-10': 'Lifetime',
        'col-default-11': '1L',
      },
      {
        id: 'art-s4',
        articleNumber: 4,
        pmid: '35499086',
        title: 'Real-world effectiveness of once-weekly semaglutide in type 2 diabetes: SURE Denmark/Sweden study',
        authors: 'Lingvay I, Catarig AM, Frandsen CS, et al.',
        journal: 'Diabetes Care',
        publicationDate: '2022-07-01',
        publicationLink: 'https://pubmed.ncbi.nlm.nih.gov/35499086',
        'col-default-0': 'Semaglutide',
        'col-default-1': 'Type 2 Diabetes',
        'col-default-2': 'Efficacy / effectiveness',
        'col-default-3': 'Comparative effectiveness',
        'col-default-4': 'Journal Article',
        'col-default-5': 'Cohort Study',
        'col-default-6': 'Europe',
        'col-default-7': 1545,
        'col-default-8': 'HbA1c change, body weight change at 30 weeks',
        'col-default-9': 'Real-world HbA1c reduction: -1.4% (baseline 8.4%). Weight loss: -4.7 kg. Consistent with clinical trial results.',
        'col-default-10': '30 weeks',
        'col-default-11': '2L',
      },
      {
        id: 'art-s5',
        articleNumber: 5,
        pmid: '37285075',
        title: 'Patient-reported outcomes with semaglutide 2.4mg in the STEP program: pooled analysis',
        authors: 'Kolotkin RL, Batterham RL, Bhatta M, et al.',
        journal: 'Obesity',
        publicationDate: '2023-08-01',
        publicationLink: 'https://pubmed.ncbi.nlm.nih.gov/37285075',
        'col-default-0': 'Semaglutide 2.4mg',
        'col-default-1': 'Obesity',
        'col-default-2': 'Disease Burden – Humanistic',
        'col-default-3': 'PROs',
        'col-default-4': 'Journal Article',
        'col-default-5': 'Modeling Study',
        'col-default-6': 'Multi-Regional',
        'col-default-7': 4532,
        'col-default-8': 'IWQOL-Lite-CT, SF-36',
        'col-default-9': 'Significant improvements in physical function, mental health, and work productivity with semaglutide vs placebo.',
        'col-default-10': '68 weeks',
        'col-default-11': '1L',
      },
      {
        id: 'art-s6',
        articleNumber: 6,
        pmid: '37952189',
        title: 'Cardiovascular outcomes with semaglutide in patients with obesity and established cardiovascular disease (SELECT)',
        authors: 'Lincoff AM, Brown-Frandsen K, Colhoun HM, et al.',
        journal: 'New England Journal of Medicine',
        publicationDate: '2023-11-11',
        publicationLink: 'https://pubmed.ncbi.nlm.nih.gov/37952189',
        'col-default-0': 'Semaglutide 2.4mg',
        'col-default-1': 'Obesity / Cardiovascular Disease',
        'col-default-2': 'Efficacy / effectiveness',
        'col-default-3': 'Clinical efficacy / effectiveness',
        'col-default-4': 'Journal Article',
        'col-default-5': 'Randomized Controlled Trial',
        'col-default-6': 'Multi-Regional',
        'col-default-7': 17604,
        'col-default-8': 'MACE (CV death, non-fatal MI, non-fatal stroke)',
        'col-default-9': 'Semaglutide reduced MACE by 20% in obese patients without diabetes (HR 0.80, 95% CI 0.72-0.90). Landmark trial in non-diabetic population.',
        'col-default-10': '3.3 years (median)',
        'col-default-11': '1L',
      },
      {
        id: 'art-s7',
        articleNumber: 7,
        pmid: '35796025',
        title: 'Global prevalence and economic burden of type 2 diabetes: systematic review',
        authors: 'Sun H, Saeedi P, Karuranga S, et al.',
        journal: 'Diabetes Research and Clinical Practice',
        publicationDate: '2022-01-01',
        publicationLink: 'https://pubmed.ncbi.nlm.nih.gov/35796025',
        'col-default-0': 'Not Applicable',
        'col-default-1': 'Type 2 Diabetes',
        'col-default-2': 'Disease Burden – Clinical',
        'col-default-3': 'Epidemiology',
        'col-default-4': 'Journal Article',
        'col-default-5': 'Systematic Review',
        'col-default-6': 'Global',
        'col-default-7': null,
        'col-default-8': 'Prevalence, incidence, economic burden',
        'col-default-9': '537 million adults (10.5%) living with diabetes. Projected 643 million by 2030. Global health expenditure: $966 billion (2021).',
        'col-default-10': 'Cross-sectional (2021)',
        'col-default-11': 'Not Applicable',
      },
      {
        id: 'art-s8',
        articleNumber: 8,
        pmid: '36462488',
        title: 'Semaglutide safety and tolerability: integrated analysis from SUSTAIN and STEP trials',
        authors: 'Davies M, Piber H, Norwood P, et al.',
        journal: 'Diabetes, Obesity and Metabolism',
        publicationDate: '2023-03-01',
        publicationLink: 'https://pubmed.ncbi.nlm.nih.gov/36462488',
        'col-default-0': 'Semaglutide',
        'col-default-1': 'Type 2 Diabetes / Obesity',
        'col-default-2': 'Safety',
        'col-default-3': 'Safety – General',
        'col-default-4': 'Journal Article',
        'col-default-5': 'Modeling Study',
        'col-default-6': 'Multi-Regional',
        'col-default-7': 8726,
        'col-default-8': 'GI AEs, pancreatitis, thyroid events, SAEs',
        'col-default-9': 'GI events most common (nausea 15-44%, vomiting 5-24%). Mostly mild-moderate, early, transient. No increased pancreatitis or thyroid cancer risk.',
        'col-default-10': 'Varies (16-104 weeks)',
        'col-default-11': '1L',
      },
    ],
  },
];

export const useLibraryStore = create<LibraryState>()(
  persist(
    (set, get) => ({
      libraries: INITIAL_LIBRARIES,
      activeLibraryId: null,

      createLibrary: (data) => {
        const newLibrary: Library = {
          ...data,
          id: `lib-${generateId()}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          articleCount: 0,
          columns: createDefaultColumns(),
          articles: [],
          dateQuickActions: [...DEFAULT_QUICK_ACTIONS],
          categoryHierarchy: DEFAULT_CATEGORY_HIERARCHY.map((n) => ({ ...n })),
        };
        set((state) => ({ libraries: [...state.libraries, newLibrary] }));
        return newLibrary;
      },

      updateDateQuickActions: (libraryId, actions) => {
        set((state) => ({
          libraries: state.libraries.map((lib) =>
            lib.id === libraryId
              ? { ...lib, dateQuickActions: actions, updatedAt: new Date().toISOString() }
              : lib
          ),
        }));
      },

      updateCategoryHierarchy: (libraryId, hierarchy) => {
        set((state) => ({
          libraries: state.libraries.map((lib) =>
            lib.id === libraryId
              ? { ...lib, categoryHierarchy: hierarchy, updatedAt: new Date().toISOString() }
              : lib
          ),
        }));
      },

      updateLibrary: (id, data) => {
        set((state) => ({
          libraries: state.libraries.map((lib) =>
            lib.id === id ? { ...lib, ...data, updatedAt: new Date().toISOString() } : lib
          ),
        }));
      },

      deleteLibrary: (id) => {
        set((state) => ({
          libraries: state.libraries.filter((lib) => lib.id !== id),
          activeLibraryId: state.activeLibraryId === id ? null : state.activeLibraryId,
        }));
      },

      addColumn: (libraryId, columnData) => {
        const column: LibraryColumn = {
          ...columnData,
          id: `col-${generateId()}`,
          order: 0,
        };
        set((state) => ({
          libraries: state.libraries.map((lib) => {
            if (lib.id !== libraryId) return lib;
            const maxOrder = lib.columns.reduce((max, c) => Math.max(max, c.order || 0), 0);
            return {
              ...lib,
              columns: [...lib.columns, { ...column, order: maxOrder + 1 }],
              updatedAt: new Date().toISOString(),
            };
          }),
        }));
      },

      updateColumn: (libraryId, columnId, data) => {
        set((state) => ({
          libraries: state.libraries.map((lib) =>
            lib.id === libraryId
              ? {
                  ...lib,
                  columns: lib.columns.map((col) => (col.id === columnId ? { ...col, ...data } : col)),
                  updatedAt: new Date().toISOString(),
                }
              : lib
          ),
        }));
      },

      deleteColumn: (libraryId, columnId) => {
        set((state) => ({
          libraries: state.libraries.map((lib) =>
            lib.id === libraryId
              ? { ...lib, columns: lib.columns.filter((col) => col.id !== columnId), updatedAt: new Date().toISOString() }
              : lib
          ),
        }));
      },

      addArticle: (libraryId, articleData) => {
        const library = get().libraries.find((l) => l.id === libraryId);
        if (!library) return;
        const articleNumber = library.articles.length + 1;
        const article = {
          ...articleData,
          id: `art-${generateId()}`,
          articleNumber,
        } as LibraryArticle;
        set((state) => ({
          libraries: state.libraries.map((lib) =>
            lib.id === libraryId
              ? { ...lib, articles: [...lib.articles, article], articleCount: lib.articleCount + 1, updatedAt: new Date().toISOString() }
              : lib
          ),
        }));
      },

      updateArticle: (libraryId, articleId, data) => {
        set((state) => ({
          libraries: state.libraries.map((lib) =>
            lib.id === libraryId
              ? {
                  ...lib,
                  articles: lib.articles.map((art) => (art.id === articleId ? { ...art, ...data } : art)),
                  updatedAt: new Date().toISOString(),
                }
              : lib
          ),
        }));
      },

      updateArticleDossierSections: (libraryId, articleId, sections) => {
        set((state) => ({
          libraries: state.libraries.map((lib) =>
            lib.id === libraryId
              ? {
                  ...lib,
                  articles: lib.articles.map((art) =>
                    art.id === articleId ? { ...art, dossierSections: sections } : art
                  ),
                  updatedAt: new Date().toISOString(),
                }
              : lib
          ),
        }));
      },

      deleteArticle: (libraryId, articleId) => {
        set((state) => ({
          libraries: state.libraries.map((lib) =>
            lib.id === libraryId
              ? {
                  ...lib,
                  articles: lib.articles.filter((art) => art.id !== articleId),
                  articleCount: lib.articleCount - 1,
                  updatedAt: new Date().toISOString(),
                }
              : lib
          ),
        }));
      },

      setActiveLibrary: (id) => {
        set({ activeLibraryId: id });
      },
    }),
    {
      name: 'ehcore-libraries',
      version: 3,
      migrate: (persistedState: any, version: number) => {
        const state = persistedState as { libraries?: any[] };
        if (version < 2) {
          // Backfill categoryHierarchy on libraries that predate this field
          if (Array.isArray(state.libraries)) {
            state.libraries = state.libraries.map((lib: any) => ({
              ...lib,
              categoryHierarchy: lib.categoryHierarchy ?? DEFAULT_CATEGORY_HIERARCHY.map((n) => ({ ...n })),
            }));
          }
        }
        if (version < 3) {
          // Seed dossierSections on known Dupixent articles
          const SEED: Record<string, string[]> = {
            'art-1': ['4.1', '4.1.1'],
            'art-2': ['4.1', '4.1.1'],
            'art-3': ['4.3'],
            'art-4': ['6.1'],
            'art-5': ['4.1', '4.1.2'],
            'art-6': ['5.1'],
            'art-7': ['6.2'],
            'art-8': ['2.1'],
            'art-9': ['4.2', '4.3'],
          };
          if (Array.isArray(state.libraries)) {
            state.libraries = state.libraries.map((lib: any) => ({
              ...lib,
              articles: (lib.articles ?? []).map((art: any) => ({
                ...art,
                dossierSections: art.dossierSections ?? SEED[art.id] ?? [],
              })),
            }));
          }
        }
        return persistedState;
      },
    }
  )
);
