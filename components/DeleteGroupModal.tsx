import { Modal, Pressable, Text, View } from "react-native";

type Props = {
  visible: boolean;
  groupName: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function DeleteGroupModal({ visible, groupName, onConfirm, onCancel }: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <Pressable
        onPress={onCancel}
        style={{
          flex: 1,
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          justifyContent: "center",
          alignItems: "center",
          padding: 32,
        }}
      >
        <Pressable
          onPress={(e) => e.stopPropagation()}
          style={{
            backgroundColor: "#F5F4ED",
            borderRadius: 20,
            padding: 24,
            width: "100%",
            maxWidth: 320,
          }}
        >
          <Text
            style={{
              fontSize: 18,
              fontWeight: "700",
              color: "#1a1a1a",
              textAlign: "center",
              marginBottom: 8,
            }}
          >
            Delete group?
          </Text>

          <Text
            style={{
              fontSize: 14,
              color: "#666666",
              textAlign: "center",
              marginBottom: 24,
              lineHeight: 20,
            }}
          >
            "{groupName}" and all its sessions will be permanently deleted
          </Text>

          {/* Buttons */}
          <View style={{ flexDirection: "row", gap: 10 }}>
            <Pressable
              onPress={onCancel}
              style={{
                flex: 1,
                paddingVertical: 14,
                borderRadius: 12,
                borderWidth: 1.5,
                borderColor: "#E5E5E5",
                alignItems: "center",
              }}
            >
              <Text style={{ color: "#1a1a1a", fontWeight: "600", fontSize: 15 }}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={onConfirm}
              style={{
                flex: 1,
                paddingVertical: 14,
                borderRadius: 12,
                backgroundColor: "#EF4444",
                alignItems: "center",
              }}
            >
              <Text style={{ color: "#FFFFFF", fontWeight: "600", fontSize: 15 }}>Delete</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
