import { ActionSheet } from "@/ui/ActionSheet";
import { TaskFormSheetMode } from "@/types/tasks";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  View,
} from "react-native";
import { DayPicker } from "./DayPicker";
import { Button, ButtonText } from "@/ui/Button";

const ALL_DAYS = [1, 2, 3, 4, 5, 6, 0];

export type DailyTaskFormValues = {
  title: string;
  note: string;
  daysOfWeek: number[];
};

type DailyTaskFormSheetProps = {
  visible: boolean;
  mode: TaskFormSheetMode;
  title: string;
  initialValues?: Partial<DailyTaskFormValues>;
  onSubmit: (values: DailyTaskFormValues) => void;
  onClose: () => void;
};

export const DailyTaskFormSheet = ({
  visible,
  mode,
  title,
  initialValues,
  onSubmit,
  onClose,
}: DailyTaskFormSheetProps) => {
  const { control, handleSubmit, reset, watch, formState } =
    useForm<DailyTaskFormValues>({
      defaultValues: {
        title: initialValues?.title ?? "",
        note: initialValues?.note ?? "",
        daysOfWeek: initialValues?.daysOfWeek ?? ALL_DAYS,
      },
    });

  useEffect(() => {
    if (visible) {
      reset({
        title: initialValues?.title ?? "",
        note: initialValues?.note ?? "",
        daysOfWeek: initialValues?.daysOfWeek ?? ALL_DAYS,
      });
    }
  }, [visible, initialValues, reset]);

  const days = watch("daysOfWeek");
  const hasDays = days.length > 0;

  const submit = handleSubmit((values) => {
    if (values.daysOfWeek.length === 0) return;
    onSubmit({
      title: values.title.trim(),
      note: values.note.trim(),
      daysOfWeek: values.daysOfWeek,
    });
    onClose(); // ← добавили закрытие после сабмита, как в RegularTaskFormSheet
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
              rules={{ validate: (v) => v.trim().length > 0 }}
              render={({ field: { onChange, value } }) => (
                <TextInput
                  value={value}
                  onChangeText={onChange}
                  placeholder="Что нужно сделать?"
                  placeholderTextColor="#9CA3AF"
                  autoFocus
                  className="bg-surface text-foreground text-base px-4 py-3 rounded-xl"
                />
              )}
            />
          </View>

          <View>
            <Text className="text-muted-foreground text-xs mb-1">
              Повторять
            </Text>
            <Controller
              control={control}
              name="daysOfWeek"
              rules={{ validate: (v) => v.length > 0 }}
              render={({ field: { onChange, value } }) => (
                <DayPicker value={value} onChange={onChange} />
              )}
            />
            {!hasDays && (
              <Text className="text-error text-xs mt-1.5">
                Выберите хотя бы один день
              </Text>
            )}
          </View>

          <View>
            <Text className="text-muted-foreground text-xs mb-1">Заметка</Text>
            <Controller
              control={control}
              name="note"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  value={value}
                  onChangeText={onChange}
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

        <View className="flex-row gap-3 px-4 pb-2">
          <View className="flex-1">
            <Button variant="ghost" onPress={onClose}>
              <ButtonText>Отмена</ButtonText>
            </Button>
          </View>
          <View className="flex-1">
            <Button
              variant="solid"
              action="primary"
              onPress={submit}
              className={!formState.isValid || !hasDays ? "opacity-50" : ""}
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
