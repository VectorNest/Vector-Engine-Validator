import { TestResult, Evaluation } from "@/core/types";
import { BaseValidation } from "@/base/BaseValidation";
import { CLIPRelevanceTest } from "./tests/CLIPRelevanceTest";
import { LatencyTest } from "./tests/LatencyTest";
import { ConsistencyTest } from "./tests/ConsistencyTest";
import { RankingTest } from "./tests/RankingTest";
import { PipeMethod, Protocol } from "@forest-protocols/sdk";
import { AbstractTestConstructor } from "@/base/AbstractTest";
import { prepareTestCollection, cleanupTestCollection, PreparedCollection } from "@/utils/testCollectionManager";
import { Resource } from "@/core/types";

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

  private testCollections: PreparedCollection[] = [];
  private protocol?: Protocol;

  private async getAgreement(resource: Resource) {
    if (!this.protocol) {
      this.protocol = new Protocol({
        rpcHost: "http://localhost:8545",
        chain: "anvil",
        address: resource.protocol,
      });
    }
    return await this.protocol.getAgreement(resource.id);
  }

  /**
   * Executed before starting to the validation.
   */
  override async onStart() {
    const agreement = await this.getAgreement(this.resource);
    const categories = ["animals", "food", "vehicles"];

    for (const category of categories) {
      const testCollection = await prepareTestCollection(
        this,
        agreement,
        this.resource,
        category
      );
      this.testCollections.push(testCollection);
      this.logger.info(`Prepared test collection: ${testCollection.name}`);
    }
  }

  /**
   * Executed after all of the Tests are run.
   */
  override async onFinish() {
    const agreement = await this.getAgreement(this.resource);
    for (const testCollection of this.testCollections) {
      await cleanupTestCollection(this, agreement, this.resource, testCollection.name);
      this.logger.info(`Cleaned up test collection: ${testCollection.name}`);
    }
  }

  /**
   * Calculates score of the Provider for this validation.
   */
  override async calculateScore(testResults: TestResult[]): Promise<number> {
    const avgScore = (testName: string): number => {
      const results = testResults.filter(r => r.testName === testName && Array.isArray(r.result));
      const allEvaluations = results.flatMap(r => r.result as Evaluation<any>[]);
      if (allEvaluations.length === 0) return 0;
      return allEvaluations.reduce((sum, ev) => sum + ev.score, 0) / allEvaluations.length;
    };

    const relevance = avgScore("CLIPRelevanceTest");
    const ranking = avgScore("RankingTest");
    const latency = avgScore("LatencyTest");
    const consistency = avgScore("ConsistencyTest");

    const weightedScore = (relevance * 0.5) + (ranking * 0.2) + (latency * 0.2) + (consistency * 0.1);
    return Math.round(weightedScore * 100);
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

  async postEndpoint(path: `/${string}`, body: any) {
    return await this.pipe.send(this.resource.operatorAddress, {
      path,
      method: PipeMethod.POST,
      body,
    });
  }

  async deleteEndpoint(path: `/${string}`, body: any) {
    return await this.pipe.send(this.resource.operatorAddress, {
      path,
      method: PipeMethod.DELETE,
      body,
    });
  }

  getTestCollections(): PreparedCollection[] {
    return this.testCollections;
  }
}
