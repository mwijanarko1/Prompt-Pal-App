import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@/components/ui/Card';
import type { CodeTestResult } from '@/lib/scoring/codeScoring';
import * as Clipboard from 'expo-clipboard';

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
]);

const PY_KEYWORDS = new Set([
  'def', 'return', 'if', 'else', 'elif', 'for', 'while', 'try', 'except',
  'True', 'False', 'None', 'and', 'or', 'not', 'in', 'class', 'import',
]);

function highlightCode(code: string, language: string): { text: string; isKeyword: boolean }[] {
  const keywords = language.toLowerCase().includes('python') ? PY_KEYWORDS : JS_KEYWORDS;
  const wordBoundary = /(\b\w+\b|[^\w\s]|\s+)/g;
  const tokens: { text: string; isKeyword: boolean }[] = [];
  let match: RegExpExecArray | null;
  while ((match = wordBoundary.exec(code)) !== null) {
    const segment = match[0];
    const isWord = /^\w+$/.test(segment);
    tokens.push({
      text: segment,
      isKeyword: isWord && keywords.has(segment),
    });
  }
  return tokens;
}

function formatValue(value: any): string {
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
  const handleCopyError = async () => {
    if (executionResult?.error) {
      await Clipboard.setStringAsync(executionResult.error);
    }
  };

  return (
    <View className="pb-6">
      {hasCode && (
        <Card className="mb-4" padding="md" variant="outlined">
          <Text className="text-onSurfaceVariant text-[10px] uppercase tracking-[2px] font-bold mb-2">
            Generated code
          </Text>
          <View className="bg-surfaceVariant/50 rounded-xl p-3 border border-outline/50">
            <Text className="text-onSurface text-xs font-mono" selectable>
              {tokens.map((t, i) => (
                <Text
                  key={i}
                  className={t.isKeyword ? 'text-primary font-semibold' : 'text-onSurface'}
                >
                  {t.text}
                </Text>
              ))}
            </Text>
          </View>
        </Card>
      )}

      {executionResult && totalCount > 0 && (
        <Card className="mb-4" padding="md" variant="outlined">
          <View className="flex-row items-center">
            <Text className="text-onSurfaceVariant text-[10px] uppercase tracking-[2px] font-bold">
              Execution summary
            </Text>
            {score != null && (
              <View className="ml-auto">
                <Text
                  className={`text-xs font-bold ${
                    passingScore != null && score >= passingScore ? 'text-success' : 'text-onSurface'
                  }`}
                >
                  Score {score}
                  {passingScore != null ? ` / ${passingScore}` : ''}
                </Text>
              </View>
            )}
          </View>
          <Text className="text-onSurface text-sm mt-2">
            {passedCount} of {totalCount} tests passed
          </Text>
        </Card>
      )}

      {executionResult?.error && (
        <Card className="mb-4 border-error/30" padding="md" variant="outlined">
          <View className="flex-row items-center mb-2">
            <Ionicons name="alert-circle" size={18} color="#EF4444" />
            <Text className="text-error text-[10px] uppercase tracking-[2px] font-bold ml-2">
              Error
            </Text>
            <TouchableOpacity
              onPress={handleCopyError}
              className="ml-auto px-3 py-1 rounded-full border border-error/40"
            >
              <Text className="text-error text-[10px] font-bold uppercase tracking-widest">
                Copy
              </Text>
            </TouchableOpacity>
          </View>
          <Text className="text-error text-sm font-mono">{executionResult.error}</Text>
        </Card>
      )}

      {executionResult?.testResults && executionResult.testResults.length > 0 && (
        <Card className="mb-4" padding="md" variant="outlined">
          <Text className="text-onSurfaceVariant text-[10px] uppercase tracking-[2px] font-bold mb-3">
            Test results
          </Text>
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
                <View className="mt-2 ml-9">
                  {tc.error && (
                    <Text className="text-error text-xs font-mono mb-2">{tc.error}</Text>
                  )}
                  <View className="flex-row">
                    <View className="flex-1 mr-2">
                      <Text className="text-onSurfaceVariant text-[10px] uppercase mb-1">Expected</Text>
                      <Text className="text-onSurface text-xs font-mono bg-surfaceVariant/50 rounded-lg p-2">
                        {formatValue(tc.expectedOutput)}
                      </Text>
                    </View>
                    <View className="flex-1 ml-2">
                      <Text className="text-onSurfaceVariant text-[10px] uppercase mb-1">Actual</Text>
                      <Text className="text-onSurface text-xs font-mono bg-surfaceVariant/50 rounded-lg p-2">
                        {formatValue(tc.actualOutput ?? tc.output)}
                      </Text>
                    </View>
                  </View>
                </View>
              )}
            </View>
          ))}
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
