import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@/components/ui/Card';
import type { CodeTestResult } from '@/lib/scoring/codeScoring';

export interface CodeExecutionResult {
  testResults: CodeTestResult[];
  output: string;
  success: boolean;
  error?: string;
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

      {executionResult?.error && (
        <Card className="mb-4 border-error/30" padding="md" variant="outlined">
          <View className="flex-row items-center mb-2">
            <Ionicons name="alert-circle" size={18} color="#EF4444" />
            <Text className="text-error text-[10px] uppercase tracking-[2px] font-bold ml-2">
              Error
            </Text>
          </View>
          <Text className="text-error text-sm font-mono">{executionResult.error}</Text>
        </Card>
      )}

      {executionResult?.testResults && executionResult.testResults.length > 0 && (
        <Card className="mb-4" padding="md" variant="outlined">
          <Text className="text-onSurfaceVariant text-[10px] uppercase tracking-[2px] font-bold mb-3">
            Test results
          </Text>
          {executionResult.testResults.map((tc: CodeTestResult) => (
            <View
              key={tc.id}
              className="flex-row items-center py-2 border-b border-outline/20 last:border-b-0"
            >
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
              <Text
                className={`text-[10px] font-bold uppercase tracking-widest ${
                  tc.passed ? 'text-success' : 'text-error'
                }`}
              >
                {tc.passed ? 'Pass' : 'Fail'}
              </Text>
            </View>
          ))}
        </Card>
      )}

      {executionResult?.output != null && executionResult.output !== '' && (
        <Card className="mb-4 bg-surfaceVariant/30" padding="md" variant="outlined">
          <Text className="text-onSurfaceVariant text-[10px] uppercase tracking-[2px] font-bold mb-2">
            Output
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
