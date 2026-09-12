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
  phone: string;
  createdAt: string;
};

type Draft = {
  serviceId: string | null;
  date: string | null;
  time: string | null;
  name: string;
  phone: string;
};

type AxiomState = {
  mode: HaloMode;
  tab: Tab;
  view: View;
  messages: ChatMessage[];
  sending: boolean;
  error: string | null;
  bookings: Booking[];
  taken: string[];
  draft: Draft;
  lastBooking: Booking | null;
  lastPing: string | null;
  setMode: (mode: HaloMode) => void;
  setTab: (tab: Tab) => void;
  setView: (view: View) => void;
  patchDraft: (patch: Partial<Draft>) => void;
  clearError: () => void;
  hydrateTaken: () => Promise<void>;
  send: (text: string) => Promise<void>;
  confirmBooking: () => Promise<Booking | null>;
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

const emptyDraft: Draft = {
  serviceId: null,
  date: null,
  time: null,
  name: "",
  phone: "",
};

export const useAxiom = create<AxiomState>((set, get) => ({
  mode: "idle",
  tab: "shop",
  view: "home",
  messages: [],
  sending: false,
  error: null,
  bookings: loadBookings(),
  taken: [],
  lastBooking: null,
  lastPing: null,
  draft: emptyDraft,
  setMode: (mode) => set({ mode }),
  setTab: (tab) => set({ tab, view: "home" }),
  setView: (view) => set({ view, tab: "shop" }),
  patchDraft: (patch) => set((s) => ({ draft: { ...s.draft, ...patch } })),
  clearError: () => set({ error: null }),
  hydrateTaken: async () => {
    const { takenSlots } = await import("@/lib/desk-api");
    const taken = await takenSlots({ data: {} });
    set({ taken });
  },
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
  confirmBooking: async () => {
    const { draft, bookings } = get();
    if (!draft.serviceId || !draft.date || !draft.time || !draft.name.trim()) {
      return null;
    }
    try {
      const { placeBooking } = await import("@/lib/desk-api");
      const result = await placeBooking({
        data: {
          serviceId: draft.serviceId,
          date: draft.date,
          time: draft.time,
          name: draft.name.trim(),
          phone: draft.phone.trim(),
        },
      });
      if (!result.ok) {
        set({ error: result.error });
        return null;
      }
      const row: Booking = {
        id: result.booking.id,
        serviceId: result.booking.serviceId,
        date: result.booking.date,
        time: result.booking.time,
        name: result.booking.name,
        phone: result.booking.phone,
        createdAt: result.booking.createdAt,
      };
      const next = [...bookings, row];
      saveBookings(next);
      set((s) => ({
        bookings: next,
        taken: [...s.taken, `${row.date}T${row.time}`],
        lastBooking: row,
        lastPing: result.ping,
        mode: "speak",
        view: "home",
        error: null,
        draft: emptyDraft,
      }));
      if (typeof window !== "undefined") {
        window.setTimeout(() => {
          if (get().mode === "speak") set({ mode: "idle" });
        }, 4200);
      }
      return row;
    } catch {
      set({ error: "Could not hold that time. Try again." });
      return null;
    }
  },
}));
