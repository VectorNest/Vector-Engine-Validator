import { TestResult, Evaluation } from "@/core/types";
import { BaseValidation } from "@/base/BaseValidation";
import { CLIPRelevanceTest } from "./tests/CLIPRelevanceTest";
import { LatencyTest } from "./tests/LatencyTest";
import { ConsistencyTest } from "./tests/ConsistencyTest";
import { RankingTest } from "./tests/RankingTest";
import { PipeMethod } from "@forest-protocols/sdk";
import { AbstractTestConstructor } from "@/base/AbstractTest";

/**
 * Define the general necessary actions for your tests.
 *
 * NOTE: All of the validation related stuff will be executed in its own Thread.
 */
export class Validation extends BaseValidation {
  override readonly tests: AbstractTestConstructor[] = [
    CLIPRelevanceTest,
    RankingTest,
    LatencyTest,
    ConsistencyTest,
  ];

  /**
   * Executed before starting to the validation.
   */
  override async onStart() {
    // Optional setup before validation starts
  }

  /**
   * Executed after all of the Tests are run.
   */
  override async onFinish() {
    // Optional teardown or summary logic
  }

  /**
   * Calculates score of the Provider for this validation.
   */
  override async calculateScore(testResults: TestResult[]): Promise<number> {
    const avgScore = (testName: string): number => {
      const result = testResults.find(r => r.testName === testName);
      if (!result || !Array.isArray(result.result)) return 0;

      const evaluations = result.result as Evaluation<any>[];
      if (evaluations.length === 0) return 0;

      return evaluations.reduce((sum, ev) => sum + ev.score, 0) / evaluations.length;
    };

    const relevance = avgScore("CLIPRelevanceTest");
    const ranking = avgScore("RankingTest");
    const latency = avgScore("LatencyTest");
    const consistency = avgScore("ConsistencyTest");

    const weightedScore = (relevance * 0.5) + (ranking * 0.2) + (latency * 0.2) + (consistency * 0.1);
    return Math.round(weightedScore * 100); // normalize to 0–100 scale
  }

  /**
   * Example utility function to call provider endpoint.
   */
  async callEndpoint(path: `/${string}`, body: any) {
    return await this.pipe.send(this.resource.operatorAddress, {
      path,
      method: PipeMethod.GET,
      body,
    });
  }
}
