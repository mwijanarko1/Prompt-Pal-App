import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Assets
const LevelCompleteImg = require('../../../../assets/Level.png');
const LevelCurrentImg = require('../../../../assets/Level-1.png');

export type NodeStatus = 'completed' | 'current' | 'locked' | 'special' | 'unlocked';

interface QuestNodeProps {
  status: NodeStatus;
  label?: string;
  onPress?: () => void;
  offset?: number; // horizontal offset from center
}

export const QuestNode = ({
  status,
  label,
  onPress,
  offset = 0,
}: QuestNodeProps) => {
  const getBackgroundColor = () => {
    switch (status) {
      case 'completed': return 'transparent'; // Using image
      case 'current': return 'transparent'; // Using image
      case 'locked': return '#E5E5E5';
      case 'special': return '#58CC02';
      case 'unlocked': return '#FFFFFF';
      default: return '#E5E5E5';
    }
  };

  const getBorderColor = () => {
    switch (status) {
      case 'completed': return 'transparent';
      case 'current': return 'transparent';
      case 'locked': return '#CFCFCF';
      case 'special': return '#46A310';
      case 'unlocked': return '#58CC02';
      default: return '#CFCFCF';
    }
  };

  const renderContent = () => {
    if (status === 'completed') {
      return (
        <Image 
          source={LevelCompleteImg} 
          style={styles.nodeImage}
          resizeMode="contain"
        />
      );
    }
    
    if (status === 'current') {
      return (
        <Image 
          source={LevelCurrentImg} 
          style={styles.nodeImage}
          resizeMode="contain"
        />
      );
    }

    switch (status) {
      case 'locked':
        return <Ionicons name="briefcase" size={28} color="#AFAFAF" />;
      case 'special':
        return <Ionicons name="sparkles" size={32} color="#FFFFFF" />;
      case 'unlocked':
        return <Ionicons name="play" size={28} color="#58CC02" />;
      default:
        return null;
    }
  };

  return (
    <View style={[styles.container, { transform: [{ translateX: offset }] }]}>
      {status === 'current' && label && (
        <View style={styles.tooltip}>
          <Text style={styles.tooltipText}>{label}</Text>
          <View style={styles.tooltipArrow} />
        </View>
      )}

      <TouchableOpacity
        style={[
          styles.node,
          {
            backgroundColor: getBackgroundColor(),
            borderColor: getBorderColor(),
            borderBottomWidth: (status === 'completed' || status === 'current') ? 0 : (status === 'locked' ? 4 : 8),
          }
        ]}
        onPress={onPress}
        disabled={status === 'locked'}
        activeOpacity={0.8}
      >
        {renderContent()}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 20,
    width: '100%',
  },
  node: {
    width: 80,
    height: 80, // Made it square to fit the images better
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    // 3D effect style from Duolingo
    borderBottomWidth: 8,
  },
  nodeImage: {
    width: 90, // Slightly larger than the node container to allow for image depth
    height: 90,
  },
  tooltip: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E5E5',
    marginBottom: 8,
    alignItems: 'center',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tooltipText: {
    fontSize: 15,
    fontWeight: '900',
    fontFamily: 'DIN Round Pro',
    color: '#3C3C3C',
    textTransform: 'uppercase',
  },
  tooltipArrow: {
    width: 12,
    height: 12,
    backgroundColor: '#FFFFFF',
    borderRightWidth: 2,
    borderBottomWidth: 2,
    borderColor: '#E5E5E5',
    position: 'absolute',
    bottom: -7,
    transform: [{ rotate: '45deg' }],
  },
});
