import { Stack } from "expo-router";

export default function SearchLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="search"
        options={{
          headerShown: true,
          headerLargeTitle: true,
          headerTitle: "Search",
          headerStyle: { backgroundColor: "black" },
        }}
      />
    </Stack>
  );
}
