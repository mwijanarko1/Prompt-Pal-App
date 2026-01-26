import React from 'react';
import { View, Text, Modal, TouchableOpacity } from 'react-native';
import { Button, Card } from './index';

interface ResultModalProps {
  visible: boolean;
  score: number;
  xp: number;
  testCases?: { name: string; passed: boolean }[];
  output?: string;
  onNext: () => void;
  onClose: () => void;
}

export function ResultModal({
  visible,
  score,
  xp,
  testCases,
  output,
  onNext,
  onClose,
}: ResultModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/60 justify-end">
        <TouchableOpacity 
          activeOpacity={1} 
          onPress={onClose} 
          className="flex-1"
        />
        <View className="bg-background rounded-t-[32px] p-6 border-t border-outline">
          <View className="items-center mb-6">
            <View className="w-12 h-1.5 bg-outline rounded-full mb-6" />
            
            <View className="flex-row items-center justify-between w-full mb-4">
              <View className="flex-row items-center">
                <View className="w-12 h-12 bg-success/20 rounded-2xl items-center justify-center mr-3 shadow-lg shadow-success/20">
                  <Text className="text-success text-2xl font-black">✓</Text>
                </View>
                <View>
                  <Text className="text-onSurface text-2xl font-black tracking-tight">Challenge Passed!</Text>
                  <Text className="text-onSurfaceVariant text-[10px] uppercase tracking-[3px] font-black">
                    LOGIC VALIDATION: {score}%
                  </Text>
                </View>
              </View>
              <Text className="text-success text-3xl font-black tracking-tighter">+{xp} XP</Text>
            </View>

            {testCases && (
              <Card className="w-full bg-surfaceVariant/50 border-0 p-6 mb-6 rounded-[32px]">
                {testCases.map((tc, i) => (
                  <View key={i} className="flex-row items-center mb-3">
                    <View className="w-5 h-5 bg-success/20 rounded-full items-center justify-center mr-3">
                      <Text className="text-success text-[10px] font-black">✓</Text>
                    </View>
                    <Text className="text-onSurface text-xs font-black uppercase tracking-widest flex-1">{tc.name}</Text>
                    <Text className="text-success text-[10px] font-black uppercase tracking-widest">PASSED</Text>
                  </View>
                ))}
                
                {output && (
                  <>
                    <View className="h-[1px] bg-outline/20 my-4" />
                    <Text className="text-primary text-[10px] font-black uppercase tracking-[2px] mb-2">System Output</Text>
                    <Text className="text-primary text-xs font-mono bg-primary/5 p-3 rounded-xl border border-primary/10">
                      {output}
                    </Text>
                  </>
                )}
              </Card>
            )}
          </View>

          <Button 
            onPress={onNext} 
            variant="primary" 
            size="lg" 
            fullWidth
            className="rounded-full py-6 shadow-glow"
          >
            <Text className="text-onPrimary text-lg font-black uppercase tracking-widest">Next Challenge →</Text>
          </Button>
        </View>
      </View>
    </Modal>
  );
}
