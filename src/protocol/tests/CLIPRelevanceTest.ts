import { HumanEvaluationTest } from "@/base/HumanEvaluationTest";
import { Validation } from "../validation";
import { cosineSimilarity } from "@/utils/embedding-utils";
import { getCLIPEmbedding } from "@/utils/clip";
import { parseTime } from "@/utils/parse-time";
import { CLIPRelevanceOutput } from "./types";

export class CLIPRelevanceTest extends HumanEvaluationTest<CLIPRelevanceOutput, Validation> {
  protected override readonly waitEvaluationsFor = parseTime("0s");

  async getOutputs(validation: Validation): Promise<CLIPRelevanceOutput[]> {
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
          const score = cosineSimilarity(embedding, top.embedding);
          outputs.push({ query, image: top.image || top.text, similarity: score });
        }
      }
    }

    return outputs;
  }

  override evaluate(output: CLIPRelevanceOutput): number {
    return output.similarity;
  }
}
