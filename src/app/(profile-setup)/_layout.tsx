import { Stack } from "expo-router";

import { ProfileSetupProvider } from "@/providers/profile-setup-provider";

export const unstable_settings = {
  anchor: "name",
};

export default function ProfileSetupLayout() {
  return (
    <ProfileSetupProvider>
      <Stack
        screenOptions={{
          animation: "slide_from_right",
          headerShown: false,
        }}
      />
    </ProfileSetupProvider>
  );
}
