import { Stack } from "expo-router";
import React from "react";

export default function CustomerLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="dashboard" />
      <Stack.Screen name="my-card" />
      <Stack.Screen name="create-card" />
      <Stack.Screen name="transactions" />
      <Stack.Screen name="profile" />
    </Stack>
  );
}
