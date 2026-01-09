import { Modal as RNModal, View, TouchableOpacity, Text } from 'react-native';
import { ReactNode } from 'react';

interface ModalProps {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
}

export function Modal({ visible, onClose, children, title }: ModalProps) {
  return (
    <RNModal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/50 justify-center items-center p-4">
        <View className="bg-surface rounded-lg p-6 w-full max-w-md">
          {title && (
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-onSurface text-xl font-bold">{title}</Text>
              <TouchableOpacity onPress={onClose}>
                <Text className="text-onSurface text-2xl">×</Text>
              </TouchableOpacity>
            </View>
          )}
          {children}
        </View>
      </View>
    </RNModal>
  );
}
