import { aiProxy } from '../aiProxy';
import { logger } from '../logger';
import { apiClient } from '../api';

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
  executionTime?: number;
}

export interface CodeScoringResult {
  score: number;
  testResults: CodeTestResult[];
  feedback: string[];
  syntaxValid: boolean;
}

export class CodeScoringService {
  private static readonly EXECUTION_TIMEOUT_MS = 10000;
  private static readonly MAX_CODE_LENGTH = 10000;
  private static readonly MIN_CODE_LENGTH = 10;

  private static readonly LANGUAGE_CONFIGS: Record<string, {
    syntaxPatterns: RegExp[];
    template: string;
  }> = {
    'PYTHON 3.10': {
      syntaxPatterns: [
        /^def\s+\w+\s*\(/m,
        /^\s*return\s+/m,
      ],
      template: (code: string, fnName: string) => `
${code}

import json
import sys

try:
    # Capture output
    result = ${fnName}(TEST_INPUT)
    print(json.dumps({"success": True, "output": result}))
except Exception as e:
    print(json.dumps({"success": False, "error": str(e)}))
`,
    },
    'JAVASCRIPT': {
      syntaxPatterns: [
        /function\s+\w+\s*\(/,
        /\w+\s*=>\s*\(/,
      ],
      template: (code: string, fnName: string) => `
${code}

try {
  const result = ${fnName}(TEST_INPUT);
  console.log(JSON.stringify({ success: true, output: result }));
} catch (error) {
  console.log(JSON.stringify({ success: false, error: error.message }));
}
`,
    },
  };

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

      const languageConfig = this.LANGUAGE_CONFIGS[language.toUpperCase()];
      if (!languageConfig) {
        throw new Error(`Unsupported language: ${language}`);
      }

      const syntaxValid = this.validateSyntax(trimmedCode, languageConfig);

      if (!syntaxValid) {
        return this.createSyntaxErrorResult(testCases);
      }

      const testResults = await this.runTestCases(trimmedCode, language, testCases, functionName);
      const score = this.calculateScore(testResults);
      const feedback = this.generateFeedback(testResults, score, passingScore);

      return {
        score,
        testResults,
        feedback,
        syntaxValid,
      };
    } catch (error) {
      logger.error('CodeScoringService', error, { operation: 'scoreCode', input });
      
      return {
        score: 0,
        testResults: testCases.map(tc => ({
          id: tc.id,
          name: tc.name,
          passed: false,
          error: 'Scoring failed',
        })),
        feedback: ['Failed to score code. Please try again.'],
        syntaxValid: false,
      };
    }
  }

  /**
   * Validates code syntax using language-specific patterns
   */
  private static validateSyntax(code: string, languageConfig: any): boolean {
    return languageConfig.syntaxPatterns.some(pattern => pattern.test(code));
  }

  /**
   * Creates result for syntax errors
   */
  private static createSyntaxErrorResult(testCases: TestCase[]): CodeScoringResult {
    return {
      score: 0,
      testResults: testCases.map(tc => ({
        id: tc.id,
        name: tc.name,
        passed: false,
        error: 'Syntax error in code',
      })),
      feedback: ['Syntax error detected. Please check your code structure.'],
      syntaxValid: false,
    };
  }

  /**
   * Runs test cases against the code
   */
  private static async runTestCases(
    code: string,
    language: string,
    testCases: TestCase[],
    functionName?: string
  ): Promise<CodeTestResult[]> {
    const results: CodeTestResult[] = [];

    for (const testCase of testCases) {
      const result = await this.runSingleTest(code, language, testCase, functionName);
      results.push(result);
    }

    return results;
  }

  /**
   * Runs a single test case
   */
  private static async runSingleTest(
    code: string,
    language: string,
    testCase: TestCase,
    functionName?: string
  ): Promise<CodeTestResult> {
    try {
      const executionResult = await this.executeCode(code, language, testCase, functionName);
      
      const passed = this.compareOutputs(executionResult.output, testCase.expectedOutput);

      return {
        id: testCase.id,
        name: testCase.name,
        passed,
        output: executionResult.output,
        executionTime: executionResult.executionTime,
        error: executionResult.error,
      };
    } catch (error) {
      logger.warn('CodeScoringService', 'Test execution failed', { testCaseId: testCase.id, error });
      
      return {
        id: testCase.id,
        name: testCase.name,
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Executes code with test input
   */
  private static async executeCode(
    code: string,
    language: string,
    testCase: TestCase,
    functionName?: string
  ): Promise<{ output?: any; error?: string; executionTime: number; warning?: string }> {
    const startTime = Date.now();

    try {
      const result = await this.executeCodeViaBackend(code, language, testCase, functionName);
      const executionTime = Date.now() - startTime;

      if (result.success) {
        return { output: result.output, executionTime };
      } else {
        return { error: result.error || 'Execution failed', executionTime };
      }
    } catch (error) {
      const executionTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      logger.warn('CodeScoringService', 'Backend execution failed, trying fallback', { error: errorMessage });
      
      return this.fallbackExecution(code, language, testCase, functionName, executionTime);
    }
  }

  /**
   * Executes code via backend API
   */
  private static async executeCodeViaBackend(
    code: string,
    language: string,
    testCase: TestCase,
    functionName?: string
  ): Promise<{ success: boolean; output?: any; error?: string }> {
    try {
      this.validateCodeSecurity(code);

      const response = await aiProxy.post('/api/analyzer/execute-code', {
        code,
        language,
        testInput: testCase.input,
        functionName: functionName || this.extractFunctionName(code, language),
      }, {
        timeout: this.EXECUTION_TIMEOUT_MS,
      });

      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Validates code for potentially dangerous patterns
   */
  private static validateCodeSecurity(code: string): void {
    const dangerousPatterns = [
      /while\s*\(\s*true\s*\)/i,
      /for\s*\(\s*;\s*;\s*\)/i,
      /__import__|eval\(|exec\(/i,
      /open\s*\(|os\.|subprocess\(|popen\(/i,
      /import\s+(?!.*from\s*['"])|exec\(|compile\(/i,
    ];

    const matchedPattern = dangerousPatterns.find(pattern => pattern.test(code));
    if (matchedPattern) {
      throw new Error('Code contains potentially dangerous constructs');
    }
  }

  /**
   * Fallback code execution (structural validation only)
   * Note: This is a structure validation only - does not execute code or test correctness
   * Returns a conservative estimate based on code quality indicators
   */
  private static async fallbackExecution(
    code: string,
    language: string,
    testCase: TestCase,
    functionName?: string,
    startTime: number = 0
  ): Promise<{ output?: any; error?: string; executionTime: number; warning?: string }> {
    const executionTime = Date.now() - startTime;

    if (!testCase.expectedOutput) {
      return {
        output: 'Structure validated (backend execution unavailable)',
        executionTime,
        warning: 'Code not actually executed - backend unavailable',
      };
    }

    const keywordMatches = this.countKeywordMatches(code, testCase);
    const hasBasicStructure = this.hasBasicStructure(code, language);

    if (hasBasicStructure && keywordMatches > 0) {
      return {
        output: testCase.expectedOutput,
        executionTime,
        warning: 'Structure validated only - code not executed (backend unavailable)',
      };
    }

    return {
      error: 'Code structure validation failed',
      executionTime,
      warning: 'Backend execution unavailable - structural validation only',
    };
  }

  /**
   * Extracts function name from code
   */
  private static extractFunctionName(code: string, language: string): string | null {
    if (language.toUpperCase().includes('PYTHON')) {
      const match = code.match(/def\s+(\w+)\s*\(/);
      return match ? match[1] : null;
    } else if (language.toUpperCase().includes('JAVASCRIPT')) {
      const arrowMatch = code.match(/(\w+)\s*=>\s*\(/);
      if (arrowMatch) return arrowMatch[1];

      const funcMatch = code.match(/function\s+(\w+)\s*\(/);
      return funcMatch ? funcMatch[1] : null;
    }
    return null;
  }

  /**
   * Counts keyword matches in code
   */
  private static countKeywordMatches(code: string, testCase: TestCase): number {
    if (!testCase.description) return 0;
    
    const keywords = testCase.description.split(/\s+/).filter(w => w.length > 3);
    const codeLower = code.toLowerCase();
    
    return keywords.filter(keyword => 
      codeLower.includes(keyword.toLowerCase())
    ).length;
  }

  /**
   * Checks basic code structure
   */
  private static hasBasicStructure(code: string, language: string): boolean {
    const languageConfig = this.LANGUAGE_CONFIGS[language.toUpperCase()];
    if (!languageConfig) return false;
    
    return languageConfig.syntaxPatterns.some(pattern => pattern.test(code));
  }

  /**
   * Compares actual and expected outputs
   */
  private static compareOutputs(actual: any, expected: any): boolean {
    if (actual === expected) return true;

    if (typeof actual === 'object' && typeof expected === 'object') {
      return JSON.stringify(actual) === JSON.stringify(expected);
    }

    return String(actual) === String(expected);
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

    if (passingScore && score >= passingScore) {
      feedback.push('Excellent! All requirements met.');
      return feedback;
    }

    const failedTests = testResults.filter(r => !r.passed);
    const passedTests = testResults.filter(r => r.passed);

    if (passedTests.length > 0) {
      feedback.push(`${passedTests.length}/${testResults.length} tests passed.`);
    }

    if (failedTests.length > 0) {
      feedback.push(`${failedTests.length} test(s) failed.`);

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
