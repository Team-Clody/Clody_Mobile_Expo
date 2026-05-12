import { Stack } from "expo-router";

const APP_BACKGROUND = "#FFFFFF";

export default function IntroduceLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: APP_BACKGROUND },
      }}
    />
  );
}
