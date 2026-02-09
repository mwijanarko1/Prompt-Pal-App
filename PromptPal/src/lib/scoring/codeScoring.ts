import { CodeExecutor, type PreparedExecution } from '../codeExecutor';
import { logger } from '../logger';

export interface TestCase {
  id: string;
  name: string;
  input?: any;
  expectedOutput?: any;
  description?: string;
}

export interface CodeScoringInput {
  code: string;
  language: string;
  testCases: TestCase[];
  functionName?: string;
  passingScore?: number;
}

export interface CodeTestResult {
  id: string;
  name: string;
  passed: boolean;
  error?: string;
  output?: any;
  expectedOutput?: any;
  actualOutput?: any;
  executionTime?: number;
}

export interface CodeScoringResult {
  score: number;
  testResults: CodeTestResult[];
  feedback: string[];
  syntaxValid: boolean;
}

export class CodeScoringService {
  private static readonly EXECUTION_TIMEOUT_MS = 5000;
  private static readonly MAX_CODE_LENGTH = 10000;
  private static readonly MIN_CODE_LENGTH = 10;

  /**
   * Scores generated code against test cases
   */
  static async scoreCode(input: CodeScoringInput): Promise<CodeScoringResult> {
    const { code, language, testCases, functionName, passingScore } = input;

    try {
      if (!code || typeof code !== 'string') {
        throw new Error('Code must be a non-empty string');
      }

      const trimmedCode = code.trim();

      if (trimmedCode.length < this.MIN_CODE_LENGTH) {
        throw new Error('Code is too short');
      }

      if (trimmedCode.length > this.MAX_CODE_LENGTH) {
        throw new Error('Code exceeds maximum length');
      }

      if (!language) {
        throw new Error('Language is required');
      }

      if (!testCases || testCases.length === 0) {
        throw new Error('At least one test case is required');
      }

      const normalizedLanguage = this.normalizeLanguage(language);
      if (!normalizedLanguage) {
        return this.createExecutionErrorResult(
          testCases,
          `Unsupported language: ${language}. Only JavaScript is supported.`,
          false
        );
      }

      const languageMismatch = this.detectLanguageMismatch(trimmedCode, normalizedLanguage);
      if (languageMismatch) {
        return this.createExecutionErrorResult(testCases, languageMismatch, false);
      }

      CodeExecutor.clearCache();

      const normalizedCodeResult = this.normalizeCodeForFunctionName(
        trimmedCode,
        functionName
      );

      const resolvedFunctionName = normalizedCodeResult.functionName;
      if (!resolvedFunctionName) {
        return this.createExecutionErrorResult(
          testCases,
          'Function name not found - check your function definition.',
          false
        );
      }

      const prepared = CodeExecutor.prepare({
        code: normalizedCodeResult.code,
        functionName: resolvedFunctionName,
        timeoutMs: this.EXECUTION_TIMEOUT_MS,
      });

      const testResults = await this.runTestCases(prepared, testCases);
      const score = this.calculateScore(testResults);
      const feedback = this.generateFeedback(testResults, score, passingScore);

      return {
        score,
        testResults,
        feedback,
        syntaxValid: true,
      };
    } catch (error) {
      logger.error('CodeScoringService', error, { operation: 'scoreCode', input });

      const normalizedError = this.normalizePrepareError(error);
      return this.createExecutionErrorResult(
        testCases,
        normalizedError.message,
        normalizedError.syntaxValid
      );
    }
  }

  /**
   * Runs test cases against the code
   */
  private static async runTestCases(
    prepared: PreparedExecution,
    testCases: TestCase[]
  ): Promise<CodeTestResult[]> {
    return Promise.all(testCases.map(testCase => this.runSingleTest(prepared, testCase)));
  }

  /**
   * Runs a single test case
   */
  private static async runSingleTest(
    prepared: PreparedExecution,
    testCase: TestCase
  ): Promise<CodeTestResult> {
    try {
      const inputs = this.normalizeInputs(testCase.input);
      const executionResult = await prepared.run(inputs);

      if (!executionResult.success) {
        return {
          id: testCase.id,
          name: testCase.name,
          passed: false,
          error: executionResult.error || 'Execution failed',
          output: executionResult.output,
          actualOutput: executionResult.output,
          expectedOutput: testCase.expectedOutput,
          executionTime: executionResult.executionTime,
        };
      }

      const actualOutput = executionResult.output;
      const passed = this.compareOutputs(actualOutput, testCase.expectedOutput);

      return {
        id: testCase.id,
        name: testCase.name,
        passed,
        output: actualOutput,
        actualOutput,
        expectedOutput: testCase.expectedOutput,
        executionTime: executionResult.executionTime,
        error: passed ? undefined : this.createMismatchError(actualOutput, testCase.expectedOutput),
      };
    } catch (error) {
      logger.warn('CodeScoringService', 'Test execution failed', { testCaseId: testCase.id, error });

      return {
        id: testCase.id,
        name: testCase.name,
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        expectedOutput: testCase.expectedOutput,
      };
    }
  }

  private static normalizeInputs(input: any): any[] {
    if (input === undefined) return [];
    return Array.isArray(input) ? input : [input];
  }

  private static normalizeLanguage(language: string): 'javascript' | null {
    const normalized = language.trim().toLowerCase();
    if (normalized === 'javascript' || normalized === 'js') return 'javascript';
    if (normalized === 'typescript' || normalized === 'ts') return 'javascript';
    if (normalized.includes('javascript')) return 'javascript';
    return null;
  }

  private static normalizePrepareError(error: unknown): { message: string; syntaxValid: boolean } {
    if (error instanceof Error) {
      const invalidNames = new Set([
        'SyntaxError',
        'FunctionNotFoundError',
        'InvalidFunctionNameError',
        'ValidationError',
        'Error',
      ]);
      const syntaxValid = !invalidNames.has(error.name);
      return { message: error.message || 'Execution failed', syntaxValid };
    }

    return { message: 'Execution failed', syntaxValid: false };
  }

  private static detectLanguageMismatch(code: string, language: 'javascript'): string | null {
    if (language !== 'javascript') return null;

    const pythonSignals = [
      /^\s*def\s+\w+\s*\(/m,
      /^\s*class\s+\w+\s*:/m,
      /print\s*\(/,
      /elif\s+/,
      /:\s*$/m,
      /f\"[^\"]*\"/,
    ];

    if (pythonSignals.some(pattern => pattern.test(code))) {
      return 'Language mismatch: expected JavaScript but received Python. Please return JavaScript code only.';
    }

    return null;
  }

  private static normalizeCodeForFunctionName(
    code: string,
    expectedName?: string
  ): { code: string; functionName: string | null } {
    const foundName = CodeExecutor.extractFunctionName(code);

    if (expectedName) {
      if (foundName && foundName !== expectedName) {
        return {
          code: `${code}\nconst ${expectedName} = ${foundName};`,
          functionName: expectedName,
        };
      }

      if (!foundName) {
        const trimmed = code.trim();
        const looksLikeExpression = /^(\(|function\b|async\b|[A-Za-z_$][\w$]*\s*=>)/.test(trimmed);
        if (looksLikeExpression) {
          return {
            code: `const ${expectedName} = ${trimmed};`,
            functionName: expectedName,
          };
        }
      }

      return { code, functionName: expectedName };
    }

    return { code, functionName: foundName };
  }

  private static createExecutionErrorResult(
    testCases: TestCase[],
    message: string,
    syntaxValid: boolean
  ): CodeScoringResult {
    return {
      score: 0,
      testResults: (testCases || []).map(tc => ({
        id: tc.id,
        name: tc.name,
        passed: false,
        error: message,
        expectedOutput: tc.expectedOutput,
      })),
      feedback: [message],
      syntaxValid,
    };
  }

  /**
   * Compares actual and expected outputs
   */
  private static compareOutputs(actual: any, expected: any): boolean {
    if (actual === expected) return true;
    if (Number.isNaN(actual) && Number.isNaN(expected)) return true;
    return this.deepEqual(actual, expected);
  }

  private static deepEqual(actual: any, expected: any): boolean {
    if (actual === expected) return true;
    if (typeof actual !== typeof expected) return false;

    if (actual && expected && typeof actual === 'object') {
      if (Array.isArray(actual) || Array.isArray(expected)) {
        if (!Array.isArray(actual) || !Array.isArray(expected)) return false;
        if (actual.length !== expected.length) return false;
        for (let i = 0; i < actual.length; i += 1) {
          if (!this.deepEqual(actual[i], expected[i])) return false;
        }
        return true;
      }

      const actualKeys = Object.keys(actual);
      const expectedKeys = Object.keys(expected);
      if (actualKeys.length !== expectedKeys.length) return false;

      for (const key of actualKeys) {
        if (!Object.prototype.hasOwnProperty.call(expected, key)) return false;
        if (!this.deepEqual(actual[key], expected[key])) return false;
      }

      return true;
    }

    return false;
  }

  private static formatValue(value: any): string {
    if (value === undefined) return 'undefined';
    if (value === null) return 'null';
    if (typeof value === 'string') return `"${value}"`;
    if (typeof value === 'bigint') return value.toString();
    if (typeof value === 'function') return '[Function]';

    try {
      const json = JSON.stringify(value);
      if (json !== undefined) return json;
    } catch {
      // ignore JSON errors
    }

    return String(value);
  }

  private static createMismatchError(actual: any, expected: any): string {
    if (actual === undefined && expected !== undefined) {
      return `Expected ${this.formatValue(expected)} but got undefined - did you forget to return?`;
    }
    return `Expected ${this.formatValue(expected)} but got ${this.formatValue(actual)}.`;
  }

  /**
   * Calculates overall score from test results
   */
  private static calculateScore(testResults: CodeTestResult[]): number {
    if (testResults.length === 0) return 0;

    const passedTests = testResults.filter(r => r.passed).length;
    const baseScore = (passedTests / testResults.length) * 100;

    const totalExecutionTime = testResults.reduce((sum, r) => sum + (r.executionTime || 0), 0);
    const avgExecutionTime = totalExecutionTime / testResults.length;

    let efficiencyBonus = 0;
    if (avgExecutionTime < 100) {
      efficiencyBonus = 5;
    } else if (avgExecutionTime < 500) {
      efficiencyBonus = 3;
    }

    return Math.min(Math.round(baseScore + efficiencyBonus), 100);
  }

  /**
   * Generates feedback based on test results
   */
  private static generateFeedback(
    testResults: CodeTestResult[],
    score: number,
    passingScore?: number
  ): string[] {
    const feedback: string[] = [];

    if (testResults.length === 0) {
      return ['No tests were executed.'];
    }

    const failedTests = testResults.filter(r => !r.passed);
    const passedTests = testResults.filter(r => r.passed);

    feedback.push(`${passedTests.length}/${testResults.length} tests passed.`);

    if (failedTests.length > 0) {
      feedback.push(`${failedTests.length} test(s) failed.`);

      const timeoutFailures = failedTests.filter(test => test.error?.includes('timed out'));
      if (timeoutFailures.length > 0) {
        feedback.push('Your code timed out - check for infinite loops.');
      }

      if (failedTests.length <= 3) {
        failedTests.forEach(test => {
          if (test.error) {
            feedback.push(`${test.name}: ${test.error}`);
          }
        });
      } else {
        feedback.push('Review the failed test cases for details.');
      }
    }

    if (passingScore && score >= passingScore) {
      feedback.push('Excellent! All requirements met.');
      return feedback;
    }

    if (score < 30) {
      feedback.push('Major improvements needed. Review the requirements.');
    } else if (score < 60) {
      feedback.push('Partial success. Refine your logic.');
    } else if (score < (passingScore || 80)) {
      feedback.push('Almost there! Check edge cases.');
    }

    return feedback;
  }

  /**
   * Batch score multiple code submissions
   */
  static async scoreCodes(inputs: CodeScoringInput[]): Promise<CodeScoringResult[]> {
    const results = await Promise.allSettled(
      inputs.map(input => this.scoreCode(input))
    );

    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      }
      logger.error('CodeScoringService', result.reason, { operation: 'scoreCodes', index });
      return {
        score: 0,
        testResults: [],
        feedback: ['Scoring failed for this code.'],
        syntaxValid: false,
      };
    });
  }
}
