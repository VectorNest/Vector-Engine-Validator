import { HumanEvaluationTest } from "@/base/HumanEvaluationTest";
import { Validation } from "../validation";
import { parseTime } from "@/utils/parse-time";

export type LatencyTestOutput = {
  query: string;
  responseTimeMs: number;
};

export class LatencyTest extends HumanEvaluationTest<LatencyTestOutput, Validation> {
  protected override readonly waitEvaluationsFor = parseTime("30s");

  async getOutputs(validation: Validation): Promise<LatencyTestOutput[]> {
    const query = "a futuristic city skyline at night";

    const start = Date.now();
    await validation.callEndpoint("/search", {
      id: validation.resource.id,
      pc: validation.resource.ptAddress,
      vectorField: "image_embedding",
      query,
      options: { limit: 3 },
    });
    const end = Date.now();

    return [
      {
        query,
        responseTimeMs: end - start,
      },
    ];
  }

  override evaluate(output: LatencyTestOutput): number {
    if (output.responseTimeMs <= 500) return 1.0;
    if (output.responseTimeMs <= 1000) return 0.8;
    if (output.responseTimeMs <= 1500) return 0.5;
    if (output.responseTimeMs <= 3000) return 0.2;
    return 0.0;
  }
}
