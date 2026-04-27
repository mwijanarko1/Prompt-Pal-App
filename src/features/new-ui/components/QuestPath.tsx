import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { QuestNode, NodeStatus } from './QuestNode';

interface PathNode {
  id: string;
  status: NodeStatus;
  label?: string;
}

interface QuestPathProps {
  nodes: PathNode[];
  onNodePress?: (nodeId: string) => void;
}

export const QuestPath = ({ nodes, onNodePress }: QuestPathProps) => {
  return (
    <View style={styles.container}>
      {/* Vertical Background Line */}
      <View style={styles.verticalLine} />
      
      {nodes.map((node, index) => {
        // Alternating logic for offsets
        // Sequence: 0 (center), 60 (right), 0 (center), -60 (left), 0 (center) ...
        // Simplified Pattern based on image:
        // Index 0: -50 (Left) - Completed
        // Index 1: 50 (Right) - Special
        // Index 2: 0 (Center) - Start/Current
        // Index 3: 50 (Right) - Locked
        
        let offset = 0;
        if (index % 4 === 0) offset = -50;
        else if (index % 4 === 1) offset = 50;
        else if (index % 4 === 2) offset = 0;
        else offset = 40; // Zigzagging slightly differently

        return (
          <QuestNode
            key={node.id}
            status={node.status}
            label={node.label}
            offset={offset}
            onPress={() => onNodePress?.(node.id)}
          />
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 40,
    width: '100%',
    position: 'relative',
  },
  verticalLine: {
    position: 'absolute',
    top: 40,
    bottom: 40,
    width: 14,
    backgroundColor: '#E5E5E5',
    borderRadius: 7,
  },
});
