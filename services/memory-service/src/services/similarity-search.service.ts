import {
  assertPgvectorReady,
  similaritySearch,
  type VectorSearchFilters
} from "@princy/database";

export class SimilaritySearchService {
  async isReady() {
    try {
      await assertPgvectorReady();
      return true;
    } catch {
      return false;
    }
  }

  search(queryVector: number[], filters: VectorSearchFilters, limit?: number) {
    return similaritySearch(queryVector, filters, limit);
  }
}
