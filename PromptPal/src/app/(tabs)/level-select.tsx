import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { processApiLevelsWithLocalAssets, getLevelsByModuleId } from "../../features/levels/data";
import { useGameStore } from "../../features/game/store";
import { apiClient, Level } from "../../lib/api";
import { useEffect, useState } from "react";

export default function LevelSelectScreen() {
  console.log("[LevelSelect] Component rendering...");
  const router = useRouter();
  const { module } = useLocalSearchParams<{ module?: string }>();
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
        // Fetch all levels from API
        const rawApiLevels = await apiClient.getLevels();

        if (rawApiLevels && rawApiLevels.length > 0) {
          let processedLevels = processApiLevelsWithLocalAssets(rawApiLevels);

          // Filter by module if specified
          if (module) {
            processedLevels = processedLevels.filter(level => level.moduleId === module);
          }

          setLevels(processedLevels);
        } else {
          // Fallback to local levels if API fails and module is specified
          if (module) {
            const localLevels = getLevelsByModuleId(module);
            setLevels(localLevels);
          } else {
            setError('No levels available from the server');
          }
        }
      } catch (error) {
        console.error('[LevelSelect] Failed to load levels:', error);
        setError('Failed to load levels. Please check your connection and try again.');

        // Fallback to local levels if API fails and module is specified
        if (module) {
          const localLevels = getLevelsByModuleId(module);
          setLevels(localLevels);
          setIsLoading(false);
        }
      } finally {
        if (!module || levels.length > 0) {
          setIsLoading(false);
        }
      }
    };

    loadLevels();
  }, [module]);

  const isLevelUnlocked = (levelId: string) => {
    // Level is unlocked only if:
    // 1. It's in the unlockedLevels array AND
    // 2. Player has lives remaining (lives > 0)
    return unlockedLevels.includes(levelId) && lives > 0;
  };

  const isLevelCompleted = (levelId: string) => {
    return completedLevels.includes(levelId);
  };

  const getDifficultyColor = (difficulty: string) => {
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
  };

  const handleLevelPress = (levelId: string) => {
    if (lives <= 0) {
      Alert.alert(
        'No Lives Remaining',
        'You\'ve run out of attempts for today. Come back tomorrow to continue playing!',
        [{ text: 'OK', style: 'default' }]
      );
      return;
    }

    if (isLevelUnlocked(levelId)) {
      // Navigate to game screen - use the root game screen (not the one in route group)
      // This ensures navigation back goes to level select, not dashboard
      router.push(`/game/${levelId}`);
    }
  };

  const handleBackPress = () => {
    // Navigate back to home/dashboard
    router.back();
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <View style={styles.titleContainer}>
            <Text style={styles.titlePrompt}>Prompt</Text>
            <Text style={styles.titlePal}>Pal</Text>
          </View>
        </View>
        <Text style={styles.subtitle}>
          {module ? `Select a ${module.replace('-', ' ')} level` : 'Select a level to begin'}
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
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => {
              setError(null);
              setIsLoading(true);
              // Trigger reload
              const loadLevels = async () => {
                try {
                  const rawApiLevels = await apiClient.getLevels();
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
              };
              loadLevels();
            }}
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.levelsContainer}>
            {levels.map((level) => {
            const unlocked = isLevelUnlocked(level.id);
            const completed = isLevelCompleted(level.id);
            const difficultyColor = getDifficultyColor(level.difficulty);

            return (
              <TouchableOpacity
                key={level.id}
                onPress={() => handleLevelPress(level.id)}
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
              </TouchableOpacity>
            );
            })}
          </View>
        </ScrollView>
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
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  levelsContainer: {
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