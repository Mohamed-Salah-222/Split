import { Session } from "@/types";
import { generateId } from "@/utils/helpers";
import AsyncStorage from "@react-native-async-storage/async-storage";

const SESSIONS_KEY = "splitly_sessions";

async function getSessions(): Promise<Session[]> {
  const data = await AsyncStorage.getItem(SESSIONS_KEY);
  if (!data) return [];
  return JSON.parse(data) as Session[];
}

async function getSessionsByGroupId(groupId: string): Promise<Session[]> {
  const sessions = await getSessions();
  return sessions.filter((s) => s.groupId === groupId);
}

async function getSessionById(id: string): Promise<Session | null> {
  const sessions = await getSessions();
  return sessions.find((s) => s.id === id) || null;
}

async function createSession(input: Omit<Session, "id" | "createdAt">): Promise<{ session?: Session; error?: string }> {
  if (!input.groupId) return { error: "groupId is required" };
  if (!input.payerId) return { error: "payerId is required" };
  if (!Array.isArray(input.assignments)) return { error: "assignments must be an array" };

  const newSession: Session = {
    id: generateId(),
    createdAt: new Date().toISOString(),
    ...input,
  };

  const sessions = await getSessions();
  sessions.push(newSession);
  await AsyncStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));

  return { session: newSession };
}

async function updateSession(id: string, updates: Partial<Session>): Promise<{ session?: Session; error?: string }> {
  const sessions = await getSessions();
  const index = sessions.findIndex((s) => s.id === id);

  if (index === -1) return { error: "Session not found" };

  sessions[index] = { ...sessions[index], ...updates };
  await AsyncStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));

  return { session: sessions[index] };
}

async function deleteSession(id: string): Promise<{ error?: string }> {
  const sessions = await getSessions();
  const filtered = sessions.filter((s) => s.id !== id);

  if (filtered.length === sessions.length) return { error: "Session not found" };

  await AsyncStorage.setItem(SESSIONS_KEY, JSON.stringify(filtered));
  return {};
}

export const sessionStorage = {
  getSessions,
  getSessionsByGroupId,
  getSessionById,
  createSession,
  updateSession,
  deleteSession,
};
