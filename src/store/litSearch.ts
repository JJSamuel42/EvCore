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

// Simulated total hits returned by PubMed for this type of query
export const SIMULATED_TOTAL_HITS = 1247;

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
  {
    pmid: '38612904',
    title: 'Budget impact analysis of dupilumab for moderate-to-severe atopic dermatitis in a US managed care population',
    authors: 'Feldman SR, Cox L, Zhu B, Bansal A, Goldblum O',
    journal: 'Journal of Managed Care & Specialty Pharmacy',
    pubDate: '2024-03-05',
    link: 'https://pubmed.ncbi.nlm.nih.gov/38612904',
    abstract: 'Background: Budget impact models (BIM) help payers assess the financial consequences of adopting new therapies. Objective: Estimate the 3-year budget impact of dupilumab in a US health plan of 1 million members. Methods: BIM from payer perspective. Drug costs based on 2024 WAC, with real-world adherence and dosing. Comparators: cyclosporine, methotrexate, azathioprine, biologics (baricitinib, abrocitinib). Results: Annual per-member-per-year cost increase of $0.12-0.18. Dupilumab associated with 34% reduction in systemic corticosteroid use and 28% reduction in dermatology visits. Net budget impact remains positive but offset by healthcare savings. Conclusion: Dupilumab offers acceptable budget impact when accounting for downstream cost offsets.',
    decision: null as 'include' | 'exclude' | null,
    rationale: '',
    aiReasoning: '',
  },
  {
    pmid: '37823691',
    title: 'Sleep disturbance and its economic impact in patients with atopic dermatitis: analysis from a patient registry',
    authors: 'Silverberg JI, Garg NK, Paller AS, Fishbein AB, Zee PC',
    journal: 'Journal of Sleep Research',
    pubDate: '2023-09-12',
    link: 'https://pubmed.ncbi.nlm.nih.gov/37823691',
    abstract: 'Background: Sleep disturbance is a major but under-evaluated burden of atopic dermatitis (AD). Methods: Cross-sectional analysis of an AD patient registry (n=1,432 adults). Sleep quality assessed via PSQI; work productivity via WPAI. Results: 68.3% reported poor sleep (PSQI >5). Moderate-severe AD associated with significantly worse sleep than mild AD (mean PSQI 12.4 vs 6.8). Sleep disturbance correlated with absenteeism (r=0.48) and presenteeism (r=0.62). Annual indirect cost attributable to sleep-related productivity loss: $3,840/patient. Biologic use associated with 54% improvement in PSQI versus conventional treatment. Conclusion: Sleep disturbance in AD significantly impacts work productivity and represents a substantial indirect economic burden.',
    decision: null as 'include' | 'exclude' | null,
    rationale: '',
    aiReasoning: '',
  },
  {
    pmid: '38334512',
    title: 'Comorbidity burden and healthcare resource utilization in atopic dermatitis: a claims database analysis',
    authors: 'Nygaard U, Vestergaard C, Deleuran M, Deleuran B',
    journal: 'Acta Dermato-Venereologica',
    pubDate: '2024-01-28',
    link: 'https://pubmed.ncbi.nlm.nih.gov/38334512',
    abstract: 'Objective: To characterize comorbidity patterns and healthcare resource utilization (HCRU) in patients with atopic dermatitis (AD) compared with matched controls. Methods: Retrospective cohort study using US commercial claims (2018-2023). AD patients (n=48,231) matched 1:3 to non-AD controls. Comorbidities, physician visits, ED visits, hospitalizations, and costs analysed. Results: AD patients had significantly higher rates of asthma (OR 3.2), allergic rhinitis (OR 2.9), anxiety (OR 1.8), and depression (OR 1.7). All-cause HCRU was 2.4x higher in AD versus controls. Annual total healthcare costs: $12,430 (AD) vs $4,210 (controls). Severe AD patients incurred 3.1x higher costs than mild. Conclusion: AD is associated with significant comorbidity burden and substantially higher HCRU and costs.',
    decision: null as 'include' | 'exclude' | null,
    rationale: '',
    aiReasoning: '',
  },
  {
    pmid: '38558721',
    title: 'Long-term safety of dupilumab: integrated analysis of clinical trials through 5 years',
    authors: 'Blauvelt A, Guttman-Yassky E, Paller AS, et al.',
    journal: 'JAMA Dermatology',
    pubDate: '2024-02-28',
    link: 'https://pubmed.ncbi.nlm.nih.gov/38558721',
    abstract: 'Importance: Long-term safety data are essential for chronic therapies like dupilumab. Objective: Characterize the long-term safety profile of dupilumab across the AD clinical development programme. Design: Integrated analysis of 9 Phase 2/3 randomised controlled trials (n=4,210 patients; 13,044 patient-years of exposure). Results: No new safety signals emerged through year 5. Injection-site reactions declined over time. Conjunctivitis incidence: 9.7% (dupilumab) vs 2.2% (placebo). No increase in serious infections, malignancies, or cardiovascular events versus placebo. No clinically relevant changes in laboratory parameters. Conclusion: Dupilumab demonstrates a consistent and acceptable safety profile over 5 years of treatment in patients with moderate-to-severe AD.',
    decision: null as 'include' | 'exclude' | null,
    rationale: '',
    aiReasoning: '',
  },
  {
    pmid: '37698204',
    title: 'Cost-effectiveness of dupilumab compared with cyclosporine in adults with moderate-to-severe atopic dermatitis in the UK',
    authors: 'Boyers D, Elliott T, Shim E, Hessler G, Mugford M',
    journal: 'PharmacoEconomics',
    pubDate: '2023-08-01',
    link: 'https://pubmed.ncbi.nlm.nih.gov/37698204',
    abstract: 'Objective: To assess the cost-effectiveness of dupilumab versus cyclosporine from the UK NHS perspective. Methods: Patient-level simulation model with lifetime horizon. Clinical inputs from CHRONOS trial and observational data. Costs and health utilities sourced from NHS reference costs and published literature. Results: Dupilumab yielded 2.14 additional QALYs at an incremental cost of £28,450 versus cyclosporine. Incremental cost-effectiveness ratio (ICER): £13,294/QALY. At the £20,000/QALY threshold, dupilumab had 82% probability of cost-effectiveness. Key drivers: QALY gains from skin clearance and reduced itch, and reduced concomitant medication use. Conclusion: Dupilumab is likely cost-effective versus cyclosporine for moderate-to-severe AD in the UK.',
    decision: null as 'include' | 'exclude' | null,
    rationale: '',
    aiReasoning: '',
  },
  {
    pmid: '38044123',
    title: 'Patient perspectives on dupilumab treatment for atopic dermatitis: a qualitative interview study',
    authors: 'Nettis E, Di Leo E, Foti C, Stingeni L, Canonica GW',
    journal: 'Patient Preference and Adherence',
    pubDate: '2023-11-30',
    link: 'https://pubmed.ncbi.nlm.nih.gov/38044123',
    abstract: 'Background: Patient-reported treatment experiences can inform shared decision-making in atopic dermatitis (AD). Methods: Semi-structured qualitative interviews with 32 adults with moderate-to-severe AD treated with dupilumab for ≥6 months. Thematic analysis conducted. Results: Key themes: (1) marked improvement in skin appearance and itch; (2) improved sleep and daily functioning; (3) enhanced self-confidence and social participation; (4) manageable injection experience; (5) concerns about long-term use and cost. Most patients reported dupilumab as a "life-changing" treatment. Minor concerns related to conjunctivitis side effects. Conclusion: Patients report substantial improvements in quality of life with dupilumab, with manageable side effects.',
    decision: null as 'include' | 'exclude' | null,
    rationale: '',
    aiReasoning: '',
  },
  {
    pmid: '38172634',
    title: 'Dupilumab versus JAK inhibitors for moderate-to-severe atopic dermatitis: a network meta-analysis',
    authors: 'Thyssen JP, de Bruin-Weller M, Guttman-Yassky E, et al.',
    journal: 'Journal of the American Academy of Dermatology',
    pubDate: '2024-01-05',
    link: 'https://pubmed.ncbi.nlm.nih.gov/38172634',
    abstract: 'Background: Direct head-to-head trials comparing biologics and JAK inhibitors in AD are lacking. Objective: Conduct a network meta-analysis (NMA) comparing dupilumab with JAK inhibitors for moderate-to-severe AD. Methods: Systematic review and Bayesian NMA of 38 RCTs. Primary outcome: EASI-75 at 16 weeks. Results: All active treatments superior to placebo. Abrocitinib 200mg ranked highest (P-score 0.81) for EASI-75, followed by upadacitinib 30mg, dupilumab, baricitinib 4mg. Differences among active treatments were modest and confidence intervals overlapping. Dupilumab showed most favourable safety profile with lowest risk of serious adverse events. Conclusion: Dupilumab offers a well-balanced efficacy-safety profile across the available treatment options for moderate-to-severe AD.',
    decision: null as 'include' | 'exclude' | null,
    rationale: '',
    aiReasoning: '',
  },
  {
    pmid: '37912543',
    title: 'Work productivity loss in patients with atopic dermatitis: systematic review and meta-analysis',
    authors: 'Vakharia PP, Chopra R, Silverberg JI',
    journal: 'Dermatology',
    pubDate: '2023-10-20',
    link: 'https://pubmed.ncbi.nlm.nih.gov/37912543',
    abstract: 'Background: Atopic dermatitis (AD) can impair work productivity but the magnitude is uncertain. Methods: Systematic review and meta-analysis of 28 studies reporting work productivity outcomes in AD using WPAI or similar instruments. Results: Pooled absenteeism: 8.4% (95% CI 6.2-10.6%). Pooled presenteeism: 29.7% (95% CI 24.3-35.1%). Overall work impairment: 33.1%. Productivity loss correlated with disease severity (r=0.61). Annual economic value of productivity loss: $7,230/patient with moderate-severe AD. Treatment with biologics reduced overall work impairment by 52% versus baseline. Conclusion: AD imposes substantial work productivity loss, particularly in moderate-severe disease, which is substantially mitigated by effective systemic therapy.',
    decision: null as 'include' | 'exclude' | null,
    rationale: '',
    aiReasoning: '',
  },
  {
    pmid: '38390812',
    title: 'Dupilumab in special populations: pregnancy, lactation, and elderly patients — a real-world evidence review',
    authors: 'Mian M, Tran K, Srivastava A, Drucker AM',
    journal: 'Dermatologic Therapy',
    pubDate: '2024-02-10',
    link: 'https://pubmed.ncbi.nlm.nih.gov/38390812',
    abstract: 'Background: Data on dupilumab use in special populations are limited. Methods: Systematic review of real-world studies reporting dupilumab use in pregnant women, lactating women, and elderly patients (≥65 years) with AD. Results: 18 studies included (n=412 pregnant exposures, n=89 lactating, n=347 elderly). No increased risk of adverse pregnancy outcomes observed compared to general AD population. Dupilumab detected in breast milk at very low concentrations; no neonatal adverse events reported. In elderly patients, efficacy similar to younger adults; no significant increase in serious adverse events. Conclusion: Emerging real-world data support an acceptable benefit-risk profile of dupilumab in pregnant, lactating, and elderly AD patients, though controlled studies are needed.',
    decision: null as 'include' | 'exclude' | null,
    rationale: '',
    aiReasoning: '',
  },
  {
    pmid: '38054789',
    title: 'Pediatric atopic dermatitis: epidemiology, burden, and treatment landscape update 2024',
    authors: 'Paller AS, Kabashima K, Bieber T',
    journal: 'Journal of Allergy and Clinical Immunology',
    pubDate: '2023-12-01',
    link: 'https://pubmed.ncbi.nlm.nih.gov/38054789',
    abstract: 'Atopic dermatitis (AD) in children is a common inflammatory skin disease with significant psychosocial and family burden. This review summarises the epidemiology, pathophysiology, and treatment landscape for pediatric AD through 2024. Prevalence in children: 15-20% in high-income countries. Severe AD affects approximately 10-15% of pediatric cases. Recent advances include dupilumab approval for children ≥6 months, tralokinumab for ≥12 years, and JAK inhibitors for adolescents. Unmet needs include long-term safety data in very young children, access to biologics, and biomarkers to guide treatment selection. Family caregiver burden remains high with average annual productivity loss of $4,200-6,800 per family.',
    decision: null as 'include' | 'exclude' | null,
    rationale: '',
    aiReasoning: '',
  },
  {
    pmid: '38244903',
    title: 'Itch neuroscience in atopic dermatitis: mechanisms and therapeutic implications',
    authors: 'Mollanazar NK, Smith PK, Yosipovitch G',
    journal: 'JAMA Dermatology',
    pubDate: '2024-01-18',
    link: 'https://pubmed.ncbi.nlm.nih.gov/38244903',
    abstract: 'Itch (pruritus) is the cardinal symptom of atopic dermatitis (AD) and drives disease burden. This review covers the neural pathways mediating itch in AD, including the roles of IL-4, IL-13, IL-31, TSLP, and substance P. Central sensitization contributes to chronic itch in severe AD. Targeted therapies (dupilumab, nemolizumab, tralokinumab) act on specific pruritogenic pathways. Dupilumab demonstrates rapid and sustained itch reduction via IL-4Rα blockade, reducing TARC and periostin. Emerging neuroimmune targets include OSMRβ (nemolizumab) and NK1R (serlopitant). Understanding itch mechanisms is critical for developing next-generation antipruritic therapies.',
    decision: null as 'include' | 'exclude' | null,
    rationale: '',
    aiReasoning: '',
  },
  {
    pmid: '37789056',
    title: 'Caregiver burden in pediatric atopic dermatitis: a cross-sectional analysis',
    authors: 'Chamlin SL, Mattson CL, Williams ML, et al.',
    journal: 'JAMA Dermatology',
    pubDate: '2023-09-01',
    link: 'https://pubmed.ncbi.nlm.nih.gov/37789056',
    abstract: 'Background: Pediatric atopic dermatitis (AD) significantly affects family functioning, but data on caregiver burden remain limited. Methods: Cross-sectional study of 342 caregivers of children with AD. Caregiver burden assessed using Dermatitis Family Impact (DFI) questionnaire. Work productivity via WPAI. Results: Mean DFI score: 14.6 (out of 30). Sleep disturbance in caregivers: 78%. Absenteeism: 9.2%; presenteeism: 31.8%. Annual caregiver productivity cost: $5,840. Younger children and more severe disease associated with higher caregiver burden. Caregivers of children treated with biologics reported significantly lower DFI scores (-6.2 points). Conclusion: Pediatric AD imposes substantial caregiver burden, particularly affecting sleep and work productivity.',
    decision: null as 'include' | 'exclude' | null,
    rationale: '',
    aiReasoning: '',
  },
  {
    pmid: '38488234',
    title: 'Tapering and discontinuation of dupilumab in atopic dermatitis: real-world experience from 6 European centres',
    authors: 'Wollenberg A, Barbarot S, Bieber T, et al.',
    journal: 'British Journal of Dermatology',
    pubDate: '2024-02-22',
    link: 'https://pubmed.ncbi.nlm.nih.gov/38488234',
    abstract: 'Background: Real-world data on dupilumab tapering and discontinuation are lacking. Methods: Retrospective cohort study across 6 European dermatology centres. Patients with moderate-to-severe AD who attempted dupilumab tapering (n=156) or discontinuation (n=89) were included. Results: Successful tapering to q4w dosing: 61.5%. Disease relapse during tapering: 38.5% (median time to relapse: 14 weeks). After discontinuation, 43.8% achieved remission at 6 months; 56.2% required treatment restart within 12 months. Baseline IGA 0/1 before tapering was the strongest predictor of successful taper. No rebound phenomenon observed on discontinuation. Conclusion: Dupilumab tapering is feasible in a subset of patients achieving complete/near-complete response; discontinuation leads to relapse in the majority.',
    decision: null as 'include' | 'exclude' | null,
    rationale: '',
    aiReasoning: '',
  },
  {
    pmid: '37901234',
    title: 'Utility values and health state preferences in atopic dermatitis: a systematic review for economic modelling',
    authors: 'Lloyd A, Doyle S, Dewilde S, Brazier J',
    journal: 'Value in Health',
    pubDate: '2023-10-10',
    link: 'https://pubmed.ncbi.nlm.nih.gov/37901234',
    abstract: 'Background: Utility values are required to calculate quality-adjusted life years (QALYs) in economic models of atopic dermatitis (AD). Methods: Systematic review of studies reporting utility values in AD. 43 studies identified. Results: Utility values varied by severity: mild AD 0.81-0.88; moderate AD 0.67-0.76; severe AD 0.54-0.63. EQ-5D most commonly used instrument. Biologic treatment associated with utility gains of 0.14-0.21 from baseline. Mapping algorithms available for DLQI-to-EQ-5D conversion. Substantial variation across countries noted. Conclusion: This systematic review provides a comprehensive utility database for use in economic models of AD and highlights the substantial HRQoL burden across severity levels.',
    decision: null as 'include' | 'exclude' | null,
    rationale: '',
    aiReasoning: '',
  },
  {
    pmid: '38301456',
    title: 'Dupilumab for atopic dermatitis in children aged 6 months to 5 years: safety and efficacy in the LIBERTY AD PRESCHOOL trial',
    authors: 'Paller AS, Bansal A, Simpson EL, et al.',
    journal: 'NEJM Evidence',
    pubDate: '2024-01-24',
    link: 'https://pubmed.ncbi.nlm.nih.gov/38301456',
    abstract: 'Background: Atopic dermatitis in preschool children is poorly controlled with available therapies. Methods: Phase 3, randomized, double-blind, placebo-controlled trial in children aged 6 months to 5 years with moderate-to-severe AD (n=162). Primary endpoint: IGA 0/1 at week 16. Results: IGA 0/1 achieved in 28.4% dupilumab vs 4.1% placebo (P<0.001). EASI-75 in 53.0% vs 11.0%. Peak pruritus NRS improvement significantly greater with dupilumab. Safety profile consistent with older populations. Conclusion: Dupilumab significantly improved skin clearance and itch in very young children with moderate-to-severe AD with an acceptable safety profile.',
    decision: null as 'include' | 'exclude' | null,
    rationale: '',
    aiReasoning: '',
  },
  {
    pmid: '38145078',
    title: 'Biomarkers predicting dupilumab response in atopic dermatitis: a systematic review',
    authors: 'Cabanillas B, Novak N',
    journal: 'Allergy',
    pubDate: '2024-01-02',
    link: 'https://pubmed.ncbi.nlm.nih.gov/38145078',
    abstract: 'Background: Identifying biomarkers predictive of dupilumab response may optimise patient selection in AD. Methods: Systematic review of 24 studies examining biomarkers (serum, tissue, genetic) in dupilumab-treated AD patients. Results: Elevated serum TARC/CCL17 and IgE at baseline were most consistently associated with treatment response. Skin transcriptomic signatures (Th2 skewing) correlated with EASI improvement. FLG loss-of-function variants did not predict response. Baseline EASI and age showed inconsistent associations. No single biomarker met criteria for clinical implementation. Conclusion: Multiple biomarkers show promise for predicting dupilumab response in AD but require prospective validation before clinical use.',
    decision: null as 'include' | 'exclude' | null,
    rationale: '',
    aiReasoning: '',
  },
  {
    pmid: '38589012',
    title: 'Switching from dupilumab to JAK inhibitors in atopic dermatitis: effectiveness and safety in a multicenter cohort',
    authors: 'Reich K, Thyssen JP, Blauvelt A, et al.',
    journal: 'Journal of the European Academy of Dermatology and Venereology',
    pubDate: '2024-03-01',
    link: 'https://pubmed.ncbi.nlm.nih.gov/38589012',
    abstract: 'Background: Some AD patients switch from dupilumab to JAK inhibitors due to inadequate response or side effects. Methods: Retrospective analysis of 234 patients who switched from dupilumab to upadacitinib (n=142) or abrocitinib (n=92). Reasons for switch, response rates, and safety recorded. Results: Main reasons for switch: dupilumab non-response (52%), conjunctivitis (28%), patient preference (20%). At 16 weeks post-switch: EASI-75 in 58.4%; IGA 0/1 in 38.2%. Response higher in primary non-responders versus secondary failures. AEs: headache (12%), nausea (8%), acne (11%). No thromboembolic events. Conclusion: Switching to JAK inhibitors is a viable strategy for dupilumab-inadequate AD patients, with meaningful clinical responses achieved.',
    decision: null as 'include' | 'exclude' | null,
    rationale: '',
    aiReasoning: '',
  },
  {
    pmid: '37645201',
    title: 'Atopic dermatitis and mental health: a population-based cohort study of depression, anxiety, and suicidality',
    authors: 'Andersen YMF, Egeberg A, Skov L, Gislason G, Thyssen JP',
    journal: 'JAMA Dermatology',
    pubDate: '2023-07-15',
    link: 'https://pubmed.ncbi.nlm.nih.gov/37645201',
    abstract: 'Importance: The mental health burden of atopic dermatitis (AD) is increasingly recognised but population-based data are limited. Objective: Assess rates of depression, anxiety, and suicidality in adults with AD compared with the general population. Design: Nationwide Danish cohort study 2010-2022 (AD n=89,405; controls n=357,620). Main Outcomes: Incident depression, anxiety disorder, self-harm, suicidal ideation, and suicide. Results: Hazard ratios for AD vs controls: depression 1.42 (95% CI 1.38-1.46); anxiety 1.35; self-harm 1.28; suicidal ideation 1.41. Severe AD had highest risk estimates. Biologic therapy associated with significant risk reduction for depression (HR 0.72). Conclusion: AD is associated with substantially elevated mental health risks; effective treatment may reduce psychiatric comorbidities.',
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

      runSearch: async (sessionId, page = 1) => {
        const session = get().sessions.find((s) => s.id === sessionId);
        if (!session) return;

        // Simulate PubMed API call with realistic hit count
        await new Promise((resolve) => setTimeout(resolve, 1500));

        const PAGE_SIZE = 25;
        const start = (page - 1) * PAGE_SIZE;
        // Cycle through MOCK_ABSTRACTS to fill pages (wraps around for demo)
        const pageResults: SearchResult[] = Array.from({ length: PAGE_SIZE }, (_, i) => {
          const src = MOCK_ABSTRACTS[(start + i) % MOCK_ABSTRACTS.length];
          // Make PMIDs unique per page/position when cycling
          return {
            ...src,
            pmid: page === 1 ? src.pmid : `${src.pmid}-p${page}-${i}`,
            decision: null,
            rationale: '',
            aiReasoning: '',
          };
        });

        const prevResults = page === 1 ? [] : (session.results ?? []);

        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === sessionId
              ? {
                  ...s,
                  results: [...prevResults, ...pageResults],
                  totalHits: SIMULATED_TOTAL_HITS,
                  lastRun: new Date().toISOString(),
                }
              : s
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
