import { Stack } from "expo-router";
import React from "react";

export default function DriverLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="dashboard" />
      <Stack.Screen name="scan" />
      <Stack.Screen name="trips" />
      <Stack.Screen name="withdraw" />
      <Stack.Screen name="profile" />
    </Stack>
  );
}
