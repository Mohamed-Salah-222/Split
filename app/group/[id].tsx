import DragDrop from "@/components/DragAndDrop";
import { useLocalSearchParams } from "expo-router";
import { Text, View, Button, Pressable, ActivityIndicator } from "react-native";
import { useEffect, useRef, useState } from "react";
import { Group, Item } from "@/types";
import { isValidId } from "@/utils/helpers";
import { groupStorage } from "@/storage/groups";
import { CameraView, useCameraPermissions } from "expo-camera";
import { tranformImage } from "@/backend/requests";

function GroupNotFound() {
  return (
    <View className="flex-1 items-center justify-center">
      <Text>Group not found</Text>
    </View>
  );
}

export default function GroupDetail() {
  const { id } = useLocalSearchParams();
  const [group, setGroup] = useState<Group>();
  const [permission, requestPermission] = useCameraPermissions();
  const [processing, setProcessing] = useState(false);
  const [items, setItems] = useState<Item[]>([]);
  const cameraRef = useRef<CameraView>(null);
  const test: any = {
    "status": "success",
    "message": null,
    "confidence": 0.85,
    "data": {
      "date": "2021-04-25",
      "time": "15:48:53",
      "store": "خير زمان - طنطا",
      "delivery_fee": null,
      "delivery_number": 16007,
      "tax": 0,
      "service": 0,
      "payment_method": "Cash",
      "total_price": 93.19,
      "discount": 0,
      "shipping_address": {
        "address": null,
        "city": null,
        "country": "EGYPT"
      },
      "items": [
        {
          "name": "بریزیدون جبنة فيتا 500 جم",
          "price": 40.95,
          "quantity": 1
        },
        {
          "name": "المراعي لبن كامل الدسم 1 لتر",
          "price": 18.25,
          "quantity": 1
        },
        {
          "name": "جبنه شيدر مستورد 1ك",
          "price": 23.22,
          "quantity": 1
        },
        {
          "name": "المراعي زبادی طبیعی 105جم",
          "price": 32.5,
          "quantity": 1
        }
      ]
    }
  }

  useEffect(() => {
    if (!isValidId(id)) return;
    groupStorage.getGroupById(id).then((g) => {
      if (g !== null) setGroup(g);
    });
  }, [id]);

  const handleCapture = async () => {
    if (!cameraRef.current || processing) return;
    setProcessing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({ base64: true });
      if (!photo?.uri) throw new Error("No photo captured");


      // const result = await tranformImage(photo.uri);
      const result = test;
      result.data.items.forEach((item: Item, index: number) => {
        item.id = index.toString();
      });
      setItems(result.data.items);
      console.log("items:", items);


      console.log("tranformImage result:", JSON.stringify(result, null, 2));
    } catch (err) {
      console.error("Capture/transform error:", err);
    } finally {
      setProcessing(false);
    }
  };

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <View className="flex-1 items-center justify-center gap-4">
        <Text>We need your permission to show the camera</Text>
        <Button onPress={requestPermission} title="Grant permission" />
      </View>
    );
  }

  if (!isValidId(id)) return <GroupNotFound />;
  if (!group) return <GroupNotFound />;

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
        <Text className="text-lg font-semibold text-foreground mb-3">Members</Text>
        {group.members.map((member) => (
          <View
            key={member.phone}
            className="flex-row items-center py-2 border-b border-border"
          >
            <Text className="text-base text-foreground flex-1">{member.name}</Text>
            <Text className="text-sm text-muted-foreground">{member.phone}</Text>
          </View>
        ))}
      </View>

      {/* Camera + Capture */}
      <View className="mb-6 rounded-2xl overflow-hidden">
        <CameraView ref={cameraRef} facing="front" style={{ height: 240 }} />
        <Pressable
          onPress={handleCapture}
          disabled={processing}
          style={({ pressed }) => ({
            backgroundColor: processing ? "#6b7280" : "#111827",
            paddingVertical: 14,
            alignItems: "center",
            opacity: pressed ? 0.8 : 1,
          })}
        >
          {processing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={{ color: "#fff", fontWeight: "600", fontSize: 15 }}>
              📸 Capture & Analyse
            </Text>
          )}
        </Pressable>
      </View>

      {/* Drag and Drop */}
      <View className="flex-1">
        <Text className="text-lg font-semibold text-foreground mb-3">Assign items</Text>
        <DragDrop items={items} members={group.members} />
      </View>
    </View>
  );
}
