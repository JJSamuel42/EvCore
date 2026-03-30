/**
 * PubMed E-utilities API client for fetching article metadata.
 * Uses NCBI efetch and CrossRef APIs.
 */

export interface ArticleMetadata {
  pmid: string;
  doi: string;
  title: string;
  authors: string;
  journal: string;
  publicationDate: string;
  abstract: string;
  publicationLink: string;
}

/** Extract PMID from a PubMed URL or plain number. */
export function extractPMIDFromUrl(input: string): string | null {
  const trimmed = input.trim();
  // Plain number
  if (/^\d+$/.test(trimmed)) return trimmed;
  // PubMed URL patterns
  const match = trimmed.match(/pubmed\.ncbi\.nlm\.nih\.gov\/(\d+)/i)
    || trimmed.match(/ncbi\.nlm\.nih\.gov\/pubmed\/(\d+)/i);
  return match ? match[1] : null;
}

/** Extract DOI from text. */
export function extractDOIFromText(input: string): string | null {
  const match = input.trim().match(/(10\.\d{4,}\/[^\s]+)/);
  return match ? match[1].replace(/[.,;)]+$/, '') : null;
}

/** Extract PMIDs or DOIs from a multi-line text block. */
export function extractIdentifiers(text: string): { pmids: string[]; dois: string[] } {
  const pmids: string[] = [];
  const dois: string[] = [];
  const lines = text.split(/[\n,;]+/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const pmid = extractPMIDFromUrl(trimmed);
    if (pmid) {
      pmids.push(pmid);
      continue;
    }
    const doi = extractDOIFromText(trimmed);
    if (doi) {
      dois.push(doi);
    }
  }
  return { pmids, dois };
}

/** Fetch article metadata from PubMed E-utilities by PMID(s). */
export async function fetchArticlesByPMID(pmids: string[]): Promise<ArticleMetadata[]> {
  if (pmids.length === 0) return [];

  const url = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&id=${pmids.join(',')}&rettype=xml&retmode=xml`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`PubMed API error: ${res.status}`);

  const xmlText = await res.text();
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlText, 'text/xml');

  const articles: ArticleMetadata[] = [];
  const articleNodes = doc.querySelectorAll('PubmedArticle');

  articleNodes.forEach((node) => {
    const pmid = node.querySelector('PMID')?.textContent || '';
    const title = node.querySelector('ArticleTitle')?.textContent || '';

    // Authors
    const authorNodes = node.querySelectorAll('Author');
    const authorNames: string[] = [];
    authorNodes.forEach((author) => {
      const last = author.querySelector('LastName')?.textContent || '';
      const initials = author.querySelector('Initials')?.textContent || '';
      if (last) authorNames.push(`${last} ${initials}`.trim());
    });
    let authors = authorNames.slice(0, 3).join(', ');
    if (authorNames.length > 3) authors += ', et al.';

    // Journal
    const journal = node.querySelector('Journal Title')?.textContent
      || node.querySelector('ISOAbbreviation')?.textContent
      || node.querySelector('MedlineTA')?.textContent
      || '';

    // Date
    const year = node.querySelector('PubDate Year')?.textContent
      || node.querySelector('ArticleDate Year')?.textContent
      || '';
    const month = node.querySelector('PubDate Month')?.textContent
      || node.querySelector('ArticleDate Month')?.textContent
      || '01';
    const day = node.querySelector('PubDate Day')?.textContent
      || node.querySelector('ArticleDate Day')?.textContent
      || '01';
    const monthNum = isNaN(parseInt(month))
      ? String(new Date(`${month} 1, 2000`).getMonth() + 1).padStart(2, '0')
      : month.padStart(2, '0');
    const publicationDate = year ? `${year}-${monthNum}-${day.padStart(2, '0')}` : '';

    // Abstract
    const abstractParts: string[] = [];
    node.querySelectorAll('AbstractText').forEach((abs) => {
      abstractParts.push(abs.textContent || '');
    });
    const abstract = abstractParts.join(' ');

    // DOI
    const doiNode = Array.from(node.querySelectorAll('ArticleId')).find(
      (el) => el.getAttribute('IdType') === 'doi'
    );
    const doi = doiNode?.textContent || '';

    articles.push({
      pmid,
      doi,
      title,
      authors,
      journal,
      publicationDate,
      abstract,
      publicationLink: `https://pubmed.ncbi.nlm.nih.gov/${pmid}`,
    });
  });

  return articles;
}

/** Fetch article metadata from CrossRef by DOI. */
export async function fetchArticleByDOI(doi: string): Promise<ArticleMetadata | null> {
  try {
    const res = await fetch(`https://api.crossref.org/works/${encodeURIComponent(doi)}`);
    if (!res.ok) return null;

    const data = await res.json();
    const work = data.message;

    const authorList = (work.author || []).map(
      (a: any) => `${a.family || ''} ${(a.given || '').charAt(0)}`.trim()
    );
    let authors = authorList.slice(0, 3).join(', ');
    if (authorList.length > 3) authors += ', et al.';

    const dateParts = work.published?.['date-parts']?.[0] || [];
    const publicationDate = dateParts.length >= 1
      ? `${dateParts[0]}-${String(dateParts[1] || 1).padStart(2, '0')}-${String(dateParts[2] || 1).padStart(2, '0')}`
      : '';

    return {
      pmid: '',
      doi,
      title: Array.isArray(work.title) ? work.title[0] : (work.title || ''),
      authors,
      journal: work['container-title']?.[0] || '',
      publicationDate,
      abstract: work.abstract || '',
      publicationLink: work.URL || `https://doi.org/${doi}`,
    };
  } catch {
    return null;
  }
}
