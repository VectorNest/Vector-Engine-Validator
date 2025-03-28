import { TestResult } from "@/core/types";
import { AbstractTest } from "@/base/AbstractTest";
import { Validation } from "../validation";
import { getCLIPEmbedding } from "@/utils/clip";
import { cosineSimilarity } from "@/utils/embedding-utils";

interface RankingTestOutput {
  query: string;
  rankedSimilarities: number[];
  monotonicityScore: number;
  score: number;
}

function checkMonotonicity(similarities: number[]): number {
  let score = 1;
  for (let i = 1; i < similarities.length; i++) {
    if (similarities[i] > similarities[i - 1]) {
      score -= 1 / similarities.length;
    }
  }
  return Math.max(0, score);
}

export class RankingTest extends AbstractTest<RankingTestOutput[], Validation> {
  async execute(validation: Validation): Promise<TestResult<RankingTestOutput[]>> {
    const outputs: RankingTestOutput[] = [];

    for (const collection of validation.getTestCollections()) {
      for (const item of collection.items) {
        const query = item.text;
        const queryEmbedding = await getCLIPEmbedding(query);

        const response = await validation.callEndpoint("/searchInCollection", {
          id: validation.resource.id,
          pc: validation.resource.protocol,
          collection: collection.name,
          vectorField: "embedding",
          query: queryEmbedding,
          options: { limit: 5 },
        });

        const results = response?.body || [];
        const similarities = results.map((r: any) => cosineSimilarity(queryEmbedding, r.embedding));
        const monotonicityScore = checkMonotonicity(similarities);

        outputs.push({
          query,
          rankedSimilarities: similarities,
          monotonicityScore,
          score: monotonicityScore // In this case, the monotonicity score is our final score
        });
      }
    }

    const avgScore = outputs.reduce((sum, out) => sum + out.score, 0) / outputs.length;

    return {
      isSuccess: true,
      raw: `Average ranking score: ${avgScore}`,
      result: outputs,
      testName: this.name
    };
  }
}
