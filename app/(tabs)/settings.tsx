import { TopBar } from "@/components/TopBar";
import { ConfirmModal } from "@/components/ConfirmModal";
import { Button, ButtonText } from "@/ui/Button";
import { settingsStore } from "@/stores/settingsStore";
import { observer } from "mobx-react-lite";
import { ScrollView, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

function SettingsScreen() {
  const handleDeleteRegular = () => settingsStore.requestCleanup("regular");
  const handleDeleteDaily = () => settingsStore.requestCleanup("daily");
  const handleCancelDelete = () => settingsStore.cancelCleanup();
  const handleConfirmDelete = async () => {
    await settingsStore.confirmCleanup();
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <TopBar title="Настройки" />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
        <Text className="text-foreground text-lg font-semibold">
          Управление задачами
        </Text>
        <Button
          variant="outline"
          action="destructive"
          disabled={settingsStore.isBusy}
          onPress={handleDeleteRegular}
        >
          <ButtonText>Удалить все обычные задачи</ButtonText>
        </Button>
        <Button
          variant="outline"
          action="destructive"
          disabled={settingsStore.isBusy}
          onPress={handleDeleteDaily}
        >
          <ButtonText>Удалить все ежедневные задачи</ButtonText>
        </Button>
        <Text className="text-muted-foreground text-sm leading-5">
          При удалении ежедневных задач история прошедших дней сохраняется.
        </Text>
      </ScrollView>
      <ConfirmModal
        visible={settingsStore.cleanupDomain !== null}
        title={settingsStore.confirmationTitle}
        message={settingsStore.confirmationMessage}
        confirmText={settingsStore.clearing ? "Удаление…" : "Удалить все"}
        onCancel={handleCancelDelete}
        onConfirm={handleConfirmDelete}
      />
    </SafeAreaView>
  );
}

export default observer(SettingsScreen);
