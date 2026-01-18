import { View, Text, Image, ScrollView } from 'react-native';
import { Modal } from './Modal';
import { Button } from './Button';

interface ResultModalProps {
  visible: boolean;
  onClose: () => void;
  targetImageUrl: string;
  resultImageUrl: string;
  score: number;
  passingScore: number;
  onNextLevel?: () => void;
  onRetry?: () => void;
}

export function ResultModal({
  visible,
  onClose,
  targetImageUrl,
  resultImageUrl,
  score,
  passingScore,
  onNextLevel,
  onRetry,
}: ResultModalProps) {
  const passed = score >= passingScore;

  const getScoreColor = () => {
    if (score >= passingScore) return 'text-green-400';
    if (score >= passingScore * 0.7) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getScoreMessage = () => {
    if (score >= passingScore) {
      return 'Excellent! You passed!';
    }
    if (score >= passingScore * 0.7) {
      return 'Close! Try again.';
    }
    return 'Keep practicing!';
  };

  return (
    <Modal visible={visible} onClose={onClose} title="Result">
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Score Display */}
        <View className="items-center mb-6">
          <Text className={`text-5xl font-bold ${getScoreColor()}`}>
            {score}%
          </Text>
          <Text className="text-onSurface/70 text-sm mt-1">
            Similarity Score
          </Text>
          <Text className={`text-onSurface font-semibold mt-2 ${getScoreColor()}`}>
            {getScoreMessage()}
          </Text>
          <View className="mt-4 w-full bg-surface rounded-full h-2 overflow-hidden">
            <View
              className={`h-full ${passed ? 'bg-green-500' : 'bg-yellow-500'}`}
              style={{ width: `${Math.min(score, 100)}%` }}
            />
          </View>
        </View>

        {/* Side-by-side Images */}
        <View className="flex-row gap-4 mb-6">
          <View className="flex-1">
            <Text className="text-onSurface/70 text-sm mb-2 text-center">
              Target
            </Text>
            <Image
              source={{ uri: targetImageUrl }}
              className="w-full h-40 rounded-lg"
              resizeMode="cover"
            />
          </View>
          <View className="flex-1">
            <Text className="text-onSurface/70 text-sm mb-2 text-center">
              Your Result
            </Text>
            <Image
              source={{ uri: resultImageUrl }}
              className="w-full h-40 rounded-lg"
              resizeMode="cover"
            />
          </View>
        </View>

        {/* Action Buttons */}
        <View className="flex-row gap-3">
          {passed && onNextLevel ? (
            <Button
              onPress={onNextLevel}
              className="flex-1"
              variant="primary"
            >
              Next Level
            </Button>
          ) : (
            <Button
              onPress={onRetry || onClose}
              className="flex-1"
              variant="primary"
            >
              Try Again
            </Button>
          )}
          <Button
            onPress={onClose}
            className="flex-1"
            variant="outline"
          >
            Close
          </Button>
        </View>
      </ScrollView>
    </Modal>
  );
}
