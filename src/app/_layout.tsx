import { Stack } from "expo-router";

export default function Layout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: "#E3350D" }, // Classic Pokémon Red
        headerTintColor: "#ffffff",
        headerTitleStyle: { fontWeight: "900", fontSize: 22 },
        headerShadowVisible: false, // Removes the bottom border for a cleaner look
      }}
    >
      <Stack.Screen name="index" options={{ title: "Legendary Pokédex" }} />
    </Stack>
  );
}
