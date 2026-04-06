import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Library, LibraryColumn, LibraryArticle, DateQuickAction, CategoryNode, CellMeta, TrainingRecord } from '@/types';

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
  trainingRecords: TrainingRecord[];
  createLibrary: (data: { name: string; innName: string; indications: string[]; description: string; columns?: LibraryColumn[]; categoryHierarchy?: CategoryNode[] }) => Library;
  updateLibrary: (id: string, data: Partial<Library>) => void;
  updateDateQuickActions: (libraryId: string, actions: DateQuickAction[]) => void;
  updateCategoryHierarchy: (libraryId: string, hierarchy: CategoryNode[]) => void;
  deleteLibrary: (id: string) => void;
  addColumn: (libraryId: string, column: Omit<LibraryColumn, 'id' | 'order'>) => void;
  updateColumn: (libraryId: string, columnId: string, data: Partial<LibraryColumn>) => void;
  deleteColumn: (libraryId: string, columnId: string) => void;
  addArticle: (libraryId: string, article: Omit<LibraryArticle, 'id' | 'articleNumber'>) => LibraryArticle | null;
  updateArticle: (libraryId: string, articleId: string, data: Partial<LibraryArticle>) => void;
  updateArticleDossierSections: (libraryId: string, articleId: string, sections: string[]) => void;
  deleteArticle: (libraryId: string, articleId: string) => void;
  bulkProcessArticles: (libraryId: string, articleIds: string[]) => Promise<void>;
  addTrainingRecord: (record: Omit<TrainingRecord, 'id' | 'timestamp'>) => void;
  setActiveLibrary: (id: string | null) => void;
}

export const DEFAULT_COLUMNS: Omit<LibraryColumn, 'id' | 'order'>[] = [
  {
    name: 'Product',
    description: 'Key product article reports on',
    type: 'select',
    predefinedValues: [],
    isFilter: true,
    aiPrompt: 'Based on the main reported product(s) in the article assign a Brand name (INN name); for example if it\'s a clinical trial of Product X vs chemotherapy, consider Product X. Publications may only report the INN name. Cross-reference with input brand names to see which to apply. If more than one product is reported on, use "Multiple". If no specific product is mentioned, then use "Nonspecific".',
    isDefault: true,
  },
  {
    name: 'Indication',
    description: 'Indications reported on',
    type: 'select',
    predefinedValues: [],
    isFilter: true,
    aiPrompt: 'Based on the indication reported on, assign an indication tag, which a user will predefine.',
    isDefault: true,
  },
  {
    name: 'Publication Type',
    description: 'Type of publication',
    type: 'select',
    predefinedValues: ['Manuscript', 'Conference', 'HTA / Regulatory', 'Data-on-File', 'Press Release', 'Other'],
    isFilter: true,
    aiPrompt: 'There are 6 options: Manuscript, Conference, HTA / Regulatory, Data-on-File, Press Release, Other. Apply Manuscript if it\'s a full-text article; Conference if its an abstract from a conference or congress; HTA / Regulatory for HTA reports or regulatory documents such as FDA patient information leaflets or SmPCs; Data-on-file if its an internal document; Press-release to news articles or investor reports, and Other for everything else.',
    isDefault: true,
  },
  {
    name: 'Study Type',
    description: 'Type of study generating the relevant data',
    type: 'select',
    predefinedValues: ['Clinical', 'Extension', 'Real-World', 'SLR / TLR', 'NMA / ITCs', 'Economic', 'Other'],
    isFilter: true,
    aiPrompt: 'There are 7 options: Clinical, Extension, Real-World, SLR / TLR, NMA / ITCs, Economic, Other. Apply Clinical for all clinical studies from randomised clinical trials to open-label studies, or post-hoc analysis on data generated from a clinical study or setting. Extension studies for those that are extensions to either a Phase II or Phase III clinical trial. Real World for studies reporting on real-world use including registry studies, claims database analysis or retrospective medical/hospital record analysis. SLR / TLR for systematic or targeted literature reviews; NMA / ITCs for reviews with meta-analyses or indirect treatment comparisons for the specified indication. Economic for articles reporting on healthcare resource utilisation, cost effectiveness, cost utility, or budget impact of a product. Apply Other for all others, particularly to articles on endpoint or PRO instrument development, psychometric validation (incl. focus groups, qualitative studies, social listening, etc.)',
    isDefault: true,
  },
  {
    name: 'Study Sponsor',
    description: 'Sponsor of the study',
    type: 'select',
    predefinedValues: ['Industry', 'Academia'],
    isFilter: true,
    aiPrompt: '2 options: Industry or Academia. Need to determine who the key sponsor is based on whats mentioned in the acknowledgements whether is sponsored by a Pharmaceutical or biotech company (Industry) or whether its done without industry funding (Academia).',
    isDefault: true,
  },
  {
    name: 'Geography',
    description: 'Geography of the study and reported data',
    type: 'select',
    predefinedValues: ['Global', 'United States', 'Canada', 'UK', 'France', 'Germany', 'Italy', 'Spain', 'Western Europe', 'LatAm', 'MENA', 'APAC'],
    isFilter: true,
    aiPrompt: 'Identify countries or regions from where participants in the study were included. Global (if more than 2 countries across 2 continents), named countries like United States, Canada, UK, France, etc. Can generalise to regions like Western Europe, LatAm, MENA (Middle East & North Africa) or APAC if more than 2 countries from the respective regions are reported on.',
    isDefault: true,
  },
  {
    name: 'Category',
    description: 'Broad study category (use the hierarchical category picker to filter)',
    type: 'select',
    predefinedValues: DEFAULT_CATEGORY_HIERARCHY.map((n) => n.category),
    isFilter: true,
    aiPrompt: 'Classify each article into one of the following categories based on what is reported (i.e. in results and conclusion sections) rather than what is mentioned: Disease Burden – Clinical, Disease Burden – Humanistic, Disease Burden – Socioeconomic, Management, Product specific, Efficacy / effectiveness, Safety, Economic value.',
    isDefault: true,
  },
  {
    name: 'Subcategory',
    description: 'Specific study subcategory within the selected category',
    type: 'select',
    predefinedValues: DEFAULT_CATEGORY_HIERARCHY.flatMap((n) => n.subcategories),
    isFilter: true,
    aiPrompt: 'Classify this article subcategory. Options are linked to Category applied and here are the options: Disease Burden – Clinical: Epidemiology, Morbidity / mortality; Disease Burden – Humanistic: Caregiver impact, Patient insight, PROs; Disease Burden – Socioeconomic: Direct costs, Indirect costs, Health resource utilisation, Caregiver impact, Productivity impact, Societal burden; Management: Guidelines / recommendations, Treatment patterns, HTA reports; Product specific: Mechanism of action, Dosing / utilisation, Regulatory, Pivotal study; Efficacy / effectiveness: Clinical efficacy / effectiveness, Comparative effectiveness, Clinical assessment outcomes; Safety: Safety – General, Safety – Specific; Economic value: Budget impact, Cost effectiveness, HCRU / Cost of care.',
    isDefault: true,
  },
  {
    name: 'Study Population',
    description: 'Specific patient population reported on',
    type: 'text',
    isFilter: false,
    aiPrompt: 'Extract specific patient population reported on the article. Bring as much nuance as possible to include descriptors like age, biomarkers, disease status, treatment status, etc, if mentioned.',
    isDefault: true,
  },
  {
    name: 'Interventions',
    description: 'Interventions studied and reported on',
    type: 'text',
    isFilter: false,
    aiPrompt: 'List all products studied and reported on in the article using INN names.',
    isDefault: true,
  },
  {
    name: 'Primary Outcomes',
    description: 'Primary objective or outcome studied in the article',
    type: 'text',
    isFilter: false,
    aiPrompt: 'Identify the key objective and primary outcome measure of the study. This would correlate with Study Type, mainly for clinical, extension, real-world, NMA / ITCs, and economic.',
    isDefault: true,
  },
  {
    name: 'Secondary Outcomes',
    description: 'Secondary or additional objectives or outcome studied in the article',
    type: 'text',
    isFilter: false,
    aiPrompt: 'Identify the secondary objectives and outcome measure of the study. This would correlate with Study Type, mainly for clinical, extension, real-world, NMA / ITCs, and economic.',
    isDefault: true,
  },
];

export function createDefaultColumns(): LibraryColumn[] {
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
        'col-default-2': 'Manuscript',
        'col-default-3': 'Clinical',
        'col-default-4': 'Industry',
        'col-default-5': 'Global',
        'col-default-6': 'Efficacy / effectiveness',
        'col-default-7': 'Clinical efficacy / effectiveness',
        'col-default-8': 'Adults with moderate-to-severe AD inadequately controlled by topical prescription medications',
        'col-default-9': 'Dupilumab 300mg q2w, dupilumab 300mg qw, placebo',
        'col-default-10': 'IGA 0/1, EASI-75 at Week 16',
        'col-default-11': 'NRS itch improvement, DLQI, POEM, HADS',
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
        'col-default-2': 'Manuscript',
        'col-default-3': 'Clinical',
        'col-default-4': 'Industry',
        'col-default-5': 'Global',
        'col-default-6': 'Efficacy / effectiveness',
        'col-default-7': 'Comparative effectiveness',
        'col-default-8': 'Adults with moderate-to-severe AD from two phase 3 RCTs',
        'col-default-9': 'Dupilumab 300mg, placebo',
        'col-default-10': 'IGA 0/1, EASI-75, NRS itch improvement',
        'col-default-11': 'NNT analysis, subgroup analyses by baseline severity',
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
        'col-default-2': 'Manuscript',
        'col-default-3': 'SLR / TLR',
        'col-default-4': 'Academia',
        'col-default-5': 'Global',
        'col-default-6': 'Efficacy / effectiveness',
        'col-default-7': 'Comparative effectiveness',
        'col-default-8': 'Adults with moderate-to-severe AD in real-world clinical settings',
        'col-default-9': 'Dupilumab',
        'col-default-10': 'EASI, IGA, DLQI, POEM',
        'col-default-11': 'Treatment persistence, safety outcomes in real-world use',
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
        'col-default-2': 'Manuscript',
        'col-default-3': 'Economic',
        'col-default-4': 'Industry',
        'col-default-5': 'UK',
        'col-default-6': 'Economic value',
        'col-default-7': 'Cost effectiveness',
        'col-default-8': 'Adults with moderate-to-severe AD who failed conventional therapy',
        'col-default-9': 'Dupilumab, best supportive care',
        'col-default-10': 'ICER per QALY gained',
        'col-default-11': 'Budget impact, sensitivity analyses',
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
        'col-default-2': 'Manuscript',
        'col-default-3': 'Clinical',
        'col-default-4': 'Industry',
        'col-default-5': 'Global',
        'col-default-6': 'Disease Burden – Humanistic',
        'col-default-7': 'PROs',
        'col-default-8': 'Adults with moderate-to-severe AD receiving dupilumab + TCS',
        'col-default-9': 'Dupilumab + TCS, placebo + TCS',
        'col-default-10': 'DLQI, HADS, PSQI',
        'col-default-11': 'Work productivity, treatment satisfaction',
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
        'col-default-2': 'Manuscript',
        'col-default-3': 'Clinical',
        'col-default-4': 'Industry',
        'col-default-5': 'Global',
        'col-default-6': 'Safety',
        'col-default-7': 'Safety – General',
        'col-default-8': 'Adults with moderate-to-severe AD from 7 phase 2/3 trials',
        'col-default-9': 'Dupilumab, placebo',
        'col-default-10': 'TEAE, TRAE, SAE rates',
        'col-default-11': 'Conjunctivitis, injection site reactions, serious infections',
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
        'col-default-2': 'Manuscript',
        'col-default-3': 'Economic',
        'col-default-4': 'Industry',
        'col-default-5': 'United States',
        'col-default-6': 'Economic value',
        'col-default-7': 'Budget impact',
        'col-default-8': 'US health plan population with moderate-to-severe AD',
        'col-default-9': 'Dupilumab',
        'col-default-10': 'Total budget impact, per member per month cost',
        'col-default-11': 'Healthcare resource utilization offset',
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
        'col-default-0': 'Nonspecific',
        'col-default-1': 'Atopic Dermatitis',
        'col-default-2': 'Manuscript',
        'col-default-3': 'Other',
        'col-default-4': 'Academia',
        'col-default-5': 'United States',
        'col-default-6': 'Disease Burden – Clinical',
        'col-default-7': 'Epidemiology',
        'col-default-8': 'US adults from NHANES survey',
        'col-default-9': 'Nonspecific',
        'col-default-10': 'Prevalence, incidence, disease burden',
        'col-default-11': 'QoL impact, work productivity burden',
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
        'col-default-2': 'Manuscript',
        'col-default-3': 'Real-World',
        'col-default-4': 'Industry',
        'col-default-5': 'United States',
        'col-default-6': 'Efficacy / effectiveness',
        'col-default-7': 'Comparative effectiveness',
        'col-default-8': 'Adults with moderate-to-severe AD switching from conventional systemic therapy',
        'col-default-9': 'Dupilumab, cyclosporine, methotrexate, azathioprine',
        'col-default-10': 'EASI, IGA, DLQI vs conventional immunosuppressants',
        'col-default-11': 'Treatment discontinuation rates, safety comparisons',
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
        'col-default-2': 'Manuscript',
        'col-default-3': 'Clinical',
        'col-default-4': 'Industry',
        'col-default-5': 'Global',
        'col-default-6': 'Efficacy / effectiveness',
        'col-default-7': 'Clinical efficacy / effectiveness',
        'col-default-8': 'Adults with T2D and high cardiovascular risk',
        'col-default-9': 'Semaglutide 0.5mg, semaglutide 1.0mg, placebo',
        'col-default-10': 'MACE (CV death, non-fatal MI, non-fatal stroke)',
        'col-default-11': 'HbA1c change, body weight change, individual MACE components',
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
        'col-default-2': 'Manuscript',
        'col-default-3': 'Clinical',
        'col-default-4': 'Industry',
        'col-default-5': 'Global',
        'col-default-6': 'Efficacy / effectiveness',
        'col-default-7': 'Clinical efficacy / effectiveness',
        'col-default-8': 'Adults with BMI ≥30 or ≥27 with weight-related comorbidity, without diabetes',
        'col-default-9': 'Semaglutide 2.4mg, placebo',
        'col-default-10': '≥5% body weight reduction at 68 weeks',
        'col-default-11': 'Waist circumference, blood pressure, lipid profile, CRP',
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
        'col-default-2': 'Manuscript',
        'col-default-3': 'Economic',
        'col-default-4': 'Industry',
        'col-default-5': 'United States',
        'col-default-6': 'Economic value',
        'col-default-7': 'Cost effectiveness',
        'col-default-8': 'Adults with obesity in the US healthcare system',
        'col-default-9': 'Semaglutide 2.4mg, lifestyle intervention',
        'col-default-10': 'ICER per QALY gained',
        'col-default-11': 'Cardiovascular event reduction, comorbidity resolution',
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
        'col-default-2': 'Manuscript',
        'col-default-3': 'Real-World',
        'col-default-4': 'Industry',
        'col-default-5': 'Western Europe',
        'col-default-6': 'Efficacy / effectiveness',
        'col-default-7': 'Clinical efficacy / effectiveness',
        'col-default-8': 'Adults with T2D in routine clinical practice in Denmark and Sweden',
        'col-default-9': 'Semaglutide',
        'col-default-10': 'HbA1c change, body weight change at 30 weeks',
        'col-default-11': 'Treatment satisfaction, treatment persistence',
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
        'col-default-2': 'Manuscript',
        'col-default-3': 'Clinical',
        'col-default-4': 'Industry',
        'col-default-5': 'Global',
        'col-default-6': 'Disease Burden – Humanistic',
        'col-default-7': 'PROs',
        'col-default-8': 'Adults with overweight or obesity from STEP trials',
        'col-default-9': 'Semaglutide 2.4mg, placebo',
        'col-default-10': 'IWQOL-Lite-CT, SF-36',
        'col-default-11': 'Physical function, mental health, work productivity',
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
        'col-default-2': 'Manuscript',
        'col-default-3': 'Clinical',
        'col-default-4': 'Industry',
        'col-default-5': 'Global',
        'col-default-6': 'Efficacy / effectiveness',
        'col-default-7': 'Clinical efficacy / effectiveness',
        'col-default-8': 'Adults with BMI ≥27 and established cardiovascular disease, without diabetes',
        'col-default-9': 'Semaglutide 2.4mg, placebo',
        'col-default-10': 'MACE (CV death, non-fatal MI, non-fatal stroke)',
        'col-default-11': 'All-cause mortality, heart failure hospitalization, body weight change',
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
        'col-default-0': 'Nonspecific',
        'col-default-1': 'Type 2 Diabetes',
        'col-default-2': 'Manuscript',
        'col-default-3': 'SLR / TLR',
        'col-default-4': 'Academia',
        'col-default-5': 'Global',
        'col-default-6': 'Disease Burden – Clinical',
        'col-default-7': 'Epidemiology',
        'col-default-8': 'Global adult population aged 20-79 years',
        'col-default-9': 'Nonspecific',
        'col-default-10': 'Prevalence, incidence, economic burden',
        'col-default-11': 'Regional prevalence differences, projected trends',
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
        'col-default-2': 'Manuscript',
        'col-default-3': 'Clinical',
        'col-default-4': 'Industry',
        'col-default-5': 'Global',
        'col-default-6': 'Safety',
        'col-default-7': 'Safety – General',
        'col-default-8': 'Adults with T2D or obesity from SUSTAIN and STEP programs',
        'col-default-9': 'Semaglutide, placebo',
        'col-default-10': 'GI AEs, pancreatitis, thyroid events, SAEs',
        'col-default-11': 'Injection site reactions, treatment discontinuation due to AEs',
      },
    ],
  },
];

export const useLibraryStore = create<LibraryState>()(
  persist(
    (set, get) => ({
      libraries: INITIAL_LIBRARIES,
      activeLibraryId: null,
      trainingRecords: [] as TrainingRecord[],

      createLibrary: (data) => {
        const { columns, categoryHierarchy, ...rest } = data;
        const newLibrary: Library = {
          ...rest,
          id: `lib-${generateId()}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          articleCount: 0,
          columns: columns ?? createDefaultColumns(),
          articles: [],
          dateQuickActions: [...DEFAULT_QUICK_ACTIONS],
          categoryHierarchy: categoryHierarchy ?? DEFAULT_CATEGORY_HIERARCHY.map((n) => ({ ...n })),
          dossierEnabled: false,
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
        if (!library) return null;
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
        return article;
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

      bulkProcessArticles: async (libraryId, articleIds) => {
        const library = get().libraries.find((l) => l.id === libraryId);
        if (!library) return;
        // Simulate AI extraction delay (~400ms per article, max 5s)
        const delay = Math.min(400 * articleIds.length, 5000);
        await new Promise((resolve) => setTimeout(resolve, delay));

        const PRODUCT_KEYWORDS: Record<string, string> = {
          dupilumab: 'Dupilumab', dupixent: 'Dupilumab', 'il-4': 'Dupilumab', 'il-13': 'Dupilumab',
          semaglutide: 'Semaglutide', ozempic: 'Semaglutide', wegovy: 'Semaglutide 2.4mg', rybelsus: 'Semaglutide',
        };
        const INDICATION_KEYWORDS: Record<string, string> = {
          'atopic dermatitis': 'Atopic Dermatitis', eczema: 'Atopic Dermatitis',
          asthma: 'Asthma', 'prurigo nodularis': 'Prurigo Nodularis',
          'allergic rhinitis': 'Allergic Rhinitis',
          'type 2 diabetes': 'Type 2 Diabetes', 't2d': 'Type 2 Diabetes', 't2dm': 'Type 2 Diabetes',
          obesity: 'Obesity', overweight: 'Obesity',
          'cardiovascular': 'Cardiovascular Disease',
        };
        const SPONSOR_KEYWORDS: Record<string, string> = {
          'sanofi': 'Industry', 'regeneron': 'Industry', 'novo nordisk': 'Industry',
          'pfizer': 'Industry', 'roche': 'Industry', 'novartis': 'Industry', 'abbvie': 'Industry',
          'gsk': 'Industry', 'astrazeneca': 'Industry', 'merck': 'Industry', 'lilly': 'Industry',
          'sponsored by': 'Industry', 'funded by': 'Industry',
        };
        const GEOGRAPHY_KEYWORDS: Record<string, string> = {
          'united states': 'United States', 'u.s.': 'United States', 'us ': 'United States',
          'canada': 'Canada', 'uk': 'UK', 'united kingdom': 'UK',
          'france': 'France', 'germany': 'Germany', 'italy': 'Italy', 'spain': 'Spain',
          'global': 'Global', 'multinational': 'Global', 'multiregional': 'Global', 'multi-regional': 'Global',
          'europe': 'Western Europe', 'european': 'Western Europe',
          'latin america': 'LatAm', 'asia': 'APAC', 'middle east': 'MENA',
        };

        function inferText(text: string, map: Record<string, string>, fallback: string): string {
          const lower = text.toLowerCase();
          for (const [kw, val] of Object.entries(map)) {
            if (lower.includes(kw)) return val;
          }
          return fallback;
        }

        const allTrainingRecords = get().trainingRecords.filter((r) => r.libraryId === libraryId);

        set((state) => ({
          libraries: state.libraries.map((lib) => {
            if (lib.id !== libraryId) return lib;
            return {
              ...lib,
              updatedAt: new Date().toISOString(),
              articles: lib.articles.map((art) => {
                if (!articleIds.includes(art.id)) return art;
                const textBlob = `${art.title} ${art.authors ?? ''} ${art.abstract ?? ''}`.toLowerCase();
                const updates: Record<string, any> = {};
                const cellMeta: Record<string, CellMeta> = { ...(art._cellMeta || {}) };
                for (const col of lib.columns) {
                  const existing = art[col.id];
                  if (existing !== undefined && existing !== '' && existing !== 'AI-generated value') continue;

                  // ── Check training records first (highest priority) ─────────
                  const colRecords = allTrainingRecords.filter(
                    (r) => r.columnId === col.id && r.userValue !== '' && r.userValue !== r.aiValue
                  );
                  if (colRecords.length > 0) {
                    // Find the most recent training record whose context snippet keywords appear in this article
                    const matched = colRecords.find((r) => {
                      const snippetWords = r.abstractSnippet.toLowerCase().split(/\W+/).filter((w) => w.length > 4);
                      const matchCount = snippetWords.filter((w) => textBlob.includes(w)).length;
                      return matchCount >= Math.max(2, Math.floor(snippetWords.length * 0.3));
                    });
                    if (matched) {
                      updates[col.id] = matched.userValue;
                      cellMeta[col.id] = {
                        confidence: 96,
                        reasoning: `Learned from ${colRecords.length} prior correction(s): matched context from training data`,
                        sourceSnippet: matched.abstractSnippet.slice(0, 120),
                      };
                      continue;
                    }
                  }

                  const colName = col.name.toLowerCase();
                  if (colName === 'product') {
                    const val = inferText(textBlob, PRODUCT_KEYWORDS, 'Nonspecific');
                    updates[col.id] = val;
                    const matched = val !== 'Nonspecific';
                    cellMeta[col.id] = { confidence: matched ? 90 : 50, reasoning: matched ? 'Keyword match in title/abstract' : 'No product keyword found; defaulted to Nonspecific', sourceSnippet: art.title.substring(0, 120) };
                  } else if (colName === 'indication') {
                    const val = inferText(textBlob, INDICATION_KEYWORDS, '');
                    updates[col.id] = val;
                    cellMeta[col.id] = val
                      ? { confidence: 88, reasoning: 'Indication keyword matched in title/abstract', sourceSnippet: art.title.substring(0, 120) }
                      : { confidence: 0, reasoning: 'No indication keyword found — manual selection required', sourceSnippet: '' };
                  } else if (colName === 'study sponsor') {
                    const val = inferText(textBlob, SPONSOR_KEYWORDS, '');
                    if (val) {
                      updates[col.id] = val;
                      cellMeta[col.id] = { confidence: 82, reasoning: 'Sponsor keyword detected in text', sourceSnippet: '' };
                    } else {
                      updates[col.id] = '';
                      cellMeta[col.id] = { confidence: 0, reasoning: 'No sponsor keyword found — manual review required', sourceSnippet: '' };
                    }
                  } else if (colName === 'geography') {
                    const val = inferText(textBlob, GEOGRAPHY_KEYWORDS, '');
                    if (val) {
                      updates[col.id] = val;
                      cellMeta[col.id] = { confidence: 78, reasoning: 'Geography inferred from text keywords', sourceSnippet: '' };
                    } else {
                      updates[col.id] = '';
                      cellMeta[col.id] = { confidence: 0, reasoning: 'No geography keyword found — manual review required', sourceSnippet: '' };
                    }
                  } else if (col.type === 'select' && col.predefinedValues?.length) {
                    const match = col.predefinedValues.find((v) => textBlob.includes(v.toLowerCase()));
                    updates[col.id] = match ?? '';
                    cellMeta[col.id] = match
                      ? { confidence: 85, reasoning: `Matched predefined value "${match}" in text`, sourceSnippet: '' }
                      : { confidence: 0, reasoning: 'No predefined value matched in text — manual selection required', sourceSnippet: '' };
                  } else if (col.type === 'number') {
                    const nMatch = textBlob.match(/n\s*=\s*(\d+)/);
                    updates[col.id] = nMatch ? parseInt(nMatch[1]) : '';
                    cellMeta[col.id] = nMatch
                      ? { confidence: 78, reasoning: `Extracted n=${nMatch[1]} from text`, sourceSnippet: nMatch[0] }
                      : { confidence: 0, reasoning: 'No numeric pattern found', sourceSnippet: '' };
                  } else if (col.type === 'text' && col.aiPrompt) {
                    // Leave empty — red ! will signal needs review
                    updates[col.id] = '';
                    cellMeta[col.id] = { confidence: 0, reasoning: 'Full AI extraction required — paste abstract to process', sourceSnippet: '' };
                  }
                }
                return { ...art, ...updates, _cellMeta: cellMeta };
              }),
            };
          }),
        }));
      },

      addTrainingRecord: (record) => {
        const newRecord: TrainingRecord = {
          ...record,
          id: `tr-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
          timestamp: new Date().toISOString(),
        };
        set((state) => ({ trainingRecords: [...state.trainingRecords, newRecord] }));
      },

      setActiveLibrary: (id) => {
        set({ activeLibraryId: id });
      },
    }),
    {
      name: 'ehcore-libraries',
      version: 5,
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
        // v4: _cellMeta field — no migration needed (optional field)
        // v5: trainingRecords + dossierEnabled — seed empty array if missing
        if (version < 5) {
          const s = persistedState as any;
          if (!Array.isArray(s.trainingRecords)) s.trainingRecords = [];
        }
        return persistedState;
      },
    }
  )
);
