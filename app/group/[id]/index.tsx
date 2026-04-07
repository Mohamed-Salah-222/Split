import { transformImage } from "@/backend/requests";
import { getAvatarColor, getInitials } from "@/lib/avatar";
import { useSession } from "@/lib/SessionContext";
import { groupStorage } from "@/storage/groups";
import { sessionStorage } from "@/storage/sessions";
import { Group, Item, Session } from "@/types";
import { isValidId } from "@/utils/helpers";
import { Feather } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, Modal, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

function formatRelativeDate(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  // Same day check (not just 24h)
  const isToday = date.getDate() === now.getDate() && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();

  if (isToday) return "Today";

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday = date.getDate() === yesterday.getDate() && date.getMonth() === yesterday.getMonth() && date.getFullYear() === yesterday.getFullYear();

  if (isYesterday) return "Yesterday";

  if (diffDays < 7) return `${diffDays} days ago`;

  // Format as "Mar 15" or "Mar 15, 2024" if not current year
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const monthName = months[date.getMonth()];
  const day = date.getDate();

  if (date.getFullYear() === now.getFullYear()) {
    return `${monthName} ${day}`;
  }
  return `${monthName} ${day}, ${date.getFullYear()}`;
}

function GroupNotFound() {
  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#F5F4ED",
      }}
    >
      <Feather name="alert-circle" size={48} color="#CCCCCC" />
      <Text style={{ fontSize: 18, fontWeight: "600", color: "#1a1a1a", marginTop: 16 }}>Group not found</Text>
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

export default function GroupDetail() {
  const { id: rawId } = useLocalSearchParams();
  const id = Array.isArray(rawId) ? rawId[0] : rawId;
  const insets = useSafeAreaInsets();
  const { setSession, clearSession } = useSession();

  const [group, setGroup] = useState<Group>();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  const [permission, requestPermission] = useCameraPermissions();
  const [cameraOpen, setCameraOpen] = useState(false);
  const [processing, setProcessing] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  const loadGroupAndSessions = useCallback(async () => {
    if (!isValidId(id)) {
      setLoading(false);
      return;
    }
    const [g, s] = await Promise.all([groupStorage.getGroupById(id), sessionStorage.getSessionsByGroupId(id)]);
    if (g !== null) setGroup(g);
    // Sort newest first
    setSessions(s.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    setLoading(false);
  }, [id]);

  // Reload on focus so we pick up new sessions after settle → done
  useFocusEffect(
    useCallback(() => {
      loadGroupAndSessions();
    }, [loadGroupAndSessions]),
  );

  useEffect(() => {
    clearSession();
  }, []);

  const handleCapture = async () => {
    if (!cameraRef.current || processing) return;
    setProcessing(true);

    try {
      const photo = await cameraRef.current.takePictureAsync({
        base64: true,
        quality: 0.7,
      });

      if (!photo?.base64) {
        throw new Error("Failed to capture photo");
      }

      const result = await transformImage(photo.base64);

      if (result.status !== "success" || !result.data?.items) {
        throw new Error(result.message || "Failed to parse receipt");
      }

      const parsedItems: Item[] = result.data.items.map((item, index) => ({
        id: index.toString(),
        name: item.name,
        price: item.price ?? 0,
        quantity: item.quantity ?? 1,
      }));

      if (parsedItems.length === 0) {
        throw new Error("No items found on receipt");
      }

      setSession({
        items: parsedItems,
        total: result.data.total_price ?? 0,
        store: result.data.store ?? null,
      });

      setCameraOpen(false);
      router.push(`/group/${id}/review`);
    } catch (err: any) {
      console.error("Receipt capture error:", err);
      Alert.alert("Couldn't read receipt", err?.message || "Something went wrong analyzing the receipt. Try again with better lighting.");
    } finally {
      setProcessing(false);
    }
  };

  const handleOpenCamera = async () => {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) return;
    }
    setCameraOpen(true);
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

  if (!isValidId(id) || !group) return <GroupNotFound />;

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
            {group.name}
          </Text>
          <Text style={{ fontSize: 13, color: "#888888", marginTop: 2 }}>
            {group.members.length} {group.members.length === 1 ? "member" : "members"} • {sessions.length} {sessions.length === 1 ? "session" : "sessions"}
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
        {/* Members */}
        <Text
          style={{
            fontSize: 14,
            fontWeight: "600",
            color: "#666666",
            marginBottom: 12,
            marginTop: 8,
          }}
        >
          Members
        </Text>
        <View
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: 16,
            borderWidth: 1,
            borderColor: "#E5E5E5",
            overflow: "hidden",
          }}
        >
          {group.members.map((member, index) => {
            const color = getAvatarColor(index);
            return (
              <View
                key={member.id || member.name}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                  borderBottomWidth: index < group.members.length - 1 ? 1 : 0,
                  borderBottomColor: "#F0F0F0",
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
                  <Text style={{ fontSize: 15, fontWeight: "500", color: "#1a1a1a" }}>{member.name}</Text>
                  {member.phone ? <Text style={{ fontSize: 12, color: "#888888", marginTop: 2 }}>{member.phone}</Text> : null}
                </View>
              </View>
            );
          })}
        </View>

        {/* Scan Button */}
        <Pressable
          onPress={handleOpenCamera}
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            backgroundColor: "#1a1a1a",
            borderRadius: 14,
            paddingVertical: 16,
            marginTop: 24,
          }}
        >
          <Feather name="camera" size={20} color="#F5F4ED" />
          <Text style={{ color: "#F5F4ED", fontWeight: "600", fontSize: 16 }}>Scan Receipt</Text>
        </Pressable>

        {/* Past Sessions */}
        <Text
          style={{
            fontSize: 14,
            fontWeight: "600",
            color: "#666666",
            marginBottom: 12,
            marginTop: 32,
          }}
        >
          Past sessions
        </Text>

        {sessions.length === 0 ? (
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
            <Feather name="inbox" size={20} color="#CCCCCC" />
            <Text style={{ fontSize: 13, color: "#AAAAAA", marginTop: 6 }}>No sessions yet</Text>
            <Text style={{ fontSize: 12, color: "#CCCCCC", marginTop: 2 }}>Scan a receipt to start</Text>
          </View>
        ) : (
          <View style={{ gap: 10 }}>
            {sessions.map((s) => {
              const payer = group.members.find((m) => m.id === s.payerId);
              const peopleCount = s.assignments.length;

              return (
                <Pressable
                  key={s.id}
                  onPress={() => router.push(`/group/${id}/sessions/${s.id}`)}
                  style={{
                    backgroundColor: "#FFFFFF",
                    borderRadius: 14,
                    borderWidth: 1,
                    borderColor: "#E5E5E5",
                    padding: 14,
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      marginBottom: 8,
                    }}
                  >
                    <View style={{ flex: 1, marginRight: 10 }}>
                      <Text
                        style={{
                          fontSize: 15,
                          fontWeight: "600",
                          color: "#1a1a1a",
                        }}
                        numberOfLines={1}
                      >
                        {s.store || "Receipt"}
                      </Text>
                      <Text style={{ fontSize: 12, color: "#888888", marginTop: 2 }}>{formatRelativeDate(s.createdAt)}</Text>
                    </View>
                    <View
                      style={{
                        backgroundColor: "#F0F7FF",
                        borderRadius: 8,
                        paddingHorizontal: 10,
                        paddingVertical: 4,
                      }}
                    >
                      <Text style={{ fontSize: 14, fontWeight: "700", color: "#1a6ee1" }}>{s.total.toFixed(2)} LE</Text>
                    </View>
                  </View>

                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 12,
                      marginTop: 4,
                    }}
                  >
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                      <Feather name="users" size={12} color="#888888" />
                      <Text style={{ fontSize: 12, color: "#888888" }}>
                        {peopleCount} {peopleCount === 1 ? "person" : "people"}
                      </Text>
                    </View>
                    {payer && (
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                        <Feather name="credit-card" size={12} color="#888888" />
                        <Text style={{ fontSize: 12, color: "#888888" }} numberOfLines={1}>
                          Paid by {payer.name}
                        </Text>
                      </View>
                    )}
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Camera Modal */}
      <Modal visible={cameraOpen} animationType="slide">
        <View
          style={{
            flex: 1,
            backgroundColor: "#000000",
            paddingTop: insets.top,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              paddingHorizontal: 20,
              paddingVertical: 12,
            }}
          >
            <Pressable
              onPress={() => !processing && setCameraOpen(false)}
              disabled={processing}
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: "rgba(255,255,255,0.15)",
                alignItems: "center",
                justifyContent: "center",
                opacity: processing ? 0.4 : 1,
              }}
            >
              <Feather name="x" size={20} color="#FFFFFF" />
            </Pressable>
            <Text style={{ color: "#FFFFFF", fontWeight: "600", fontSize: 16 }}>Scan Receipt</Text>
            <View style={{ width: 36 }} />
          </View>

          <View style={{ flex: 1 }}>
            <CameraView ref={cameraRef} facing="back" style={{ flex: 1 }} />
          </View>

          <View
            style={{
              alignItems: "center",
              paddingVertical: 32,
              paddingBottom: insets.bottom + 32,
            }}
          >
            {processing ? (
              <View style={{ alignItems: "center", gap: 12 }}>
                <ActivityIndicator size="large" color="#FFFFFF" />
                <Text style={{ color: "#FFFFFF", fontSize: 14 }}>Analyzing receipt...</Text>
              </View>
            ) : (
              <Pressable
                onPress={handleCapture}
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: 36,
                  borderWidth: 4,
                  borderColor: "#FFFFFF",
                  backgroundColor: "transparent",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <View
                  style={{
                    width: 58,
                    height: 58,
                    borderRadius: 29,
                    backgroundColor: "#FFFFFF",
                  }}
                />
              </Pressable>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}
