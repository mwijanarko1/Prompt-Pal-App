import {
  View,
  Text,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Pressable,
} from "react-native";
import { FlashList } from "@shopify/flash-list";
import { useRouter, useLocalSearchParams } from "expo-router";
import { processApiLevelsWithLocalAssets } from "../../features/levels/data";
import { useGameStore } from "../../features/game/store";
import { Level } from "../../features/game/store";
import { convexHttpClient } from "../../lib/convex-client";
import { api } from "../../../convex/_generated/api_cjs";
import { useEffect, useState, useCallback, memo } from "react";

interface LevelItemProps {
  level: Level;
  unlocked: boolean;
  completed: boolean;
  difficultyColor: string;
  lives: number;
  onPress: (levelId: string) => void;
}

const LevelItem = memo(function LevelItem({
  level,
  unlocked,
  completed,
  difficultyColor,
  lives,
  onPress,
}: LevelItemProps) {
  const handlePress = useCallback(() => {
    onPress(level.id);
  }, [onPress, level.id]);

  return (
    <Pressable
      onPress={handlePress}
      disabled={!unlocked}
      style={[
        styles.levelCard,
        unlocked ? styles.levelCardUnlocked : styles.levelCardLocked,
      ]}
    >
      <View style={styles.levelHeader}>
        <Text
          style={[styles.levelTitle, { opacity: unlocked ? 1 : 0.5 }]}
        >
          {level.id.replace("_", " ").toUpperCase()}
        </Text>
        {completed && (
          <View style={styles.completedBadge}>
            <Text style={styles.completedCheck}>✓</Text>
          </View>
        )}
      </View>

      <View style={styles.levelMeta}>
        <View
          style={[
            styles.difficultyBadge,
            { backgroundColor: difficultyColor + "20" },
          ]}
        >
          <Text
            style={[
              styles.difficultyText,
              { color: difficultyColor },
            ]}
          >
            {level.difficulty}
          </Text>
        </View>
        {!unlocked && (
          <Text style={styles.lockedText}>
            {lives <= 0 ? 'No Lives Remaining' : 'Locked'}
          </Text>
        )}
      </View>

      <Text
        style={[
          styles.passingScore,
          { opacity: unlocked ? 0.7 : 0.4 },
        ]}
      >
        Passing Score: {level.passingScore}%
      </Text>
    </Pressable>
  );
});

export default function LevelSelectScreen() {
  console.log("[LevelSelect] ===== COMPONENT RENDERING - LEVEL SELECT SCREEN LOADED! =====");
  console.log("[LevelSelect] Current route params:", useLocalSearchParams());
  const router = useRouter();
  const { type } = useLocalSearchParams<{ type?: 'image' | 'code' | 'copywriting' }>();
  console.log("[DEBUG] LevelSelect type parameter:", type);
  const [levels, setLevels] = useState<Level[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Use Zustand store - destructure like other components for consistency
  const { unlockedLevels: storeUnlockedLevels, completedLevels: storeCompletedLevels, lives: storeLives } = useGameStore();

  // Get store values with safe fallbacks
  const unlockedLevels = storeUnlockedLevels || [];
  const completedLevels = storeCompletedLevels || [];
  const lives = storeLives ?? 3;

  useEffect(() => {
    const loadLevels = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Fetch levels from Convex with type filtering
        const rawApiLevels = await convexHttpClient.query(api.queries.getAllLevels, {
          type: type || undefined,
          limit: 50
        });

        if (rawApiLevels && rawApiLevels.length > 0) {
          const processedLevels = processApiLevelsWithLocalAssets(rawApiLevels);
          setLevels(processedLevels);
        } else {
          setError(`No ${type || ''} levels available from the server`);
        }
      } catch (error) {
        console.error('[LevelSelect] Failed to load levels:', error);
        setError('Failed to load levels. Please check your connection and try again.');

        // No local fallback for type-based filtering
        setLevels([]);
        setIsLoading(false);
      } finally {
        if (!type || levels.length > 0) {
          setIsLoading(false);
        }
      }
    };

    loadLevels();
  }, [type]);

  const isLevelUnlocked = useCallback((levelId: string) => {
    // Since we're not implementing user plans for now, all coding and copywriting levels are available
    // Image generation levels are hidden anyway (module locked), but kept locked for future
    if (levelId.startsWith('code-') || levelId.startsWith('copywriting-')) {
      return lives > 0; // Only check lives, not unlock status
    }
    // For image levels (future implementation), use normal unlock logic
    return unlockedLevels.includes(levelId) && lives > 0;
  }, [unlockedLevels, lives]);

  const isLevelCompleted = useCallback((levelId: string) => {
    return completedLevels.includes(levelId);
  }, [completedLevels]);

  const getDifficultyColor = useCallback((difficulty: string) => {
    switch (difficulty) {
      case "beginner":
        return "#03DAC6"; // secondary (teal)
      case "intermediate":
        return "#BB86FC"; // primary (purple)
      case "advanced":
        return "#CF6679"; // error (red)
      default:
        return "#FFFFFF";
    }
  }, []);

  const handleLevelPress = useCallback((levelId: string) => {
    if (lives <= 0) {
      Alert.alert(
        'No Lives Remaining',
        'You\'ve run out of attempts for today. Come back tomorrow to continue playing!',
        [{ text: 'OK', style: 'default' }]
      );
      return;
    }

    // Always allow coding and copywriting levels, regardless of unlocking status
    // This matches the visual unlock state in renderLevelItem
    if (levelId.startsWith('code-') || levelId.startsWith('copywriting-')) {
      router.push(`/game/${levelId}`);
      return;
    }

    if (unlockedLevels.includes(levelId) && lives > 0) {
      // Navigate to game screen
      router.push(`/game/${levelId}`);
    }
  }, [lives, unlockedLevels, router]);

  const handleBackPress = useCallback(() => {
    // Navigate back to home/dashboard
    router.back();
  }, [router]);

  const renderLevelItem = useCallback(({ item }: { item: Level }) => {
    const unlocked = isLevelUnlocked(item.id);
    const completed = isLevelCompleted(item.id);
    const difficultyColor = getDifficultyColor(item.difficulty);

    return (
      <LevelItem
        level={item}
        unlocked={unlocked}
        completed={completed}
        difficultyColor={difficultyColor}
        lives={lives}
        onPress={handleLevelPress}
      />
    );
  }, [isLevelUnlocked, isLevelCompleted, getDifficultyColor, lives, handleLevelPress]);

  const retryLoadLevels = useCallback(async () => {
    setError(null);
    setIsLoading(true);
    try {
      const rawApiLevels = await convexHttpClient.query(api.queries.getLevels);
      if (rawApiLevels && rawApiLevels.length > 0) {
        const processedLevels = processApiLevelsWithLocalAssets(rawApiLevels);
        setLevels(processedLevels);
      } else {
        setError('No levels available from the server');
      }
    } catch (error) {
      console.error('[LevelSelect] Failed to reload levels:', error);
      setError('Failed to load levels. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Pressable onPress={handleBackPress} style={styles.backButton}>
            <Text style={styles.backButtonText}>←</Text>
          </Pressable>
          <View style={styles.titleContainer}>
            <Text style={styles.titlePrompt}>Prompt</Text>
            <Text style={styles.titlePal}>Pal</Text>
          </View>
        </View>
        <Text style={styles.subtitle}>
          {type ? `Select a ${type === 'image' ? 'image generation' : type === 'code' ? 'coding logic' : 'copywriting'} challenge` : 'Select a challenge to begin'}
        </Text>

        {/* Lives Display */}
        <View style={styles.livesContainer}>
          <View style={styles.livesDisplay}>
            <Text style={styles.livesLabel}>Lives:</Text>
            <Text style={[styles.livesCount, lives <= 0 && styles.livesCountZero]}>
              {lives}
            </Text>
          </View>
        </View>
      </View>

      {/* Levels List */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#BB86FC" />
          <Text style={styles.loadingText}>Loading Levels…</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorTitle}>Unable to Load Levels</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <Pressable
            style={styles.retryButton}
            onPress={retryLoadLevels}
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </Pressable>
        </View>
      ) : (
        <FlashList
          data={levels}
          renderItem={renderLevelItem}
          keyExtractor={(item) => item.id}
          estimatedItemSize={140}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212", // background
  },
  header: {
    paddingTop: 48,
    paddingBottom: 24,
    paddingHorizontal: 24,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  backButton: {
    position: "absolute",
    left: 0,
    top: 0,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#1E1E1E",
    alignItems: "center",
    justifyContent: "center",
  },
  backButtonText: {
    color: "#BB86FC",
    fontSize: 20,
    fontWeight: "bold",
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  titlePrompt: {
    color: "#BB86FC", // primary
    fontSize: 36,
    fontWeight: "bold",
  },
  titlePal: {
    color: "#03DAC6", // secondary
    fontSize: 36,
    fontWeight: "bold",
  },
  subtitle: {
    color: "#FFFFFF",
    textAlign: "center",
    fontSize: 16,
    opacity: 0.7,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  levelCard: {
    marginBottom: 16,
    padding: 16,
    borderRadius: 8,
    borderWidth: 2,
  },
  levelCardUnlocked: {
    backgroundColor: "#1E1E1E", // surface
    borderColor: "#BB86FC", // primary
  },
  levelCardLocked: {
    backgroundColor: "#1E1E1E", // surface
    borderColor: "#1E1E1E", // surface
    opacity: 0.5,
  },
  levelHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  levelTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "bold",
  },
  completedBadge: {
    backgroundColor: "#03DAC6", // secondary
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  completedCheck: {
    color: "#000000",
    fontSize: 12,
    fontWeight: "bold",
  },
  levelMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  difficultyText: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  lockedText: {
    color: "#FFFFFF",
    fontSize: 12,
    opacity: 0.5,
  },
  passingScore: {
    color: "#FFFFFF",
    fontSize: 14,
  },
  livesContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 16,
  },
  livesDisplay: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  livesLabel: {
    color: "#FFFFFF",
    fontSize: 14,
    opacity: 0.7,
  },
  livesCount: {
    color: "#03DAC6", // secondary
    fontSize: 18,
    fontWeight: "bold",
  },
  livesCountZero: {
    color: "#CF6679", // error (red)
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  loadingText: {
    color: "#FFFFFF",
    fontSize: 16,
    marginTop: 16,
    opacity: 0.7,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: "center",
  },
  errorMessage: {
    color: "#FFFFFF",
    fontSize: 14,
    opacity: 0.7,
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 20,
  },
  retryButton: {
    backgroundColor: "#BB86FC",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#000000",
    fontSize: 16,
    fontWeight: "bold",
  },
});
