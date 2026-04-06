import { getAvatarColor, getInitials } from "@/lib/avatar";
import { Group } from "@/types";
import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";

type GroupCardProps = {
  group: Group;
  layout: "list" | "grid";
  onLongPress?: () => void;
};

export default function GroupCard({ group, layout, onLongPress }: GroupCardProps) {
  const maxAvatars = layout === "grid" ? 3 : 4;
  const visibleMembers = group.members.slice(0, maxAvatars);
  const overflow = group.members.length - maxAvatars;

  const avatarSize = layout === "grid" ? "w-6 h-6" : "w-7 h-7";
  const avatarTextSize = layout === "grid" ? "text-[9px]" : "text-[10px]";

  if (layout === "grid") {
    return (
      <Pressable className="bg-card rounded-xl border border-border p-3 active:opacity-80" onPress={() => router.push(`/group/${group.id}`)} onLongPress={onLongPress} delayLongPress={500}>
        <Text className="text-sm font-semibold text-card-foreground" numberOfLines={1}>
          {group.name}
        </Text>
        <Text className="text-[11px] text-muted-foreground mt-1 mb-2.5">
          {group.members.length} {group.members.length === 1 ? "member" : "members"}
        </Text>

        {/* Avatars */}
        <View className="flex-row gap-1 mb-2.5">
          {visibleMembers.map((member, index) => {
            const color = getAvatarColor(index);
            return (
              <View key={index} className={`${avatarSize} rounded-full items-center justify-center`} style={{ backgroundColor: color.bg }}>
                <Text className={`${avatarTextSize} font-medium`} style={{ color: color.text }}>
                  {getInitials(member.name)}
                </Text>
              </View>
            );
          })}
          {overflow > 0 && (
            <View className={`${avatarSize} rounded-full bg-muted/30 items-center justify-center`}>
              <Text className={`${avatarTextSize} font-medium text-muted-foreground`}>+{overflow}</Text>
            </View>
          )}
        </View>

        <Text className="text-[11px] font-medium text-primary">
          {group.sessionCount} {group.sessionCount === 1 ? "session" : "sessions"}
        </Text>
      </Pressable>
    );
  }

  // List layout
  return (
    <Pressable className="bg-card rounded-xl border border-border p-3.5 mb-2 active:opacity-80" onPress={() => router.push(`/group/${group.id}`)} onLongPress={onLongPress} delayLongPress={500}>
      {/* Header */}
      <View className="flex-row justify-between items-center mb-1.5">
        <Text className="text-[15px] font-semibold text-card-foreground" numberOfLines={1}>
          {group.name}
        </Text>
        <Text className="text-[11px] text-muted-foreground">
          {group.members.length} {group.members.length === 1 ? "member" : "members"}
        </Text>
      </View>

      {/* Avatars */}
      <View className="flex-row gap-1.5 mb-2">
        {visibleMembers.map((member, index) => {
          const color = getAvatarColor(index);
          return (
            <View key={index} className={`${avatarSize} rounded-full items-center justify-center`} style={{ backgroundColor: color.bg }}>
              <Text className={`${avatarTextSize} font-medium`} style={{ color: color.text }}>
                {getInitials(member.name)}
              </Text>
            </View>
          );
        })}
        {overflow > 0 && (
          <View className={`${avatarSize} rounded-full bg-muted/30 items-center justify-center`}>
            <Text className={`${avatarTextSize} font-medium text-muted-foreground`}>+{overflow}</Text>
          </View>
        )}
      </View>

      {/* Footer */}
      <View className="flex-row justify-between items-center">
        <Text className="text-[11px] text-muted-foreground">{group.lastSplit ? `Last split: ${group.lastSplit}` : "No splits yet"}</Text>
        <Text className="text-[11px] font-medium text-primary">
          {group.sessionCount} {group.sessionCount === 1 ? "session" : "sessions"}
        </Text>
      </View>
    </Pressable>
  );
}
