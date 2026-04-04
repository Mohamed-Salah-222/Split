import { Text, View } from "react-native";

export default function TabOneScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-background">
      <Text className="text-xl font-bold text-foreground">Tab One + TailWind</Text>
      <View className="my-8 h-px w-4/5 bg-border" />
    </View>
  );
}
