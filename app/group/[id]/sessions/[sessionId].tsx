import { getAvatarColor, getInitials } from "@/lib/avatar";
import { groupStorage } from "@/storage/groups";
import { sessionStorage } from "@/storage/sessions";
import { Group, Session } from "@/types";
import { isValidId } from "@/utils/helpers";
import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

function formatFullDate(iso: string): string {
  const date = new Date(iso);
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const monthName = months[date.getMonth()];
  const day = date.getDate();
  const year = date.getFullYear();
  const hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 || 12;
  return `${monthName} ${day}, ${year} • ${displayHours}:${minutes} ${ampm}`;
}

export default function SessionDetailPage() {
  const { id: rawId, sessionId: rawSessionId } = useLocalSearchParams();
  const id = Array.isArray(rawId) ? rawId[0] : rawId;
  const sessionId = Array.isArray(rawSessionId) ? rawSessionId[0] : rawSessionId;
  const insets = useSafeAreaInsets();

  const [session, setSession] = useState<Session | null>(null);
  const [group, setGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!isValidId(id) || !isValidId(sessionId)) {
        setLoading(false);
        return;
      }
      const [s, g] = await Promise.all([sessionStorage.getSessionById(sessionId), groupStorage.getGroupById(id)]);
      setSession(s);
      setGroup(g);
      setLoading(false);
    };
    load();
  }, [id, sessionId]);

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

  if (!session || !group) {
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
        <Text style={{ fontSize: 16, color: "#666666", marginTop: 16, textAlign: "center" }}>Session not found</Text>
        <Pressable
          onPress={() => router.back()}
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

  const payer = group.members.find((m) => m.id === session.payerId);

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
            {session.store || "Receipt"}
          </Text>
          <Text style={{ fontSize: 12, color: "#888888", marginTop: 2 }} numberOfLines={1}>
            {formatFullDate(session.createdAt)}
          </Text>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: insets.bottom + 40,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Total + Payer card */}
        <View
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: 16,
            borderWidth: 1,
            borderColor: "#E5E5E5",
            padding: 16,
            marginTop: 8,
          }}
        >
          <Text style={{ fontSize: 12, color: "#888888" }}>Total</Text>
          <Text style={{ fontSize: 28, fontWeight: "700", color: "#1a1a1a", marginTop: 4 }}>{session.total.toFixed(2)} LE</Text>

          {payer && (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 10,
                marginTop: 14,
                paddingTop: 14,
                borderTopWidth: 1,
                borderTopColor: "#F0F0F0",
              }}
            >
              {(() => {
                const idx = group.members.findIndex((m) => m.id === payer.id);
                const color = getAvatarColor(idx);
                return (
                  <View
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 16,
                      backgroundColor: color.bg,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Text style={{ fontSize: 12, fontWeight: "600", color: color.text }}>{getInitials(payer.name)}</Text>
                  </View>
                );
              })()}
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 12, color: "#888888" }}>Paid by</Text>
                <Text style={{ fontSize: 14, fontWeight: "600", color: "#1a1a1a", marginTop: 1 }}>{payer.name}</Text>
              </View>
            </View>
          )}
        </View>

        {/* Per-member breakdown */}
        <Text
          style={{
            fontSize: 14,
            fontWeight: "600",
            color: "#666666",
            marginBottom: 12,
            marginTop: 24,
          }}
        >
          Breakdown
        </Text>

        <View style={{ gap: 10 }}>
          {session.assignments.map((assignment) => {
            const member = group.members.find((m) => m.id === assignment.memberId);
            if (!member) return null;
            const memberIndex = group.members.findIndex((m) => m.id === member.id);
            const color = getAvatarColor(memberIndex);
            const memberTotal = assignment.items.reduce((sum, item) => sum + item.price, 0);
            const isPayer = member.id === session.payerId;

            return (
              <View
                key={member.id}
                style={{
                  backgroundColor: "#FFFFFF",
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: "#E5E5E5",
                  overflow: "hidden",
                }}
              >
                {/* Member header */}
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingHorizontal: 16,
                    paddingVertical: 14,
                    gap: 12,
                  }}
                >
                  <View
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      backgroundColor: color.bg,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Text style={{ fontSize: 13, fontWeight: "600", color: color.text }}>{getInitials(member.name)}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                      <Text style={{ fontSize: 15, fontWeight: "600", color: "#1a1a1a" }}>{member.name}</Text>
                      {isPayer && (
                        <View
                          style={{
                            backgroundColor: "#F0F7FF",
                            borderRadius: 6,
                            paddingHorizontal: 6,
                            paddingVertical: 1,
                          }}
                        >
                          <Text style={{ fontSize: 10, fontWeight: "600", color: "#1a6ee1" }}>PAID</Text>
                        </View>
                      )}
                    </View>
                    <Text style={{ fontSize: 12, color: "#888888", marginTop: 2 }}>
                      {assignment.items.length} {assignment.items.length === 1 ? "item" : "items"}
                    </Text>
                  </View>
                  <View
                    style={{
                      backgroundColor: isPayer ? "#F0F7FF" : "#FEF3E7",
                      borderRadius: 8,
                      paddingHorizontal: 10,
                      paddingVertical: 4,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: "700",
                        color: isPayer ? "#1a6ee1" : "#D97706",
                      }}
                    >
                      {memberTotal.toFixed(2)} LE
                    </Text>
                  </View>
                </View>

                {/* Items list */}
                <View
                  style={{
                    borderTopWidth: 1,
                    borderTopColor: "#F0F0F0",
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                  }}
                >
                  {assignment.items.map((item, itemIndex) => (
                    <View
                      key={`${item.id}-${itemIndex}`}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        paddingVertical: 8,
                        borderBottomWidth: itemIndex < assignment.items.length - 1 ? 1 : 0,
                        borderBottomColor: "#F8F8F8",
                      }}
                    >
                      <Text style={{ flex: 1, fontSize: 14, color: "#1a1a1a" }} numberOfLines={1}>
                        {item.name}
                      </Text>
                      <Text
                        style={{
                          fontSize: 13,
                          fontWeight: "500",
                          color: "#666666",
                        }}
                      >
                        {item.price.toFixed(2)} LE
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}
