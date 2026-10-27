import { ActivityIndicator, View } from "react-native";

export const Loader = () => (
  <View className="flex-1 items-center justify-center">
    <ActivityIndicator size="large" color="#FFFFFF" />
  </View>
);
