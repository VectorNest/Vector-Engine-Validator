import { TestResult } from "@/core/types";
import { AbstractTest } from "@/base/AbstractTest";
import { Validation } from "../validation";
import { getCLIPEmbedding } from "@/utils/clip";

interface LatencyTestOutput {
  query: string;
  latencyMs: number;
  score: number;
}

export class LatencyTest extends AbstractTest<LatencyTestOutput[], Validation> {
  private calculateScore(latencyMs: number): number {
    if (latencyMs < 500) return 1.0;
    if (latencyMs < 1000) return 0.8;
    if (latencyMs < 2000) return 0.5;
    return 0.2;
  }

  async execute(validation: Validation): Promise<TestResult<LatencyTestOutput[]>> {
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
        const latencyMs = Date.now() - start;
        const score = this.calculateScore(latencyMs);

        outputs.push({ query, latencyMs, score });
      }
    }

    const avgScore = outputs.reduce((sum, out) => sum + out.score, 0) / outputs.length;

    return {
      isSuccess: true,
      raw: `Average latency score: ${avgScore}`,
      result: outputs,
      testName: this.name
    };
  }
}
