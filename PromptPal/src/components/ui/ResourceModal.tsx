import {
  Modal as RNModal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from './Button';
import { Badge } from './Badge';
import { Resource, getResourceIcon, formatResourceTypeLabel } from './ResourceUtils';

export type { Resource } from './ResourceUtils';

interface ResourceModalProps {
  isVisible: boolean;
  onClose: () => void;
  resource: Resource | null;
}

type UnknownRecord = Record<string, unknown>;

function asRecord(value: unknown): UnknownRecord {
  return value && typeof value === 'object' ? (value as UnknownRecord) : {};
}

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

export function renderResourceContent(resource: Resource) {
  const { type, content } = resource;

  if (!content) return <Text className="text-onSurfaceVariant italic">No content available for this resource.</Text>;

  const contentData = asRecord(content);

  switch (type) {
    case 'lexicon': {
      const terms = asArray(contentData.terms).length > 0
        ? asArray(contentData.terms)
        : asArray(contentData.entries).map((entry) => {
            const row = asRecord(entry);
            return {
              term: asString(row.term, asString(row.word)),
              definition: asString(row.definition),
              example: asString(row.example),
            };
          });

      if (terms.length === 0) {
        return <Text className="text-onSurfaceVariant italic">No terms available yet.</Text>;
      }

      return (
        <View className="space-y-4">
          {terms.map((item, index: number) => {
            const row = asRecord(item);
            const term = asString(row.term);
            const definition = asString(row.definition);
            const example = asString(row.example);

            return (
              <View key={index} className="bg-surfaceVariant/20 p-4 rounded-2xl border border-outline/10">
                <Text className="text-primary font-black text-lg mb-1">{term || `Term ${index + 1}`}</Text>
                <Text className="text-onSurface text-sm leading-5">{definition || 'Definition unavailable.'}</Text>
                {example ? (
                  <View className="mt-3 bg-black/10 p-2 rounded-lg">
                    <Text className="text-onSurfaceVariant text-xs italic">Example: {example}</Text>
                  </View>
                ) : null}
              </View>
            );
          })}
        </View>
      );
    }

    case 'cheatsheet': {
      const snippets = asArray(contentData.snippets).length > 0
        ? asArray(contentData.snippets)
        : asArray(contentData.patterns).map((pattern) => {
            const row = asRecord(pattern);
            return {
              title: asString(row.title, asString(row.name)),
              code: asString(row.code),
              description: asString(row.description),
            };
          });

      if (snippets.length === 0) {
        return <Text className="text-onSurfaceVariant italic">No snippets available yet.</Text>;
      }

      return (
        <View className="space-y-4">
          {snippets.map((item, index: number) => {
            const row = asRecord(item);
            const title = asString(row.title, `Snippet ${index + 1}`);
            const code = asString(row.code);
            const description = asString(row.description);

            return (
              <View key={index} className="space-y-2">
                <Text className="text-onSurface font-bold text-base">{title}</Text>
                <View className="bg-[#1E1E2E] p-4 rounded-xl border border-white/5">
                  <Text className="text-[#A6ADC8] font-mono text-xs leading-5">
                    {code || '// Code example unavailable.'}
                  </Text>
                </View>
                {description ? (
                  <Text className="text-onSurfaceVariant text-xs">{description}</Text>
                ) : null}
              </View>
            );
          })}
        </View>
      );
    }

    case 'guide': {
      const sections = asArray(contentData.sections);
      if (sections.length === 0) {
        return <Text className="text-onSurfaceVariant italic">No guide sections available yet.</Text>;
      }

      return (
        <View className="space-y-5">
          {sections.map((section, index: number) => {
            const row = asRecord(section);
            const title = asString(row.title, `Section ${index + 1}`);
            const body = asString(row.body, asString(row.text));
            const tips = asString(row.tips);

            return (
              <View key={index} className="space-y-3">
                <Text className="text-onSurface font-black text-xl">{title}</Text>
                <Text className="text-onSurfaceVariant text-sm leading-6">
                  {body || 'Content unavailable for this section.'}
                </Text>
                {tips ? (
                  <View className="bg-primary/10 p-4 rounded-2xl border border-primary/20 mt-4 mb-4">
                    <View className="flex-row items-center mb-2">
                      <Ionicons name="bulb" size={16} color="#FF6B00" />
                      <Text className="text-primary font-bold ml-2">Pro Tip</Text>
                    </View>
                    <Text className="text-onSurface text-xs italic leading-5">{tips}</Text>
                  </View>
                ) : null}
              </View>
            );
          })}
        </View>
      );
    }

    case 'case-study':
      return (
        <View className="space-y-6">
          <View className="bg-surfaceVariant/30 p-5 rounded-[32px] border border-outline/10">
            <Text className="text-primary font-black text-xs uppercase tracking-[2px] mb-2">The Challenge</Text>
            <Text className="text-onSurface text-base leading-6">{asString(contentData.challenge, 'Challenge details unavailable.')}</Text>
          </View>

          <View className="space-y-4">
            <Text className="text-onSurface font-black text-xl">The Solution</Text>
            <Text className="text-onSurfaceVariant text-sm leading-6">{asString(contentData.solution, 'Solution details unavailable.')}</Text>
          </View>

          <View className="bg-success/10 p-5 rounded-[32px] border border-success/20">
            <Text className="text-success font-black text-xs uppercase tracking-[2px] mb-2">Key Result</Text>
            <Text className="text-onSurface text-base leading-6 font-bold">{asString(contentData.result, 'Result details unavailable.')}</Text>
          </View>
        </View>
      );

    case 'prompting-tip': {
      const sections = asArray(contentData.sections);
      if (sections.length === 0) {
        return <Text className="text-onSurfaceVariant italic">No prompting tips available yet.</Text>;
      }

      return (
        <View className="space-y-6">
          {sections.map((section, index: number) => {
            const row = asRecord(section);
            const title = asString(row.title, `Tip ${index + 1}`);
            const body = asString(row.content, asString(row.body, asString(row.text)));
            const example = asString(row.example);

            return (
              <View key={index} className="space-y-3">
                <View className="flex-row items-center">
                  <Ionicons name="bulb" size={20} color="#FF6B00" />
                  <Text className="text-onSurface font-black text-lg ml-2">{title}</Text>
                </View>
                <Text className="text-onSurfaceVariant text-sm leading-6 pl-7">
                  {body || 'Tip details unavailable.'}
                </Text>
                {example ? (
                  <View className="bg-primary/5 p-4 rounded-2xl border border-primary/10 ml-7">
                    <Text className="text-primary font-bold text-xs uppercase tracking-widest mb-1">Example Prompt</Text>
                    <Text className="text-onSurface text-sm italic leading-5">{example}</Text>
                  </View>
                ) : null}
              </View>
            );
          })}
        </View>
      );
    }

    default:
      return <Text className="text-onSurfaceVariant">{JSON.stringify(content, null, 2)}</Text>;
  }
}

export const ResourceModal: React.FC<ResourceModalProps> = ({ isVisible, onClose, resource }) => {
  const { height } = useWindowDimensions();

  if (!resource) return null;

  return (
    <RNModal
      visible={isVisible}
      transparent
      animationType="slide"
      presentationStyle="overFullScreen"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end bg-black/70">
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

        <View
          className="bg-surface rounded-t-[32px] overflow-hidden border border-outline/10"
          style={{ maxHeight: height * 0.9 }}
        >
          <View className="items-center pt-3 pb-1">
            <View className="h-1.5 w-12 rounded-full bg-outline/40" />
          </View>

          <View className="px-6 pt-4 pb-4 border-b border-outline/5">
            <View className="flex-row justify-between items-start mb-4">
              <View className="flex-1 mr-4">
                <Badge
                  label={formatResourceTypeLabel(resource.type)}
                  variant="primary"
                  className="bg-primary/20 text-primary self-start mb-2"
                />
                <Text className="text-onSurface text-2xl font-black">{resource.title}</Text>
              </View>
              <Pressable
                onPress={onClose}
                className="w-10 h-10 bg-surfaceVariant/50 rounded-full items-center justify-center"
              >
                <Ionicons name="close" size={24} color="#6B7280" />
              </Pressable>
            </View>

            <View className="flex-row items-center">
              <Ionicons name="time-outline" size={14} color="#9CA3AF" />
              <Text className="text-onSurfaceVariant text-xs ml-1 mr-4">{resource.estimatedTime || 5} min read</Text>
              <Ionicons name={getResourceIcon(resource.type)} size={14} color="#9CA3AF" />
              <Text className="text-onSurfaceVariant text-xs ml-1 uppercase tracking-tighter">
                {resource.type}
              </Text>
            </View>
          </View>

          <ScrollView
            className="flex-1 px-6 py-6"
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingBottom: 24 }}
          >
            <Text className="text-onSurfaceVariant text-sm mb-8 leading-6 italic">
              {resource.description}
            </Text>

            {renderResourceContent(resource)}
          </ScrollView>

          <View className="px-6 pt-4 pb-8 border-t border-outline/5 bg-surface">
            <Button
              onPress={onClose}
              variant="primary"
              className="w-full"
            >
              Got it
            </Button>
          </View>
        </View>
      </View>
    </RNModal>
  );
};
