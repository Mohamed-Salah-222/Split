import { View, Text, Pressable, FlatList } from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import GroupCard from "../components/GroupCard";

const MOCK_GROUPS = [
  {
    id: "1",
    name: "Friday dinner crew",
    members: [
      { name: "Salah", phone: "+201001234567" },
      { name: "Slta", phone: "+201009876543" },
      { name: "Fady", phone: "+201005551234" },
      { name: "Yosre", phone: "+201007779999" },
    ],
    lastSplit: "2 days ago",
    sessionCount: 3,
  },
  {
    id: "2",
    name: "Roommates",
    members: [
      { name: "Salah", phone: "+201001234567" },
      { name: "Slta", phone: "+201009876543" },
      { name: "Fady", phone: "+201005551234" },
      { name: "Yosre", phone: "+201007779999" },
    ],
    lastSplit: "1 week ago",
    sessionCount: 7,
  },
  {
    id: "3",
    name: "Work lunch",
    members: [
      { name: "Salah", phone: "+201001234567" },
      { name: "Slta", phone: "+201009876543" },
      { name: "Fady", phone: "+201005551234" },
      { name: "Yosre", phone: "+201007779999" },
    ],
    lastSplit: "today",
    sessionCount: 12,
  },
];

export default function HomeScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="px-5 pt-4 pb-3">
        <Text className="text-sm text-muted-foreground">Welcome back</Text>
        <Text className="text-3xl font-bold text-foreground">My groups</Text>
      </View>

      {/* Groups list */}
      <FlatList
        data={MOCK_GROUPS}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <GroupCard group={item} />}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View className="items-center justify-center py-20">
            <Text className="text-lg text-muted-foreground">No groups yet</Text>
            <Text className="text-sm text-muted-foreground mt-1">Create one to start splitting</Text>
          </View>
        }
      />

      {/* Create group button */}
      <View className="absolute bottom-0 left-0 right-0 px-4" style={{ paddingBottom: insets.bottom + 16 }}>
        <Pressable className="bg-foreground rounded-xl py-4 items-center active:opacity-80" onPress={() => router.push("/create-group")}>
          <Text className="text-background font-semibold text-base">+ Create new group</Text>
        </Pressable>
      </View>
    </View>
  );
}
