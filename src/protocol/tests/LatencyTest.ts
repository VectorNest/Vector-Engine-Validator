import { HumanEvaluationTest } from "@/base/HumanEvaluationTest";
import { Validation } from "../validation";
import { getCLIPEmbedding } from "@/utils/clip";
import { parseTime } from "@/utils/parse-time";

export type LatencyTestOutput = {
  query: string;
  latencyMs: number;
};

export class LatencyTest extends HumanEvaluationTest<LatencyTestOutput, Validation> {
  protected override readonly waitEvaluationsFor = parseTime("0s");

  async getOutputs(validation: Validation): Promise<LatencyTestOutput[]> {
    const outputs: LatencyTestOutput[] = [];

    for (const collection of validation.getTestCollections()) {
      for (const item of collection.items) {
        const query = item.text;
        const queryEmbedding = await getCLIPEmbedding(query);

        const start = Date.now();
        await validation.callEndpoint("/searchInCollection", {
          id: validation.resource.id,
          pc: validation.resource.protocol,
          collection: collection.name,
          vectorField: "embedding",
          query: queryEmbedding,
          options: { limit: 3 },
        });
        const latency = Date.now() - start;

        outputs.push({ query, latencyMs: latency });
      }
    }

    return outputs;
  }

  override evaluate(output: LatencyTestOutput): number {
    if (output.latencyMs < 500) return 1.0;
    if (output.latencyMs < 1000) return 0.8;
    if (output.latencyMs < 2000) return 0.5;
    return 0.2;
  }
}
