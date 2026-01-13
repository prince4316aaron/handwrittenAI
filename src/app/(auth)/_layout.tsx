// app/(auth)/_layout.tsx
import { Stack } from "expo-router";

export default function AuthLayout() {
  return (
    <Stack
      initialRouteName="login"
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
      }}
    >
      <Stack.Screen name="login" />
      <Stack.Screen name="signup" />
      <Stack.Screen name="forgotpass" />
      <Stack.Screen name="otp" />
      <Stack.Screen name="newpass" />
      <Stack.Screen name="reset-success" />
      <Stack.Screen name="account-created" />
    </Stack>
  );
}
