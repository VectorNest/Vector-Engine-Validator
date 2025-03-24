import { TestResult } from "@/core/types";
import { AbstractTest } from "@/base/AbstractTest";
import { mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from "fs";
import { join } from "path";
import { sleep } from "@/utils/sleep";
import { readableTime } from "@/utils/readable-time";
import { BaseValidation } from "./BaseValidation";
import { config } from "@/core/config";

export type Output = Record<string, unknown>;
export type Evaluation<T extends Output> = {
  score: number;
  output: T;
};

/**
 * Abstract human evaluation class that can be used for
 * subjective or automated scoring tests.
 */
export abstract class HumanEvaluationTest<
  T extends Output = {},
  K extends BaseValidation = BaseValidation
> extends AbstractTest<Evaluation<T>[], K> {
  /**
   * The amount of time before the evaluations are saved in milliseconds.
   */
  protected readonly waitEvaluationsFor = config.EVALUATION_WAIT_TIME;

  /**
   * Must return outputs from the provider to be scored
   */
  abstract getOutputs(validation: K): Promise<T[]>;

  /**
   * Must evaluate a single output and return a score between 0 and 1
   */
  abstract evaluate(output: T): number;

  async execute(validation: K): Promise<TestResult<Evaluation<T>[]>> {
    let filePath: string | undefined;
    try {
      const outputs = await this.getOutputs(validation);
      const basePath = join(process.cwd(), "data", "evaluations");

      if (!statSync(basePath, { throwIfNoEntry: false })?.isDirectory()) {
        mkdirSync(basePath, {
          recursive: true,
          mode: 0o777,
        });
        this.logger.debug(`Evaluations directory is made`);
      }

      const timestamp = Date.now();
      const fileName = `eva-${this.constructor.name.toLowerCase()}-${timestamp}.json`;
      filePath = join(basePath, fileName);

      // Automatically score outputs
      const evaluations: Evaluation<T>[] = outputs.map((output) => ({
        output,
        score: this.evaluate(output),
      }));

      writeFileSync(filePath, JSON.stringify(evaluations, null, 2), {
        encoding: "utf-8",
        mode: 0o777,
      });

      this.logger.info(
        `Auto-evaluated ${evaluations.length} items. File saved as "${fileName}"`
      );

      // Wait period for review (optional)
      const startTime = Date.now();
      while (true) {
        await sleep(1000);
        const diff = Date.now() - startTime;
        if (diff > this.waitEvaluationsFor) {
          this.logger.info(`Time is up for ${fileName}. Proceeding with results.`);
          break;
        }
      }

      const content = readFileSync(filePath, { encoding: "utf-8" });
      const results: Evaluation<T>[] = JSON.parse(content);

      return {
        isSuccess: true,
        raw: `${results.length} evaluations processed`,
        result: results,
        testName: this.name,
      };
    } finally {
      // Cleanup
      if (filePath && statSync(filePath, { throwIfNoEntry: false })?.isFile()) {
        rmSync(filePath, { force: true });
      }
    }
  }
}
