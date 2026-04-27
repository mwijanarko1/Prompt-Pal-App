import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface FeaturedCourseCardProps {
  level: number;
  track: string;
  title: string;
  progress: number;
  onPress?: () => void;
}

export const FeaturedCourseCard = ({ level, track, title, progress, onPress }: FeaturedCourseCardProps) => {
  return (
    <TouchableOpacity style={styles.container} activeOpacity={0.9} onPress={onPress}>
      <View style={styles.header}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{`LEVEL ${level} • ${track.toUpperCase()}`}</Text>
        </View>
      </View>
      
      <Text style={styles.title}>{title}</Text>
      
      <View style={styles.progressSection}>
        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBar, { width: `${progress}%` }]} />
        </View>
        <Text style={styles.progressText}>{`${progress}%`}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#58CC02',
    borderRadius: 24,
    padding: 20,
    marginHorizontal: 16,
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  badge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
    fontFamily: 'DIN Round Pro',
    letterSpacing: 0.5,
  },
  menuButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '900',
    fontFamily: 'DIN Round Pro',
    marginBottom: 20,
    lineHeight: 34,
  },
  progressSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBarContainer: {
    flex: 1,
    height: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 6,
    marginRight: 10,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
  },
  progressText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
    fontFamily: 'DIN Round Pro',
  },
});
