import { CalendarIcon, ListIcon, SettingsIcon } from "../../assets/icons";
import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          backgroundColor: "#121417",
          borderTopWidth: 0,
          elevation: 0,
          shadowOpacity: 0,
          height: 64 + insets.bottom,
          paddingBottom: insets.bottom,
        },
        tabBarIconStyle: {
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Сегодня",
          tabBarIcon: () => <CalendarIcon size={24} />,
        }}
      />
      <Tabs.Screen
        name="tasks"
        options={{
          title: "Задачи",
          tabBarIcon: () => <ListIcon size={24} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Настройки",
          tabBarIcon: () => <SettingsIcon size={24} />,
        }}
      />
    </Tabs>
  );
}
