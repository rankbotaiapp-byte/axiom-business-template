"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { persistWorkspaceAction } from "@/lib/data/actions";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createBrowserSupabase } from "@/lib/supabase/client";
import type { AppState } from "@/types";

import { emptyState, loadState, saveState } from "./app-store";

type AppContextValue = {
  state: AppState;
  hydrated: boolean;
  persistError: string | null;
  remote: boolean;
  userId: string | null;
  commit: (updater: (current: AppState) => AppState) => AppState;
};

const AppContext = createContext<AppContextValue | null>(null);

function bindUser(state: AppState, userId: string): AppState {
  return {
    ...state,
    profile: state.profile ? { ...state.profile, id: userId } : state.profile,
    visions: state.visions.map((vision) => ({ ...vision, userId })),
  };
}

export function AppProvider({
  children,
  initial,
}: {
  children: ReactNode;
  initial?: { userId: string; state: AppState } | null;
}) {
  const remote = isSupabaseConfigured();
  const [state, setState] = useState<AppState>(initial?.state ?? emptyState);
  const [userId, setUserId] = useState<string | null>(initial?.userId ?? null);
  const [hydrated, setHydrated] = useState(Boolean(initial));
  const [persistError, setPersistError] = useState<string | null>(null);
  const persistChain = useRef(Promise.resolve());

  useEffect(() => {
    if (initial) {
      setState(initial.state);
      setUserId(initial.userId);
      setHydrated(true);
    }
  }, [initial]);

  useEffect(() => {
    if (!remote) {
      setState(loadState());
      setHydrated(true);
      return;
    }

    if (!initial) setHydrated(true);

    const supabase = createBrowserSupabase();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "INITIAL_SESSION") return;
      if (!session?.user) {
        setUserId(null);
        setState(emptyState());
        return;
      }
      setUserId(session.user.id);
    });

    return () => subscription.unsubscribe();
  }, [remote]);

  const commit = useCallback(
    (updater: (current: AppState) => AppState) => {
      let next = emptyState();
      setState((current) => {
        next = updater(current);
        if (userId) next = bindUser(next, userId);
        if (!remote) saveState(next);
        return next;
      });
      if (remote && userId) {
        persistChain.current = persistChain.current
          .then(async () => {
            const result = await persistWorkspaceAction(next);
            setPersistError(result.ok ? null : result.error);
          })
          .catch((error: unknown) => {
            setPersistError(error instanceof Error ? error.message : "The record could not be written.");
          });
      }
      return next;
    },
    [remote, userId]
  );

  const value = useMemo<AppContextValue>(
    () => ({ state, hydrated, persistError, remote, userId, commit }),
    [commit, hydrated, persistError, remote, state, userId]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp requires AppProvider.");
  }
  return context;
}
