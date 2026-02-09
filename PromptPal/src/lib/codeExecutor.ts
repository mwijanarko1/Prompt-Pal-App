export interface ExecutionOptions {
  code: string;
  functionName?: string;
  inputs: any[];
  timeoutMs?: number;
}

export interface ExecutionResult {
  success: boolean;
  output: any;
  error?: string;
  executionTime: number;
}

export interface PreparedExecution {
  functionName: string;
  run: (inputs: any[]) => Promise<ExecutionResult>;
}

const DEFAULT_TIMEOUT_MS = 5000;
const MAX_CACHE_ENTRIES = 50;

const SAFE_GLOBALS = Object.freeze({
  Math,
  JSON,
  Array,
  Object,
  String,
  Number,
  Boolean,
  RegExp,
  Date,
  Map,
  Set,
  WeakMap,
  WeakSet,
  BigInt,
  Symbol,
  parseInt,
  parseFloat,
  isNaN,
  isFinite,
});

const STUB_CONSOLE = Object.freeze({
  log: () => {},
  info: () => {},
  warn: () => {},
  error: () => {},
  debug: () => {},
});

const EXECUTOR_CACHE = new Map<string, { runner: Function; lineOffset: number }>();

const DISALLOWED_PATTERNS: { pattern: RegExp; message: string }[] = [
  { pattern: /\beval\s*\(/i, message: 'Usage of eval is not allowed.' },
  { pattern: /\bFunction\s*\(/, message: 'Dynamic Function construction is not allowed.' },
  { pattern: /\bglobalThis\b|\bwindow\b|\bdocument\b|\bglobal\b/i, message: 'Access to global objects is not allowed.' },
  { pattern: /\bfetch\b|\bXMLHttpRequest\b|\bWebSocket\b/i, message: 'Network access is not allowed.' },
  { pattern: /\blocalStorage\b|\bsessionStorage\b/i, message: 'Storage access is not allowed.' },
  { pattern: /\bprocess\b|\brequire\b|\bimport\s+\w+/i, message: 'Module access is not allowed.' },
];

const FUNCTION_NAME_PATTERNS = [
  /\bfunction\s+([A-Za-z_$][\w$]*)\s*\(/,
  /\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*function\s*\(/,
  /\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*\(?[^=]*?\)?\s*=>/,
  /\bexport\s+function\s+([A-Za-z_$][\w$]*)\s*\(/,
  /\bexport\s+(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=/,
];

function normalizeInputs(inputs: any[]): any[] {
  if (inputs == null) return [];
  return Array.isArray(inputs) ? inputs : [inputs];
}

function validateFunctionName(functionName: string): void {
  if (!/^[A-Za-z_$][\w$]*$/.test(functionName)) {
    const error = new Error(`Invalid function name: ${functionName}`);
    error.name = 'InvalidFunctionNameError';
    throw error;
  }
}

function validateSecurity(code: string): void {
  for (const rule of DISALLOWED_PATTERNS) {
    if (rule.pattern.test(code)) {
      const error = new Error(rule.message);
      error.name = 'SecurityError';
      throw error;
    }
  }
}

function injectLoopGuards(code: string): string {
  let guarded = code;

  guarded = guarded.replace(/(\bfor\s*\([^)]*\)\s*{)/g, '$1\n__checkTimeout();');
  guarded = guarded.replace(/(\bwhile\s*\([^)]*\)\s*{)/g, '$1\n__checkTimeout();');
  guarded = guarded.replace(/\bdo\s*{/g, 'do {\n__checkTimeout();');
  guarded = guarded.replace(/(\bfor\s*\([^)]*\))\s*([^\s{][^;]*;)/g, '$1 { __checkTimeout(); $2 }');
  guarded = guarded.replace(/(\bwhile\s*\([^)]*\))\s*([^\s{][^;]*;)/g, '$1 { __checkTimeout(); $2 }');

  return guarded;
}

function buildRunner(code: string, functionName: string, timeoutMs: number): { runner: Function; lineOffset: number } {
  const guardedCode = injectLoopGuards(code);

  const preludeLines = [
    '"use strict";',
    'const { Math, JSON, Array, Object, String, Number, Boolean, RegExp, Date, Map, Set, WeakMap, WeakSet, BigInt, Symbol, parseInt, parseFloat, isNaN, isFinite } = __sandbox;',
    'const console = __sandbox.console;',
    'const globalThis = undefined;',
    'const global = undefined;',
    'const window = undefined;',
    'const document = undefined;',
    'const fetch = undefined;',
    'const XMLHttpRequest = undefined;',
    'const WebSocket = undefined;',
    'const localStorage = undefined;',
    'const sessionStorage = undefined;',
    'const process = undefined;',
    'const require = undefined;',
    'const Function = undefined;',
    'const __startTime = Date.now();',
    `const __timeoutMs = ${Math.max(1, timeoutMs)};`,
    'const __checkTimeout = () => {',
    '  if (Date.now() - __startTime > __timeoutMs) {',
    '    const err = new Error("Execution timed out");',
    '    err.name = "TimeoutError";',
    '    throw err;',
    '  }',
    '};',
  ];

  const prefix = `${preludeLines.join('\n')}\n`;
  const lineOffset = preludeLines.length;

  const source = `${prefix}${guardedCode}\n` +
    `if (typeof ${functionName} !== "function") {\n` +
    `  const err = new Error("Function '${functionName}' not found");\n` +
    `  err.name = "FunctionNotFoundError";\n` +
    `  throw err;\n` +
    `}\n` +
    '__checkTimeout();\n' +
    `return ${functionName}.apply(undefined, inputs);`;

  const runner = new Function('__sandbox', 'inputs', source);
  return { runner, lineOffset };
}

function getCacheKey(code: string, functionName: string, timeoutMs: number): string {
  return `${timeoutMs}::${functionName}::${code}`;
}

function getErrorLocation(stack: string | undefined, lineOffset: number): { line?: number; column?: number } {
  if (!stack) return {};

  const match = stack.match(/<anonymous>:(\d+):(\d+)/) || stack.match(/:(\d+):(\d+)/);
  if (!match) return {};

  const line = Number(match[1]);
  const column = Number(match[2]);
  if (!Number.isFinite(line) || line <= 0) return {};

  const adjustedLine = line - lineOffset;
  if (adjustedLine <= 0) return {};

  return { line: adjustedLine, column };
}

function formatExecutionError(error: unknown, lineOffset: number): string {
  if (!error) return 'Unknown error';

  const err = error as Error;
  const message = err.message || 'Unknown error';
  const location = getErrorLocation(err.stack, lineOffset);

  if (err.name === 'TimeoutError') {
    return 'Your code timed out - check for infinite loops.';
  }

  if (err.name === 'SecurityError') {
    return message;
  }

  if (err.name === 'FunctionNotFoundError') {
    return message;
  }

  if (err.name === 'SyntaxError') {
    if (location.line) {
      return `Syntax error on line ${location.line}: ${message}`;
    }
    return `Syntax error: ${message}`;
  }

  if (location.line) {
    return `Line ${location.line}: ${message}`;
  }

  return message;
}

function trimCacheIfNeeded(): void {
  if (EXECUTOR_CACHE.size <= MAX_CACHE_ENTRIES) return;
  const keys = Array.from(EXECUTOR_CACHE.keys());
  const excess = EXECUTOR_CACHE.size - MAX_CACHE_ENTRIES;
  for (let i = 0; i < excess; i += 1) {
    EXECUTOR_CACHE.delete(keys[i]);
  }
}

export class CodeExecutor {
  static clearCache(): void {
    EXECUTOR_CACHE.clear();
  }
  static extractFunctionName(code: string): string | null {
    for (const pattern of FUNCTION_NAME_PATTERNS) {
      const match = code.match(pattern);
      if (match?.[1]) return match[1];
    }
    return null;
  }

  static prepare(options: Omit<ExecutionOptions, 'inputs'>): PreparedExecution {
    const { code, functionName, timeoutMs = DEFAULT_TIMEOUT_MS } = options;

    if (!code || typeof code !== 'string') {
      const error = new Error('Code must be a non-empty string');
      error.name = 'ValidationError';
      throw error;
    }

    validateSecurity(code);

    const resolvedName = functionName ?? CodeExecutor.extractFunctionName(code);
    if (!resolvedName) {
      const error = new Error('Function name not found - check your function definition.');
      error.name = 'FunctionNotFoundError';
      throw error;
    }

    validateFunctionName(resolvedName);

    const cacheKey = getCacheKey(code, resolvedName, timeoutMs);
    let cached = EXECUTOR_CACHE.get(cacheKey);
    if (!cached) {
      try {
        cached = buildRunner(code, resolvedName, timeoutMs);
      } catch (error) {
        const err = new Error(formatExecutionError(error, 0));
        err.name = error instanceof Error ? error.name : 'ExecutionError';
        throw err;
      }
      EXECUTOR_CACHE.set(cacheKey, cached);
      trimCacheIfNeeded();
    }

    return {
      functionName: resolvedName,
      run: async (inputs: any[]): Promise<ExecutionResult> => {
        const startTime = Date.now();
        try {
          const sandbox = Object.freeze({ ...SAFE_GLOBALS, console: STUB_CONSOLE });
          const result = cached!.runner(sandbox, normalizeInputs(inputs));
          const output = result instanceof Promise ? await result : result;
          return {
            success: true,
            output,
            executionTime: Date.now() - startTime,
          };
        } catch (error) {
          return {
            success: false,
            output: undefined,
            error: formatExecutionError(error, cached!.lineOffset),
            executionTime: Date.now() - startTime,
          };
        }
      },
    };
  }

  static async execute(options: ExecutionOptions): Promise<ExecutionResult> {
    const prepared = CodeExecutor.prepare({
      code: options.code,
      functionName: options.functionName,
      timeoutMs: options.timeoutMs,
    });
    return prepared.run(options.inputs);
  }
}
