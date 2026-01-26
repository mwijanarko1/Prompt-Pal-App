import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Modal } from './Modal';
import { Button } from './Button';
import { Badge } from './Badge';
import { Resource } from '@/lib/api';

interface ResourceModalProps {
  isVisible: boolean;
  onClose: () => void;
  resource: Resource | null;
}

const { height } = Dimensions.get('window');

export const ResourceModal: React.FC<ResourceModalProps> = ({ isVisible, onClose, resource }) => {
  if (!resource) return null;

  const renderContent = () => {
    const { type, content } = resource;

    if (!content) return <Text className="text-onSurfaceVariant italic">No content available for this resource.</Text>;

    switch (type) {
      case 'lexicon':
        return (
          <View className="space-y-4">
            {Array.isArray(content.terms) && content.terms.map((item: any, index: number) => (
              <View key={index} className="bg-surfaceVariant/20 p-4 rounded-2xl border border-outline/10">
                <Text className="text-primary font-black text-lg mb-1">{item.term}</Text>
                <Text className="text-onSurface text-sm leading-5">{item.definition}</Text>
                {item.example && (
                  <View className="mt-3 bg-black/10 p-2 rounded-lg">
                    <Text className="text-onSurfaceVariant text-xs italic">Example: {item.example}</Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        );

      case 'cheatsheet':
        return (
          <View className="space-y-4">
            {Array.isArray(content.snippets) && content.snippets.map((item: any, index: number) => (
              <View key={index} className="space-y-2">
                <Text className="text-onSurface font-bold text-base">{item.title}</Text>
                <View className="bg-[#1E1E2E] p-4 rounded-xl border border-white/5">
                  <Text className="text-[#A6ADC8] font-mono text-xs leading-5">
                    {item.code}
                  </Text>
                </View>
                <Text className="text-onSurfaceVariant text-xs">{item.description}</Text>
              </View>
            ))}
          </View>
        );

      case 'guide':
        return (
          <View className="space-y-6">
            {Array.isArray(content.sections) && content.sections.map((section: any, index: number) => (
              <View key={index} className="space-y-2">
                <Text className="text-onSurface font-black text-xl">{section.title}</Text>
                <Text className="text-onSurfaceVariant text-sm leading-6">
                  {section.body}
                </Text>
                {section.tips && (
                  <View className="bg-primary/10 p-4 rounded-2xl border border-primary/20 mt-2">
                    <View className="flex-row items-center mb-1">
                      <Ionicons name="bulb" size={16} color="#FF6B00" />
                      <Text className="text-primary font-bold ml-2">Pro Tip</Text>
                    </View>
                    <Text className="text-onSurface text-xs italic">{section.tips}</Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        );

      case 'case-study':
        return (
          <View className="space-y-6">
            <View className="bg-surfaceVariant/30 p-5 rounded-[32px] border border-outline/10">
              <Text className="text-primary font-black text-xs uppercase tracking-[2px] mb-2">The Challenge</Text>
              <Text className="text-onSurface text-base leading-6">{content.challenge}</Text>
            </View>
            
            <View className="space-y-4">
              <Text className="text-onSurface font-black text-xl">The Solution</Text>
              <Text className="text-onSurfaceVariant text-sm leading-6">{content.solution}</Text>
            </View>

            <View className="bg-success/10 p-5 rounded-[32px] border border-success/20">
              <Text className="text-success font-black text-xs uppercase tracking-[2px] mb-2">Key Result</Text>
              <Text className="text-onSurface text-base leading-6 font-bold">{content.result}</Text>
            </View>
          </View>
        );

      default:
        return <Text className="text-onSurfaceVariant">{JSON.stringify(content, null, 2)}</Text>;
    }
  };

  const getIconName = () => {
    switch (resource.type) {
      case 'guide': return 'book';
      case 'cheatsheet': return 'flash';
      case 'lexicon': return 'text';
      case 'case-study': return 'bulb';
      default: return 'document-text';
    }
  };

  return (
    <Modal isVisible={isVisible} onClose={onClose}>
      <View className="max-h-[85%] bg-surface rounded-[40px] overflow-hidden">
        {/* Header */}
        <View className="px-6 pt-8 pb-4 border-b border-outline/5">
          <View className="flex-row justify-between items-start mb-4">
            <View className="flex-1 mr-4">
              <Badge 
                label={resource.type.replace('-', ' ')} 
                variant="primary" 
                className="bg-primary/20 text-primary self-start mb-2" 
              />
              <Text className="text-onSurface text-2xl font-black">{resource.title}</Text>
            </View>
            <TouchableOpacity 
              onPress={onClose}
              className="w-10 h-10 bg-surfaceVariant/50 rounded-full items-center justify-center"
            >
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>
          
          <View className="flex-row items-center">
            <Ionicons name="time-outline" size={14} color="#9CA3AF" />
            <Text className="text-onSurfaceVariant text-xs ml-1 mr-4">{resource.estimatedTime || 5} min read</Text>
            <Ionicons name={getIconName()} size={14} color="#9CA3AF" />
            <Text className="text-onSurfaceVariant text-xs ml-1 uppercase tracking-tighter">
              {resource.type}
            </Text>
          </View>
        </View>

        {/* Content */}
        <ScrollView 
          className="px-6 py-6"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          <Text className="text-onSurfaceVariant text-sm mb-8 leading-6 italic">
            {resource.description}
          </Text>
          
          {renderContent()}
        </ScrollView>

        {/* Footer */}
        <View className="px-6 py-6 border-t border-outline/5 bg-surface">
          <Button 
            label="Got it" 
            onPress={onClose} 
            variant="primary"
            className="w-full"
          />
        </View>
      </View>
    </Modal>
  );
};
