import DragDrop from "@/components/DragAndDrop";
import { useSession } from "@/lib/SessionContext";
import { groupStorage } from "@/storage/groups";
import { Group } from "@/types";
import { isValidId } from "@/utils/helpers";
import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function AssignPage() {
  const { id: rawId } = useLocalSearchParams();
  const id = Array.isArray(rawId) ? rawId[0] : rawId;
  const insets = useSafeAreaInsets();
  const { session } = useSession();

  const [group, setGroup] = useState<Group>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isValidId(id)) {
      setLoading(false);
      return;
    }
    groupStorage.getGroupById(id).then((g) => {
      if (g !== null) setGroup(g);
      setLoading(false);
    });
  }, [id]);

  const handleContinue = () => {
    if (!session) return;

    if (session.assignments.length === 0) {
      Alert.alert("No assignments", "Drag at least one item to a member before continuing.");
      return;
    }

    router.push(`/group/${id}/settle`);
  };

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#F5F4ED",
        }}
      >
        <ActivityIndicator size="large" color="#1a1a1a" />
      </View>
    );
  }

  if (!group || !session) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "#F5F4ED",
          alignItems: "center",
          justifyContent: "center",
          padding: 20,
        }}
      >
        <Feather name="alert-circle" size={48} color="#CCCCCC" />
        <Text style={{ fontSize: 16, color: "#666666", marginTop: 16, textAlign: "center" }}>{!group ? "Group not found" : "No items to assign"}</Text>
        <Pressable
          onPress={() => router.replace(`/group/${id}`)}
          style={{
            marginTop: 16,
            paddingHorizontal: 24,
            paddingVertical: 12,
            borderRadius: 12,
            backgroundColor: "#1a1a1a",
          }}
        >
          <Text style={{ color: "#F5F4ED", fontWeight: "600" }}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#F5F4ED", paddingTop: insets.top }}>
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 20,
          paddingTop: 16,
          paddingBottom: 12,
          gap: 12,
        }}
      >
        <Pressable
          onPress={() => router.back()}
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            backgroundColor: "#FFFFFF",
            borderWidth: 1,
            borderColor: "#E5E5E5",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Feather name="arrow-left" size={18} color="#1a1a1a" />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 20, fontWeight: "700", color: "#1a1a1a" }} numberOfLines={1}>
            Assign items
          </Text>
          <Text style={{ fontSize: 13, color: "#888888", marginTop: 2 }}>Total: {session.total.toFixed(2)} LE</Text>
        </View>
      </View>

      <View style={{ flex: 1, paddingBottom: 80 }}>
        <DragDrop items={session.items} members={group.members} />
      </View>

      {/* Continue button */}
      <View
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          paddingHorizontal: 20,
          paddingTop: 12,
          paddingBottom: insets.bottom + 16,
          backgroundColor: "#F5F4ED",
          borderTopWidth: 1,
          borderTopColor: "#EEEEEE",
        }}
      >
        <Pressable
          onPress={handleContinue}
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            backgroundColor: "#1a1a1a",
            borderRadius: 14,
            paddingVertical: 16,
          }}
        >
          <Text style={{ color: "#F5F4ED", fontWeight: "600", fontSize: 16 }}>Continue to settle</Text>
          <Feather name="arrow-right" size={18} color="#F5F4ED" />
        </Pressable>
      </View>
    </View>
  );
}
