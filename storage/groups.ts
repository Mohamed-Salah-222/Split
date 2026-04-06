import AsyncStorage from "@react-native-async-storage/async-storage";
import { Group, CreateGroupInput, Member } from "@/types";
import { generateId } from "@/utils/helpers";

const GROUPS_KEY = "splitly_groups";

function validate(input: CreateGroupInput): string | null {
  if (!input.name || !input.creator || !Array.isArray(input.members)) {
    return "name, creator, and members array are required";
  }

  for (let i = 0; i < input.members.length; i++) {
    const member: Member = input.members[i];
    if (!member.name || !member.phone) {
      return `Each member must have name and phone (index ${i})`;
    }
  }

  return null;
}


async function getGroups(): Promise<Group[]> {
  const data = await AsyncStorage.getItem(GROUPS_KEY);
  if (!data) return [];
  return JSON.parse(data) as Group[];
}


async function getGroupById(id: string): Promise<Group | null> {
  const groups = await getGroups();
  return groups.find((g) => g.id === id) || null;
}


async function createGroup(input: CreateGroupInput): Promise<{ group?: Group; error?: string }> {
  const error = validate(input);
  if (error) return { error };

  const newGroup: Group = {
    id: generateId(),
    name: input.name,
    creator: input.creator,
    members: input.members,
    createdAt: new Date().toISOString(),
    sessionCount: input.sessionCount,
  };

  const groups = await getGroups();
  groups.push(newGroup);
  await AsyncStorage.setItem(GROUPS_KEY, JSON.stringify(groups));

  return { group: newGroup };
}


async function updateGroup(id: string, updates: Partial<CreateGroupInput>): Promise<{ group?: Group; error?: string }> {
  const groups = await getGroups();
  const index = groups.findIndex((g) => g.id === id);

  if (index === -1) return { error: "Group not found" };

  const group = groups[index];

  if (updates.name) group.name = updates.name;
  if (updates.creator) group.creator = updates.creator;
  if (updates.members) {

    const input = {
      name: group.name,
      creator: group.creator,
      members: updates.members,
      sessionCount: group.sessionCount,
    } as CreateGroupInput;

    const error = validate(input)
    if (error) return { error };
    group.members = updates.members;
  }

  groups[index] = group;
  await AsyncStorage.setItem(GROUPS_KEY, JSON.stringify(groups));

  return { group };
}


async function deleteGroup(id: string): Promise<{ group?: Group; error?: string }> {
  const groups = await getGroups();
  const index = groups.findIndex((g) => g.id === id);

  if (index === -1) return { error: "Group not found" };

  const deleted = groups.splice(index, 1)[0];
  await AsyncStorage.setItem(GROUPS_KEY, JSON.stringify(groups));

  return { group: deleted };
}

export const groupStorage = {
  getGroups,
  getGroupById,
  createGroup,
  updateGroup,
  deleteGroup,
};
