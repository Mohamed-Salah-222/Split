import ContactPicker from "@/components/ContactPicker";
import { groupStorage } from "@/storage/groups";
import { Member } from "@/types";
import { Feather } from "@expo/vector-icons";
import BottomSheet, { BottomSheetBackdrop, BottomSheetScrollView, BottomSheetTextInput } from "@gorhom/bottom-sheet";
import { forwardRef, useCallback, useEffect, useMemo, useState } from "react";
import { Alert, BackHandler, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type MemberRow = {
  id: string;
  name: string;
  phone: string;
};

function createEmptyMember(): MemberRow {
  return {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2),
    name: "",
    phone: "",
  };
}

type Props = {
  onCreated: () => void;
  onClose: () => void;
};

const CreateGroupSheet = forwardRef<BottomSheet, Props>(({ onCreated, onClose }, ref) => {
  const insets = useSafeAreaInsets();
  const snapPoints = useMemo(() => ["85%"], []);

  const [groupName, setGroupName] = useState("");
  const [members, setMembers] = useState<MemberRow[]>([createEmptyMember(), createEmptyMember(), createEmptyMember()]);
  const [loading, setLoading] = useState(false);
  const [contactPickerVisible, setContactPickerVisible] = useState(false);

  useEffect(() => {
    const backHandler = BackHandler.addEventListener("hardwareBackPress", () => {
      if (typeof ref === "object" && ref?.current) {
        ref.current.close();
        return true; // prevents default back behavior
      }
      return false;
    });

    return () => backHandler.remove();
  }, [ref]);

  function resetForm() {
    setGroupName("");
    setMembers([createEmptyMember(), createEmptyMember(), createEmptyMember()]);
  }

  function sanitizePhone(raw: string): string {
    //* 34an lw fe 7d mt5lf by save el numbers b +2
    //* most likely slta 34an hwa mn 7wary california
    let cleaned = raw.replace(/[^\d+]/g, "");
    if (cleaned.startsWith("+2")) {
      cleaned = cleaned.slice(2);
    }
    cleaned = cleaned.replace(/\D/g, "");
    return cleaned;
  }

  function updateMember(id: string, field: "name" | "phone", value: string) {
    if (field === "phone") {
      const processed = sanitizePhone(value);
      if (processed.length > 11) return;
      setMembers((prev) => prev.map((m) => (m.id === id ? { ...m, phone: processed } : m)));
    } else {
      setMembers((prev) => prev.map((m) => (m.id === id ? { ...m, name: value } : m)));
    }
  }

  function removeMember(id: string) {
    if (members.length <= 1) return;
    setMembers((prev) => prev.filter((m) => m.id !== id));
  }

  function addEmptyMember() {
    setMembers((prev) => [...prev, createEmptyMember()]);
  }

  function handleContactsSelected(contacts: { id: string; name: string; phone: string }[]) {
    setMembers((prev) => {
      const updated = [...prev];
      let contactIndex = 0;

      for (let i = 0; i < updated.length && contactIndex < contacts.length; i++) {
        if (updated[i].name.trim() === "" && updated[i].phone.trim() === "") {
          updated[i] = {
            ...updated[i],
            name: contacts[contactIndex].name,
            phone: sanitizePhone(contacts[contactIndex].phone),
          };
          contactIndex++;
        }
      }

      while (contactIndex < contacts.length) {
        updated.push({
          id: Date.now().toString(36) + Math.random().toString(36).slice(2) + contacts[contactIndex].id,
          name: contacts[contactIndex].name,
          phone: sanitizePhone(contacts[contactIndex].phone),
        });
        contactIndex++;
      }

      return updated;
    });
  }

  function findDuplicates(): string | null {
    const filledMembers = members.filter((m) => m.name.trim() !== "");

    const names = filledMembers.map((m) => m.name.trim().toLowerCase());
    for (let i = 0; i < names.length; i++) {
      for (let j = i + 1; j < names.length; j++) {
        if (names[i] === names[j]) {
          return `Duplicate name: "${filledMembers[i].name.trim()}"`;
        }
      }
    }

    const phones = filledMembers.filter((m) => m.phone.trim() !== "").map((m) => m.phone.trim());
    for (let i = 0; i < phones.length; i++) {
      for (let j = i + 1; j < phones.length; j++) {
        if (phones[i] === phones[j]) {
          return `Duplicate phone: "${phones[i]}"`;
        }
      }
    }

    return null;
  }

  async function handleCreate() {
    const trimmedName = groupName.trim();
    if (!trimmedName) {
      Alert.alert("Missing name", "Enter a group name.");
      return;
    }

    const validMembers: Member[] = members
      .filter((m) => m.name.trim() !== "")
      .map((m) => ({
        id: Date.now().toString(36) + Math.random().toString(36).slice(2),
        name: m.name.trim(),
        phone: m.phone.trim(),
        items: [],
      }));

    if (validMembers.length === 0) {
      Alert.alert("No members", "Add at least one member with a name.");
      return;
    }

    const duplicateError = findDuplicates();
    if (duplicateError) {
      Alert.alert("Duplicate found", duplicateError);
      return;
    }

    setLoading(true);
    const { error } = await groupStorage.createGroup({
      name: trimmedName,
      creator: "Me",
      members: validMembers,
      sessionCount: 0,
    });
    setLoading(false);

    if (error) {
      Alert.alert("Error", error);
      return;
    }

    resetForm();
    onCreated();
  }

  const renderBackdrop = useCallback((props: any) => <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.5} />, []);

  return (
    <>
      <BottomSheet
        ref={ref}
        index={0}
        snapPoints={snapPoints}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        backgroundStyle={{ backgroundColor: "#F5F4ED" }}
        handleIndicatorStyle={{ backgroundColor: "#CCCCCC", width: 40 }}
        topInset={insets.top}
        onChange={(index) => {
          if (index === -1) {
            resetForm();
            onClose();
          }
        }}
      >
        <BottomSheetScrollView
          contentContainerStyle={{
            padding: 20,
            paddingBottom: insets.bottom + 40,
          }}
          keyboardShouldPersistTaps="handled"
          overScrollMode="always"
          nestedScrollEnabled={true}
        >
          {/* Title */}
          <Text
            style={{
              fontSize: 24,
              fontWeight: "700",
              color: "#1a1a1a",
              marginBottom: 24,
            }}
          >
            New Group
          </Text>

          {/* Group Name */}
          <Text
            style={{
              fontSize: 14,
              fontWeight: "600",
              color: "#666666",
              marginBottom: 8,
            }}
          >
            Group name
          </Text>
          <BottomSheetTextInput
            value={groupName}
            onChangeText={setGroupName}
            placeholder="e.g. Friday dinner crew"
            placeholderTextColor="#AAAAAA"
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: 12,
              paddingHorizontal: 16,
              paddingVertical: 14,
              fontSize: 16,
              color: "#1a1a1a",
              borderWidth: 1,
              borderColor: "#E5E5E5",
              marginBottom: 24,
            }}
          />

          {/* Members */}
          <Text
            style={{
              fontSize: 14,
              fontWeight: "600",
              color: "#666666",
              marginBottom: 12,
            }}
          >
            Members
          </Text>

          {members.map((member) => (
            <View
              key={member.id}
              style={{
                flexDirection: "row",
                gap: 8,
                marginBottom: 10,
                alignItems: "stretch",
              }}
            >
              <BottomSheetTextInput
                value={member.name}
                onChangeText={(v) => updateMember(member.id, "name", v)}
                placeholder="Name"
                placeholderTextColor="#AAAAAA"
                style={{
                  flex: 3,
                  backgroundColor: "#FFFFFF",
                  borderRadius: 12,
                  paddingHorizontal: 14,
                  paddingVertical: 12,
                  fontSize: 15,
                  color: "#1a1a1a",
                  borderWidth: 1,
                  borderColor: "#E5E5E5",
                }}
              />
              <BottomSheetTextInput
                value={member.phone}
                onChangeText={(v) => updateMember(member.id, "phone", v)}
                placeholder="Phone"
                placeholderTextColor="#AAAAAA"
                keyboardType="phone-pad"
                style={{
                  flex: 4,
                  backgroundColor: "#FFFFFF",
                  borderRadius: 12,
                  paddingHorizontal: 14,
                  paddingVertical: 12,
                  fontSize: 15,
                  color: "#1a1a1a",
                  borderWidth: 1,
                  borderColor: "#E5E5E5",
                }}
              />
              {members.length > 1 && (
                <Pressable
                  onPress={() => removeMember(member.id)}
                  style={{
                    width: 44,
                    borderRadius: 12,
                    backgroundColor: "#FEE2E2",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Feather name="x" size={16} color="#EF4444" />
                </Pressable>
              )}
            </View>
          ))}

          {/* Add member buttons */}
          <View
            style={{
              flexDirection: "row",
              gap: 10,
              marginTop: 8,
              marginBottom: 32,
            }}
          >
            <Pressable
              onPress={addEmptyMember}
              style={{
                flex: 1,
                flexDirection: "row",
                gap: 6,
                paddingVertical: 12,
                borderRadius: 12,
                borderWidth: 1.5,
                borderColor: "#1a1a1a",
                borderStyle: "dashed",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Feather name="plus" size={16} color="#1a1a1a" />
              <Text style={{ color: "#1a1a1a", fontWeight: "600", fontSize: 14 }}>Add member</Text>
            </Pressable>
            <Pressable
              onPress={() => setContactPickerVisible(true)}
              style={{
                flex: 1,
                flexDirection: "row",
                gap: 6,
                paddingVertical: 12,
                borderRadius: 12,
                borderWidth: 1.5,
                borderColor: "#1a1a1a",
                borderStyle: "dashed",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Feather name="book-open" size={16} color="#1a1a1a" />
              <Text style={{ color: "#1a1a1a", fontWeight: "600", fontSize: 14 }}>Contacts</Text>
            </Pressable>
          </View>

          {/* Create Button */}
          <Pressable
            onPress={handleCreate}
            disabled={loading}
            style={{
              backgroundColor: "#1a1a1a",
              borderRadius: 14,
              paddingVertical: 16,
              alignItems: "center",
              opacity: loading ? 0.6 : 1,
            }}
          >
            <Text style={{ color: "#F5F4ED", fontWeight: "600", fontSize: 16 }}>{loading ? "Creating..." : "Create group"}</Text>
          </Pressable>
        </BottomSheetScrollView>
      </BottomSheet>

      <ContactPicker visible={contactPickerVisible} onClose={() => setContactPickerVisible(false)} onSelect={handleContactsSelected} />
    </>
  );
});

CreateGroupSheet.displayName = "CreateGroupSheet";

export default CreateGroupSheet;
