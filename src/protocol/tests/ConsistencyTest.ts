import { HumanEvaluationTest } from "@/base/HumanEvaluationTest";
import { Validation } from "../validation";
import { getCLIPEmbedding } from "@/utils/clip";
import { parseTime } from "@/utils/parse-time";

export type ConsistencyTestOutput = {
  query: string;
  runHashes: string[][];
  averageSimilarity: number;
};

function hashResultSet(results: any[]): string[] {
  return results.map(r => JSON.stringify(r)).sort();
}

function overlap(a: string[], b: string[]): number {
  const setB = new Set(b);
  const intersection = a.filter(x => setB.has(x));
  return intersection.length / Math.max(a.length, b.length);
}

export class ConsistencyTest extends HumanEvaluationTest<ConsistencyTestOutput, Validation> {
  protected override readonly waitEvaluationsFor = parseTime("0s");

  async getOutputs(validation: Validation): Promise<ConsistencyTestOutput[]> {
    const outputs: ConsistencyTestOutput[] = [];

    for (const collection of validation.getTestCollections()) {
      for (const item of collection.items) {
        const query = item.text;
        const embedding = await getCLIPEmbedding(query);
        const runHashes: string[][] = [];

        for (let i = 0; i < 4; i++) {
          const run = await validation.callEndpoint("/searchInCollection", {
            id: validation.resource.id,
            pc: validation.resource.protocol,
            collection: collection.name,
            vectorField: "embedding",
            query: embedding,
            options: { limit: 5 },
          });
          runHashes.push(hashResultSet(run.body || []));
        }

        const base = runHashes[0];
        const overlaps = [1, 2, 3].map(i => overlap(base, runHashes[i]));
        const averageSimilarity = overlaps.reduce((a, b) => a + b, 0) / overlaps.length;

        outputs.push({
          query,
          runHashes,
          averageSimilarity,
        });
      }
    }

    return outputs;
  }

  override evaluate(output: ConsistencyTestOutput): number {
    if (output.averageSimilarity >= 0.95) return 1.0;
    if (output.averageSimilarity >= 0.85) return 0.9;
    if (output.averageSimilarity >= 0.7) return 0.75;
    if (output.averageSimilarity >= 0.5) return 0.5;
    return 0.0;
  }
}
