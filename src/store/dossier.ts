import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  Dossier,
  DossierSection,
  DossierSectionContent,
  DossierSectionVersion,
  DossierGenerateType,
  LibraryArticle,
} from '@/types';

// ─── AI Generation Simulation ───────────────────────────────────────────────

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function fmtAuthorShort(authors: string): string {
  // Return first author + et al.
  const first = authors.split(',')[0]?.trim() ?? authors;
  return `${first} et al.`;
}

function buildExtractedData(articles: LibraryArticle[]): string {
  if (!articles.length) return 'No publications tagged to this section.';
  return articles
    .map((a, i) => {
      const keyResults = a['col-default-9'] ?? a['keyResults'] ?? '';
      const n = a['col-default-7'] ?? '';
      const studyType = a['col-default-5'] ?? '';
      return [
        `[${i + 1}] ${a.title} (${a.publicationDate?.slice(0, 4) ?? 'n.d.'})`,
        studyType ? `  Study type: ${studyType}` : '',
        n ? `  N = ${n}` : '',
        keyResults ? `  Key results: ${keyResults}` : '',
      ]
        .filter(Boolean)
        .join('\n');
    })
    .join('\n\n');
}

function buildReasoning(
  sectionTitle: string,
  guidanceNotes: string[],
  articles: LibraryArticle[],
  generateType: DossierGenerateType
): string {
  const refList = articles
    .map((a, i) => `[${i + 1}] ${fmtAuthorShort(a.authors)} (${a.publicationDate?.slice(0, 4) ?? 'n.d.'}) — ${a.title.slice(0, 80)}...`)
    .join('\n');

  const notesSummary = guidanceNotes.length
    ? guidanceNotes.map((n) => `  • ${n}`).join('\n')
    : '  (No guidance notes provided.)';

  const typeNote =
    generateType === 'table'
      ? 'A structured table was generated to present comparative or quantitative data clearly.'
      : generateType === 'visual'
      ? 'A descriptive summary suitable for visual representation (chart/figure) was generated.'
      : 'Narrative prose was generated in the voice of a medical writer.';

  return `## AI Reasoning — ${sectionTitle}

### Guidance notes used as structural anchor:
${notesSummary}

### Publications reviewed:
${refList || '  (None tagged)'}

### Generation approach:
${typeNote}

The agent followed the general dossier writing prompt: act as a medical writer developing a core value dossier, using language appropriate for a broad range of healthcare professionals, consistent with clinical research paper tone and style. Each referenced publication was reviewed for relevance to the section topic, and only data directly supporting the guidance notes was incorporated. Confidence is highest for claims supported by two or more tagged publications; single-source data points are flagged as such in the reasoning.

### Reference-to-content mapping:
${articles.length
  ? articles
      .map(
        (a, i) =>
          `[${i + 1}] Used to support: ${
            a['col-default-8'] ?? a['col-default-9'] ?? 'general background evidence'
          }.`
      )
      .join('\n')
  : '  No publications available for this section.'}`;
}

function generateTextContent(
  section: DossierSection,
  articles: LibraryArticle[],
  product: string,
  indication: string
): string {
  const title = section.title.toLowerCase();
  const notes = section.guidanceNotes;
  const refTags = articles.map((a) => `[REF:${a.id}]`);

  // Build a note-by-note expansion
  const noteExpansions = notes.map((note, ni) => {
    const refTag = refTags[ni % refTags.length] ?? '';
    return `${note.endsWith('.') ? note.slice(0, -1) : note}. ${refTag}`.trim();
  });

  // Section-type-specific preamble
  let preamble = '';
  if (/epidemio|burden|prevalence|incidence/.test(title)) {
    preamble = `${indication} represents a significant and growing public health concern, with substantial burden across clinical, humanistic, and economic domains.${refTags[0] ?? ''} `;
  } else if (/treatment|management|landscape|guideline/.test(title)) {
    preamble = `The current treatment landscape for ${indication} encompasses a range of pharmacological and non-pharmacological interventions, the selection of which is guided by disease severity, patient characteristics, and available clinical evidence.${refTags[0] ?? ''} `;
  } else if (/mechanism|pharmacolog/.test(title)) {
    preamble = `${product} is a fully human monoclonal antibody that targets the shared receptor component of interleukin-4 (IL-4) and interleukin-13 (IL-13), key drivers of type 2 inflammation central to the pathophysiology of ${indication}.${refTags[0] ?? ''} `;
  } else if (/efficac|trial|clinic|pivotal|randomis|randomiz|rct/.test(title)) {
    preamble = `The clinical development programme for ${product} in ${indication} is underpinned by a robust body of evidence from randomised controlled trials demonstrating consistent and clinically meaningful improvements across primary and secondary endpoints.${refTags[0] ?? ''} `;
  } else if (/safety|tolerab|adverse|ae/.test(title)) {
    preamble = `The safety and tolerability profile of ${product} in ${indication} has been comprehensively characterised across the clinical trial programme and in real-world settings, with an overall favourable benefit–risk balance.${refTags[0] ?? ''} `;
  } else if (/economic|cost.effect|budget|hcru|resource/.test(title)) {
    preamble = `Economic analyses consistently support the value proposition of ${product} in ${indication}, demonstrating a cost-effective profile relative to current standard-of-care comparators from both payer and societal perspectives.${refTags[0] ?? ''} `;
  } else if (/real.world|rwe|observational|registry/.test(title)) {
    preamble = `Real-world evidence corroborates findings from the randomised controlled trial programme, confirming the effectiveness, safety, and patient-reported outcomes of ${product} in routine clinical practice for ${indication}.${refTags[0] ?? ''} `;
  } else if (/unmet|need|gap/.test(title)) {
    preamble = `Despite advances in available therapies, a substantial unmet medical need persists in ${indication}, particularly among patients with moderate-to-severe disease who fail to achieve or sustain adequate disease control with conventional treatments.${refTags[0] ?? ''} `;
  } else if (/conclusion|summary|executive/.test(title)) {
    preamble = `${product} (${indication.toLowerCase()}) has demonstrated a compelling, evidence-based value proposition, supported by a comprehensive clinical programme encompassing efficacy, safety, patient-reported outcomes, and economic analyses.${refTags[0] ?? ''} `;
  } else {
    preamble = `The following section provides an evidence-based summary of ${section.title.toLowerCase()} in the context of ${product} for ${indication}.${refTags[0] ?? ''} `;
  }

  const body = noteExpansions.length
    ? '\n\n' + noteExpansions.join(' ')
    : '';

  const closing =
    articles.length >= 2
      ? `\n\nCollectively, the available evidence${refTags.length >= 2 ? ` ${refTags.slice(0, 2).join(', ')}` : ''} supports the clinical value and differentiated profile of ${product} in ${indication} with respect to ${section.title.toLowerCase()}.`
      : '';

  return preamble + body + closing;
}

function generateTableContent(
  section: DossierSection,
  articles: LibraryArticle[],
  product: string
): string {
  if (!articles.length) {
    return `| Parameter | Finding | Reference |\n|-----------|---------|----------|\n| — | No publications tagged to this section | — |`;
  }
  const header = `| Study | Study Type | N | Key Finding | Reference |\n|-------|-----------|---|-------------|-----------|`;
  const rows = articles.map((a) => {
    const studyType = a['col-default-5'] ?? 'NR';
    const n = a['col-default-7'] ?? 'NR';
    const result = (a['col-default-9'] ?? a['col-default-8'] ?? '—').slice(0, 60);
    return `| ${fmtAuthorShort(a.authors)} (${a.publicationDate?.slice(0, 4) ?? 'n.d.'}) | ${studyType} | ${n} | ${result} | [REF:${a.id}] |`;
  });
  return `**Table: Summary of evidence — ${section.title}**\n\n${header}\n${rows.join('\n')}\n\nNR = Not reported; N = number of patients.`;
}

function generateVisualContent(
  section: DossierSection,
  articles: LibraryArticle[],
  product: string,
  indication: string
): string {
  const bullets = articles.map(
    (a, i) =>
      `• ${fmtAuthorShort(a.authors)} (${a.publicationDate?.slice(0, 4) ?? 'n.d.'}): ${(a['col-default-9'] ?? a['col-default-8'] ?? 'Key data not extracted').slice(0, 80)} [REF:${a.id}]`
  );
  return `**Figure legend: ${section.title} — ${product} in ${indication}**\n\nKey data points for visual representation:\n\n${bullets.join('\n') || '• No tagged publications available.'}\n\n[Note for medical writer: Commission figure from visual communications team based on data points above. Suggested chart type: ${/efficac|trial|endpoint/.test(section.title.toLowerCase()) ? 'Forest plot or bar chart with error bars' : /safety|adverse/.test(section.title.toLowerCase()) ? 'Grouped bar chart (AE frequencies)' : /economic|cost/.test(section.title.toLowerCase()) ? 'Cost-effectiveness scatter plot (ICER plane)' : 'Infographic or summary diagram'}.]`;
}

async function simulateGenerate(
  section: DossierSection,
  articles: LibraryArticle[],
  generateType: DossierGenerateType,
  additionalPrompt: string,
  product: string,
  indication: string
): Promise<{ content: string; reasoning: string; extractedData: string }> {
  await new Promise((resolve) => setTimeout(resolve, 2800));

  let content = '';
  if (generateType === 'table') {
    content = generateTableContent(section, articles, product);
  } else if (generateType === 'visual') {
    content = generateVisualContent(section, articles, product, indication);
  } else {
    content = generateTextContent(section, articles, product, indication);
  }

  if (additionalPrompt.trim()) {
    content += `\n\n[Revised per instruction: "${additionalPrompt.trim()}"]`;
  }

  const reasoning = buildReasoning(section.title, section.guidanceNotes, articles, generateType);
  const extractedData = buildExtractedData(articles);

  return { content, reasoning, extractedData };
}

// ─── Sample dossier data ─────────────────────────────────────────────────────

function makeSampleSections(): DossierSection[] {
  const s = (
    id: string,
    outlineNumber: string,
    title: string,
    level: number,
    parentId: string | null,
    order: number,
    guidanceNotes: string[]
  ): DossierSection => ({ id, outlineNumber, title, level, parentId, guidanceNotes, order });

  return [
    s('sec-1', '1', 'Executive Summary', 1, null, 0, [
      'Provide a concise overview of the dossier purpose and key messages',
      'Summarise the unmet need, product value proposition, and evidence base',
      'Include headline efficacy, safety, and economic findings',
    ]),
    s('sec-2', '2', 'Disease Background', 1, null, 1, [
      'Describe the pathophysiology and natural history of the condition',
      'Define disease severity classifications used in clinical practice',
    ]),
    s('sec-2-1', '2.1', 'Epidemiology and Disease Burden', 2, 'sec-2', 0, [
      'Report prevalence and incidence data with geographic breakdowns where available',
      'Quantify clinical, humanistic (QoL, PROs), and socioeconomic burden',
      'Highlight the disproportionate impact in moderate-to-severe patients',
    ]),
    s('sec-2-2', '2.2', 'Current Treatment Landscape', 2, 'sec-2', 1, [
      'Summarise current treatment guidelines and sequencing (NICE, EMA, AAD)',
      'Describe limitations of existing therapies including efficacy ceiling and safety concerns',
      'Identify gaps driving residual unmet need',
    ]),
    s('sec-2-3', '2.3', 'Unmet Medical Need', 2, 'sec-2', 2, [
      'Define patients inadequately controlled on conventional therapy',
      'Describe the clinical and quality-of-life consequences of inadequate control',
      'Position the unmet need as the rationale for the evaluated intervention',
    ]),
    s('sec-3', '3', 'Product Description', 1, null, 2, [
      'Provide brand name, INN, regulatory classification, and indication wording',
    ]),
    s('sec-3-1', '3.1', 'Mechanism of Action', 2, 'sec-3', 0, [
      'Describe the molecular target and binding mechanism',
      'Explain the downstream immunological effects relevant to the indication',
      'Differentiate the mechanism from comparators where clinically meaningful',
    ]),
    s('sec-3-2', '3.2', 'Clinical Development Programme', 2, 'sec-3', 1, [
      'Outline the pivotal and supportive trial programme (phase, design, populations)',
      'Note key endpoints and follow-up durations',
    ]),
    s('sec-3-3', '3.3', 'Regulatory Status', 2, 'sec-3', 2, [
      'State approved indications across key markets (EU, US, UK, Japan)',
      'Highlight any restrictions or special conditions of authorisation',
      'Note relevant label language supporting value claims',
    ]),
    s('sec-4', '4', 'Clinical Evidence', 1, null, 3, [
      'Present a structured synthesis of clinical efficacy and effectiveness data',
    ]),
    s('sec-4-1', '4.1', 'Pivotal Randomised Controlled Trials', 2, 'sec-4', 0, [
      'Summarise trial design, population, interventions, and primary endpoints',
      'Report primary and key secondary endpoint results with 95% CIs and p-values',
      'Describe responder analyses (IGA 0/1, EASI-50/75/90, NRS)',
    ]),
    s('sec-4-1-1', '4.1.1', 'SOLO-1 and SOLO-2', 3, 'sec-4-1', 0, [
      'Detail the SOLO-1 and SOLO-2 trial designs and patient populations',
      'Present co-primary endpoint results (IGA 0/1 and EASI-75 at Week 16)',
      'Summarise patient-reported outcome improvements (DLQI, POEM, pruritus NRS)',
    ]),
    s('sec-4-1-2', '4.1.2', 'CHRONOS and Long-Term Data', 3, 'sec-4-1', 1, [
      'Describe the long-term maintenance trial design (dupilumab + TCS)',
      'Report sustained efficacy at Week 52',
      'Note the durability of response and steroid-sparing effects',
    ]),
    s('sec-4-2', '4.2', 'Comparative Effectiveness', 2, 'sec-4', 1, [
      'Summarise head-to-head and indirect comparison data vs. key biologics',
      'Include network meta-analyses where available',
      'Interpret results in the context of HTA requirements (NICE, G-BA)',
    ]),
    s('sec-4-3', '4.3', 'Real-World Evidence', 2, 'sec-4', 2, [
      'Report real-world effectiveness from registries, claims, and cohort studies',
      'Compare RWE outcomes to pivotal trial benchmarks',
      'Address generalisability and population representativeness',
    ]),
    s('sec-5', '5', 'Safety Profile', 1, null, 4, [
      'Provide a comprehensive summary of the safety and tolerability data',
    ]),
    s('sec-5-1', '5.1', 'Overview of Adverse Events', 2, 'sec-5', 0, [
      'Report overall incidence of treatment-emergent adverse events (TEAEs)',
      'Highlight adverse events of special interest (conjunctivitis, injection site reactions)',
      'Compare safety profile with placebo and active comparators',
    ]),
    s('sec-5-2', '5.2', 'Special Populations', 2, 'sec-5', 1, [
      'Summarise safety data in paediatric, elderly, and comorbid populations',
      'Describe any dose modifications or monitoring requirements',
    ]),
    s('sec-6', '6', 'Economic Value', 1, null, 5, [
      'Present the health economic case supporting the value proposition',
    ]),
    s('sec-6-1', '6.1', 'Cost-Effectiveness Analysis', 2, 'sec-6', 0, [
      'Summarise base-case ICER results from published models',
      'Describe model structure, time horizon, and perspective',
      'Present key sensitivity analyses and scenario results',
    ]),
    s('sec-6-2', '6.2', 'Budget Impact Analysis', 2, 'sec-6', 1, [
      'Estimate budget impact over a 3–5 year horizon for a representative payer',
      'Describe key drivers of budget impact (uptake, market share, comparator costs)',
      'Note any risk-sharing or managed entry agreement considerations',
    ]),
    s('sec-7', '7', 'Conclusions', 1, null, 6, [
      'Restate the core value proposition concisely',
      'Link the clinical and economic evidence to the stated unmet need',
      'Close with a clear, evidence-backed positioning statement',
    ]),
  ];
}

const INITIAL_DOSSIERS: Dossier[] = [
  {
    id: 'dos-1',
    name: 'Dupixent (dupilumab) — Atopic Dermatitis Core Value Dossier',
    product: 'Dupixent',
    indication: 'Atopic Dermatitis',
    libraryId: 'lib-1',
    sections: makeSampleSections(),
    sectionContents: {},
    createdAt: '2024-02-01T09:00:00Z',
    updatedAt: '2024-03-20T11:00:00Z',
  },
];

// ─── Store ───────────────────────────────────────────────────────────────────

interface DossierStoreState {
  dossiers: Dossier[];

  createDossier: (data: {
    name: string;
    product: string;
    indication: string;
    libraryId: string;
  }) => Dossier;
  updateDossier: (id: string, data: Partial<Dossier>) => void;
  deleteDossier: (id: string) => void;

  addSection: (dossierId: string, section: Omit<DossierSection, 'id'>) => DossierSection;
  updateSection: (dossierId: string, sectionId: string, data: Partial<DossierSection>) => void;
  deleteSection: (dossierId: string, sectionId: string) => void;
  moveSection: (dossierId: string, sectionId: string, direction: 'up' | 'down') => void;

  setSectionContent: (
    dossierId: string,
    sectionId: string,
    content: string,
    type: DossierGenerateType
  ) => void;
  setSectionPrompt: (dossierId: string, sectionId: string, prompt: string) => void;
  saveVersion: (dossierId: string, sectionId: string) => void;
  generateContent: (
    dossierId: string,
    sectionId: string,
    type: DossierGenerateType,
    articles: LibraryArticle[]
  ) => Promise<void>;
}

function getOrInitContent(
  state: DossierStoreState,
  dossierId: string,
  sectionId: string
): DossierSectionContent {
  const dossier = state.dossiers.find((d) => d.id === dossierId);
  return (
    dossier?.sectionContents[sectionId] ?? {
      currentDraft: '',
      currentType: 'text' as DossierGenerateType,
      aiReasoning: '',
      extractedData: '',
      versions: [],
      isGenerating: false,
      additionalPrompt: '',
    }
  );
}

export const useDossierStore = create<DossierStoreState>()(
  persist(
    (set, get) => ({
      dossiers: INITIAL_DOSSIERS,

      createDossier: (data) => {
        const dossier: Dossier = {
          id: generateId(),
          ...data,
          sections: [],
          sectionContents: {},
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        set((s) => ({ dossiers: [...s.dossiers, dossier] }));
        return dossier;
      },

      updateDossier: (id, data) => {
        set((s) => ({
          dossiers: s.dossiers.map((d) =>
            d.id === id ? { ...d, ...data, updatedAt: new Date().toISOString() } : d
          ),
        }));
      },

      deleteDossier: (id) => {
        set((s) => ({ dossiers: s.dossiers.filter((d) => d.id !== id) }));
      },

      addSection: (dossierId, sectionData) => {
        const section: DossierSection = { id: generateId(), ...sectionData };
        set((s) => ({
          dossiers: s.dossiers.map((d) =>
            d.id === dossierId
              ? {
                  ...d,
                  sections: [...d.sections, section],
                  updatedAt: new Date().toISOString(),
                }
              : d
          ),
        }));
        return section;
      },

      updateSection: (dossierId, sectionId, data) => {
        set((s) => ({
          dossiers: s.dossiers.map((d) =>
            d.id === dossierId
              ? {
                  ...d,
                  sections: d.sections.map((sec) =>
                    sec.id === sectionId ? { ...sec, ...data } : sec
                  ),
                  updatedAt: new Date().toISOString(),
                }
              : d
          ),
        }));
      },

      deleteSection: (dossierId, sectionId) => {
        set((s) => ({
          dossiers: s.dossiers.map((d) => {
            if (d.id !== dossierId) return d;
            // Also remove children
            const toDelete = new Set<string>();
            const collectChildren = (pid: string) => {
              toDelete.add(pid);
              d.sections
                .filter((sec) => sec.parentId === pid)
                .forEach((child) => collectChildren(child.id));
            };
            collectChildren(sectionId);
            const newContents = { ...d.sectionContents };
            toDelete.forEach((id) => delete newContents[id]);
            return {
              ...d,
              sections: d.sections.filter((sec) => !toDelete.has(sec.id)),
              sectionContents: newContents,
              updatedAt: new Date().toISOString(),
            };
          }),
        }));
      },

      moveSection: (dossierId, sectionId, direction) => {
        set((s) => ({
          dossiers: s.dossiers.map((d) => {
            if (d.id !== dossierId) return d;
            const sec = d.sections.find((s) => s.id === sectionId);
            if (!sec) return d;
            const siblings = d.sections
              .filter((s) => s.parentId === sec.parentId)
              .sort((a, b) => a.order - b.order);
            const idx = siblings.findIndex((s) => s.id === sectionId);
            const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
            if (swapIdx < 0 || swapIdx >= siblings.length) return d;
            const swap = siblings[swapIdx];
            const updatedSections = d.sections.map((s) => {
              if (s.id === sec.id) return { ...s, order: swap.order };
              if (s.id === swap.id) return { ...s, order: sec.order };
              return s;
            });
            return { ...d, sections: updatedSections, updatedAt: new Date().toISOString() };
          }),
        }));
      },

      setSectionContent: (dossierId, sectionId, content, type) => {
        set((s) => ({
          dossiers: s.dossiers.map((d) => {
            if (d.id !== dossierId) return d;
            const existing = d.sectionContents[sectionId] ?? {
              currentDraft: '',
              currentType: 'text' as DossierGenerateType,
              aiReasoning: '',
              extractedData: '',
              versions: [],
              isGenerating: false,
              additionalPrompt: '',
            };
            return {
              ...d,
              sectionContents: {
                ...d.sectionContents,
                [sectionId]: { ...existing, currentDraft: content, currentType: type },
              },
            };
          }),
        }));
      },

      setSectionPrompt: (dossierId, sectionId, prompt) => {
        set((s) => ({
          dossiers: s.dossiers.map((d) => {
            if (d.id !== dossierId) return d;
            const existing = d.sectionContents[sectionId] ?? {
              currentDraft: '',
              currentType: 'text' as DossierGenerateType,
              aiReasoning: '',
              extractedData: '',
              versions: [],
              isGenerating: false,
              additionalPrompt: '',
            };
            return {
              ...d,
              sectionContents: {
                ...d.sectionContents,
                [sectionId]: { ...existing, additionalPrompt: prompt },
              },
            };
          }),
        }));
      },

      saveVersion: (dossierId, sectionId) => {
        set((s) => ({
          dossiers: s.dossiers.map((d) => {
            if (d.id !== dossierId) return d;
            const content = d.sectionContents[sectionId];
            if (!content || !content.currentDraft) return d;
            const version: DossierSectionVersion = {
              id: generateId(),
              content: content.currentDraft,
              type: content.currentType,
              prompt: content.additionalPrompt,
              savedAt: new Date().toISOString(),
            };
            const versions = [version, ...content.versions].slice(0, 3);
            return {
              ...d,
              sectionContents: {
                ...d.sectionContents,
                [sectionId]: { ...content, versions },
              },
              updatedAt: new Date().toISOString(),
            };
          }),
        }));
      },

      generateContent: async (dossierId, sectionId, type, articles) => {
        const state = get();
        const dossier = state.dossiers.find((d) => d.id === dossierId);
        const section = dossier?.sections.find((s) => s.id === sectionId);
        if (!dossier || !section) return;

        const existing = getOrInitContent(state, dossierId, sectionId);
        const additionalPrompt = existing.additionalPrompt;

        // Mark as generating
        set((s) => ({
          dossiers: s.dossiers.map((d) => {
            if (d.id !== dossierId) return d;
            const prev = d.sectionContents[sectionId] ?? existing;
            return {
              ...d,
              sectionContents: {
                ...d.sectionContents,
                [sectionId]: { ...prev, isGenerating: true },
              },
            };
          }),
        }));

        const { content, reasoning, extractedData } = await simulateGenerate(
          section,
          articles,
          type,
          additionalPrompt,
          dossier.product,
          dossier.indication
        );

        set((s) => ({
          dossiers: s.dossiers.map((d) => {
            if (d.id !== dossierId) return d;
            const prev = d.sectionContents[sectionId] ?? existing;
            return {
              ...d,
              sectionContents: {
                ...d.sectionContents,
                [sectionId]: {
                  ...prev,
                  currentDraft: content,
                  currentType: type,
                  aiReasoning: reasoning,
                  extractedData,
                  isGenerating: false,
                },
              },
              updatedAt: new Date().toISOString(),
            };
          }),
        }));
      },
    }),
    {
      name: 'ehcore-dossier',
      partialize: (state) => ({ dossiers: state.dossiers }),
    }
  )
);
