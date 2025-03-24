import { HumanEvaluationTest } from "@/base/HumanEvaluationTest";
import { Validation } from "../validation";
import { cosineSimilarity } from "@/utils/embedding-utils";
import { getCLIPEmbedding } from "@/utils/clip";
import { parseTime } from "@/utils/parse-time";

export type CLIPRelevanceOutput = {
  query: string;
  topImageUrl: string;
  similarity: number;
};

export class CLIPRelevanceTest extends HumanEvaluationTest<CLIPRelevanceOutput, Validation> {
  protected override readonly waitEvaluationsFor = parseTime("2m");

  async getOutputs(validation: Validation): Promise<CLIPRelevanceOutput[]> {
    const query = "a cat sitting in a cardboard box";

    const textEmbedding = await getCLIPEmbedding(query);
    const response = await validation.callEndpoint("/search", {
      id: validation.resource.id,
      pc: validation.resource.ptAddress,
      vectorField: "image_embedding",
      query: textEmbedding,
      options: { limit: 3, metricType: "cosine" },
    });

    const results = response.body || [];
    const outputs: CLIPRelevanceOutput[] = [];

    for (const result of results) {
      if (!result.image) continue;
      const imageEmbedding = await getCLIPEmbedding(result.image, "image");
      const similarity = cosineSimilarity(textEmbedding, imageEmbedding);

      outputs.push({
        query,
        topImageUrl: result.image,
        similarity,
      });
    }

    return outputs;
  }

  override evaluate(output: CLIPRelevanceOutput): number {
    if (output.similarity >= 0.9) return 1.0;
    if (output.similarity >= 0.8) return 0.9;
    if (output.similarity >= 0.7) return 0.75;
    if (output.similarity >= 0.6) return 0.5;
    return 0.0;
  }
}
