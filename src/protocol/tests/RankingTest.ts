import { HumanEvaluationTest } from "@/base/HumanEvaluationTest";
import { Validation } from "../validation";
import { cosineSimilarity } from "@/utils/embedding-utils";
import { getCLIPEmbedding } from "@/utils/clip";
import { parseTime } from "@/utils/parse-time";

export type RankingTestOutput = {
  query: string;
  rankedResults: { image: string; similarity: number }[];
  averageDrop: number;
};

export class RankingTest extends HumanEvaluationTest<RankingTestOutput, Validation> {
  protected override readonly waitEvaluationsFor = parseTime("2m");

  async getOutputs(validation: Validation): Promise<RankingTestOutput[]> {
    const query = "a mountain landscape with snow and trees";
    const textEmbedding = await getCLIPEmbedding(query);

    const response = await validation.callEndpoint("/search", {
      id: validation.resource.id,
      pc: validation.resource.ptAddress,
      vectorField: "image_embedding",
      query: textEmbedding,
      options: { limit: 5, metricType: "cosine" },
    });

    const results = response.body || [];
    const rankedResults = [];

    for (const result of results) {
      if (!result.image) continue;
      const imageEmbedding = await getCLIPEmbedding(result.image, "image");
      const similarity = cosineSimilarity(textEmbedding, imageEmbedding);
      rankedResults.push({ image: result.image, similarity });
    }

    // Calculate how well the list is sorted by similarity
    const drops: number[] = [];
    for (let i = 0; i < rankedResults.length - 1; i++) {
      const diff = rankedResults[i].similarity - rankedResults[i + 1].similarity;
      if (diff < 0) drops.push(Math.abs(diff)); // penalty if lower rank is more similar
    }

    const averageDrop = drops.length
      ? drops.reduce((sum, d) => sum + d, 0) / drops.length
      : 0;

    return [
      {
        query,
        rankedResults,
        averageDrop,
      },
    ];
  }

  override evaluate(output: RankingTestOutput): number {
    if (output.averageDrop === 0) return 1.0; // perfect ranking
    if (output.averageDrop < 0.05) return 0.9;
    if (output.averageDrop < 0.1) return 0.75;
    if (output.averageDrop < 0.2) return 0.5;
    return 0.0;
  }
}
