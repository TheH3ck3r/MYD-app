import dayjs from "dayjs";
import { Pressable, Text, View } from "react-native";

const DAY_VALUES = [1, 2, 3, 4, 5, 6, 0];

const getLabel = (value: number): string => {
  const short = dayjs().day(value).format("dd");
  return short.charAt(0).toUpperCase() + short.slice(1);
};

type DayPickerProps = {
  value: number[];
  onChange: (days: number[]) => void;
};

export const DayPicker = ({ value, onChange }: DayPickerProps) => {
  const toggle = (day: number) => {
    if (value.includes(day)) {
      onChange(value.filter((d) => d !== day));
    } else {
      onChange([...value, day]);
    }
  };

  return (
    <View className="flex-row gap-1.5">
      {DAY_VALUES.map((day) => {
        const active = value.includes(day);
        return (
          <Pressable
            key={day}
            onPress={() => toggle(day)}
            className={`flex-1 aspect-square rounded-lg items-center justify-center border ${
              active
                ? "bg-primary border-primary"
                : "bg-transparent border-border"
            } active:opacity-70`}
          >
            <Text
              className={`text-xs font-medium ${
                active ? "text-primary-foreground" : "text-muted-foreground"
              }`}
            >
              {getLabel(day)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
};
