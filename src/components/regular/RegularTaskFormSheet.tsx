import { TaskFormSheetMode } from "@/types/tasks";
import { ActionSheet } from "@/ui/ActionSheet";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { KeyboardAvoidingView, Platform } from "react-native";
import {
  TaskFormActions,
  TaskFormFields,
  type TaskFormValues,
} from "../TaskFormFields";

export type RegularTaskFormValues = TaskFormValues;

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
  const { control, handleSubmit, reset, formState } =
    useForm<RegularTaskFormValues>({
      defaultValues: {
        title: initialValues?.title ?? "",
        note: initialValues?.note ?? "",
      },
    });

  useEffect(() => {
    if (visible)
      reset({
        title: initialValues?.title ?? "",
        note: initialValues?.note ?? "",
      });
  }, [visible, initialValues, reset]);

  const submit = handleSubmit((values) => {
    onSubmit({ title: values.title.trim(), note: values.note.trim() });
    onClose();
  });

  return (
    <ActionSheet visible={visible} title={title} onClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <TaskFormFields control={control} />
        <TaskFormActions
          creating={mode === "create"}
          valid={formState.isValid}
          onClose={onClose}
          onSubmit={() => {
            void submit();
          }}
        />
      </KeyboardAvoidingView>
    </ActionSheet>
  );
};
