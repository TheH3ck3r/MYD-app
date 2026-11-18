import { useRef } from "react";
import { useController, type Control } from "react-hook-form";
import { Text, TextInput, View } from "react-native";
import { Button, ButtonText } from "@/ui/Button";

export type TaskFormValues = { title: string; note: string };

type TaskFormFieldsProps = {
  control: Control<TaskFormValues>;
  disabled?: boolean;
};

export const TaskFormFields = ({
  control,
  disabled = false,
}: TaskFormFieldsProps) => {
  const noteRef = useRef<TextInput>(null);
  const { field: title } = useController({
    control,
    name: "title",
    rules: { required: true, validate: (value) => value.trim().length > 0 },
  });
  const { field: note } = useController({ control, name: "note" });

  return (
    <View className="px-6 pt-2 pb-4 gap-4">
      <View>
        <Text className="text-muted-foreground text-xs mb-1">Заголовок</Text>
        <TextInput
          value={title.value}
          onChangeText={title.onChange}
          onBlur={title.onBlur}
          editable={!disabled}
          placeholder="Что нужно сделать?"
          placeholderTextColor="#9CA3AF"
          autoFocus
          returnKeyType="next"
          onSubmitEditing={() => noteRef.current?.focus()}
          className="bg-surface text-foreground text-base px-4 py-3 rounded-xl"
        />
      </View>
      <View>
        <Text className="text-muted-foreground text-xs mb-1">Заметка</Text>
        <TextInput
          ref={noteRef}
          value={note.value}
          onChangeText={note.onChange}
          onBlur={note.onBlur}
          editable={!disabled}
          placeholder="Опционально..."
          placeholderTextColor="#9CA3AF"
          multiline
          numberOfLines={3}
          className="bg-surface text-foreground text-base px-4 py-3 rounded-xl min-h-[80px]"
          style={{ textAlignVertical: "top" }}
        />
      </View>
    </View>
  );
};

type TaskFormActionsProps = {
  onClose: () => void;
  onSubmit: () => void;
  creating: boolean;
  valid: boolean;
  saving?: boolean;
};

export const TaskFormActions = ({
  onClose,
  onSubmit,
  creating,
  valid,
  saving = false,
}: TaskFormActionsProps) => (
  <View className="flex-row gap-3 px-6 pb-2">
    <View className="flex-1">
      <Button variant="ghost" disabled={saving} onPress={onClose}>
        <ButtonText>Отмена</ButtonText>
      </Button>
    </View>
    <View className="flex-1">
      <Button
        variant="solid"
        action="primary"
        disabled={saving}
        onPress={onSubmit}
        className={!valid || saving ? "opacity-50" : ""}
      >
        <ButtonText>
          {saving ? "Сохраняем…" : creating ? "Создать" : "Сохранить"}
        </ButtonText>
      </Button>
    </View>
  </View>
);
