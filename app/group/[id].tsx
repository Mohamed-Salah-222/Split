//* Each Group with the details

import DragDrop from "@/components/DragAndDrop";
import { useLocalSearchParams } from "expo-router";
import { Text, View } from "react-native";

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

export default function GroupDetail() {
  const { id } = useLocalSearchParams();
  const group = MOCK_GROUPS.find((g) => g.id === id);

  if (!group) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text>Group not found</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background p-4">
      {/* Group Header */}
      <View className="mb-6">
        <Text className="text-3xl font-bold text-foreground">{group.name}</Text>
        <Text className="text-sm text-muted-foreground mt-1">
          {group.members.length} members • {group.sessionCount} sessions
        </Text>
      </View>

      {/* Members List */}
      <View className="mb-6">
        <Text className="text-lg font-semibold text-foreground mb-3">
          Members
        </Text>
        {group.members.map((member) => (
          <View
            key={member.phone}
            className="flex-row items-center py-2 border-b border-border"
          >
            <Text className="text-base text-foreground flex-1">
              {member.name}
            </Text>
            <Text className="text-sm text-muted-foreground">
              {member.phone}
            </Text>
          </View>
        ))}
      </View>

      {/* Drag and Drop Component */}
      <View className="flex-1">
        <Text className="text-lg font-semibold text-foreground mb-3">
          Assign items
        </Text>
        <DragDrop />
      </View>
    </View>
  );
}
