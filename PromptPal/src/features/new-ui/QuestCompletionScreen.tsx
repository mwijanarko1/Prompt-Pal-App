import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, {
  Circle,
  Defs,
  FeBlend,
  FeColorMatrix,
  FeComposite,
  FeFlood,
  FeGaussianBlur,
  FeOffset,
  Filter,
  G,
  LinearGradient,
  Mask,
  Path,
  Rect,
  Stop
} from 'react-native-svg';

const MedalIcon = () => (
  <Svg width="27" height="49" viewBox="0 0 27 49" fill="none">
    <G filter="url(#filter0_d_225_2059)">
      <Path d="M0.981201 1.66344C0.981201 0.839266 1.64933 0.171143 2.4735 0.171143H21.9699C22.7941 0.171143 23.4622 0.839267 23.4622 1.66344V4.65353C23.4622 5.4777 22.7941 6.14583 21.9699 6.14583H20.7298V3.00659H3.71359V6.14583H2.4735C1.64933 6.14583 0.981201 5.4777 0.981201 4.65353V1.66344Z" fill="#FFEEB0" />
      <Path d="M0.981201 2.0399C0.981201 1.21573 1.64933 0.547607 2.4735 0.547607H21.9699C22.7941 0.547607 23.4622 1.21573 23.4622 2.0399V5.02999C23.4622 5.85417 22.7941 6.52229 21.9699 6.52229H20.7298V3.38305H3.71359V6.52229H2.4735C1.64933 6.52229 0.981201 5.85417 0.981201 5.02999V2.0399Z" fill="#F4CC3F" />
      <Path d="M3.71545 3.34814H20.7281V15.3963L12.2218 21.3645L3.71545 15.3963V3.34814Z" fill="#128600" />
      <Mask id="mask0_225_2059" maskUnits="userSpaceOnUse" x="3" y="3" width="18" height="19">
        <Path d="M3.75134 3.34814H20.7561V15.3983L12.2537 21.3645L3.75134 15.3983V3.34814Z" fill="#58CC02" />
      </Mask>
      <G mask="url(#mask0_225_2059)">
        <Rect x="8.99744" y="-3.80322" width="6.51247" height="25.1677" fill="#58CC02" />
      </G>
      <Rect x="10.804" y="18.2061" width="2.73418" height="4.65823" rx="1.36709" fill="#C09525" />
      <Circle cx="12.1711" cy="33.7786" r="12" fill="url(#paint0_linear_225_2059)" />
      <Circle cx="12.1712" cy="33.7785" r="9.36709" fill="#705100" />
      <Mask id="mask1_225_2059" maskUnits="userSpaceOnUse" x="3" y="25" width="20" height="20">
        <Circle cx="12.7381" cy="34.8465" r="9.38889" fill="#C28B37" />
      </Mask>
      <G mask="url(#mask1_225_2059)">
        <Circle cx="12.171" cy="33.7784" r="9.38889" fill="#FFB800" />
      </G>
      <Circle cx="12.2979" cy="33.8457" r="7.71316" fill="#C18222" />
      <Path d="M12.2978 27.6376L14.1164 31.3374L17.7535 31.7999L15.256 34.6487L15.9349 38.737L12.2978 36.8871L8.66071 38.737L9.3457 34.6487L6.84216 31.7999L10.4793 31.3374L12.2978 27.6376Z" fill="url(#paint1_linear_225_2059)" />
      <Path d="M12.3959 27.5897L14.1879 31.2362L17.767 31.6913L17.9711 31.7177L17.8353 31.8719L15.3715 34.6815L16.0424 38.7186L16.0785 38.9325L15.8851 38.8348L12.2972 37.0087L8.71033 38.8348L8.51697 38.9325L8.5531 38.7186L9.22888 34.6805L6.76013 31.8719L6.62439 31.7177L6.82849 31.6913L10.4066 31.2362L12.1996 27.5897L12.2982 27.3895L12.3959 27.5897Z" stroke="#A36D1D" strokeOpacity="0.2" strokeWidth="0.218442" />
      <Path opacity="0.5" d="M20.8105 10.8944L3.69109 10.8944L3.69109 3.36937L20.8105 3.36937L20.8105 10.8944Z" fill="url(#paint2_linear_225_2059)" />
    </G>
    <Defs>
      <Filter id="filter0_d_225_2059" x={0} y={0} width="26.7384" height="48.3458" filterUnits="userSpaceOnUse">
        <FeFlood floodOpacity="0" result="BackgroundImageFix" />
        <FeColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
        <FeOffset dx="1.19804" dy="1.19804" />
        <FeGaussianBlur stdDeviation="0.684595" />
        <FeComposite in2="hardAlpha" operator="out" />
        <FeColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.3 0" />
        <FeBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_225_2059" />
        <FeBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_225_2059" result="shape" />
      </Filter>
      <LinearGradient id="paint0_linear_225_2059" x1="12.1711" y1="21.7786" x2="12.1711" y2="45.7786" gradientUnits="userSpaceOnUse">
        <Stop stopColor="#FFE176" />
        <Stop offset="1" stopColor="#FFD12D" />
      </LinearGradient>
      <LinearGradient id="paint1_linear_225_2059" x1="12.2978" y1="27.6376" x2="12.2978" y2="38.737" gradientUnits="userSpaceOnUse">
        <Stop stopColor="white" />
        <Stop offset="0.0001" stopColor="#FFFFFD" />
        <Stop offset="1" stopColor="#FFE86D" />
      </LinearGradient>
      <LinearGradient id="paint2_linear_225_2059" x1="12.2508" y1="10.8944" x2="12.2508" y2="3.36937" gradientUnits="userSpaceOnUse">
        <Stop stopColor="#1D62A2" stopOpacity="0" />
        <Stop offset="1" stopColor="#14275A" />
      </LinearGradient>
    </Defs>
  </Svg>
);

export const QuestCompletionScreen = () => {
  const router = useRouter();

  const handleContinue = () => {
    router.push('/game/quest-nailed-it');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.content}>
        {/* Top XP Badge Toast */}
        <View style={styles.toastContainer}>
          <View style={styles.toast}>
            <View style={styles.medalIconContainer}>
              <MedalIcon />
            </View>
            <Text style={styles.toastText}>+100 XP EARNED</Text>
          </View>
        </View>

        {/* Wizard Celebration Illustration */}
        <View style={styles.illustrationContainer}>
          <Image
            source={require('../../../assets/Group1.svg')}
            style={styles.wizardImage}
            contentFit="contain"
          />
        </View>

        {/* Completion Text */}
        <View style={styles.textSection}>
          <Text style={styles.title}>Quest Complete!</Text>
        </View>

        {/* Action Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
            <Text style={styles.continueButtonText}>CONTINUE</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 25,
  },
  toastContainer: {
    width: '100%',
    alignItems: 'center',
    marginTop: 20,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    width: 350, // Using 380 to fit better on standard screens while matching the scale
    height: 75,
    paddingHorizontal: 24,
    borderRadius: 30,
    // High fidelity shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  medalIconContainer: {
    marginRight: 12,
  },
  toastText: {
    fontSize: 22,
    color: '#FFB800',
    fontWeight: '900',
    fontFamily: 'DIN Round Pro',
    letterSpacing: 0.5,
  },
  illustrationContainer: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  wizardImage: {
    width: 240,
    height: 345.43,
  },
  textSection: {
    marginBottom: 40,
  },
  title: {
    fontSize: 38,
    fontWeight: '900',
    color: '#3C3C3C',
    fontFamily: 'DIN Round Pro',
    textAlign: 'center',
  },
  buttonContainer: {
    width: '100%',
    marginBottom: 40,
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
