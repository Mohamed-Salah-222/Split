import { Assignment, Item } from "@/types";
import { createContext, ReactNode, useContext, useState } from "react";

type SessionData = {
  items: Item[];
  total: number;
  store: string | null;
  assignments: Assignment[];
};

type SessionContextValue = {
  session: SessionData | null;
  setSession: (data: Omit<SessionData, "assignments">) => void;
  updateItems: (items: Item[]) => void;
  updateTotal: (total: number) => void;
  updateAssignments: (assignments: Assignment[]) => void;
  clearSession: () => void;
};

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSessionState] = useState<SessionData | null>(null);

  const setSession = (data: Omit<SessionData, "assignments">) => {
    setSessionState({ ...data, assignments: [] });
  };

  const updateItems = (items: Item[]) => {
    setSessionState((prev) => (prev ? { ...prev, items } : null));
  };

  const updateTotal = (total: number) => {
    setSessionState((prev) => (prev ? { ...prev, total } : null));
  };

  const updateAssignments = (assignments: Assignment[]) => {
    setSessionState((prev) => (prev ? { ...prev, assignments } : null));
  };

  const clearSession = () => setSessionState(null);

  return (
    <SessionContext.Provider
      value={{
        session,
        setSession,
        updateItems,
        updateTotal,
        updateAssignments,
        clearSession,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) {
    throw new Error("useSession must be used within a SessionProvider");
  }
  return ctx;
}
