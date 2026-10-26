import { ChevronIcon } from "@/assets/icons/ChevronIcon";
import dayjs from "dayjs";
import { memo, useRef, useState } from "react";
import {
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  Text,
  useWindowDimensions,
  View,
} from "react-native";

type WeekCalendarProps = {
  selectedDate: string; // формат 'YYYY-MM-DD'
  onSelectDate: (date: string) => void;
};

const WEEKS_RANGE = 52;
const WEEK_OFFSETS = Array.from(
  { length: WEEKS_RANGE * 2 + 1 },
  (_, i) => i - WEEKS_RANGE,
);
const CENTER_INDEX = WEEKS_RANGE;
const DATE_FORMAT = "YYYY-MM-DD";

type WeekRowProps = {
  weekOffset: number;
  width: number;
  selectedDate: string;
  today: string;
  onSelectDate: (date: string) => void;
};

const WeekRow = memo(
  ({ weekOffset, width, selectedDate, today, onSelectDate }: WeekRowProps) => {
    const start = dayjs().startOf("week").add(weekOffset, "week");
    const days = Array.from({ length: 7 }, (_, i) => start.add(i, "day"));

    return (
      <View style={{ width }} className="flex-row gap-1.5 px-4">
        {days.map((day) => {
          const dateStr = day.format(DATE_FORMAT);
          const isSelected = selectedDate === dateStr;
          const isToday = today === dateStr;

          return (
            <Pressable
              key={dateStr}
              onPress={() => onSelectDate(dateStr)}
              className={`flex-1 aspect-square items-center justify-center rounded-xl border ${
                isSelected
                  ? "bg-primary border-primary"
                  : isToday
                    ? "bg-surface border-primary"
                    : "bg-surface border-transparent"
              }`}
            >
              <Text
                className={`text-base font-semibold ${
                  isSelected ? "text-primary-foreground" : "text-foreground"
                }`}
              >
                {day.format("dd")}
              </Text>
              <Text
                className={`text-xs ${
                  isSelected
                    ? "text-primary-foreground/70"
                    : "text-muted-foreground"
                }`}
              >
                {day.format("D")}
              </Text>
            </Pressable>
          );
        })}
      </View>
    );
  },
);

export const WeekCalendar = ({
  selectedDate,
  onSelectDate,
}: WeekCalendarProps) => {
  const { width } = useWindowDimensions();
  const listRef = useRef<FlatList<number>>(null);
  const [index, setIndex] = useState(CENTER_INDEX);

  const today = dayjs().format(DATE_FORMAT);
  const weekStart = dayjs()
    .startOf("week")
    .add(index - CENTER_INDEX, "week");

  const goTo = (next: number) => {
    if (next < 0 || next >= WEEK_OFFSETS.length) return;
    setIndex(next);
    listRef.current?.scrollToIndex({ index: next, animated: true });
  };

  const onMomentumEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    setIndex(Math.round(e.nativeEvent.contentOffset.x / width));
  };

  const isFirst = index === 0;
  const isLast = index === WEEK_OFFSETS.length - 1;

  return (
    <View className="py-2 border-b border-border/50">
      <View className="mb-2 flex-row items-center justify-between px-4">
        <Pressable
          onPress={() => goTo(index - 1)}
          disabled={isFirst}
          hitSlop={12}
          className={isFirst ? "opacity-30" : ""}
        >
          <View style={{ transform: [{ rotate: "90deg" }] }}>
            <ChevronIcon size={12} color="#9CA3AF" />
          </View>
        </Pressable>

        <Text className="text-foreground text-sm font-medium">
          {weekStart.format("D MMM")} –{" "}
          {weekStart.add(6, "day").format("D MMM")}
        </Text>

        <Pressable
          onPress={() => goTo(index + 1)}
          disabled={isLast}
          hitSlop={12}
          className={isLast ? "opacity-30" : ""}
        >
          <View style={{ transform: [{ rotate: "-90deg" }] }}>
            <ChevronIcon size={12} color="#9CA3AF" />
          </View>
        </Pressable>
      </View>

      <FlatList
        ref={listRef}
        data={WEEK_OFFSETS}
        keyExtractor={(offset) => String(offset)}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        initialScrollIndex={CENTER_INDEX}
        getItemLayout={(_, i) => ({
          length: width,
          offset: width * i,
          index: i,
        })}
        initialNumToRender={3}
        windowSize={5}
        extraData={selectedDate}
        onMomentumScrollEnd={onMomentumEnd}
        renderItem={({ item }) => (
          <WeekRow
            weekOffset={item}
            width={width}
            selectedDate={selectedDate}
            today={today}
            onSelectDate={onSelectDate}
          />
        )}
      />
    </View>
  );
};
