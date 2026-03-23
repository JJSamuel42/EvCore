// ============================================================
// Auth Types
// ============================================================
export type UserRole = 'admin' | 'researcher' | 'viewer';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  active: boolean;
  createdAt: string;
}

// ============================================================
// Library Types
// ============================================================
export type ColumnType = 'text' | 'select' | 'date' | 'number';

export interface LibraryColumn {
  id: string;
  name: string;
  description: string;
  type: ColumnType;
  predefinedValues?: string[];
  isFilter: boolean;
  aiPrompt: string;
  order: number;
  isDefault?: boolean;
  hidden?: boolean;
  width?: number;
}

export interface DateQuickAction {
  id: string;
  label: string;
  type: 'relative_months' | 'since_date';
  months?: number;
  date?: string; // ISO date string for 'since_date'
}

// State interfaces for stores
export interface FilterState {
  [columnId: string]: string | string[] | null;
}

export interface SortState {
  columnId: string | null;
  direction: 'asc' | 'desc';
}

// Funnel state interface (for import in stores)
export interface FunnelState {
  funnels: Funnel[];
  activeFunnelId: string | null;
  createFunnel: (data: Omit<Funnel, 'id' | 'createdAt' | 'updatedAt'>) => Funnel;
  updateFunnel: (id: string, data: Partial<Funnel>) => void;
  deleteFunnel: (id: string) => void;
  addLevel: (funnelId: string, level: Omit<FunnelLevel, 'id'>) => void;
  updateLevel: (funnelId: string, levelId: string, data: Partial<FunnelLevel>) => void;
  deleteLevel: (funnelId: string, levelId: string) => void;
  addArticleToLevel: (funnelId: string, levelId: string, article: FunnelArticle) => void;
  updateArticleInLevel: (funnelId: string, levelId: string, articleId: string, data: Partial<FunnelArticle>) => void;
  removeArticleFromLevel: (funnelId: string, levelId: string, articleId: string) => void;
  setActiveFunnel: (id: string | null) => void;
}

// LitSearch state interface
export interface LitSearchState {
  sessions: SearchSession[];
  activeSessionId: string | null;
  createSession: (name: string, aiContext?: string) => SearchSession;
  updateSession: (id: string, data: Partial<SearchSession>) => void;
  deleteSession: (id: string) => void;
  addTerm: (sessionId: string, term: Omit<SearchTerm, 'id'>) => void;
  removeTerm: (sessionId: string, termId: string) => void;
  updateTerm: (sessionId: string, termId: string, data: Partial<SearchTerm>) => void;
  setFilters: (sessionId: string, filters: Partial<PubMedFilters>) => void;
  setResults: (sessionId: string, results: SearchResult[]) => void;
  updateResult: (sessionId: string, pmid: string, data: Partial<SearchResult>) => void;
  setActiveSession: (id: string | null) => void;
  runSearch: (sessionId: string) => Promise<void>;
  runAIReview: (sessionId: string) => Promise<void>;
}

export interface LibraryArticle {
  id: string;
  articleNumber: number;
  pmid: string;
  title: string;
  authors: string;
  journal: string;
  publicationDate: string;
  publicationLink: string;
  [key: string]: any;
}

export interface Library {
  id: string;
  name: string; // brand name
  innName: string;
  indications: string[];
  description: string;
  createdAt: string;
  updatedAt: string;
  articleCount: number;
  columns: LibraryColumn[];
  articles: LibraryArticle[];
  dateQuickActions: DateQuickAction[];
}

// ============================================================
// Lit Search Types
// ============================================================
export type PICOType = 'P' | 'I' | 'C' | 'O';
export type BooleanOperator = 'AND' | 'OR' | 'NOT';
export type DecisionType = 'include' | 'exclude' | null;

export interface SearchTerm {
  id: string;
  text: string;
  type: PICOType;
  operator: BooleanOperator | null;
}

export interface PubMedFilters {
  dateFrom?: string;
  dateTo?: string;
  species: 'human' | 'animal' | 'both';
  language: 'english' | 'other' | 'both';
}

export interface SearchResult {
  pmid: string;
  title: string;
  authors: string;
  journal: string;
  pubDate: string;
  link: string;
  abstract: string;
  decision: DecisionType;
  rationale: string;
  aiReasoning: string;
  confidence?: number;       // 0–100
  confidenceReason?: string;
}

export interface SearchSession {
  id: string;
  name: string;
  query: string;
  terms: SearchTerm[];
  filters: PubMedFilters;
  results: SearchResult[];
  aiContext: string;
  lastRun: string | null;
  createdAt: string;
}

// ============================================================
// Patient Funnel Types
// ============================================================
export type ArticleRating = 'low' | 'medium' | 'high';

export interface FunnelArticle {
  articleId: string;
  title: string;
  pubDate: string;
  studyDetails: string;
  extractedData: string;
  rating: ArticleRating;
  appliedValue?: number;
  comment?: string;
  selected: boolean;
}

export interface FunnelLevel {
  id: string;
  name: string;
  description: string;
  percentage: number;
  value?: number;
  linkedArticles: FunnelArticle[];
}

export interface Funnel {
  id: string;
  name: string;
  country: string;
  indication: string;
  description: string;
  levels: FunnelLevel[];
  createdAt: string;
  updatedAt: string;
}

export interface AgeDistribution {
  /** 0–12 years (narrow pediatric) */
  pediatric0to12: number;
  /** 0–17 years (broad pediatric / under-18) */
  pediatricUnder18: number;
  /** 18+ years (adults) */
  adults18plus: number;
  /** 50+ years */
  elderly50plus: number;
  /** 60+ years */
  elderly60plus: number;
  /** 65+ years (standard elderly threshold) */
  elderly65plus: number;
}

export interface CountryData {
  code: string;
  name: string;
  flag: string;
  population: number;
  ageDistribution: AgeDistribution;
  /** Primary data source used (census bureau, World Bank, UN) */
  dataSource: string;
  dataYear: number;
}

// ============================================================
// Shared
// ============================================================
export interface SelectOption {
  value: string;
  label: string;
}
