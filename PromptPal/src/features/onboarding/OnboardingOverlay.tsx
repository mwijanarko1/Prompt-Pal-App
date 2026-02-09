import { View, Text, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { useState, useRef } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/components/ui';
import { useOnboardingStore } from './store';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Slide {
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

const slides: Slide[] = [
  {
    title: 'Welcome to PromptPal!',
    description: 'Master the art of AI prompt engineering through gamified challenges. Learn to communicate effectively with AI across three exciting modules.',
    icon: 'rocket-outline',
    color: '#BB86FC',
  },
  {
    title: '🖼️ Image Generation',
    description: 'Analyze target images and craft detailed prompts to recreate them. Learn how to describe visual elements, styles, and compositions that AI can understand.',
    icon: 'image-outline',
    color: '#03DAC6',
  },
  {
    title: '💻 Code Challenges',
    description: 'Write prompts that instruct AI to generate functional code. Your prompts will be tested against real test cases to ensure correctness.',
    icon: 'code-slash-outline',
    color: '#4151FF',
  },
  {
    title: '✍️ Copywriting',
    description: 'Create marketing copy that matches brand voice and goals. Learn to write prompts that generate persuasive, on-brand content for any audience.',
    icon: 'create-outline',
    color: '#FF6B00',
  },
  {
    title: '💡 Hint System',
    description: 'Stuck on a challenge? Use hints to get guidance. Each level provides helpful clues to improve your prompt engineering skills.',
    icon: 'bulb-outline',
    color: '#F59E0B',
  },
];

export function OnboardingOverlay() {
  const { hasSeenOnboarding, setHasSeenOnboarding } = useOnboardingStore();
  const [currentSlide, setCurrentSlide] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);

  if (hasSeenOnboarding) {
    return null;
  }

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      const nextSlide = currentSlide + 1;
      setCurrentSlide(nextSlide);
      scrollViewRef.current?.scrollTo({
        x: nextSlide * SCREEN_WIDTH,
        animated: true,
      });
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentSlide > 0) {
      const prevSlide = currentSlide - 1;
      setCurrentSlide(prevSlide);
      scrollViewRef.current?.scrollTo({
        x: prevSlide * SCREEN_WIDTH,
        animated: true,
      });
    }
  };

  const handleSkip = () => {
    setHasSeenOnboarding(true);
  };

  const handleComplete = () => {
    setHasSeenOnboarding(true);
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
    scrollViewRef.current?.scrollTo({
      x: index * SCREEN_WIDTH,
      animated: true,
    });
  };

  return (
    <View className="absolute inset-0 bg-black/90 z-50">
      {/* Skip Button */}
      <TouchableOpacity
        onPress={handleSkip}
        className="absolute top-12 right-6 z-10"
      >
        <Text className="text-onSurfaceVariant text-sm font-semibold">
          Skip
        </Text>
      </TouchableOpacity>

      {/* Slides */}
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEnabled={false}
        onMomentumScrollEnd={(event) => {
          const slideIndex = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
          setCurrentSlide(slideIndex);
        }}
      >
        {slides.map((slide, index) => (
          <View
            key={index}
            style={{ width: SCREEN_WIDTH }}
            className="flex-1 justify-center items-center px-8"
          >
            {/* Icon */}
            <View
              className="w-24 h-24 rounded-full items-center justify-center mb-8"
              style={{ backgroundColor: slide.color + '20' }}
            >
              <Ionicons name={slide.icon} size={48} color={slide.color} />
            </View>

            {/* Title */}
            <Text className="text-onSurface text-3xl font-bold text-center mb-4">
              {slide.title}
            </Text>

            {/* Description */}
            <Text className="text-onSurfaceVariant text-base text-center leading-6 px-4">
              {slide.description}
            </Text>
          </View>
        ))}
      </ScrollView>

      {/* Progress Dots */}
      <View className="absolute bottom-32 left-0 right-0 flex-row justify-center items-center space-x-2">
        {slides.map((_, index) => (
          <TouchableOpacity
            key={index}
            onPress={() => goToSlide(index)}
            className={`h-2 rounded-full ${
              index === currentSlide ? 'w-8 bg-primary' : 'w-2 bg-onSurfaceVariant/30'
            }`}
          />
        ))}
      </View>

      {/* Navigation Buttons */}
      <View className="absolute bottom-8 left-0 right-0 px-6 flex-row justify-between items-center">
        {currentSlide > 0 ? (
          <Button
            onPress={handlePrevious}
            variant="outline"
            size="md"
            className="flex-1 mr-2"
          >
            Previous
          </Button>
        ) : (
          <View className="flex-1 mr-2" />
        )}

        <Button
          onPress={handleNext}
          variant="primary"
          size="md"
          className="flex-1"
        >
          {currentSlide === slides.length - 1 ? 'Get Started' : 'Next'}
        </Button>
      </View>
    </View>
  );
}