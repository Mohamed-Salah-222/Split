import { View, Text, Pressable } from "react-native";
import { router } from "expo-router";
import { groupStorage } from "@/storage/groups";

type Member = {
  name: string;
  phone: string;
};

type Group = {
  id: string;
  name: string;
  members: Member[];
  lastSplit?: string;
  sessionCount: number;
};

type GroupCardProps = {
  group: Group;
};

function getInitials(name: string): string {
  const parts = name.trim().split(" ");
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export default function GroupCard({ group }: GroupCardProps) {
  const maxAvatars = 4;
  const visibleMembers = group.members.slice(0, maxAvatars);
  const overflow = group.members.length - maxAvatars;

  const onDelete = async () => {
    groupStorage.deleteGroup(group.id).then(() => router.push("/"));
  };

  return (
    <Pressable className="bg-card rounded-xl border border-border p-4 mb-3 active:opacity-80" onPress={() => router.push(`/group/${group.id}`)}>
      {/* Header: name + member count */}
      <View className="flex-row justify-between items-center mb-2">
        <Text className="text-base font-semibold text-card-foreground">{group.name}</Text>
        <Text className="text-xs text-muted-foreground">
          {group.members.length} {group.members.length === 1 ? "member" : "members"}
        </Text>
        <Pressable className="bg-foreground rounded-xl py-2 px-4 text-sm text-card-foreground active:opacity-80" onPress={() => onDelete()}>
          <Text style={{ color: "#dc2626", fontSize: 12, fontWeight: "500" }}>Delete</Text>
        </Pressable>
      </View>

      {/* Avatars */}
      <View className="flex-row gap-1.5 mb-3">
        {visibleMembers.map((member, index) => (
          <View key={index} className="w-7 h-7 rounded-full bg-primary/15 items-center justify-center">
            <Text className="text-xs font-medium text-primary">{getInitials(member.name)}</Text>
          </View>
        ))}
        {overflow > 0 && (
          <View className="w-7 h-7 rounded-full bg-muted/30 items-center justify-center">
            <Text className="text-xs font-medium text-muted-foreground">+{overflow}</Text>
          </View>
        )}
      </View>

      {/* Footer: last split + session count */}
      <View className="flex-row justify-between items-center">
        <Text className="text-xs text-muted-foreground">{group.lastSplit ? `Last split: ${group.lastSplit}` : "No splits yet"}</Text>
        <Text className="text-xs font-medium text-primary">
          {group.sessionCount} {group.sessionCount === 1 ? "session" : "sessions"}
        </Text>
      </View>

    </Pressable>
  );
}
