import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Ionicons } from '@expo/vector-icons';
import { Level } from '../store';

interface CodeRequirementsViewProps {
  level: Level;
}

export function CodeRequirementsView({ level }: CodeRequirementsViewProps) {
  const [testCasesExpanded, setTestCasesExpanded] = useState(true);

  if (level.type !== 'code' || !level.requirementBrief) {
    return null;
  }

  return (
    <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
      <View className="p-4 space-y-4">
        {/* Language Badge */}
        <View className="flex-row items-center justify-between">
          <Badge 
            label={level.language || 'PYTHON 3.10'} 
            variant="primary"
            className="px-3 py-1.5"
          />
          {level.moduleTitle && (
            <Text className="text-onSurfaceVariant text-sm font-semibold">
              {level.moduleTitle}
            </Text>
          )}
        </View>

        {/* Problem Description Card */}
        <Card title="Problem Description" variant="elevated" padding="lg">
          <Text className="text-onSurface text-base leading-6">
            {level.requirementBrief}
          </Text>
        </Card>

        {/* Test Cases Section - Collapsible */}
        {level.testCases && level.testCases.length > 0 && (
          <Card variant="elevated" padding="none">
            <TouchableOpacity
              onPress={() => setTestCasesExpanded(!testCasesExpanded)}
              className="flex-row items-center justify-between p-4 border-b border-outline/30"
            >
              <View className="flex-row items-center">
                <Ionicons 
                  name="code-slash-outline" 
                  size={20} 
                  color="#03DAC6" 
                  style={{ marginRight: 8 }}
                />
                <Text className="text-onSurface text-lg font-bold">
                  Test Cases ({level.testCases.length})
                </Text>
              </View>
              <Ionicons
                name={testCasesExpanded ? 'chevron-up' : 'chevron-down'}
                size={20}
                color="#FFFFFF"
              />
            </TouchableOpacity>

            {testCasesExpanded && (
              <View className="p-4 space-y-3">
                {level.testCases.map((testCase, index) => (
                  <View
                    key={testCase.id || index}
                    className="bg-surfaceVariant/50 rounded-xl p-3 border border-outline/20"
                  >
                    <View className="flex-row items-center mb-2">
                      <View className={`w-6 h-6 rounded-full items-center justify-center mr-2 ${
                        testCase.passed 
                          ? 'bg-green-500/20' 
                          : 'bg-surfaceVariant'
                      }`}>
                        <Text className={`text-xs font-bold ${
                          testCase.passed ? 'text-green-400' : 'text-onSurfaceVariant'
                        }`}>
                          {index + 1}
                        </Text>
                      </View>
                      <Text className="text-onSurface font-semibold text-sm flex-1">
                        {testCase.name}
                      </Text>
                      {testCase.passed && (
                        <Ionicons name="checkmark-circle" size={18} color="#03DAC6" />
                      )}
                    </View>
                    <Text className="text-onSurfaceVariant text-xs ml-8">
                      {testCase.name.replace('test_', '').replace(/_/g, ' ')}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </Card>
        )}

        {/* Requirement Image (if available) */}
        {level.requirementImage && (
          <Card title="Reference" variant="outlined" padding="md">
            <Text className="text-onSurfaceVariant text-sm mb-2">
              Use this image as context for the problem:
            </Text>
            <View className="bg-surfaceVariant rounded-lg h-32 items-center justify-center">
              <Ionicons name="image-outline" size={32} color="#6B7280" />
              <Text className="text-onSurfaceVariant text-xs mt-2">
                Image reference available
              </Text>
            </View>
          </Card>
        )}
      </View>
    </ScrollView>
  );
}