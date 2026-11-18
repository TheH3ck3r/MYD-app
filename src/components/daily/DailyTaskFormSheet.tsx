import { useState } from "react";
import { useForm } from "react-hook-form";
import {
  ScrollView,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { ActionSheet } from "@/ui/ActionSheet";
import { Button, ButtonText } from "@/ui/Button";
import {
  TaskFormActions,
  TaskFormFields,
  type TaskFormValues,
} from "@/components/TaskFormFields";
import { DayPicker } from "./DayPicker";
import type {
  DailySchedule,
  DailyWeekday,
  DailyTaskFormData,
} from "@/types/dailyTasks";
import {
  dailyAnchorWeek,
  validateDailyDate,
  validateDailySchedule,
} from "@/utils/dailyRecurrence";

const INPUT = "bg-surface text-foreground text-base px-4 py-3 rounded-xl";

type DailyTaskFormSheetProps = {
  form: DailyTaskFormData;
  onSubmit: (fields: TaskFormValues, schedule?: DailySchedule) => Promise<void>;
  onClose: () => void;
};

// Each editor session mounts fresh; failed saves retain the entered fields.
export const DailyTaskFormSheet = ({
  form,
  onSubmit,
  onClose,
}: DailyTaskFormSheetProps) => {
  const {
    title,
    initialValues,
    schedule,
    parentTitle,
    creating,
    editingExisting,
  } = form;
  const { control, handleSubmit, formState } = useForm<TaskFormValues>({
    defaultValues: initialValues,
  });
  const { height } = useWindowDimensions();
  const [visible, setVisible] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [frequency, setFrequency] = useState<DailySchedule["frequency"]>(
    schedule?.frequency ?? "weekly",
  );
  const [daysOfWeek, setDaysOfWeek] = useState<readonly DailyWeekday[]>(
    schedule?.frequency === "weekly"
      ? schedule.daysOfWeek
      : [1, 2, 3, 4, 5, 6, 0],
  );
  const [interval, setInterval] = useState(
    schedule?.frequency === "weekly" ? String(schedule.intervalWeeks) : "1",
  );
  const [monthlyDay, setMonthlyDay] = useState(
    schedule?.frequency === "monthly"
      ? String(schedule.dayOfMonth)
      : (schedule?.startDate.slice(8) ?? "1"),
  );
  const [startDate, setStartDate] = useState(schedule?.startDate ?? "");
  const [anchor, setAnchor] = useState(
    schedule?.frequency === "weekly"
      ? schedule.anchorWeekStart
      : schedule
        ? dailyAnchorWeek(schedule.startDate)
        : "",
  );
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const readSchedule = (): DailySchedule | undefined => {
    if (!schedule) return undefined;
    try {
      validateDailyDate(startDate);
    } catch {
      throw new Error("Укажите существующую дату начала в формате ГГГГ-ММ-ДД");
    }
    let result: DailySchedule;
    if (frequency === "weekly") {
      if (!daysOfWeek.length)
        throw new Error("Выберите хотя бы один день недели");
      if (
        !/^\d+$/.test(interval) ||
        !Number.isSafeInteger(Number(interval)) ||
        Number(interval) < 1
      )
        throw new Error("Интервал в неделях должен быть целым числом от 1");
      try {
        if (dailyAnchorWeek(anchor) !== anchor) throw new Error("Not Monday");
      } catch {
        throw new Error(
          "Опорная дата должна быть понедельником в формате ГГГГ-ММ-ДД",
        );
      }
      result = {
        frequency,
        startDate,
        daysOfWeek,
        intervalWeeks: Number(interval),
        anchorWeekStart: anchor,
      };
    } else {
      if (
        !/^\d+$/.test(monthlyDay) ||
        Number(monthlyDay) < 1 ||
        Number(monthlyDay) > 31
      )
        throw new Error("Укажите целое число месяца от 1 до 31");
      result = { frequency, startDate, dayOfMonth: Number(monthlyDay) };
    }
    validateDailySchedule(result);
    return result;
  };

  const submit = handleSubmit(async (values) => {
    if (saving || !visible) return;
    setError(null);
    try {
      const nextSchedule = readSchedule();
      setSaving(true);
      await onSubmit(
        { title: values.title.trim(), note: values.note.trim() },
        nextSchedule,
      );
      setVisible(false);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Не удалось сохранить задачу",
      );
    } finally {
      setSaving(false);
    }
  });

  const summary =
    frequency === "weekly"
      ? `Каждые ${interval} нед. · ${daysOfWeek.map((day) => ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"][day]).join(", ")}`
      : `${monthlyDay}-го числа каждого месяца`;

  return (
    <ActionSheet
      visible={visible}
      title={title}
      onDismiss={onClose}
      onClose={() => {
        if (!saving) setVisible(false);
      }}
    >
      <View style={{ flexShrink: 1 }}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          style={{ maxHeight: height * 0.55, flexShrink: 1 }}
        >
          {editingExisting && (
            <Text className="mx-6 mb-2 text-sm leading-5 text-muted-foreground">
              Текст и подзадачи изменятся сегодня. Изменения расписания вступят
              в силу завтра. История прошедших дней сохранится.
            </Text>
          )}
          {!!error && (
            <Text
              accessibilityRole="alert"
              className="mx-6 mb-2 text-sm text-error"
            >
              {error}
            </Text>
          )}
          <TaskFormFields control={control} disabled={saving} />
          {schedule ? (
            <View className="px-6 pb-4 gap-3">
              <Button
                variant="ghost"
                align="start"
                disabled={saving}
                onPress={() => setExpanded(!expanded)}
                className="px-0"
              >
                <ButtonText>
                  {expanded ? "Скрыть расписание" : "Расписание"}
                </ButtonText>
              </Button>
              <Text className="text-sm text-muted-foreground">{summary}</Text>
              <Text className="text-xs leading-5 text-muted-foreground">
                Общее расписание для задачи и всех её подзадач.
              </Text>
              {expanded && (
                <>
                  <View className="flex-row gap-2">
                    <View className="flex-1">
                      <Button
                        variant={frequency === "weekly" ? "solid" : "ghost"}
                        action="primary"
                        disabled={saving}
                        onPress={() => setFrequency("weekly")}
                      >
                        <ButtonText>По неделям</ButtonText>
                      </Button>
                    </View>
                    <View className="flex-1">
                      <Button
                        variant={frequency === "monthly" ? "solid" : "ghost"}
                        action="primary"
                        disabled={saving}
                        onPress={() => setFrequency("monthly")}
                      >
                        <ButtonText>По месяцам</ButtonText>
                      </Button>
                    </View>
                  </View>
                  {frequency === "weekly" ? (
                    <>
                      <View pointerEvents={saving ? "none" : "auto"}>
                        <DayPicker
                          value={[...daysOfWeek]}
                          onChange={(days) =>
                            setDaysOfWeek(
                              days.filter(
                                (day): day is DailyWeekday =>
                                  day === 0 ||
                                  day === 1 ||
                                  day === 2 ||
                                  day === 3 ||
                                  day === 4 ||
                                  day === 5 ||
                                  day === 6,
                              ),
                            )
                          }
                        />
                      </View>
                      <Text className="text-xs text-muted-foreground">
                        Повторять каждые N недель
                      </Text>
                      <TextInput
                        accessibilityLabel="Интервал в неделях"
                        value={interval}
                        onChangeText={setInterval}
                        editable={!saving}
                        keyboardType="number-pad"
                        className={INPUT}
                      />
                      <Text className="text-xs text-muted-foreground">
                        Понедельник опорной недели · ГГГГ-ММ-ДД
                      </Text>
                      <TextInput
                        accessibilityLabel="Опорная неделя"
                        value={anchor}
                        onChangeText={setAnchor}
                        editable={!saving}
                        maxLength={10}
                        className={INPUT}
                      />
                    </>
                  ) : (
                    <>
                      <Text className="text-xs text-muted-foreground">
                        Число месяца · от 1 до 31
                      </Text>
                      <TextInput
                        accessibilityLabel="Число месяца"
                        value={monthlyDay}
                        onChangeText={setMonthlyDay}
                        editable={!saving}
                        keyboardType="number-pad"
                        className={INPUT}
                      />
                      <Text className="text-xs leading-5 text-muted-foreground">
                        Если такого числа нет, задача появится в последний день
                        месяца.
                      </Text>
                    </>
                  )}
                  <Text className="text-xs text-muted-foreground">
                    Начало расписания · ГГГГ-ММ-ДД
                  </Text>
                  <TextInput
                    accessibilityLabel="Начало расписания"
                    value={startDate}
                    onChangeText={setStartDate}
                    editable={!saving}
                    maxLength={10}
                    className={INPUT}
                  />
                </>
              )}
            </View>
          ) : (
            <View className="px-6 pb-4 gap-1">
              <Text className="text-xs text-muted-foreground">
                Расписание родительской задачи
              </Text>
              <Text className="text-sm text-foreground">{parentTitle}</Text>
            </View>
          )}
        </ScrollView>
        <TaskFormActions
          creating={creating}
          valid={formState.isValid}
          saving={saving}
          onClose={() => setVisible(false)}
          onSubmit={() => {
            void submit();
          }}
        />
      </View>
    </ActionSheet>
  );
};
