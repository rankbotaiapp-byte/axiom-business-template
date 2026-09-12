import { create } from "zustand";
import { business } from "@/config/business";

export type HaloMode = "idle" | "listen" | "think" | "speak";
export type Tab = "shop" | "studio";
export type View = "home" | "services" | "hours" | "book" | "ask";
export type ChatRole = "user" | "axiom";

export type ChatMessage = {
  id: string;
  role: ChatRole;
  text: string;
};

export type Booking = {
  id: string;
  serviceId: string;
  date: string;
  time: string;
  name: string;
  createdAt: string;
};

type Draft = {
  serviceId: string | null;
  date: string | null;
  time: string | null;
  name: string;
};

type AxiomState = {
  mode: HaloMode;
  tab: Tab;
  view: View;
  messages: ChatMessage[];
  sending: boolean;
  error: string | null;
  bookings: Booking[];
  draft: Draft;
  lastBooking: Booking | null;
  setMode: (mode: HaloMode) => void;
  setTab: (tab: Tab) => void;
  setView: (view: View) => void;
  patchDraft: (patch: Partial<Draft>) => void;
  clearError: () => void;
  send: (text: string) => Promise<void>;
  confirmBooking: () => Booking | null;
};

function nid() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

const KEY = `axiom-bookings:${business.name}`;

function loadBookings(): Booking[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Booking[]) : [];
  } catch {
    return [];
  }
}

function saveBookings(rows: Booking[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(rows));
}

export const useAxiom = create<AxiomState>((set, get) => ({
  mode: "idle",
  tab: "shop",
  view: "home",
  messages: [],
  sending: false,
  error: null,
  bookings: loadBookings(),
  lastBooking: null,
  draft: { serviceId: null, date: null, time: null, name: "" },
  setMode: (mode) => set({ mode }),
  setTab: (tab) => set({ tab, view: "home" }),
  setView: (view) => set({ view, tab: "shop" }),
  patchDraft: (patch) => set((s) => ({ draft: { ...s.draft, ...patch } })),
  clearError: () => set({ error: null }),
  send: async (raw) => {
    const text = raw.trim();
    if (!text || get().sending) return;

    const userMsg: ChatMessage = { id: nid(), role: "user", text };
    set((s) => ({
      messages: [...s.messages, userMsg],
      sending: true,
      mode: "think",
      error: null,
      view: "ask",
      tab: "shop",
    }));

    try {
      const { askAxiom } = await import("@/lib/ask-axiom");
      const history = get()
        .messages.slice(-8)
        .map((m) => ({ role: m.role, text: m.text }));

      const result = await askAxiom({ data: { messages: history } });

      if (result.ok) {
        set((s) => ({
          messages: [
            ...s.messages,
            { id: nid(), role: "axiom", text: result.text },
          ],
          sending: false,
          mode: "speak",
        }));
        if (typeof window !== "undefined") {
          window.setTimeout(() => {
            if (get().mode === "speak" && !get().sending) set({ mode: "idle" });
          }, 3600);
        }
      } else {
        set({ sending: false, mode: "idle", error: result.error });
      }
    } catch {
      set({
        sending: false,
        mode: "idle",
        error: `${business.axiomName} could not reach the desk.`,
      });
    }
  },
  confirmBooking: () => {
    const { draft, bookings } = get();
    if (!draft.serviceId || !draft.date || !draft.time || !draft.name.trim()) {
      return null;
    }
    const row: Booking = {
      id: nid(),
      serviceId: draft.serviceId,
      date: draft.date,
      time: draft.time,
      name: draft.name.trim().slice(0, 80),
      createdAt: new Date().toISOString(),
    };
    const next = [...bookings, row];
    saveBookings(next);
    set({
      bookings: next,
      lastBooking: row,
      mode: "speak",
      view: "home",
      draft: { serviceId: null, date: null, time: null, name: "" },
    });
    if (typeof window !== "undefined") {
      window.setTimeout(() => {
        if (get().mode === "speak") set({ mode: "idle" });
      }, 4200);
    }
    return row;
  },
}));
