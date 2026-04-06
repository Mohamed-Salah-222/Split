import { groupStorage } from "@/storage/groups";
import type { Member } from "@/types";
import { generateId } from "@/utils/helpers";
import { useState } from "react";
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";

function FormField({ label, value, onChangeText, placeholder, keyboardType = "default", error }: { label: string; value: string; onChangeText: (t: string) => void; placeholder?: string; keyboardType?: "default" | "phone-pad"; error?: string }) {
  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={{ fontSize: 14, fontWeight: "500", color: "#111827", marginBottom: 6 }}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        keyboardType={keyboardType}
        placeholderTextColor="#9ca3af"
        style={{
          backgroundColor: "#f3f4f6",
          borderRadius: 12,
          paddingHorizontal: 16,
          paddingVertical: 12,
          fontSize: 16,
          color: "#111827",
          borderWidth: 1,
          borderColor: error ? "#ef4444" : "transparent",
        }}
      />
      {error ? <Text style={{ color: "#ef4444", fontSize: 12, marginTop: 4 }}>{error}</Text> : null}
    </View>
  );
}

function MemberRow({ member, index, onChange, onRemove, errors }: { member: Member; index: number; onChange: (index: number, field: keyof Member, value: string) => void; onRemove: (index: number) => void; errors?: Partial<Member> }) {
  return (
    <View
      style={{
        backgroundColor: "#f9fafb",
        borderRadius: 16,
        borderWidth: 1,
        borderColor: "#e5e7eb",
        padding: 16,
        marginBottom: 12,
      }}
    >
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <Text style={{ fontSize: 14, fontWeight: "600", color: "#111827" }}>Member {index + 1}</Text>
        <Pressable
          onPress={() => onRemove(index)}
          style={({ pressed }) => ({
            backgroundColor: "#fee2e2",
            borderRadius: 8,
            paddingHorizontal: 12,
            paddingVertical: 4,
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <Text style={{ color: "#dc2626", fontSize: 12, fontWeight: "500" }}>Remove</Text>
        </Pressable>
      </View>

      <FormField label="Name" value={member.name} onChangeText={(v) => onChange(index, "name", v)} placeholder="Full name" error={errors?.name} />
      <FormField label="Phone" value={member.phone} onChangeText={(v) => onChange(index, "phone", v)} placeholder="+1 555 000 0000" keyboardType="phone-pad" error={errors?.phone} />
    </View>
  );
}

export default function CreateGroupScreen() {
  const [groupName, setGroupName] = useState("");
  const [creator, setCreator] = useState("");
  const [members, setMembers] = useState<Member[]>([{ id: generateId(), name: "", phone: "", items: [] }]);
  const [memberErrors, setMemberErrors] = useState<(Partial<Member> | undefined)[]>([]);
  const [loading, setLoading] = useState(false);

  const addMember = () => setMembers((prev) => [...prev, { id: generateId(), name: "", phone: "", items: [] }]);

  const removeMember = (index: number) => {
    setMembers((prev) => prev.filter((_, i) => i !== index));
    setMemberErrors((prev) => prev.filter((_, i) => i !== index));
  };

  const updateMember = (index: number, field: keyof Member, value: string) => setMembers((prev) => prev.map((m, i) => (i === index ? { ...m, [field]: value } : m)));

  const handleCreate = async () => {
    setLoading(true);
    setMemberErrors([]);

    const result = await groupStorage.createGroup({
      name: groupName,
      creator,
      members,
      sessionCount: 0,
    });

    setLoading(false);

    if (result.error) {
      Alert.alert("Validation Error", result.error);
      return;
    }

    Alert.alert("Success", `"${result.group!.name}" created!`, [
      {
        text: "OK",
        onPress: () => {
          setGroupName("");
          setCreator("");
          setMembers([{ id: generateId(), name: "", phone: "", items: [] }]);

          setMemberErrors([]);
        },
      },
    ]);
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: "#ffffff" }} behavior={Platform.OS === "ios" ? "padding" : "height"} keyboardVerticalOffset={80}>
      <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 }}>
        <Text style={{ fontSize: 14, color: "#6b7280" }}>Organize your people</Text>
        <Text style={{ fontSize: 30, fontWeight: "700", color: "#111827" }}>Create a group</Text>
      </View>

      <ScrollView style={{ flex: 1, paddingHorizontal: 20 }} contentContainerStyle={{ paddingBottom: 120 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={{ marginBottom: 24 }}>
          <Text style={{ fontSize: 11, fontWeight: "600", color: "#9ca3af", letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 12 }}>Group Info</Text>
          <FormField label="Group name" value={groupName} onChangeText={setGroupName} placeholder="e.g. Weekend Hikers" />
          <FormField label="Your name (creator)" value={creator} onChangeText={setCreator} placeholder="e.g. Alex Johnson" />
        </View>

        <View>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <Text style={{ fontSize: 11, fontWeight: "600", color: "#9ca3af", letterSpacing: 1.2, textTransform: "uppercase" }}>Members ({members.length})</Text>
            <Pressable
              onPress={addMember}
              style={({ pressed }) => ({
                backgroundColor: "#f3f4f6",
                borderRadius: 8,
                paddingHorizontal: 12,
                paddingVertical: 6,
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <Text style={{ fontSize: 14, fontWeight: "500", color: "#111827" }}>+ Add member</Text>
            </Pressable>
          </View>

          {members.map((member, index) => (
            <MemberRow key={index} member={member} index={index} onChange={updateMember} onRemove={removeMember} errors={memberErrors[index]} />
          ))}
        </View>
      </ScrollView>

      <View
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          paddingHorizontal: 16,
          paddingTop: 12,
          paddingBottom: 16,
          backgroundColor: "#ffffff",
          borderTopWidth: 1,
          borderTopColor: "#f3f4f6",
        }}
      >
        <Pressable
          onPress={handleCreate}
          disabled={loading}
          style={({ pressed }) => ({
            backgroundColor: "#111827",
            borderRadius: 12,
            paddingVertical: 16,
            alignItems: "center",
            opacity: pressed || loading ? 0.7 : 1,
          })}
        >
          {loading ? <ActivityIndicator color="#ffffff" /> : <Text style={{ color: "#ffffff", fontWeight: "600", fontSize: 16 }}>Create group</Text>}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
