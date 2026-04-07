import { getAvatarColor, getInitials } from "@/lib/avatar";
import { Feather } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { Dimensions, Linking, Pressable, Text, View } from "react-native";
import { DraxProvider, DraxScrollView, DraxView } from "react-native-drax";
import { Item, Member, Group, Payer } from "../types";
import { createWpSendMessageLink, normalizePhoneNumber } from "@/utils/helpers";

export default function DragDrop(props: { items: Item[]; group: Group, total: number }) {
  const [items, setItems] = useState<Item[]>(props.items);
  const [users, setUsers] = useState<Member[]>(
    props.group.members.map((m) => ({ ...m, items: m.items ?? [] }))
  );
  const [payers, setPayers] = useState<Payer[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    setUsers(
      props.group.members.map((m) => ({
        ...m,
        items: m.items ?? [],
      })),
    );
    setItems(props.items ?? []);
    setActiveIndex(0);
  }, [props.group.members, props.items]);

  const isPayer = (user: Member) => {
    return payers.some((p) => p.member.id === user.id);
  }

  const handleMarkPayer = (user: Member) => {
    setPayers((prev) => {
      const newPayers = [...prev, { member: user, amount_due: 0 }];
      const share = props.total / newPayers.length;
      return newPayers.map((payer) => ({ ...payer, amount_due: share }));
    });
  };

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

  const formatMessage = (payer: Payer, user: Member, totalCost: number) => {
    const message = `I have ${user.items.length} items for you:

    ${user.items.map((item) => item.name).join(", ")}
    please pay me ${totalCost}
    at this phone number: ${payer.member.phone} `;
    const url = createWpSendMessageLink(message, normalizePhoneNumber(user.phone));
    return url;
  }

  const handleSendMessage = async (user: Member, payer: Payer) => {
    let totalCost = (user.items ?? []).reduce((sum, item) => sum + item.price, 0);
    if (payer.amount_due < totalCost) {
      totalCost = payer.amount_due;
    }
    const message = formatMessage(payer, user, totalCost);

    // Open WhatsApp link first, then reduce amount due
    // const phone = payer.member.phone?.replace(/\D/g, "");
    // const encodedMessage = encodeURIComponent(message);
    await Linking.openURL(message);

    // Reduce amount due only after link is opened
    setPayers((prev) =>
      prev.map((p) => {
        if (p.member.id === payer.member.id) {
          return { ...p, amount_due: p.amount_due - totalCost };
        }
        return p;
      }),
    );
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

  const getTotalForUser = (user: Member) => {
    return user.items.reduce((sum, item) => sum + item.price, 0);
  };

  const activeItem = items[activeIndex];

  return (
    <DraxProvider>
      <View style={{ flex: 1 }}>
        {/* Items - Single card with arrow navigation */}
        <View style={{ paddingHorizontal: 20, marginBottom: 16 }}>
          <Text
            style={{
              fontSize: 14,
              fontWeight: "600",
              color: "#666666",
              marginBottom: 10,
            }}
          >
            {items.length > 0 ? `Items(${activeIndex + 1} of ${items.length})` : "Items (0 remaining)"}
          </Text>

          {items.length > 0 && activeItem ? (
            <View
              style={{
                flexDirection: "row",
                alignItems: "flex-start",
                gap: 8,
              }}
            >
              {/* Left arrow */}
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

              {/* Item card */}
              <DraxView
                key={activeItem.id}
                draggable
                dragPayload={activeItem}
                style={{
                  width: Dimensions.get("window").width - 40 - 32 - 32 - 16,
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
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "500",
                    color: "#1a1a1a",
                  }}
                  numberOfLines={1}
                >
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
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: "600",
                      color: "#1a6ee1",
                    }}
                  >
                    {activeItem.price.toFixed(2)}
                  </Text>
                  {activeItem.quantity > 1 && (
                    <View
                      style={{
                        backgroundColor: "#F0F0F0",
                        borderRadius: 6,
                        paddingHorizontal: 6,
                        paddingVertical: 2,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 11,
                          fontWeight: "600",
                          color: "#888888",
                        }}
                      >
                        ×{activeItem.quantity}
                      </Text>
                    </View>
                  )}
                </View>
              </DraxView>

              {/* Right arrow */}
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
          )
          }
        </View>

        {/* Drag hint */}
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

        {/* Members - Vertical drop zones */}
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
            const total = getTotalForUser(user);

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
                {/* User header */}
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
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: "600",
                        color: color.text,
                      }}
                    >
                      {getInitials(user.name)}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontSize: 15,
                        fontWeight: "600",
                        color: "#1a1a1a",
                      }}
                    >
                      {user.name}
                    </Text>
                    {user.items.length > 0 && (
                      <Text
                        style={{
                          fontSize: 12,
                          color: "#888888",
                          marginTop: 2,
                        }}
                      >
                        {user.items.length} {user.items.length === 1 ? "item" : "items"}
                      </Text>
                    )}
                  </View>
                  {total > 0 && (
                    <View
                      style={{
                        backgroundColor: "#F0F7FF",
                        borderRadius: 8,
                        paddingHorizontal: 10,
                        paddingVertical: 4,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 14,
                          fontWeight: "700",
                          color: "#1a6ee1",
                        }}
                      >
                        {total.toFixed(2)}
                      </Text>
                    </View>
                  )}
                </View>

                {user.phone && !isPayer(user) && (
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      paddingHorizontal: 16,
                      paddingVertical: 8,
                      gap: 12,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: "600",
                        color: "#1a1a1a",
                      }}
                    >
                      {payers.filter((p) => p.amount_due > 0).map((p) => {
                        return (
                          <Pressable
                            key={p.member.id}
                            onPress={() => {
                              handleSendMessage(user, p)
                            }}
                            style={{
                              width: 24,
                              height: 24,
                              borderRadius: 6,
                              backgroundColor: "#FEE2E2",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <Feather name="message-square" size={12} color="#EF4444" />
                          </Pressable>
                        );
                      })}

                    </Text>
                  </View>
                )
                }

                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    gap: 12,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "600",
                      color: "#1a1a1a",
                    }}
                  >
                    mark payer
                  </Text>
                  <Pressable
                    onPress={() => {
                      handleMarkPayer(user)
                    }}
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 6,
                      backgroundColor: "#FEE2E2",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Feather name="message-circle" size={12} color="#EF4444" />
                  </Pressable>
                </View>
                {/* Assigned items */}
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
                        key={`${item.id} -${itemIndex} `}
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          paddingVertical: 8,
                          borderBottomWidth: itemIndex < user.items.length - 1 ? 1 : 0,
                          borderBottomColor: "#F8F8F8",
                        }}
                      >
                        <Text
                          style={{
                            flex: 1,
                            fontSize: 14,
                            color: "#1a1a1a",
                          }}
                          numberOfLines={1}
                        >
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
                          {item.price.toFixed(2)}
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
