import dayjs from "dayjs";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Task } from "@/components/Task";
import type {
  DailyOpenedTask,
  DailyTaskTarget,
  DailyTemplateListItem,
} from "@/types/dailyTasks";

type DailyTemplatesListProps = {
  items: DailyTemplateListItem[];
  today: string;
  busy: boolean;
  onOpen: (target: DailyOpenedTask) => void;
  onDelete: (target: DailyTaskTarget) => void;
};

export const DailyTemplatesList = ({
  items,
  today,
  busy,
  onOpen,
  onDelete,
}: DailyTemplatesListProps) => (
  <ScrollView
    contentContainerStyle={{
      paddingHorizontal: 16,
      paddingBottom: 110,
      gap: 16,
    }}
  >
    <Text className="text-lg font-semibold text-foreground">
      Все повторения
    </Text>
    <Text className="text-sm text-muted-foreground">
      Здесь доступны и задачи, которых нет в выбранный день. Нажмите, чтобы
      изменить расписание и подзадачи.
    </Text>
    {!items.length && (
      <Text className="py-8 text-center text-muted-foreground">
        Повторений пока нет. Создайте первое.
      </Text>
    )}
    {items.map((item) => (
      <View key={item.taskId} className="gap-2 rounded-2xl bg-surface p-4">
        <Task
          item={item.tree}
          onPress={(nodeId) =>
            onOpen({ taskId: item.taskId, nodeId, template: true })
          }
          onToggle={() => undefined}
          toggleDisabled
        />
        <Text className="mt-1 text-sm text-muted-foreground">
          {item.schedule.frequency === "weekly"
            ? `Каждые ${item.schedule.intervalWeeks} нед. · ${item.schedule.daysOfWeek.map((day) => ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"][day]).join(", ")}`
            : `${item.schedule.dayOfMonth}-го числа каждого месяца`}
        </Text>
        {item.effectiveFrom > today && (
          <Text className="mt-1 text-xs text-primary">
            Новая версия с {dayjs(item.effectiveFrom).format("D MMMM")}
          </Text>
        )}
        <Pressable
          disabled={busy}
          onPress={() => onDelete({ taskId: item.taskId, nodeId: item.taskId })}
          className="self-start py-2"
        >
          <Text className="text-sm text-error">Удалить повторение</Text>
        </Pressable>
      </View>
    ))}
  </ScrollView>
);
