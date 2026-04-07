/**
 * Data Repository Abstraction Layer
 *
 * Provides a consistent interface for all data operations so that the backing
 * store can be swapped from Zustand/localStorage → Azure SQL without touching
 * any UI code.
 *
 * Current implementation: LocalStorageRepository (wraps Zustand stores)
 * Future implementation:   AzureSQLRepository    (uses Prisma + SQL Server)
 *
 * Usage:
 *   import { getRepository } from '@/lib/dataRepository';
 *   const repo = getRepository();
 *   const lib = await repo.getLibrary('lib-123');
 */

import { Library, LibraryArticle, LibraryColumn } from '@/types';

// ── Interface ─────────────────────────────────────────────────────────────────

export interface DataRepository {
  // Libraries
  getLibraries(): Promise<Library[]>;
  getLibrary(id: string): Promise<Library | null>;
  saveLibrary(library: Library): Promise<void>;
  deleteLibrary(id: string): Promise<void>;

  // Articles
  getArticles(libraryId: string): Promise<LibraryArticle[]>;
  saveArticle(libraryId: string, article: LibraryArticle): Promise<void>;
  deleteArticle(libraryId: string, articleId: string): Promise<void>;

  // Columns (includes learnedExamples which accumulate from user corrections)
  updateColumn(libraryId: string, columnId: string, data: Partial<LibraryColumn>): Promise<void>;
}

// ── LocalStorage Implementation (current) ─────────────────────────────────────

/**
 * Thin wrapper that reads from / writes to the Zustand store.
 * The Zustand store itself persists to localStorage via its `persist` middleware.
 */
class LocalStorageRepository implements DataRepository {
  private getStore() {
    // Lazy import to avoid circular dependencies and SSR issues
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('@/store/libraries').useLibraryStore.getState();
  }

  async getLibraries(): Promise<Library[]> {
    return this.getStore().libraries;
  }

  async getLibrary(id: string): Promise<Library | null> {
    return this.getStore().libraries.find((l: Library) => l.id === id) ?? null;
  }

  async saveLibrary(library: Library): Promise<void> {
    this.getStore().updateLibrary(library.id, library);
  }

  async deleteLibrary(id: string): Promise<void> {
    this.getStore().deleteLibrary(id);
  }

  async getArticles(libraryId: string): Promise<LibraryArticle[]> {
    const lib = await this.getLibrary(libraryId);
    return lib?.articles ?? [];
  }

  async saveArticle(libraryId: string, article: LibraryArticle): Promise<void> {
    this.getStore().updateArticle(libraryId, article.id, article);
  }

  async deleteArticle(libraryId: string, articleId: string): Promise<void> {
    this.getStore().deleteArticle(libraryId, articleId);
  }

  async updateColumn(libraryId: string, columnId: string, data: Partial<LibraryColumn>): Promise<void> {
    this.getStore().updateColumn(libraryId, columnId, data);
  }
}

// ── Future: AzureSQLRepository ────────────────────────────────────────────────
//
// class AzureSQLRepository implements DataRepository {
//   constructor(private prisma: PrismaClient) {}
//
//   async getLibraries(): Promise<Library[]> {
//     const rows = await this.prisma.library.findMany({ include: { columns: true } });
//     return rows.map(mapLibraryFromDB);
//   }
//
//   async updateColumn(libraryId: string, columnId: string, data: Partial<LibraryColumn>): Promise<void> {
//     // learnedExamples stored as JSON in library_columns.learned_examples (NVARCHAR(MAX))
//     await this.prisma.libraryColumn.update({
//       where: { id: columnId },
//       data: {
//         ai_prompt: data.aiPrompt,
//         learned_examples: data.learnedExamples ? JSON.stringify(data.learnedExamples) : undefined,
//         width: data.width,
//       },
//     });
//   }
//
//   // ... implement all methods
// }

// ── Factory ───────────────────────────────────────────────────────────────────

let _instance: DataRepository | null = null;

/**
 * Returns the singleton DataRepository instance.
 * To switch backends, change the class instantiated here and
 * supply any required configuration (e.g. DATABASE_URL).
 */
export function getRepository(): DataRepository {
  if (!_instance) {
    // Swap this line to switch backends:
    _instance = new LocalStorageRepository();
    // _instance = new AzureSQLRepository(prisma);
  }
  return _instance;
}
