import { LibraryArticle, LibraryColumn, CategoryNode } from '@/types';

export interface QCIssue {
  type: 'blank' | 'typo' | 'category_mismatch';
  articleId: string;
  articleNumber: number;
  columnId: string;
  columnName: string;
  currentValue: string;
  suggestedValue: string;
  message: string;
}

/** Levenshtein distance between two strings. */
function levenshtein(a: string, b: string): number {
  const la = a.length;
  const lb = b.length;
  const dp: number[][] = Array.from({ length: la + 1 }, (_, i) =>
    Array.from({ length: lb + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= la; i++) {
    for (let j = 1; j <= lb; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[la][lb];
}

/** Find blank cells that should have values. */
export function findBlanks(
  articles: LibraryArticle[],
  columns: LibraryColumn[]
): QCIssue[] {
  const issues: QCIssue[] = [];
  for (const art of articles) {
    for (const col of columns) {
      const val = art[col.id];
      if (val === undefined || val === null || val === '' || val === '—') {
        issues.push({
          type: 'blank',
          articleId: art.id,
          articleNumber: art.articleNumber,
          columnId: col.id,
          columnName: col.name,
          currentValue: '',
          suggestedValue: '',
          message: `Missing value for "${col.name}" in article #${art.articleNumber}`,
        });
      }
    }
  }
  return issues;
}

/** Find select-column values that don't match predefined options (possible typos). */
export function findTypos(
  articles: LibraryArticle[],
  columns: LibraryColumn[]
): QCIssue[] {
  const issues: QCIssue[] = [];
  const selectCols = columns.filter(
    (col) => col.type === 'select' && col.predefinedValues?.length
  );

  for (const art of articles) {
    for (const col of selectCols) {
      const val = art[col.id];
      if (!val || typeof val !== 'string') continue;
      const predefined = col.predefinedValues!;
      const exactMatch = predefined.some(
        (pv) => pv.toLowerCase() === val.toLowerCase()
      );
      if (exactMatch) continue;

      // Check fuzzy match
      let bestMatch = '';
      let bestDist = Infinity;
      for (const pv of predefined) {
        const dist = levenshtein(val.toLowerCase(), pv.toLowerCase());
        if (dist < bestDist) {
          bestDist = dist;
          bestMatch = pv;
        }
      }

      // Threshold: distance ≤ 3 and ≤ 40% of string length
      if (bestDist <= 3 && bestDist <= val.length * 0.4) {
        issues.push({
          type: 'typo',
          articleId: art.id,
          articleNumber: art.articleNumber,
          columnId: col.id,
          columnName: col.name,
          currentValue: val,
          suggestedValue: bestMatch,
          message: `"${val}" in "${col.name}" (article #${art.articleNumber}) may be a typo — did you mean "${bestMatch}"?`,
        });
      } else if (bestDist > 3) {
        issues.push({
          type: 'typo',
          articleId: art.id,
          articleNumber: art.articleNumber,
          columnId: col.id,
          columnName: col.name,
          currentValue: val,
          suggestedValue: '',
          message: `"${val}" in "${col.name}" (article #${art.articleNumber}) is not a predefined value`,
        });
      }
    }
  }
  return issues;
}

/** Check that subcategory belongs to its parent category. */
export function checkCategoryAlignment(
  articles: LibraryArticle[],
  columns: LibraryColumn[],
  hierarchy: CategoryNode[]
): QCIssue[] {
  const issues: QCIssue[] = [];
  const catCol = columns.find((c) => c.name === 'Category');
  const subCol = columns.find((c) => c.name === 'Subcategory');
  if (!catCol || !subCol) return issues;

  for (const art of articles) {
    const cat = art[catCol.id];
    const sub = art[subCol.id];
    if (!cat || !sub) continue;

    const catNode = hierarchy.find((n) => n.category === cat);
    if (!catNode) continue;

    if (!catNode.subcategories.includes(sub)) {
      // Find which category actually owns this subcategory
      const correctCat = hierarchy.find((n) => n.subcategories.includes(sub));
      issues.push({
        type: 'category_mismatch',
        articleId: art.id,
        articleNumber: art.articleNumber,
        columnId: subCol.id,
        columnName: 'Subcategory',
        currentValue: `${cat} > ${sub}`,
        suggestedValue: correctCat ? `${correctCat.category} > ${sub}` : '',
        message: `Article #${art.articleNumber}: Subcategory "${sub}" doesn't belong to category "${cat}"${correctCat ? ` — it belongs to "${correctCat.category}"` : ''}`,
      });
    }
  }
  return issues;
}

/** Run all QC checks and return combined issues. */
export function runAllChecks(
  articles: LibraryArticle[],
  columns: LibraryColumn[],
  hierarchy: CategoryNode[]
): QCIssue[] {
  return [
    ...findBlanks(articles, columns),
    ...findTypos(articles, columns),
    ...checkCategoryAlignment(articles, columns, hierarchy),
  ];
}
