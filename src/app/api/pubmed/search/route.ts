import { NextRequest, NextResponse } from 'next/server';

/**
 * Proxy for PubMed esearch + efetch.
 * Avoids browser CORS issues and keeps API calls server-side.
 *
 * GET /api/pubmed/search?query=...&retmax=25&retstart=0
 * Returns: { pmids: string[], totalHits: number, articles: ArticleRecord[] }
 */

const NCBI_BASE = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils';
const PAGE_SIZE = 25;

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const query = searchParams.get('query');
  const retmax = parseInt(searchParams.get('retmax') ?? String(PAGE_SIZE), 10);
  const retstart = parseInt(searchParams.get('retstart') ?? '0', 10);

  if (!query) {
    return NextResponse.json({ error: 'Missing query parameter' }, { status: 400 });
  }

  try {
    // Step 1: esearch — get PMIDs and hit count
    const esearchUrl = `${NCBI_BASE}/esearch.fcgi?db=pubmed&term=${encodeURIComponent(query)}&retmax=${retmax}&retstart=${retstart}&retmode=json`;
    const esearchRes = await fetch(esearchUrl, {
      headers: { 'User-Agent': 'EvCore/1.0 (research@evcore.io)' },
      next: { revalidate: 0 },
    });
    if (!esearchRes.ok) {
      return NextResponse.json({ error: `PubMed esearch failed: ${esearchRes.status}` }, { status: 502 });
    }
    const esearchData = await esearchRes.json();
    const pmids: string[] = esearchData.esearchresult?.idlist ?? [];
    const totalHits = parseInt(esearchData.esearchresult?.count ?? '0', 10);

    if (pmids.length === 0) {
      return NextResponse.json({ pmids: [], totalHits, articles: [] });
    }

    // Step 2: efetch — get article details
    const efetchUrl = `${NCBI_BASE}/efetch.fcgi?db=pubmed&id=${pmids.join(',')}&rettype=xml&retmode=xml`;
    const efetchRes = await fetch(efetchUrl, {
      headers: { 'User-Agent': 'EvCore/1.0 (research@evcore.io)' },
      next: { revalidate: 0 },
    });
    if (!efetchRes.ok) {
      return NextResponse.json({ error: `PubMed efetch failed: ${efetchRes.status}` }, { status: 502 });
    }
    const xmlText = await efetchRes.text();

    // Parse XML server-side (no DOMParser — use regex for key fields)
    const articles = parseArticlesFromXML(xmlText);

    return NextResponse.json({ pmids, totalHits, articles });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Unknown error' }, { status: 502 });
  }
}

interface ArticleRecord {
  pmid: string;
  title: string;
  authors: string;
  journal: string;
  pubDate: string;
  abstract: string;
  link: string;
}

function extractTag(xml: string, tag: string): string {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i');
  const m = xml.match(re);
  return m ? m[1].replace(/<[^>]+>/g, '').trim() : '';
}

function extractAllTags(xml: string, tag: string): string[] {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'gi');
  const results: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml)) !== null) {
    results.push(m[1].replace(/<[^>]+>/g, '').trim());
  }
  return results;
}

function parseArticlesFromXML(xml: string): ArticleRecord[] {
  // Split into individual PubmedArticle blocks
  const articleRe = /<PubmedArticle>([\s\S]*?)<\/PubmedArticle>/gi;
  const articles: ArticleRecord[] = [];
  let m: RegExpExecArray | null;

  while ((m = articleRe.exec(xml)) !== null) {
    const block = m[1];

    const pmid = extractTag(block, 'PMID');
    const title = extractTag(block, 'ArticleTitle');

    // Authors: collect LastName + Initials
    const authorBlocks = extractAllTags(block, 'Author');
    // Actually extractAllTags on the full block gives us individual <Author> contents
    // Use a different approach for authors
    const authorRe = /<Author[^>]*>([\s\S]*?)<\/Author>/gi;
    const names: string[] = [];
    let am: RegExpExecArray | null;
    while ((am = authorRe.exec(block)) !== null) {
      const last = extractTag(am[1], 'LastName');
      const init = extractTag(am[1], 'Initials');
      if (last) names.push(init ? `${last} ${init}` : last);
    }
    let authors = names.slice(0, 3).join(', ');
    if (names.length > 3) authors += ', et al.';

    // Journal
    const journal = extractTag(block, 'Title') || extractTag(block, 'ISOAbbreviation') || extractTag(block, 'MedlineTA');

    // Date
    const year = extractTag(block, 'Year') || '';
    const rawMonth = extractTag(block, 'Month') || '01';
    const day = (extractTag(block, 'Day') || '01').padStart(2, '0');
    const monthNum = /^\d+$/.test(rawMonth)
      ? rawMonth.padStart(2, '0')
      : String(new Date(`${rawMonth} 1 2000`).getMonth() + 1).padStart(2, '0');
    const pubDate = year ? `${year}-${monthNum}-${day}` : '';

    // Abstract
    const abstractParts = extractAllTags(block, 'AbstractText');
    const abstract = abstractParts.join(' ');

    if (pmid) {
      articles.push({
        pmid,
        title,
        authors,
        journal,
        pubDate,
        abstract,
        link: `https://pubmed.ncbi.nlm.nih.gov/${pmid}`,
      });
    }
  }

  return articles;
}
