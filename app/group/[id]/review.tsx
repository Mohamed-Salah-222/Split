import { useSession } from "@/lib/SessionContext";
import { Item } from "@/types";
import { generateId } from "@/utils/helpers";
import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type EditableItem = {
  id: string;
  name: string;
  price: string; // string for input, parsed on save
  quantity: string;
};

function itemToEditable(item: Item): EditableItem {
  return {
    id: item.id,
    name: item.name,
    price: item.price.toString(),
    quantity: item.quantity.toString(),
  };
}

function editableToItem(e: EditableItem): Item {
  return {
    id: e.id,
    name: e.name.trim(),
    price: parseFloat(e.price) || 0,
    quantity: parseInt(e.quantity, 10) || 1,
  };
}

export default function ReviewPage() {
  const { id: rawId } = useLocalSearchParams();
  const id = Array.isArray(rawId) ? rawId[0] : rawId;
  const insets = useSafeAreaInsets();
  const { session, setSession } = useSession();

  const [editableItems, setEditableItems] = useState<EditableItem[]>([]);

  useEffect(() => {
    if (session?.items) {
      setEditableItems(session.items.map(itemToEditable));
    }
  }, []);

  // If somehow we land here with no session, bounce back
  if (!session) {
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
        <Text style={{ fontSize: 16, color: "#666666", marginTop: 16, textAlign: "center" }}>No receipt data. Scan a receipt first.</Text>
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

  const updateItem = (itemId: string, field: keyof EditableItem, value: string) => {
    setEditableItems((prev) => prev.map((item) => (item.id === itemId ? { ...item, [field]: value } : item)));
  };

  const removeItem = (itemId: string) => {
    setEditableItems((prev) => prev.filter((item) => item.id !== itemId));
  };

  const addItem = () => {
    setEditableItems((prev) => [
      ...prev,
      {
        id: generateId(),
        name: "",
        price: "0",
        quantity: "1",
      },
    ]);
  };

  // Calculated subtotal from current items
  const subtotal = editableItems.reduce((sum, item) => {
    const price = parseFloat(item.price) || 0;
    const qty = parseInt(item.quantity, 10) || 0;
    return sum + price * qty;
  }, 0);

  const handleContinue = () => {
    const validItems = editableItems.filter((e) => e.name.trim() !== "");

    if (validItems.length === 0) {
      Alert.alert("No items", "Add at least one item before continuing.");
      return;
    }

    const finalItems = validItems.map(editableToItem);
    const finalTotal = finalItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

    setSession({
      items: finalItems,
      total: finalTotal,
      store: session.store,
    });

    router.push(`/group/${id}/assign`);
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
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
              Review items
            </Text>
            {session.store ? (
              <Text style={{ fontSize: 13, color: "#888888", marginTop: 2 }} numberOfLines={1}>
                {session.store}
              </Text>
            ) : null}
          </View>
        </View>

        {/* Totals card */}
        <View style={{ paddingHorizontal: 20, marginTop: 4, marginBottom: 12 }}>
          <View
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: 14,
              borderWidth: 1,
              borderColor: "#E5E5E5",
              padding: 14,
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <View>
              <Text style={{ fontSize: 12, color: "#888888" }}>Items subtotal</Text>
              <Text style={{ fontSize: 20, fontWeight: "700", color: "#1a1a1a", marginTop: 2 }}>{subtotal.toFixed(2)}</Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={{ fontSize: 12, color: "#888888" }}>Receipt total</Text>
              <Text style={{ fontSize: 16, fontWeight: "600", color: "#666666", marginTop: 2 }}>{session.total.toFixed(2)}</Text>
            </View>
          </View>
          {Math.abs(subtotal - session.total) > 0.01 && <Text style={{ fontSize: 11, color: "#AAAAAA", marginTop: 6, marginLeft: 4 }}>Difference may be tax/service/delivery fees</Text>}
        </View>

        {/* Items list */}
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingBottom: insets.bottom + 100,
          }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <Text style={{ fontSize: 14, fontWeight: "600", color: "#666666" }}>Items ({editableItems.length})</Text>
          </View>

          {editableItems.map((item) => (
            <View
              key={item.id}
              style={{
                backgroundColor: "#FFFFFF",
                borderRadius: 14,
                borderWidth: 1,
                borderColor: "#E5E5E5",
                padding: 12,
                marginBottom: 10,
              }}
            >
              {/* Name input */}
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <TextInput
                  value={item.name}
                  onChangeText={(v) => updateItem(item.id, "name", v)}
                  placeholder="Item name"
                  placeholderTextColor="#AAAAAA"
                  style={{
                    flex: 1,
                    fontSize: 15,
                    fontWeight: "500",
                    color: "#1a1a1a",
                    paddingVertical: 4,
                  }}
                />
                <Pressable
                  onPress={() => removeItem(item.id)}
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 8,
                    backgroundColor: "#FEE2E2",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Feather name="x" size={14} color="#EF4444" />
                </Pressable>
              </View>

              {/* Price + qty row */}
              <View style={{ flexDirection: "row", gap: 8, marginTop: 10 }}>
                <View style={{ flex: 2 }}>
                  <Text style={{ fontSize: 11, color: "#888888", marginBottom: 4 }}>Price</Text>
                  <TextInput
                    value={item.price}
                    onChangeText={(v) => updateItem(item.id, "price", v.replace(/[^0-9.]/g, ""))}
                    keyboardType="decimal-pad"
                    placeholder="0.00"
                    placeholderTextColor="#AAAAAA"
                    style={{
                      backgroundColor: "#F8F8F5",
                      borderRadius: 8,
                      paddingHorizontal: 10,
                      paddingVertical: 8,
                      fontSize: 14,
                      color: "#1a1a1a",
                      borderWidth: 1,
                      borderColor: "#EEEEEE",
                    }}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 11, color: "#888888", marginBottom: 4 }}>Qty</Text>
                  <TextInput
                    value={item.quantity}
                    onChangeText={(v) => updateItem(item.id, "quantity", v.replace(/[^0-9]/g, ""))}
                    keyboardType="number-pad"
                    placeholder="1"
                    placeholderTextColor="#AAAAAA"
                    style={{
                      backgroundColor: "#F8F8F5",
                      borderRadius: 8,
                      paddingHorizontal: 10,
                      paddingVertical: 8,
                      fontSize: 14,
                      color: "#1a1a1a",
                      borderWidth: 1,
                      borderColor: "#EEEEEE",
                    }}
                  />
                </View>
              </View>
            </View>
          ))}

          {/* Add button */}
          <Pressable
            onPress={addItem}
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              paddingVertical: 14,
              borderRadius: 12,
              borderWidth: 1.5,
              borderColor: "#1a1a1a",
              borderStyle: "dashed",
              marginTop: 4,
            }}
          >
            <Feather name="plus" size={16} color="#1a1a1a" />
            <Text style={{ color: "#1a1a1a", fontWeight: "600", fontSize: 14 }}>Add item</Text>
          </Pressable>
        </ScrollView>

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
            <Text style={{ color: "#F5F4ED", fontWeight: "600", fontSize: 16 }}>Continue to assign</Text>
            <Feather name="arrow-right" size={18} color="#F5F4ED" />
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
