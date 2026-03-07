import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@/components/ui/Card';
import type { CodeTestResult } from '@/lib/scoring/codeScoring';
import * as Clipboard from 'expo-clipboard';
import { useState } from 'react';

export interface CodeExecutionResult {
  code: string;
  testResults: CodeTestResult[];
  output: string;
  success: boolean;
  error?: string;
  score?: number;
  passingScore?: number;
}

export interface CodeExecutionViewProps {
  code: string;
  executionResult: CodeExecutionResult | null;
  language: string;
}

const JS_KEYWORDS = new Set([
  'function', 'const', 'let', 'var', 'return', 'if', 'else', 'for', 'while',
  'try', 'catch', 'async', 'await', 'true', 'false', 'null', 'undefined',
  'new', 'this', 'class', 'extends', 'import', 'export', 'from', 'default',
  'typeof', 'instanceof', 'in', 'of', 'break', 'continue', 'switch', 'case',
  'default', 'throw', 'finally', 'yield', 'super', 'static', 'get', 'set',
  'public', 'private', 'protected', 'readonly', 'interface', 'type', 'enum',
]);

const PY_KEYWORDS = new Set([
  'def', 'return', 'if', 'else', 'elif', 'for', 'while', 'try', 'except',
  'True', 'False', 'None', 'and', 'or', 'not', 'in', 'class', 'import',
  'from', 'as', 'with', 'lambda', 'yield', 'pass', 'break', 'continue',
  'global', 'nonlocal', 'assert', 'raise', 'finally', 'is', 'del',
]);

type TokenType = 'keyword' | 'string' | 'comment' | 'number' | 'operator' | 'normal';

function highlightCode(code: string, language: string): { text: string; type: TokenType }[] {
  const keywords = language.toLowerCase().includes('python') ? PY_KEYWORDS : JS_KEYWORDS;
  const tokens: { text: string; type: TokenType }[] = [];

  // Simple regex-based tokenization
  const patterns = [
    // Comments
    { regex: /(\/\/.*$|\/\*[\s\S]*?\*\/|#.*$)/gm, type: 'comment' as TokenType },
    // Strings
    { regex: /(["'`])((?:\\.|(?!\1)[^\\\n])*?)\1/g, type: 'string' as TokenType },
    // Numbers
    { regex: /\b\d+(\.\d+)?\b/g, type: 'number' as TokenType },
    // Operators
    { regex: /[+\-*/%=<>!&|^~?:;,.(){}[\]]/g, type: 'operator' as TokenType },
    // Keywords and identifiers
    { regex: /\b\w+\b/g, type: 'normal' as TokenType },
  ];

  let lastIndex = 0;
  const matches: Array<{ index: number; match: string; type: TokenType }> = [];

  // Find all matches
  for (const pattern of patterns) {
    let match;
    while ((match = pattern.regex.exec(code)) !== null) {
      matches.push({
        index: match.index,
        match: match[0],
        type: pattern.type,
      });
    }
  }

  // Sort by index and process
  matches.sort((a, b) => a.index - b.index);

  for (const match of matches) {
    // Add any text before this match
    if (match.index > lastIndex) {
      const beforeText = code.slice(lastIndex, match.index);
      if (beforeText) {
        tokens.push({ text: beforeText, type: 'normal' });
      }
    }

    // Add the matched token
    let tokenType: TokenType = match.type;
    if (tokenType === 'normal' && keywords.has(match.match)) {
      tokenType = 'keyword';
    }

    tokens.push({ text: match.match, type: tokenType });
    lastIndex = match.index + match.match.length;
  }

  // Add remaining text
  if (lastIndex < code.length) {
    tokens.push({ text: code.slice(lastIndex), type: 'normal' });
  }

  return tokens;
}

function formatValue(value: unknown): string {
  if (value === undefined) return 'undefined';
  if (value === null) return 'null';
  if (typeof value === 'string') return `"${value}"`;
  if (typeof value === 'bigint') return value.toString();

  try {
    const json = JSON.stringify(value);
    if (json !== undefined) return json;
  } catch {
    // ignore JSON errors
  }

  return String(value);
}

export function CodeExecutionView({
  code,
  executionResult,
  language,
}: CodeExecutionViewProps) {
  const [testResultsExpanded, setTestResultsExpanded] = useState(false);

  const hasCode = code.trim().length > 0;
  const hasResult = executionResult != null && (
    executionResult.error != null ||
    (executionResult.testResults != null && executionResult.testResults.length > 0) ||
    (executionResult.output != null && executionResult.output !== '')
  );
  if (!hasCode && !hasResult) return null;

  const tokens = hasCode ? highlightCode(code, language) : [];
  const passedCount = executionResult?.testResults?.filter(r => r.passed).length ?? 0;
  const totalCount = executionResult?.testResults?.length ?? 0;
  const score = executionResult?.score;
  const passingScore = executionResult?.passingScore;

  // Calculate total execution time
  const totalExecutionTime = executionResult?.testResults?.reduce((total, test) => {
    return total + (test.executionTime || 0);
  }, 0) || 0;
  const handleCopyError = async () => {
    if (executionResult?.error) {
      await Clipboard.setStringAsync(executionResult.error);
    }
  };

  return (
    <View className="pb-6">
      {hasCode && (
        <Card className="mb-4" padding="md" variant="outlined">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-onSurfaceVariant text-[10px] uppercase tracking-[2px] font-bold">
              Generated code
            </Text>
            <TouchableOpacity
              onPress={async () => {
                await Clipboard.setStringAsync(code);
                // Could add a toast notification here
              }}
              className="px-3 py-1 rounded-full border border-outline/40 bg-surfaceVariant/30"
            >
              <Text className="text-onSurface text-[10px] font-bold uppercase tracking-widest">
                Copy
              </Text>
            </TouchableOpacity>
          </View>
          <View className="bg-surfaceVariant/50 rounded-xl p-3 border border-outline/50">
            <Text className="text-onSurface text-xs font-mono" selectable>
              {tokens.map((t, i) => {
                let textClass = 'text-onSurface';
                switch (t.type) {
                  case 'keyword':
                    textClass = 'text-primary font-semibold';
                    break;
                  case 'string':
                    textClass = 'text-success';
                    break;
                  case 'comment':
                    textClass = 'text-onSurfaceVariant';
                    break;
                  case 'number':
                    textClass = 'text-info';
                    break;
                  case 'operator':
                    textClass = 'text-warning font-semibold';
                    break;
                }
                return (
                  <Text key={i} className={textClass}>
                    {t.text}
                  </Text>
                );
              })}
            </Text>
          </View>
        </Card>
      )}

      {executionResult && totalCount > 0 && (
        <Card className="mb-4" padding="md" variant="outlined">
          <View className="flex-row items-center justify-between">
            <Text className="text-onSurfaceVariant text-[10px] uppercase tracking-[2px] font-bold">
              Execution summary
            </Text>
            <View className="flex-row items-center space-x-3">
              {totalExecutionTime > 0 && (
                <View className="flex-row items-center">
                  <Ionicons name="time-outline" size={12} color="#6B7280" />
                  <Text className="text-onSurfaceVariant text-[10px] ml-1">
                    {totalExecutionTime}ms
                  </Text>
                </View>
              )}
              {score != null && (
                <Text
                  className={`text-xs font-bold ${
                    passingScore != null && score >= passingScore ? 'text-success' : 'text-onSurface'
                  }`}
                >
                  Score {score}
                  {passingScore != null ? ` / ${passingScore}` : ''}
                </Text>
              )}
            </View>
          </View>
          <Text className="text-onSurface text-sm mt-2">
            {passedCount} of {totalCount} tests passed
          </Text>
        </Card>
      )}

      {executionResult?.error && (
        <Card className="mb-4 border-error/30" padding="md" variant="outlined">
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-row items-center">
              <Ionicons name="alert-circle" size={18} color="#EF4444" />
              <Text className="text-error text-[10px] uppercase tracking-[2px] font-bold ml-2">
                Execution Error
              </Text>
            </View>
            <TouchableOpacity
              onPress={handleCopyError}
              className="px-3 py-1 rounded-full border border-error/40"
            >
              <Text className="text-error text-[10px] font-bold uppercase tracking-widest">
                Copy
              </Text>
            </TouchableOpacity>
          </View>

          <View className="bg-error/5 rounded-lg p-3 border border-error/20">
            <Text className="text-error text-sm font-mono leading-5">{executionResult.error}</Text>
          </View>

          <Text className="text-onSurfaceVariant text-[10px] mt-2 italic">
            Check your prompt and try again. Make sure your code follows the requirements.
          </Text>
        </Card>
      )}

      {executionResult?.testResults && executionResult.testResults.length > 0 && (
        <Card className="mb-4" padding="md" variant="outlined">
          <TouchableOpacity
            onPress={() => setTestResultsExpanded(!testResultsExpanded)}
            className="flex-row items-center justify-between mb-3"
          >
            <Text className="text-onSurfaceVariant text-[10px] uppercase tracking-[2px] font-bold">
              Test results ({passedCount}/{totalCount} passed)
            </Text>
            <View className="flex-row items-center">
              <Ionicons
                name={testResultsExpanded ? 'chevron-up' : 'chevron-down'}
                size={16}
                color="#6B7280"
              />
            </View>
          </TouchableOpacity>

          {testResultsExpanded && (
            <>
              {executionResult.testResults.map((tc: CodeTestResult, index: number) => (
            <View
              key={`test-result-${tc.id || index}-${index}`}
              className="py-3 border-b border-outline/20 last:border-b-0"
            >
              <View className="flex-row items-center">
                <View
                  className={`w-6 h-6 rounded-full items-center justify-center mr-3 ${
                    tc.passed ? 'bg-success/20' : 'bg-error/20'
                  }`}
                >
                  <Ionicons
                    name={tc.passed ? 'checkmark' : 'close'}
                    size={14}
                    color={tc.passed ? '#10B981' : '#EF4444'}
                  />
                </View>
                <Text className="text-onSurface text-sm flex-1 font-medium" numberOfLines={1}>
                  {tc.name}
                </Text>
                {tc.executionTime != null && (
                  <Text className="text-onSurfaceVariant text-[10px] mr-3">
                    {tc.executionTime}ms
                  </Text>
                )}
                <Text
                  className={`text-[10px] font-bold uppercase tracking-widest ${
                    tc.passed ? 'text-success' : 'text-error'
                  }`}
                >
                  {tc.passed ? 'Pass' : 'Fail'}
                </Text>
              </View>

              {!tc.passed && (
                <View className="mt-3 ml-9">
                  {tc.error && (
                    <View className="mb-3">
                      <Text className="text-onSurfaceVariant text-[10px] uppercase mb-1 font-semibold">Error Message</Text>
                      <View className="bg-error/10 rounded-lg p-2 border border-error/20">
                        <Text className="text-error text-xs font-mono leading-4">{tc.error}</Text>
                      </View>
                    </View>
                  )}
                  {(tc.expectedOutput || tc.actualOutput || tc.output) && (
                    <View className="flex-row">
                      <View className="flex-1 mr-2">
                        <Text className="text-onSurfaceVariant text-[10px] uppercase mb-1 font-semibold">Expected Output</Text>
                        <Text className="text-success text-xs font-mono bg-success/10 rounded-lg p-2 border border-success/20 min-h-[32px]">
                          {formatValue(tc.expectedOutput)}
                        </Text>
                      </View>
                      <View className="flex-1 ml-2">
                        <Text className="text-onSurfaceVariant text-[10px] uppercase mb-1 font-semibold">Your Output</Text>
                        <Text className="text-error text-xs font-mono bg-error/10 rounded-lg p-2 border border-error/20 min-h-[32px]">
                          {formatValue(tc.actualOutput ?? tc.output)}
                        </Text>
                      </View>
                    </View>
                  )}
                </View>
              )}
            </View>
          ))}
            </>
          )}
        </Card>
      )}

      {executionResult?.output != null && executionResult.output !== '' && (
        <Card className="mb-4 bg-surfaceVariant/30" padding="md" variant="outlined">
          <Text className="text-onSurfaceVariant text-[10px] uppercase tracking-[2px] font-bold mb-2">
            Feedback
          </Text>
          <View className="bg-background/80 rounded-xl p-3 border border-outline/30">
            <Text className="text-onSurface text-xs font-mono" selectable>
              {executionResult.output}
            </Text>
          </View>
        </Card>
      )}
    </View>
  );
}
