import { Stack } from "expo-router";

export const unstable_settings = {
  initialRouteName: "farm-profile",
};

export default function ProfileSetupLayout() {
  return (
    <Stack
      screenOptions={{
        animation: "slide_from_right",
        headerShown: false,
      }}
    />
  );
}
