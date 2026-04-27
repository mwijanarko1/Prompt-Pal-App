import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StreakView, ShareIcon } from '@/features/ranking/components/StreakView';

export default function RankScreen() {
  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.header} edges={['top']}>
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.closeButton}>
            <Ionicons name="close" size={28} color="#3C3C3C" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Streak</Text>
          <TouchableOpacity style={styles.shareIconContainer}>
            <ShareIcon />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <StreakView />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    backgroundColor: '#FFFFFF',
    zIndex: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#3C3C3C',
    fontFamily: 'DIN Round Pro',
    textAlign: 'center',
    flex: 1,
  },
  closeButton: {
    padding: 8,
    width: 44,
  },
  shareIconContainer: {
    padding: 8,
    width: 44,
    alignItems: 'flex-end',
  },
});
