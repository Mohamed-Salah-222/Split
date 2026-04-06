import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { DraxProvider, DraxView } from "react-native-drax";
import { Item, Member } from "../types";
import { useEffect } from "react";

const initialItems: Item[] = [
  { id: "1", name: "Apple", price: 10, quantity: 2 },
  { id: "2", name: "Milk", price: 20, quantity: 1 },
  { id: "3", name: "Bread", price: 15, quantity: 3 },
  { id: "4", name: "Eggs", price: 30, quantity: 1 },
];


export default function DragDrop(props: { items: Item[], members: Member[] }) {
  const [items, setItems] = useState<Item[]>(props.items);
  const [users, setUsers] = useState<Member[]>(props.members);
  console.log("items: here :", items);
  useEffect(() => {
    setUsers(props.members);
    setItems(props.items ?? []);
  }, [props.members, props.items]);
  // HACK: find a better way to handle this // maybe just create the user with empty items array // or don't filter items too early
  users.forEach((user) => {
    if (user.items === undefined) {
      user.items = [];
    }
  });

  const handleDrop = (userId: string, item: Item) => {
    setUsers((prev) =>
      prev.map((user) =>
        user.id === userId ? { ...user, items: [...user.items, item] } : user,
      ),
    );
    setItems(
      (prev) =>
        prev
          .map((i) =>
            i.id === item.id ? { ...i, quantity: i.quantity - 1 } : i,
          )
          .filter((i) => i.quantity > 0), // Hide items with 0 quantity
    );
  };

  return (
    <DraxProvider>
      <View style={styles.container}>
        {/* Items */}
        <View>
          <Text>Items</Text>
          {items.map((item) => (
            <DraxView
              key={item.id}
              style={styles.item}
              draggable
              dragPayload={item}
            >
              <Text>{item.name}</Text>
              <Text style={{ fontSize: 12 }}>×{item.quantity}</Text>
            </DraxView>
          ))}
        </View>

        {/* Users */}
        <View>
          <Text>Users</Text>
          {users.map((user) => (
            <DraxView
              key={user.id}
              style={styles.user}
              receptive
              onReceiveDragDrop={(event) => {
                const draggedItem = event.dragged.payload as Item;
                handleDrop(user.id, draggedItem);
              }}
            >
              <Text>{user.name}</Text>

              {user.items.map((item) => (
                <Text key={item.id}>• {item.name}</Text>
              ))}
            </DraxView>
          ))}
        </View>
      </View>
    </DraxProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    flexDirection: "row",
    justifyContent: "space-around",
  },
  item: {
    padding: 15,
    backgroundColor: "#ddd",
    margin: 5,
  },
  user: {
    padding: 20,
    backgroundColor: "#cde",
    margin: 10,
    minWidth: 120,
  },
});
