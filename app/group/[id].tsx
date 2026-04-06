import DragDrop from "@/components/DragAndDrop";
import { getAvatarColor, getInitials } from "@/lib/avatar";
import { groupStorage } from "@/storage/groups";
import { Group, Item } from "@/types";
import { isValidId } from "@/utils/helpers";
import { Feather } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Modal, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Step = "overview" | "assign";

// const MOCK_GROUP: Group = {
//   id: "123",
//   name: "Group name",
//   creator: "Saif Ul Islam",
//   createdAt: "2023-01-01T00:00:00.000Z",
//   sessionCount: 0,
//   members: [
//     {
//       id: "123",
//       name: "Saif Ul Islam",
//       phone: "+201000049956",
//       items: [],
//     },
//     {
//       id: "1234",
//       name: "Mohammed Ali",
//       phone: "+201000049956",
//       items: [],
//     },
//     {
//       id: "12345",
//       name: "Slah el gay",
//       phone: "+201000049956",
//       items: [],
//     },
//   ],
// };
//

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
      <Text
        style={{
          fontSize: 18,
          fontWeight: "600",
          color: "#1a1a1a",
          marginTop: 16,
        }}
      >
        Group not found
      </Text>
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

  const [group, setGroup] = useState<Group>();
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<Step>("overview");

  // Camera
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraOpen, setCameraOpen] = useState(false);
  const [processing, setProcessing] = useState(false);
  const cameraRef = useRef<CameraView>(null);
  const [total, setTotal] = useState(0);

  // Items from receipt
  const [items, setItems] = useState<Item[]>([]);

  // Test data
  const testResponse: any = {
    status: "success",
    data: {
      store: "خير زمان - طنطا",
      total_price: 114.92,
      items: [
        { name: "بریزیدون جبنة فيتا 500 جم", price: 40.95, quantity: 1 },
        { name: "المراعي لبن كامل الدسم 1 لتر", price: 18.25, quantity: 1 },
        { name: "جبنه شيدر مستورد 1ك", price: 23.22, quantity: 1 },
        { name: "المراعي زبادی طبیعی 105جم", price: 32.5, quantity: 1 },
      ],
    },
  };


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

  const handleCapture = async () => {
    if (!cameraRef.current || processing) return;
    setProcessing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({ base64: true });
      if (!photo?.uri) throw new Error("No photo captured");

      // TODO: Replace testResponse with actual API call:
      // const result = await tranformImage(photo.uri);
      const result = testResponse;
      const parsedItems: Item[] = result.data.items.map((item: any, index: number) => ({
        ...item,
        id: index.toString(),
      }));
      setItems(parsedItems);
      setTotal(result.data.total_price);
      setCameraOpen(false);
      setStep("assign");
    } catch (err) {
      console.error("Capture error:", err);
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

  // Loading state
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
          onPress={() => {
            if (step === "assign") {
              setStep("overview");
            } else {
              router.back();
            }
          }}
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
            {group.members.length} {group.members.length === 1 ? "member" : "members"} • {group.sessionCount} {group.sessionCount === 1 ? "session" : "sessions"}
          </Text>
        </View>
      </View>

      {/* Step: Overview */}
      {step === "overview" && (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingBottom: insets.bottom + 100,
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
                  {/* Avatar */}
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
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: "600",
                        color: color.text,
                      }}
                    >
                      {getInitials(member.name)}
                    </Text>
                  </View>

                  {/* Info */}
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontSize: 15,
                        fontWeight: "500",
                        color: "#1a1a1a",
                      }}
                    >
                      {member.name}
                    </Text>
                    {member.phone ? (
                      <Text
                        style={{
                          fontSize: 12,
                          color: "#888888",
                          marginTop: 2,
                        }}
                      >
                        {member.phone}
                      </Text>
                    ) : null}
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
              marginTop: 32,
            }}
          >
            <Feather name="camera" size={20} color="#F5F4ED" />
            <Text style={{ color: "#F5F4ED", fontWeight: "600", fontSize: 16 }}>Scan Receipt</Text>
          </Pressable>
        </ScrollView>
      )}


      {/* Step: Assign Items */}
      {step === "assign" && (
        <View style={{ flex: 1 }}>
          <DragDrop items={items} group={group} total={total} />
        </View>
      )}

      {/* Camera Modal */}
      <Modal visible={cameraOpen} animationType="slide">
        <View
          style={{
            flex: 1,
            backgroundColor: "#000000",
            paddingTop: insets.top,
          }}
        >
          {/* Camera Header */}
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
              onPress={() => setCameraOpen(false)}
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: "rgba(255,255,255,0.15)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Feather name="x" size={20} color="#FFFFFF" />
            </Pressable>
            <Text style={{ color: "#FFFFFF", fontWeight: "600", fontSize: 16 }}>Scan Receipt</Text>
            <View style={{ width: 36 }} />
          </View>

          {/* Camera View */}
          <View style={{ flex: 1 }}>
            <CameraView ref={cameraRef} facing="back" style={{ flex: 1 }} />
          </View>

          {/* Capture Button */}
          <View
            style={{
              alignItems: "center",
              paddingVertical: 32,
              paddingBottom: insets.bottom + 32,
            }}
          >
            {processing ? (
              <View
                style={{
                  alignItems: "center",
                  gap: 12,
                }}
              >
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
