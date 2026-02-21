import { Ionicons } from '@expo/vector-icons';

export type IconName = keyof typeof Ionicons.glyphMap;

export interface Resource {
  id: string;
  appId: string;
  type: 'guide' | 'cheatsheet' | 'lexicon' | 'case-study' | 'prompting-tip';
  title: string;
  description: string;
  content: unknown;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime?: number | null;
  tags: string[];
  icon?: string | null;
  metadata?: unknown | null;
  order: number;
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
}

export function getResourceIcon(type: Resource['type']): IconName {
  switch (type) {
    case 'guide': return 'book';
    case 'cheatsheet': return 'flash';
    case 'lexicon': return 'text';
    case 'case-study': return 'bulb';
    case 'prompting-tip': return 'chatbubble-ellipses';
    default: return 'document-text';
  }
}

export function formatResourceTypeLabel(type: Resource['type']): string {
  return type
    .split('-')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}
