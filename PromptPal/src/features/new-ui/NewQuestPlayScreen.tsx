import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { XpIcon } from './components/CustomIcons';

const SubmitIcon = () => (
  <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <Path d="M3.63109 2.12202C2.73759 1.67552 1.74859 2.52802 2.05809 3.47752L4.06509 9.63002C4.12186 9.80383 4.22519 9.95876 4.36386 10.0779C4.50253 10.1971 4.67122 10.276 4.85159 10.306L12.7816 11.6275C13.1991 11.6975 13.1991 12.2975 12.7816 12.3675L4.85209 13.689C4.67172 13.719 4.50303 13.7979 4.36436 13.9171C4.22569 14.0363 4.12236 14.1912 4.06559 14.365L2.05809 20.521C1.74809 21.471 2.73759 22.3235 3.63109 21.877L21.3781 13.006C22.2076 12.591 22.2076 11.4075 21.3781 10.993L3.63109 2.12202Z" fill="white" />
  </Svg>
);

export const NewQuestPlayScreen = () => {
  const router = useRouter();
  const [prompt, setPrompt] = useState('');

  const handleBack = () => {
    router.back();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header with Progress and Hearts */}
          <View style={styles.header}>
            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
              <Ionicons name="close" size={28} color="#3C3C3C" />
            </TouchableOpacity>
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: '60%' }]} />
              </View>
            </View>
            <View style={styles.heartsContainer}>
              <Ionicons name="heart" size={24} color="#FF9600" style={styles.heartIcon} />
              <Ionicons name="heart" size={24} color="#FF9600" style={styles.heartIcon} />
              <Ionicons name="heart" size={24} color="#FF9600" style={styles.heartIcon} />
            </View>
          </View>

          {/* Level Badge */}
          <View style={styles.badgeContainer}>
            <View style={styles.levelBadge}>
              <Text style={styles.levelBadgeText}>LEVEL 1  •  CODING</Text>
            </View>
          </View>

          {/* Title Area */}
          <View style={styles.titleSection}>
            <Text style={styles.mainTitle}>One Shoot It</Text>
            <Text style={styles.subTitle}>
              Write a prompt that recreates this button, first try counts.
            </Text>
          </View>

          {/* Target Card */}
          <View style={styles.targetCard}>
            <Text style={styles.targetLabel}>Match This Exactly</Text>
            <View style={styles.previewContainer}>
              <TouchableOpacity style={styles.previewButton} activeOpacity={0.8}>
                <Text style={styles.previewButtonText}>Get Started</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Constraints Section */}
          <View style={styles.constraintsSection}>
            <Text style={styles.optimalLengthText}>Optimal Length: 12-20 words</Text>
            <View style={styles.tagsContainer}>
              <View style={styles.tag}>
                <Ionicons name="checkmark" size={14} color="#3C3C3C" />
                <Text style={styles.tagText}>IDENTITY</Text>
              </View>
              <View style={styles.tag}>
                <Ionicons name="checkmark" size={14} color="#3C3C3C" />
                <Text style={styles.tagText}>CONTEXT</Text>
              </View>
              <View style={styles.tag}>
                <Ionicons name="checkmark" size={14} color="#3C3C3C" />
                <Text style={styles.tagText}>CONSTRAINT</Text>
              </View>
            </View>
          </View>

          {/* Prompt Entry Area */}
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>Your Prompt</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.textInput}
                placeholder="e.g., Create a pill-shaped button with a cyan gradient background and high-contrast dark text.."
                placeholderTextColor="#A0A0A0"
                multiline
                value={prompt}
                onChangeText={setPrompt}
                textAlignVertical="top"
              />
            </View>
          </View>
        </ScrollView>

        {/* Bottom Bar */}
        <View style={styles.bottomBar}>
          <View style={styles.rewardBox}>
            <Text style={styles.rewardLabel}>REWARD</Text>
            <View style={styles.xpBox}>
              <Text style={styles.rewardValue}>+250 XP</Text>
              <XpIcon width={16} height={18} />
            </View>
          </View>
          <TouchableOpacity style={styles.submitButton} onPress={() => router.push('/game/quest-result')}>
            <Text style={styles.submitButtonText}>SUBMIT PROMPT</Text>
            <SubmitIcon />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    marginRight: 15,
    padding: 2,
  },
  progressContainer: {
    flex: 1,
    marginRight: 15,
  },
  progressBar: {
    height: 12,
    backgroundColor: '#F0F0F0',
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#58CC02',
    borderRadius: 6,
  },
  heartsContainer: {
    flexDirection: 'row',
  },
  heartIcon: {
    marginLeft: 4,
  },
  badgeContainer: {
    alignItems: 'center',
    marginBottom: 15,
  },
  levelBadge: {
    backgroundColor: '#E8F7DD',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  levelBadgeText: {
    color: '#58CC02',
    fontWeight: '800',
    fontSize: 13,
    letterSpacing: 0.5,
    fontFamily: 'DIN Round Pro',
  },
  titleSection: {
    alignItems: 'center',
    marginBottom: 25,
  },
  mainTitle: {
    fontSize: 40,
    fontWeight: '700',
    color: '#3C3C3C',
    marginBottom: 8,
    textAlign: 'center',
    fontFamily: 'DIN Round Pro',
  },
  subTitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 22,
    fontFamily: 'DIN Round Pro',
  },
  targetCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: 380,
    height: 138,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EFEFEF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
    marginBottom: 25,
    alignSelf: 'center',
    justifyContent: 'center',
  },
  targetLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#3C3C3C',
    textAlign: 'center',
    marginBottom: 20,
    fontFamily: 'DIN Round Pro',
  },
  previewContainer: {
    alignItems: 'center',
  },
  previewButton: {
    backgroundColor: '#00D4D4',
    width: 350,
    height: 45,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    // Add subtle shadow for the button as in image
    shadowColor: '#00D4D4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  previewButtonText: {
    color: '#3C3C3C',
    fontWeight: '800',
    fontSize: 18,
    fontFamily: 'DIN Round Pro',
  },
  constraintsSection: {
    marginBottom: 20,
  },
  optimalLengthText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    fontFamily: 'DIN Round Pro',
  },
  tagsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 120, // As per design
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    // Height is Hug (approx 24px)
    minHeight: 24,
  },
  tagText: {
    marginLeft: 4, // Gap: 4px
    fontSize: 11, // Small font for 24px height
    fontWeight: '700',
    color: '#3C3C3C',
    fontFamily: 'DIN Round Pro',
  },
  inputSection: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    fontFamily: 'DIN Round Pro',
  },
  inputWrapper: {
    backgroundColor: '#F7F7F7',
    borderRadius: 15,
    padding: 16,
    height: 180,
    borderWidth: 1,
    borderColor: '#EFEFEF',
  },
  textInput: {
    fontSize: 18,
    color: '#3C3C3C',
    lineHeight: 26,
    height: '100%',
    fontFamily: 'DIN Round Pro',
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    backgroundColor: '#FFFFFF',
  },
  rewardBox: {
    flex: 1,
  },
  rewardLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#999',
    marginBottom: 2,
    fontFamily: 'DIN Round Pro',
  },
  xpBox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rewardValue: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FF9600',
    marginRight: 6,
    fontFamily: 'DIN Round Pro',
  },
  submitButton: {
    backgroundColor: '#58CC02',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 25,
    paddingVertical: 14,
    borderRadius: 15,
    // Bottom shadow for the green button
    borderBottomWidth: 4,
    borderBottomColor: '#46A302',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 16,
    marginRight: 8,
    fontFamily: 'DIN Round Pro',
  },
  sendIcon: {
    transform: [{ rotate: '-45deg' }],
  },
});
