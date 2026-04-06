import * as Contacts from "expo-contacts";
import { useEffect, useState } from "react";
import { Alert, FlatList, Modal, Pressable, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type ContactItem = {
  id: string;
  name: string;
  phone: string;
};

type Props = {
  visible: boolean;
  onClose: () => void;
  onSelect: (contacts: ContactItem[]) => void;
};

export default function ContactPicker({ visible, onClose, onSelect }: Props) {
  const insets = useSafeAreaInsets();
  const [contacts, setContacts] = useState<ContactItem[]>([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (visible) {
      loadContacts();
      setSearch("");
      setSelected(new Set());
    }
  }, [visible]);

  async function loadContacts() {
    setLoading(true);
    const { status } = await Contacts.requestPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Allow contacts access to pick contacts.");
      onClose();
      return;
    }

    const { data } = await Contacts.getContactsAsync({
      fields: [Contacts.Fields.PhoneNumbers, Contacts.Fields.Name],
      sort: Contacts.SortTypes.FirstName,
    });

    const mapped: ContactItem[] = data
      .filter((c) => c.name && c.phoneNumbers && c.phoneNumbers.length > 0)
      .map((c) => ({
        id: c.id || c.name || Math.random().toString(),
        name: c.name || "",
        phone: c.phoneNumbers?.[0]?.number || "",
      }));

    setContacts(mapped);
    setLoading(false);
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function handleDone() {
    const picked = contacts.filter((c) => selected.has(c.id));
    onSelect(picked);
    onClose();
  }

  const filtered = search.trim() ? contacts.filter((c) => c.name.toLowerCase().includes(search.trim().toLowerCase())) : contacts;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View
        style={{
          flex: 1,
          backgroundColor: "#F5F4ED",
          paddingTop: insets.top,
        }}
      >
        {/* Header */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            paddingHorizontal: 20,
            paddingTop: 16,
            paddingBottom: 12,
          }}
        >
          <Pressable onPress={onClose}>
            <Text style={{ fontSize: 16, color: "#888888" }}>Cancel</Text>
          </Pressable>
          <Text style={{ fontSize: 18, fontWeight: "700", color: "#1a1a1a" }}>Contacts</Text>
          <Pressable onPress={handleDone}>
            <Text
              style={{
                fontSize: 16,
                fontWeight: "600",
                color: selected.size > 0 ? "#1a6ee1" : "#CCCCCC",
              }}
            >
              Add ({selected.size})
            </Text>
          </Pressable>
        </View>

        {/* Search */}
        <View style={{ paddingHorizontal: 20, marginBottom: 8 }}>
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search contacts..."
            placeholderTextColor="#AAAAAA"
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: 12,
              paddingHorizontal: 16,
              paddingVertical: 12,
              fontSize: 16,
              color: "#1a1a1a",
              borderWidth: 1,
              borderColor: "#E5E5E5",
            }}
          />
        </View>

        {/* Contact List */}
        {loading ? (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
            <Text style={{ fontSize: 16, color: "#888888" }}>Loading contacts...</Text>
          </View>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => {
              const isSelected = selected.has(item.id);
              return (
                <Pressable
                  onPress={() => toggleSelect(item.id)}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingVertical: 14,
                    borderBottomWidth: 1,
                    borderBottomColor: "#EEEEEE",
                    gap: 12,
                  }}
                >
                  {/* Checkbox */}
                  <View
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 12,
                      borderWidth: 2,
                      borderColor: isSelected ? "#1a6ee1" : "#CCCCCC",
                      backgroundColor: isSelected ? "#1a6ee1" : "transparent",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {isSelected && (
                      <Text
                        style={{
                          color: "#FFFFFF",
                          fontSize: 14,
                          fontWeight: "700",
                          lineHeight: 16,
                        }}
                      >
                        ✓
                      </Text>
                    )}
                  </View>

                  {/* Contact Info */}
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: "500",
                        color: "#1a1a1a",
                      }}
                    >
                      {item.name}
                    </Text>
                    <Text
                      style={{
                        fontSize: 13,
                        color: "#888888",
                        marginTop: 2,
                      }}
                    >
                      {item.phone}
                    </Text>
                  </View>
                </Pressable>
              );
            }}
            ListEmptyComponent={
              <View
                style={{
                  alignItems: "center",
                  justifyContent: "center",
                  paddingTop: 60,
                }}
              >
                <Text style={{ fontSize: 16, color: "#888888" }}>{search.trim() ? "No contacts match your search" : "No contacts found"}</Text>
              </View>
            }
          />
        )}
      </View>
    </Modal>
  );
}
