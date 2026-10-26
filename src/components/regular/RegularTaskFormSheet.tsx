import { TaskFormSheetMode } from "@/types/tasks";
import { ActionSheet } from "@/ui/ActionSheet";
import { Button, ButtonText } from "@/ui/Button";
import { useEffect, useRef } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  TextInput,
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
} from "react-native";

export type RegularTaskFormValues = {
  title: string;
  note: string;
};

type RegularTaskFormSheetProps = {
  visible: boolean;
  mode: TaskFormSheetMode;
  title: string;
  initialValues?: Partial<RegularTaskFormValues>;
  onSubmit: (values: RegularTaskFormValues) => void;
  onClose: () => void;
};

export const RegularTaskFormSheet = ({
  visible,
  mode,
  title,
  initialValues,
  onSubmit,
  onClose,
}: RegularTaskFormSheetProps) => {
  const noteRef = useRef<TextInput>(null);

  const { control, handleSubmit, reset, formState } =
    useForm<RegularTaskFormValues>({
      defaultValues: {
        title: initialValues?.title ?? "",
        note: initialValues?.note ?? "",
      },
    });

  useEffect(() => {
    if (visible) {
      reset({
        title: initialValues?.title ?? "",
        note: initialValues?.note ?? "",
      });
    }
  }, [visible, initialValues, reset]);

  const submit = handleSubmit((values) => {
    onSubmit({
      title: values.title.trim(),
      note: values.note.trim(),
    });
    onClose();
  });

  return (
    <ActionSheet visible={visible} title={title} onClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View className="px-6 pt-2 pb-4 gap-4">
          <View>
            <Text className="text-muted-foreground text-xs mb-1">
              Заголовок
            </Text>
            <Controller
              control={control}
              name="title"
              rules={{
                required: true,
                validate: (v) => v.trim().length > 0,
              }}
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  placeholder="Что нужно сделать?"
                  placeholderTextColor="#9CA3AF"
                  autoFocus
                  returnKeyType="next"
                  onSubmitEditing={() => noteRef.current?.focus()}
                  className="bg-surface text-foreground text-base px-4 py-3 rounded-xl"
                />
              )}
            />
          </View>

          <View>
            <Text className="text-muted-foreground text-xs mb-1">Заметка</Text>
            <Controller
              control={control}
              name="note"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  ref={noteRef}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  placeholder="Опционально..."
                  placeholderTextColor="#9CA3AF"
                  multiline
                  numberOfLines={3}
                  className="bg-surface text-foreground text-base px-4 py-3 rounded-xl min-h-[80px]"
                  style={{ textAlignVertical: "top" }}
                />
              )}
            />
          </View>
        </View>

        <View className=" flex-row gap-3 px-6 pb-2">
          <View className="flex-1">
            <Button variant="ghost" onPress={onClose}>
              <ButtonText>Отмена</ButtonText>
            </Button>
          </View>
          <View className="flex-1">
            <Button
              variant="solid"
              action="primary"
              onPress={() => {
                submit();
              }}
              className={!formState.isValid ? "opacity-50" : ""}
            >
              <ButtonText>
                {mode === "create" ? "Создать" : "Сохранить"}
              </ButtonText>
            </Button>
          </View>
        </View>
      </KeyboardAvoidingView>
    </ActionSheet>
  );
};
