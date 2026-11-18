import { CrossIcon } from "../../assets/icons";
import { ReactNode, useCallback, useEffect, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  LayoutChangeEvent,
  Modal,
  View,
  Text,
  Pressable,
} from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { scheduleOnRN } from "react-native-worklets";

type ActionSheetProps = {
  visible: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
  onDismiss?: () => void;
};

export const ActionSheet = ({
  visible,
  title,
  children,
  onClose,
  onDismiss,
}: ActionSheetProps) => {
  const insets = useSafeAreaInsets();
  const [mounted, setMounted] = useState(visible);
  const onDismissRef = useRef(onDismiss);

  useEffect(() => {
    onDismissRef.current = onDismiss;
  }, [onDismiss]);

  const finishClose = useCallback(() => {
    setMounted(false);
    onDismissRef.current?.();
  }, []);

  const progress = useSharedValue(0);
  const sheetHeight = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      progress.value = withTiming(1, {
        duration: 250,
        easing: Easing.out(Easing.cubic),
      });
    } else {
      progress.value = withTiming(0, { duration: 200 }, (finished) => {
        if (finished) scheduleOnRN(finishClose);
      });
    }
  }, [visible, progress, finishClose]);

  const handleLayout = (e: LayoutChangeEvent) => {
    sheetHeight.value = e.nativeEvent.layout.height;
  };

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: progress.value * 0.6,
  }));

  const sheetStyle = useAnimatedStyle(() => {
    // fallback 1000 пока высота не измерена — гарантированно спрятан
    const h = sheetHeight.value || 1000;
    return {
      transform: [{ translateY: (1 - progress.value) * h }],
    };
  });

  if (!mounted) return null;

  return (
    <Modal
      transparent
      statusBarTranslucent
      navigationBarTranslucent
      visible={mounted}
      animationType="none"
      onRequestClose={onClose}
    >
      <Animated.View
        style={backdropStyle}
        className="absolute inset-0 bg-black"
      >
        <Pressable className="flex-1" onPress={onClose} />
      </Animated.View>

      <KeyboardAvoidingView
        behavior="padding"
        pointerEvents="box-none"
        style={{
          flex: 1,
          justifyContent: "flex-end",
          paddingTop: insets.top + 16,
        }}
      >
        <Animated.View
          onLayout={handleLayout}
          style={[
            sheetStyle,
            {
              paddingBottom: insets.bottom + 8,
              flexShrink: 1,
              maxHeight: "100%",
            },
          ]}
          className="bg-background rounded-t-3xl"
        >
          <View className="items-center pt-3 pb-2">
            <View className="w-10 h-1 bg-border rounded-full" />
          </View>

          <View className="flex-row justify-between items-center px-6 pt-2 pb-4">
            <Text className="text-foreground text-lg font-semibold">
              {title}
            </Text>

            <Pressable onPress={onClose}>
              <CrossIcon size={20} />
            </Pressable>
          </View>

          <View style={{ flexShrink: 1 }} className="px-2 pb-2">
            {children}
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
};
