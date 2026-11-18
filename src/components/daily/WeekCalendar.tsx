import { useState } from "react";
import dayjs from "dayjs";
import { FlatList, Modal, Pressable, Text, View } from "react-native";
import { dailyAnchorWeek, shiftDailyDate } from "@/utils/dailyRecurrence";

type WeekCalendarProps = {
  selectedDate: string;
  today: string;
  onSelectDate: (date: string) => void;
  dayState?: (date: string) => "done" | "failed" | "excused" | "todo" | "empty";
};

const LABELS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
const WEEK_OFFSETS = [-1, 0, 1];
const formatMonth = (date: string): string => {
  const label = dayjs(date).format("MMMM YYYY");
  return label.charAt(0).toUpperCase() + label.slice(1);
};
const DOT = {
  done: "bg-success",
  failed: "bg-error",
  excused: "bg-muted-foreground",
  todo: "bg-primary",
  empty: "bg-transparent",
};

export const WeekCalendar = ({
  selectedDate,
  today,
  onSelectDate,
  dayState,
}: WeekCalendarProps) => {
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(`${selectedDate.slice(0, 7)}-01`);
  const [weekWidth, setWeekWidth] = useState(0);
  const start = dailyAnchorWeek(selectedDate);
  const gridStart = dailyAnchorWeek(month);
  const choose = (date: string) => {
    onSelectDate(date);
    setOpen(false);
  };

  const day = (date: string, compact: boolean) => {
    const selected = date === selectedDate;
    const current = date === today;
    return (
      <Pressable
        key={date}
        accessibilityLabel={dayjs(date).format("D MMMM YYYY")}
        accessibilityState={{ selected }}
        onPress={() => choose(date)}
        style={compact ? { width: "14.2857%" } : { flex: 1 }}
        className="items-center py-1"
      >
        <View
          className={`h-10 w-10 items-center justify-center rounded-xl border ${selected ? "border-primary bg-primary" : current ? "border-primary bg-surface" : "border-transparent"}`}
        >
          <Text
            className={
              selected
                ? "font-semibold text-primary-foreground"
                : compact && date.slice(0, 7) !== month.slice(0, 7)
                  ? "text-muted-foreground"
                  : "text-foreground"
            }
          >
            {Number(date.slice(8))}
          </Text>
        </View>
        <View
          className={`mt-1 h-1 w-1 rounded-full ${DOT[dayState?.(date) ?? "empty"]}`}
        />
      </Pressable>
    );
  };

  return (
    <View className="border-b border-border px-4 pb-3 pt-2">
      <View className="mb-2 flex-row items-center justify-between">
        <Pressable
          accessibilityLabel="Предыдущая неделя"
          onPress={() => onSelectDate(shiftDailyDate(selectedDate, -7))}
          className="px-3 py-2"
        >
          <Text className="text-xl text-foreground">‹</Text>
        </Pressable>
        <Pressable
          onPress={() => {
            setMonth(`${selectedDate.slice(0, 7)}-01`);
            setOpen(true);
          }}
          className="py-2"
        >
          <Text className="text-sm font-semibold text-foreground">
            {formatMonth(selectedDate)} ▾
          </Text>
        </Pressable>
        <Pressable
          accessibilityLabel="Следующая неделя"
          onPress={() => onSelectDate(shiftDailyDate(selectedDate, 7))}
          className="px-3 py-2"
        >
          <Text className="text-xl text-foreground">›</Text>
        </Pressable>
      </View>
      <View className="flex-row">
        {LABELS.map((label) => (
          <Text
            key={label}
            className="flex-1 text-center text-xs text-muted-foreground"
          >
            {label}
          </Text>
        ))}
      </View>
      <View onLayout={(event) => setWeekWidth(event.nativeEvent.layout.width)}>
        {weekWidth > 0 && (
          <FlatList
            // Recenter only after landing on a different week or resizing.
            key={`${start}:${weekWidth}`}
            data={WEEK_OFFSETS}
            keyExtractor={(offset) => String(offset)}
            horizontal
            pagingEnabled
            bounces={false}
            showsHorizontalScrollIndicator={false}
            initialScrollIndex={1}
            initialNumToRender={3}
            style={{ height: 56, flexGrow: 0 }}
            getItemLayout={(_, index) => ({
              length: weekWidth,
              offset: weekWidth * index,
              index,
            })}
            onMomentumScrollEnd={(event) => {
              const index = Math.round(
                event.nativeEvent.contentOffset.x / weekWidth,
              );
              if (index !== 1 && index >= 0 && index <= 2) {
                onSelectDate(shiftDailyDate(selectedDate, (index - 1) * 7));
              }
            }}
            renderItem={({ item: weekOffset }) => (
              <View style={{ width: weekWidth }} className="flex-row">
                {LABELS.map((_, index) =>
                  day(shiftDailyDate(start, weekOffset * 7 + index), false),
                )}
              </View>
            )}
          />
        )}
      </View>
      <Modal
        transparent
        visible={open}
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <View className="flex-1 justify-center bg-black/70 px-5">
          <View className="rounded-3xl bg-background p-4">
            <View className="mb-4 flex-row items-center justify-between">
              <Pressable
                accessibilityLabel="Предыдущий месяц"
                onPress={() =>
                  setMonth(
                    dayjs(month).subtract(1, "month").format("YYYY-MM-DD"),
                  )
                }
                className="p-3"
              >
                <Text className="text-xl text-foreground">‹</Text>
              </Pressable>
              <Text className="font-semibold text-foreground">
                {formatMonth(month)}
              </Text>
              <Pressable
                accessibilityLabel="Следующий месяц"
                onPress={() =>
                  setMonth(dayjs(month).add(1, "month").format("YYYY-MM-DD"))
                }
                className="p-3"
              >
                <Text className="text-xl text-foreground">›</Text>
              </Pressable>
            </View>
            <View className="flex-row">
              {LABELS.map((label) => (
                <Text
                  key={label}
                  className="flex-1 text-center text-xs text-muted-foreground"
                >
                  {label}
                </Text>
              ))}
            </View>
            <View className="flex-row flex-wrap">
              {Array.from({ length: 42 }, (_, index) =>
                day(shiftDailyDate(gridStart, index), true),
              )}
            </View>
            <View className="mt-4 flex-row justify-between">
              <Pressable onPress={() => choose(today)} className="p-3">
                <Text className="text-primary">Сегодня</Text>
              </Pressable>
              <Pressable onPress={() => setOpen(false)} className="p-3">
                <Text className="text-muted-foreground">Закрыть</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};
