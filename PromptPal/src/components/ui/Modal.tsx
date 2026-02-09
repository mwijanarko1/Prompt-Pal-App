import { Modal as RNModal, View, TouchableOpacity, Text, Pressable } from 'react-native';
import { ReactNode } from 'react';

interface ModalProps {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'full';
}

export function Modal({ visible, onClose, children, title, size = 'md' }: ModalProps) {
  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    full: 'max-w-full mx-4'
  };

  return (
    <RNModal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable
        className="flex-1 bg-black/70 justify-center items-center p-4"
        onPress={onClose}
      >
        <Pressable
          className={`bg-surface rounded-2xl p-6 w-full ${sizeClasses[size]} shadow-xl`}
          onPress={() => {}} // Prevent closing when tapping modal content
        >
          {title && (
            <View className="flex-row justify-between items-center mb-6 pb-4 border-b border-outline">
              <Text className="text-onSurface text-xl font-bold flex-1">{title}</Text>
              <TouchableOpacity
                onPress={onClose}
                className="w-8 h-8 items-center justify-center rounded-full bg-surfaceVariant ml-4"
              >
                <Text className="text-onSurface text-lg font-bold">×</Text>
              </TouchableOpacity>
            </View>
          )}
          <View className="max-h-[90vh]">
            {children}
          </View>
        </Pressable>
      </Pressable>
    </RNModal>
  );
}
