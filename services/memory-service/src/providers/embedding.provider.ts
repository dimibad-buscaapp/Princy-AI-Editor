export type EmbeddingProvider = {
  embed(text: string): Promise<number[]>;
  getModelName(): string;
};
