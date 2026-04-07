import { getAvatarColor, getInitials } from "@/lib/avatar";
import { useSession } from "@/lib/SessionContext";
import { groupStorage } from "@/storage/groups";
import { sessionStorage } from "@/storage/sessions";
import { Group, Member } from "@/types";
import { createWpSendMessageLink, isValidId, normalizePhoneNumber } from "@/utils/helpers";
import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, Linking, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type DebtorRow = {
  member: Member;
  total: number;
  itemNames: string[];
  hasPhone: boolean;
};

export default function SettlePage() {
  const { id: rawId } = useLocalSearchParams();
  const id = Array.isArray(rawId) ? rawId[0] : rawId;
  const insets = useSafeAreaInsets();
  const { session, clearSession } = useSession();

  const [group, setGroup] = useState<Group>();
  const [loading, setLoading] = useState(true);
  const [payerId, setPayerId] = useState<string | null>(null);
  const [sentMessages, setSentMessages] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

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

  const debtors = useMemo<DebtorRow[]>(() => {
    if (!session || !group || !payerId) return [];

    return session.assignments
      .filter((a) => a.memberId !== payerId)
      .map((a) => {
        const member = group.members.find((m) => m.id === a.memberId);
        if (!member) return null;
        const total = a.items.reduce((sum, item) => sum + item.price, 0);
        return {
          member,
          total,
          itemNames: a.items.map((i) => i.name),
          hasPhone: !!member.phone && member.phone.trim().length > 0,
        };
      })
      .filter((d): d is DebtorRow => d !== null && d.total > 0);
  }, [session, group, payerId]);

  const payer = useMemo(() => {
    if (!group || !payerId) return null;
    return group.members.find((m) => m.id === payerId) ?? null;
  }, [group, payerId]);

  const handleSendMessage = async (debtor: DebtorRow) => {
    if (!payer || !group || !session) return;

    const itemLines = session.assignments
      .find((a) => a.memberId === debtor.member.id)
      ?.items.map((i) => `• ${i.name} - ${i.price.toFixed(2)} LE`)
      .join("\n");

    const message = `Hey ${debtor.member.name}!\n\n` + `Here's your share from ${group.name}:\n\n` + `${itemLines}\n\n` + `Your total: ${debtor.total.toFixed(2)} LE\n\n` + `Please send to ${payer.name}, at ${payer.phone || "(no number)"}`;

    const phone = normalizePhoneNumber(debtor.member.phone);
    const url = createWpSendMessageLink(message, phone);

    try {
      const supported = await Linking.canOpenURL(url);
      if (!supported) {
        Alert.alert("WhatsApp not available", "Make sure WhatsApp is installed.");
        return;
      }
      await Linking.openURL(url);
      setSentMessages((prev) => new Set(prev).add(debtor.member.id));
    } catch (err: any) {
      Alert.alert("Couldn't open WhatsApp", err?.message || "Unknown error");
    }
  };

  const handleDone = async () => {
    if (!session || !group || !payerId || !id) return;

    setSaving(true);
    try {
      await sessionStorage.createSession({
        groupId: id,
        store: session.store,
        items: session.items,
        total: session.total,
        assignments: session.assignments,
        payerId,
        sentMessages: Array.from(sentMessages),
      });

      const groups = await groupStorage.getGroups();
      const updated = groups.map((g) => (g.id === group.id ? { ...g, sessionCount: g.sessionCount + 1, lastSplit: "just now" } : g));
      await AsyncStorage.setItem("splitly_groups", JSON.stringify(updated));

      clearSession();
      router.replace(`/group/${id}`);
    } catch (err: any) {
      Alert.alert("Couldn't save session", err?.message || "Unknown error");
    } finally {
      setSaving(false);
    }
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
        <Text style={{ fontSize: 16, color: "#666666", marginTop: 16, textAlign: "center" }}>{!group ? "Group not found" : "No session data"}</Text>
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
            Settle up
          </Text>
          <Text style={{ fontSize: 13, color: "#888888", marginTop: 2 }}>Total: {session.total.toFixed(2)} LE</Text>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: insets.bottom + 100,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Text
          style={{
            fontSize: 14,
            fontWeight: "600",
            color: "#666666",
            marginBottom: 12,
            marginTop: 8,
          }}
        >
          Who paid?
        </Text>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingRight: 20 }}>
          {group.members.map((member, index) => {
            const color = getAvatarColor(index);
            const isSelected = payerId === member.id;

            return (
              <Pressable key={member.id} onPress={() => setPayerId(isSelected ? null : member.id)} style={{ alignItems: "center", width: 76 }}>
                <View
                  style={{
                    width: 60,
                    height: 60,
                    borderRadius: 30,
                    backgroundColor: color.bg,
                    alignItems: "center",
                    justifyContent: "center",
                    borderWidth: isSelected ? 3 : 0,
                    borderColor: "#1a6ee1",
                  }}
                >
                  <Text style={{ fontSize: 18, fontWeight: "700", color: color.text }}>{getInitials(member.name)}</Text>
                  {isSelected && (
                    <View
                      style={{
                        position: "absolute",
                        bottom: -2,
                        right: -2,
                        width: 22,
                        height: 22,
                        borderRadius: 11,
                        backgroundColor: "#1a6ee1",
                        alignItems: "center",
                        justifyContent: "center",
                        borderWidth: 2,
                        borderColor: "#F5F4ED",
                      }}
                    >
                      <Feather name="check" size={12} color="#FFFFFF" />
                    </View>
                  )}
                </View>
                <Text
                  style={{
                    fontSize: 12,
                    color: isSelected ? "#1a1a1a" : "#666666",
                    fontWeight: isSelected ? "600" : "500",
                    marginTop: 8,
                    textAlign: "center",
                  }}
                  numberOfLines={1}
                >
                  {member.name}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {payer && (
          <View
            style={{
              backgroundColor: "#F0F7FF",
              borderRadius: 12,
              padding: 14,
              marginTop: 16,
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
            }}
          >
            <Feather name="check-circle" size={18} color="#1a6ee1" />
            <Text style={{ fontSize: 14, color: "#1a6ee1", fontWeight: "500", flex: 1 }}>
              <Text style={{ fontWeight: "700" }}>{payer.name}</Text> paid {session.total.toFixed(2)} LE
            </Text>
          </View>
        )}

        {payer && (
          <>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginTop: 32,
                marginBottom: 12,
              }}
            >
              <Text style={{ fontSize: 14, fontWeight: "600", color: "#666666" }}>People owe {payer.name}</Text>
              <Text style={{ fontSize: 12, color: "#AAAAAA" }}>
                {sentMessages.size} of {debtors.length} sent
              </Text>
            </View>

            {debtors.length === 0 ? (
              <View
                style={{
                  backgroundColor: "#FFFFFF",
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: "#E5E5E5",
                  borderStyle: "dashed",
                  paddingVertical: 24,
                  alignItems: "center",
                }}
              >
                <Feather name="users" size={20} color="#CCCCCC" />
                <Text style={{ fontSize: 13, color: "#AAAAAA", marginTop: 6 }}>No one owes {payer.name}</Text>
              </View>
            ) : (
              <View
                style={{
                  backgroundColor: "#FFFFFF",
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: "#E5E5E5",
                  overflow: "hidden",
                }}
              >
                {debtors.map((debtor, index) => {
                  const memberIndex = group.members.findIndex((m) => m.id === debtor.member.id);
                  const color = getAvatarColor(memberIndex);
                  const isSent = sentMessages.has(debtor.member.id);

                  return (
                    <View
                      key={debtor.member.id}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        paddingHorizontal: 16,
                        paddingVertical: 14,
                        borderBottomWidth: index < debtors.length - 1 ? 1 : 0,
                        borderBottomColor: "#F0F0F0",
                        gap: 12,
                      }}
                    >
                      <View
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 20,
                          backgroundColor: color.bg,
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Text style={{ fontSize: 14, fontWeight: "600", color: color.text }}>{getInitials(debtor.member.name)}</Text>
                      </View>

                      <View style={{ flex: 1 }}>
                        <Text
                          style={{
                            fontSize: 15,
                            fontWeight: "600",
                            color: "#1a1a1a",
                          }}
                        >
                          {debtor.member.name}
                        </Text>
                        <Text style={{ fontSize: 12, color: "#888888", marginTop: 2 }}>
                          {debtor.itemNames.length} {debtor.itemNames.length === 1 ? "item" : "items"}
                        </Text>
                      </View>

                      <View
                        style={{
                          backgroundColor: "#FEF3E7",
                          borderRadius: 8,
                          paddingHorizontal: 10,
                          paddingVertical: 4,
                          marginRight: 8,
                        }}
                      >
                        <Text style={{ fontSize: 14, fontWeight: "700", color: "#D97706" }}>{debtor.total.toFixed(2)} LE</Text>
                      </View>

                      <Pressable
                        onPress={() => handleSendMessage(debtor)}
                        disabled={!debtor.hasPhone}
                        style={{
                          width: 38,
                          height: 38,
                          borderRadius: 10,
                          backgroundColor: isSent ? "#DCFCE7" : debtor.hasPhone ? "#25D366" : "#F0F0F0",
                          alignItems: "center",
                          justifyContent: "center",
                          opacity: debtor.hasPhone ? 1 : 0.5,
                        }}
                      >
                        <Feather name={isSent ? "check" : "message-circle"} size={16} color={isSent ? "#16A34A" : debtor.hasPhone ? "#FFFFFF" : "#AAAAAA"} />
                      </Pressable>
                    </View>
                  );
                })}
              </View>
            )}
          </>
        )}
      </ScrollView>

      {payer && (
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
            onPress={handleDone}
            disabled={saving}
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              backgroundColor: "#1a1a1a",
              borderRadius: 14,
              paddingVertical: 16,
              opacity: saving ? 0.6 : 1,
            }}
          >
            {saving ? (
              <ActivityIndicator color="#F5F4ED" />
            ) : (
              <>
                <Feather name="check" size={18} color="#F5F4ED" />
                <Text style={{ color: "#F5F4ED", fontWeight: "600", fontSize: 16 }}>Done</Text>
              </>
            )}
          </Pressable>
        </View>
      )}
    </View>
  );
}
