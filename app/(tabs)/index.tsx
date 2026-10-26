import { WeekCalendar } from "@/components";
import { StreakSheet } from "@/components/daily/StreakSheet";
import { TopBar } from "@/components/TopBar";
import { TaskFormState } from "@/types/tasks";
import { useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import dayjs from "dayjs";

export default function DailyScreen() {
  const [isStreakSheetOpen, setIsStreakSheetOpen] = useState<boolean>(false);
  const [formState, setFormState] = useState<TaskFormState>(null);
  const [openTaskId, setOpenTaskId] = useState<string | null>(null);

  const [selectedDate, setSelectedDate] = useState(
    dayjs().format("YYYY-MM-DD"),
  );

  useEffect(() => {
    console.log(selectedDate);
  }, [selectedDate]);

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <TopBar
        title="Ежедневные задачи"
        perfectStreak={12}
        activeStreak={47}
        onStreakPress={() => setIsStreakSheetOpen(true)}
      />

      <WeekCalendar
        selectedDate={selectedDate}
        onSelectDate={(date) => console.log(date)}
      />

      <StreakSheet
        visible={isStreakSheetOpen}
        onClose={() => setIsStreakSheetOpen(false)}
      />
    </SafeAreaView>
  );
}
