import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";
import { LEVELS } from "../features/levels/data";
import { useGameStore } from "../features/game/store";

export default function LevelSelectScreen() {
  console.log("[LevelSelect] Component rendering...");
  const router = useRouter();
  const store = useGameStore();

  // Get store values with safe fallbacks
  const unlockedLevels = store.unlockedLevels || ["level_01"];
  const completedLevels = store.completedLevels || [];

  const isLevelUnlocked = (levelId: string) => {
    return unlockedLevels.includes(levelId);
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
    if (isLevelUnlocked(levelId)) {
      router.push(`/game/${levelId}`);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.titlePrompt}>Prompt</Text>
          <Text style={styles.titlePal}>Pal</Text>
        </View>
        <Text style={styles.subtitle}>Select a level to begin</Text>
      </View>

      {/* Levels List */}
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.levelsContainer}>
          {LEVELS.map((level) => {
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
                  {!unlocked && <Text style={styles.lockedText}>Locked</Text>}
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
});
