import dayjs from "dayjs";
import { Text, View } from "react-native";
import type { DailyDateMode } from "@/types/dailyTasks";

type DailyDayHeaderProps = {
  selectedDate: string;
  completedCount: number;
  taskCount: number;
  dateMode: DailyDateMode;
};

export const DailyDayHeader = ({
  selectedDate,
  completedCount,
  taskCount,
  dateMode,
}: DailyDayHeaderProps) => (
  <View className="mb-4 gap-4">
    <View className="gap-1">
      <Text className="text-lg font-semibold text-foreground">
        {dayjs(selectedDate).format("D MMMM, dddd")}
      </Text>
      <Text className="text-sm text-muted-foreground">
        {taskCount
          ? `Выполнено ${completedCount} из ${taskCount}`
          : "Нет запланированных задач"}
        {dateMode === "history"
          ? " · история"
          : dateMode === "future"
            ? " · предварительный просмотр"
            : ""}
      </Text>
    </View>
    {dateMode !== "today" && (
      <Text className="text-xs text-muted-foreground">
        Отметки доступны за сегодня. Содержимое повторения можно изменить через
        «Все повторения».
      </Text>
    )}
    {!taskCount && (
      <View className="gap-2 rounded-2xl bg-surface p-6">
        <Text className="text-base font-semibold text-foreground">
          Свободный день
        </Text>
        <Text className="text-sm leading-5 text-muted-foreground">
          На эту дату ничего не запланировано. Дни без задач сохраняют стрики.
        </Text>
      </View>
    )}
  </View>
);
