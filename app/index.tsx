import CreateGroupSheet from "@/components/CreateGroupSheet";
import DeleteGroupModal from "@/components/DeleteGroupModal";
import GroupCard from "@/components/GroupCard";
import { groupStorage } from "@/storage/groups";
import { Group } from "@/types";
import BottomSheet from "@gorhom/bottom-sheet";
import { useFocusEffect } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { FlatList, Pressable, Text, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Rect } from "react-native-svg";

type LayoutMode = "list" | "grid";

function ListIcon({ active }: { active: boolean }) {
  const color = active ? "#FFFFFF" : "#888888";
  return (
    <Svg width={16} height={16} viewBox="0 0 16 16">
      <Rect x={1} y={2} width={14} height={2.5} rx={1} fill={color} />
      <Rect x={1} y={6.75} width={14} height={2.5} rx={1} fill={color} />
      <Rect x={1} y={11.5} width={14} height={2.5} rx={1} fill={color} />
    </Svg>
  );
}

function GridIcon({ active }: { active: boolean }) {
  const color = active ? "#FFFFFF" : "#888888";
  return (
    <Svg width={16} height={16} viewBox="0 0 16 16">
      <Rect x={1} y={1} width={6} height={6} rx={1.5} fill={color} />
      <Rect x={9} y={1} width={6} height={6} rx={1.5} fill={color} />
      <Rect x={1} y={9} width={6} height={6} rx={1.5} fill={color} />
      <Rect x={9} y={9} width={6} height={6} rx={1.5} fill={color} />
    </Svg>
  );
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const [layout, setLayout] = useState<LayoutMode>("grid");
  const [groups, setGroups] = useState<Group[]>([]);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Group | null>(null);
  const sheetRef = useRef<BottomSheet>(null);

  // Toggle animation
  const pillPosition = useSharedValue(1);

  const pillStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: withTiming(pillPosition.value * 28, { duration: 250 }) }],
    };
  });

  function switchLayout(mode: LayoutMode) {
    setLayout(mode);
    pillPosition.value = mode === "list" ? 0 : 1;
  }

  // Reload groups every time the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadGroups();
    }, []),
  );

  async function loadGroups() {
    const data = await groupStorage.getGroups();
    setGroups(data);
  }

  function handleOpenSheet() {
    setSheetOpen(true);
  }

  function handleGroupCreated() {
    sheetRef.current?.close();
    loadGroups();
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    await groupStorage.deleteGroup(deleteTarget.id);
    setDeleteTarget(null);
    loadGroups();
  }

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="px-5 pt-4 pb-3">
        <View className="flex-row justify-between items-center mb-1">
          <Text className="text-sm text-muted-foreground">Welcome back</Text>

          {/* Layout Toggle */}
          <View className="flex-row p-0.5 bg-card rounded-lg border border-border">
            <Animated.View
              className="bg-foreground"
              style={[
                {
                  position: "absolute",
                  top: 2,
                  left: 2,
                  bottom: 2,
                  width: 28,
                  borderRadius: 6,
                },
                pillStyle,
              ]}
            />
            <Pressable className="w-7 items-center justify-center py-1 z-10" onPress={() => switchLayout("list")}>
              <ListIcon active={layout === "list"} />
            </Pressable>
            <Pressable className="w-7 items-center justify-center py-1 z-10" onPress={() => switchLayout("grid")}>
              <GridIcon active={layout === "grid"} />
            </Pressable>
          </View>
        </View>
        <Text className="text-3xl font-bold text-foreground">My groups</Text>
      </View>

      {/* Groups List/Grid */}
      <FlatList
        key={layout}
        data={groups}
        keyExtractor={(item) => item.id}
        numColumns={layout === "grid" ? 2 : 1}
        columnWrapperStyle={layout === "grid" ? { gap: 8, paddingHorizontal: 16 } : undefined}
        contentContainerStyle={layout === "grid" ? { gap: 8, paddingBottom: 100 } : { paddingHorizontal: 16, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) =>
          layout === "grid" ? (
            <View className="flex-1">
              <GroupCard group={item} layout="grid" onLongPress={() => setDeleteTarget(item)} />
            </View>
          ) : (
            <GroupCard group={item} layout="list" onLongPress={() => setDeleteTarget(item)} />
          )
        }
        ListEmptyComponent={
          <View className="items-center justify-center py-20">
            <Text className="text-lg text-muted-foreground">No groups yet</Text>
            <Text className="text-sm text-muted-foreground mt-1 text-center">Create your first group to start splitting</Text>
          </View>
        }
      />

      {/* Create Button */}
      <View className="absolute bottom-0 left-0 right-0 px-4" style={{ paddingBottom: insets.bottom + 16 }}>
        <Pressable className="bg-foreground rounded-xl py-4 items-center active:opacity-80" onPress={handleOpenSheet}>
          <Text className="text-background font-semibold text-base">+ Create new group</Text>
        </Pressable>
      </View>

      {/* Create Group Bottom Sheet */}
      {sheetOpen ? <CreateGroupSheet ref={sheetRef} onCreated={handleGroupCreated} onClose={() => setSheetOpen(false)} /> : null}

      {/* Delete Confirmation Modal */}
      <DeleteGroupModal visible={deleteTarget !== null} groupName={deleteTarget?.name ?? ""} onConfirm={handleDeleteConfirm} onCancel={() => setDeleteTarget(null)} />
    </View>
  );
}
