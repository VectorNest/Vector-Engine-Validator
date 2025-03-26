export interface CLIPRelevanceOutput {
  query: string;
  image: string;
  similarity: number;
  [key: string]: unknown;
} 