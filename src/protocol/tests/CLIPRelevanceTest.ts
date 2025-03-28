import { TestResult } from "@/core/types";
import { AbstractTest } from "@/base/AbstractTest";
import { Validation } from "../validation";
import { cosineSimilarity } from "@/utils/embedding-utils";
import { getCLIPEmbedding } from "@/utils/clip";

interface CLIPRelevanceOutput {
  query: string;
  image: string;
  similarity: number;
}

export class CLIPRelevanceTest extends AbstractTest<CLIPRelevanceOutput[], Validation> {
  async execute(validation: Validation): Promise<TestResult<CLIPRelevanceOutput[]>> {
    const outputs: CLIPRelevanceOutput[] = [];

    for (const collection of validation.getTestCollections()) {
      for (const item of collection.items) {
        const query = item.text;
        const embedding = await getCLIPEmbedding(query);

        const response = await validation.callEndpoint("/searchInCollection", {
          id: validation.resource.id,
          pc: validation.resource.protocol,
          collection: collection.name,
          vectorField: "embedding",
          query: embedding,
          options: { limit: 1 },
        });

        const top = response?.body?.[0];
        if (top?.embedding) {
          const similarity = cosineSimilarity(embedding, top.embedding);
          outputs.push({ query, image: top.image || top.text, similarity });
        }
      }
    }

    const avgSimilarity = outputs.reduce((sum, out) => sum + out.similarity, 0) / outputs.length;

    return {
      isSuccess: true,
      raw: `Average similarity score: ${avgSimilarity}`,
      result: outputs,
      testName: this.name
    };
  }
}
