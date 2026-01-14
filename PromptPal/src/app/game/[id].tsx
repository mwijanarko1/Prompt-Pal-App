import { View, Text, Image, Alert, ActivityIndicator } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState, useEffect } from "react";
import { Button, Input } from "../../components/ui";
import { getLevelById, fetchLevelById } from "../../features/levels/data";
import { geminiService } from "../../lib/gemini";
import { useGameStore } from "../../features/game/store";
import { Level } from "../../features/game/store";

export default function GameScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [level, setLevel] = useState<Level | null>(null);
  const [isLoadingLevel, setIsLoadingLevel] = useState(true);

  const { lives, loseLife, startLevel } = useGameStore();

  // Fetch level from API or fallback
  useEffect(() => {
    const loadLevel = async () => {
      setIsLoadingLevel(true);
      console.log(`[GameScreen] Loading level: ${id}`);
      try {
        // Try to fetch from API first
        console.log(`[GameScreen] Attempting to fetch level from API...`);
        const apiLevel = await fetchLevelById(id as string);
        if (apiLevel) {
          console.log(`[GameScreen] ✅ Level loaded from API:`, apiLevel.id);
          setLevel(apiLevel);
        } else {
          console.log(`[GameScreen] ⚠️ No level found in API, using fallback`);
          // Fallback to local data
          const localLevel = getLevelById(id as string);
          setLevel(localLevel || null);
        }
      } catch (error) {
        console.error("[GameScreen] ❌ Failed to load level from API:", error);
        // Fallback to local data
        const localLevel = getLevelById(id as string);
        if (localLevel) {
          console.log(`[GameScreen] ✅ Using fallback level:`, localLevel.id);
        }
        setLevel(localLevel || null);
      } finally {
        setIsLoadingLevel(false);
      }
    };

    loadLevel();
  }, [id]);

  // Start the level when component mounts and level is loaded
  useEffect(() => {
    if (level) {
      startLevel(level.id);
    }
  }, [startLevel, level]);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      Alert.alert("Error", "Please enter a prompt");
      return;
    }

    if (!level) {
      Alert.alert("Error", "Level not loaded");
      return;
    }

    console.log(
      `[GameScreen] 🎨 Generating image for prompt: "${prompt.substring(
        0,
        50
      )}..."`
    );
    setIsGenerating(true);
    try {
      const imageUrl = await geminiService.generateImage(prompt);
      console.log(`[GameScreen] ✅ Image generated:`, imageUrl);
      setGeneratedImage(imageUrl);

      // Compare images - pass taskId if available for API evaluation
      console.log(`[GameScreen] 🔍 Comparing images...`);
      const score = await geminiService.compareImages(
        level.targetImageUrl,
        imageUrl,
        level.id // Pass level ID as taskId for API evaluation
      );
      console.log(
        `[GameScreen] 📊 Similarity score: ${score}% (passing: ${level.passingScore}%)`
      );

      Alert.alert(
        "Result",
        `Your prompt scored: ${score}% similarity!\n\n${
          score >= level.passingScore ? "Level passed!" : "Try again!"
        }`,
        [
          {
            text: score >= level.passingScore ? "Next Level" : "Try Again",
            onPress: () => {
              if (score >= level.passingScore) {
                router.back();
              } else {
                loseLife();
                setGeneratedImage(null);
                setPrompt("");
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error("[GameScreen] ❌ Image generation failed:", error);
      const errorMessage =
        error && typeof error === "object" && "details" in error
          ? (error as { details?: string; error?: string }).details ||
            (error as { error?: string }).error
          : "Failed to generate image. Please try again.";
      Alert.alert("Error", errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  if (isLoadingLevel) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator size="large" color="#03DAC6" />
        <Text className="text-onSurface mt-4">Loading level...</Text>
      </View>
    );
  }

  if (!level) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <Text className="text-error text-xl">Level not found</Text>
        <Button onPress={() => router.back()} className="mt-4">
          Go Back
        </Button>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      {/* Top half: Target Image */}
      <View className="flex-1 p-4">
        <Text className="text-onSurface text-lg font-semibold mb-2 text-center">
          Target Image
        </Text>
        <Image
          source={{ uri: level.targetImageUrl }}
          className="flex-1 rounded-lg"
          resizeMode="contain"
        />
      </View>

      {/* Bottom half: Input and Controls */}
      <View className="flex-1 p-4">
        <Text className="text-onSurface text-lg font-semibold mb-2">
          Your Prompt
        </Text>

        <Input
          value={prompt}
          onChangeText={setPrompt}
          placeholder="Describe what you see in the image above..."
          multiline
          numberOfLines={4}
          className="flex-1"
        />

        <View className="flex-row justify-between items-center mt-4">
          <Text className="text-onSurface">Lives: {lives}</Text>
          <Button
            onPress={handleGenerate}
            loading={isGenerating}
            disabled={!prompt.trim()}
          >
            Generate
          </Button>
        </View>

        {generatedImage && (
          <View className="mt-4">
            <Text className="text-onSurface text-sm mb-2">Your Result:</Text>
            <Image
              source={{ uri: generatedImage }}
              className="w-24 h-24 rounded-lg"
              resizeMode="cover"
            />
          </View>
        )}
      </View>
    </View>
  );
}
