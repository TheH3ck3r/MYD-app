import { Button, ButtonText } from "@/ui/Button";
import { Modal, Pressable, Text, View } from "react-native";

type ConfirmModalProps = {
  visible: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
};

export const ConfirmModal = ({
  visible,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = "Удалить",
  cancelText = "Отмена",
}: ConfirmModalProps) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <Pressable
        className="flex-1 bg-black/60 justify-center items-center px-6"
        onPress={onCancel}
      >
        <Pressable className="w-full bg-background rounded-2xl p-5 gap-4">
          <View className="gap-2">
            <Text className="text-foreground text-lg font-semibold">
              {title}
            </Text>
            <Text className="text-muted-foreground text-sm leading-5">
              {message}
            </Text>
          </View>

          <View className="flex-row gap-3 mt-2">
            <View className="flex-1">
              <Button variant="ghost" onPress={onCancel}>
                <ButtonText>{cancelText}</ButtonText>
              </Button>
            </View>
            <View className="flex-1">
              <Button variant="solid" action="destructive" onPress={onConfirm}>
                <ButtonText>{confirmText}</ButtonText>
              </Button>
            </View>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};
