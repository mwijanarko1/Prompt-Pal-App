import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export const QuestNailedItScreen = () => {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Status Header */}
        <View style={styles.statusHeader}>
          <View style={styles.statusInfo}>
            <Text style={styles.levelLabel}>CURRENT LEVEL: ADVANCED</Text>
            <Text style={styles.progressLabel}>85% COMPLETE</Text>
          </View>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: '85%' }]} />
          </View>
        </View>

        {/* Title and Illustration Container */}
        <View style={styles.heroContainer}>
          <Text style={styles.title}>Nailed It!</Text>
          <Image
            source={require('../../../assets/OBJECTS.svg')}
            style={styles.wizardImage}
            contentFit="contain"
          />
        </View>

        {/* XP Gains */}
        <View style={styles.xpSection}>
          <Text style={styles.xpText}>+250 XP</Text>
        </View>

        {/* Description */}
        <View style={styles.descriptionSection}>
          <Text style={styles.descriptionText}>
            Mastery streak maintained! You've unlocked the{' '}
            <Text style={styles.badgeText}>Neutral Architect</Text> badge.
          </Text>
        </View>

        {/* Call to Action */}
        <TouchableOpacity
          style={styles.continueButton}
          onPress={() => router.replace('/(tabs)')}
        >
          <Text style={styles.continueButtonText}>CONTINUE QUEST</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  scrollContent: {
    paddingHorizontal: 25,
    paddingTop: 20,
    paddingBottom: 40,
    alignItems: 'center',
  },
  statusHeader: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  statusInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  levelLabel: {
    fontSize: 12,
    fontWeight: '900',
    color: '#4B4B4B',
    fontFamily: 'DIN Round Pro',
  },
  progressLabel: {
    fontSize: 12,
    fontWeight: '900',
    color: '#58CC02',
    fontFamily: 'DIN Round Pro',
  },
  progressBarBg: {
    height: 14,
    backgroundColor: '#E5E5E5',
    borderRadius: 20,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#58CC02',
    borderRadius: 20,
  },
  heroContainer: {
    width: 242.65,
    height: 361.09,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  title: {
    fontSize: 36,
    fontWeight: '700',
    color: '#4B4B4B',
    fontFamily: 'DIN Round Pro',
    marginBottom: 10,
  },
  wizardImage: {
    width: '100%',
    height: 280,
  },
  xpSection: {
    marginBottom: 10,
    marginTop: 20,
  },
  xpText: {
    fontSize: 50,
    fontWeight: '700',
    color: '#FFB800',
    fontFamily: 'DIN Round Pro',
  },
  descriptionSection: {
    marginBottom: 40,
    paddingHorizontal: 10,
  },
  descriptionText: {
    fontSize: 16,
    color: '#4B4B4B',
    fontWeight: '500',
    lineHeight: 26,
    textAlign: 'center',
    fontFamily: 'DIN Round Pro',
  },
  badgeText: {
    color: '#58CC02',
  },
  continueButton: {
    backgroundColor: '#58CC02',
    width: '100%',
    paddingVertical: 18,
    borderRadius: 18,
    alignItems: 'center',
    // 3D effect
    borderBottomWidth: 5,
    borderBottomColor: '#46A302',
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
    fontFamily: 'DIN Round Pro',
    letterSpacing: 1,
  },
});
