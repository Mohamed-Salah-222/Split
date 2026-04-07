import { getAvatarColor, getInitials } from "@/lib/avatar";
import { useSession } from "@/lib/SessionContext";
import { Assignment, Item, Member } from "@/types";
import { Feather } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { Dimensions, Pressable, Text, View } from "react-native";
import { DraxProvider, DraxScrollView, DraxView } from "react-native-drax";

type Props = {
  items: Item[];
  members: Member[];
};

type UserWithItems = Member & { items: Item[] };

export default function DragDrop({ items: propItems, members: propMembers }: Props) {
  const { updateAssignments } = useSession();

  const [items, setItems] = useState<Item[]>(propItems);
  const [users, setUsers] = useState<UserWithItems[]>(propMembers.map((m) => ({ ...m, items: [] })));
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    setUsers(propMembers.map((m) => ({ ...m, items: [] })));
    setItems(propItems ?? []);
    setActiveIndex(0);
  }, [propMembers, propItems]);

  useEffect(() => {
    const assignments: Assignment[] = users.filter((u) => u.items.length > 0).map((u) => ({ memberId: u.id, items: u.items }));
    updateAssignments(assignments);
  }, [users]);

  const handleDrop = (userId: string, item: Item) => {
    setUsers((prev) => prev.map((user) => (user.id === userId ? { ...user, items: [...user.items, { ...item, quantity: 1 }] } : user)));
    setItems((prev) => {
      const updated = prev.map((i) => (i.id === item.id ? { ...i, quantity: i.quantity - 1 } : i)).filter((i) => i.quantity > 0);
      if (activeIndex >= updated.length && updated.length > 0) {
        setActiveIndex(updated.length - 1);
      }
      return updated;
    });
  };

  const handleRemoveItem = (userId: string, itemIndex: number) => {
    const user = users.find((u) => u.id === userId);
    if (!user) return;
    const removedItem = user.items[itemIndex];

    setItems((prev) => {
      const existing = prev.find((i) => i.id === removedItem.id);
      if (existing) {
        return prev.map((i) => (i.id === removedItem.id ? { ...i, quantity: i.quantity + 1 } : i));
      }
      return [...prev, { ...removedItem, quantity: 1 }];
    });

    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, items: u.items.filter((_, i) => i !== itemIndex) } : u)));
  };

  const getTotalForUser = (user: UserWithItems) => {
    return user.items.reduce((sum, item) => sum + item.price, 0);
  };

  const activeItem = items[activeIndex];
  const cardWidth = Dimensions.get("window").width - 40 - 32 - 32 - 16;

  return (
    <DraxProvider>
      <View style={{ flex: 1 }}>
        {/* Items section */}
        <View style={{ paddingHorizontal: 20, marginBottom: 16 }}>
          <Text style={{ fontSize: 14, fontWeight: "600", color: "#666666", marginBottom: 10 }}>{items.length > 0 ? `Items (${activeIndex + 1} of ${items.length})` : "Items (0 remaining)"}</Text>

          {items.length > 0 && activeItem ? (
            <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 8 }}>
              <Pressable
                onPress={() => setActiveIndex((prev) => Math.max(0, prev - 1))}
                disabled={activeIndex <= 0}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 10,
                  backgroundColor: activeIndex > 0 ? "#FFFFFF" : "#F0F0F0",
                  borderWidth: 1,
                  borderColor: "#E5E5E5",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Feather name="chevron-left" size={16} color={activeIndex > 0 ? "#1a1a1a" : "#CCCCCC"} />
              </Pressable>

              <DraxView
                key={activeItem.id}
                draggable
                dragPayload={activeItem}
                style={{
                  width: cardWidth,
                  backgroundColor: "#FFFFFF",
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: "#E5E5E5",
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                }}
                draggingStyle={{ opacity: 0.4 }}
                dragReleasedStyle={{ opacity: 1 }}
              >
                <Text style={{ fontSize: 14, fontWeight: "500", color: "#1a1a1a" }} numberOfLines={1}>
                  {activeItem.name}
                </Text>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginTop: 4,
                  }}
                >
                  <Text style={{ fontSize: 13, fontWeight: "600", color: "#1a6ee1" }}>{activeItem.price.toFixed(2)} LE</Text>
                  {activeItem.quantity > 1 && (
                    <View
                      style={{
                        backgroundColor: "#F0F0F0",
                        borderRadius: 6,
                        paddingHorizontal: 6,
                        paddingVertical: 2,
                      }}
                    >
                      <Text style={{ fontSize: 11, fontWeight: "600", color: "#888888" }}>×{activeItem.quantity}</Text>
                    </View>
                  )}
                </View>
              </DraxView>

              <Pressable
                onPress={() => setActiveIndex((prev) => Math.min(items.length - 1, prev + 1))}
                disabled={activeIndex >= items.length - 1}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 10,
                  backgroundColor: activeIndex < items.length - 1 ? "#FFFFFF" : "#F0F0F0",
                  borderWidth: 1,
                  borderColor: "#E5E5E5",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Feather name="chevron-right" size={16} color={activeIndex < items.length - 1 ? "#1a1a1a" : "#CCCCCC"} />
              </Pressable>
            </View>
          ) : (
            <View
              style={{
                backgroundColor: "#FFFFFF",
                borderRadius: 12,
                borderWidth: 1,
                borderColor: "#E5E5E5",
                borderStyle: "dashed",
                paddingVertical: 20,
                alignItems: "center",
              }}
            >
              <Feather name="check-circle" size={20} color="#CCCCCC" />
              <Text style={{ fontSize: 14, color: "#AAAAAA", marginTop: 6 }}>All items assigned</Text>
            </View>
          )}
        </View>

        {items.length > 0 && (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              marginBottom: 12,
            }}
          >
            <Feather name="arrow-down" size={14} color="#AAAAAA" />
            <Text style={{ fontSize: 12, color: "#AAAAAA" }}>Drag items to a member below</Text>
          </View>
        )}

        <DraxScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingBottom: 40,
            gap: 10,
          }}
          showsVerticalScrollIndicator={false}
        >
          {users.map((user, userIndex) => {
            const color = getAvatarColor(userIndex);
            const userTotal = getTotalForUser(user);

            return (
              <DraxView
                key={user.id}
                receptive
                onReceiveDragDrop={(event) => {
                  const draggedItem = event.dragged.payload as Item;
                  handleDrop(user.id, draggedItem);
                }}
                style={{
                  backgroundColor: "#FFFFFF",
                  borderRadius: 16,
                  borderWidth: 1.5,
                  borderColor: "#E5E5E5",
                  overflow: "hidden",
                }}
                receivingStyle={{
                  borderColor: "#1a6ee1",
                  borderWidth: 2,
                  backgroundColor: "#F8FAFF",
                }}
              >
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
                    <Text style={{ fontSize: 13, fontWeight: "600", color: color.text }}>{getInitials(user.name)}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 15, fontWeight: "600", color: "#1a1a1a" }}>{user.name}</Text>
                    {user.items.length > 0 && (
                      <Text style={{ fontSize: 12, color: "#888888", marginTop: 2 }}>
                        {user.items.length} {user.items.length === 1 ? "item" : "items"}
                      </Text>
                    )}
                  </View>
                  {userTotal > 0 && (
                    <View
                      style={{
                        backgroundColor: "#F0F7FF",
                        borderRadius: 8,
                        paddingHorizontal: 10,
                        paddingVertical: 4,
                      }}
                    >
                      <Text style={{ fontSize: 14, fontWeight: "700", color: "#1a6ee1" }}>{userTotal.toFixed(2)} LE</Text>
                    </View>
                  )}
                </View>

                {user.items.length > 0 ? (
                  <View
                    style={{
                      borderTopWidth: 1,
                      borderTopColor: "#F0F0F0",
                      paddingHorizontal: 16,
                      paddingVertical: 8,
                    }}
                  >
                    {user.items.map((item, itemIndex) => (
                      <View
                        key={`${item.id}-${itemIndex}`}
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          paddingVertical: 8,
                          borderBottomWidth: itemIndex < user.items.length - 1 ? 1 : 0,
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
                            marginRight: 10,
                          }}
                        >
                          {item.price.toFixed(2)} LE
                        </Text>
                        <Pressable
                          onPress={() => handleRemoveItem(user.id, itemIndex)}
                          style={{
                            width: 24,
                            height: 24,
                            borderRadius: 6,
                            backgroundColor: "#FEE2E2",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Feather name="x" size={12} color="#EF4444" />
                        </Pressable>
                      </View>
                    ))}
                  </View>
                ) : (
                  <View
                    style={{
                      borderTopWidth: 1,
                      borderTopColor: "#F0F0F0",
                      paddingVertical: 16,
                      alignItems: "center",
                    }}
                  >
                    <Text style={{ fontSize: 13, color: "#CCCCCC" }}>Drop items here</Text>
                  </View>
                )}
              </DraxView>
            );
          })}
        </DraxScrollView>
      </View>
    </DraxProvider>
  );
}
