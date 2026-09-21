import { StyleSheet, View } from "react-native";
import { Button, Text } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text variant="headlineMedium" style={styles.title}>
          MYD
        </Text>
        <Text variant="bodyMedium" style={styles.subtitle}>
          Make your dream
        </Text>
        <Button mode="contained" onPress={() => console.log("pressed")}>
          Тестовая кнопка
        </Button>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  title: {
    fontWeight: "bold",
  },
  subtitle: {
    opacity: 0.6,
  },
});
