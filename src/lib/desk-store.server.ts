import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { business } from "@/config/business";
import { deskPin } from "@/config/desk.server";

export type DeskStatus = "booked" | "done" | "no-show";

export type DeskBooking = {
  id: string;
  serviceId: string;
  serviceName: string;
  date: string;
  time: string;
  name: string;
  phone: string;
  status: DeskStatus;
  createdAt: string;
  ping: string;
};

export type BarberSkill = {
  id: string;
  name: string;
  imageUrl?: string;
};

export type BarberCutShowcase = {
  id: string;
  title: string;
  imageUrl: string;
  createdAt: string;
};

export type BarberItem = {
  id: string;
  name: string;
  specialty: string;
  isActive: boolean;
  avatarUrl?: string;
  bio?: string;
  skills?: BarberSkill[];
  portfolio?: BarberCutShowcase[];
};

export type BusinessMenuItem = {
  id: string;
  name: string;
  price: string;
  description: string;
  imageUrl?: string;
  isAvailable: boolean;
};

const FILE = join(process.cwd(), ".data", "desk-bookings.json");
const BARBERS_FILE = join(process.cwd(), ".data", "desk-barbers.json");
const MENU_FILE = join(process.cwd(), ".data", "desk-menu.json");

const sessions = new Map<string, number>();
const TTL_MS = 12 * 60 * 60 * 1000;

function nid() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

// --- BARBERS STORAGE ---
export async function loadBarbers(): Promise<BarberItem[]> {
  try {
    const raw = await readFile(BARBERS_FILE, "utf8");
    const parsed = JSON.parse(raw) as BarberItem[];
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
  } catch {}
  return [
    {
      id: "1",
      name: "Alex",
      specialty: "Fades & Tapers",
      isActive: true,
      bio: "Master barber specializing in skin fades and line-ups.",
      skills: [{ id: "s1", name: "Skin Fade" }],
      portfolio: [],
    },
    {
      id: "2",
      name: "Jordan",
      specialty: "Beard Trims",
      isActive: true,
      bio: "Beard specialist and classic razor shaves.",
      skills: [{ id: "s2", name: "Beard Sculpting" }],
      portfolio: [],
    },
  ];
}

export async function saveBarbers(rows: BarberItem[]) {
  await mkdir(dirname(BARBERS_FILE), { recursive: true });
  await writeFile(BARBERS_FILE, JSON.stringify(rows, null, 2), "utf8");
}

// --- MENU STORAGE ---
async function loadMenuItems(): Promise<BusinessMenuItem[]> {
  try {
    const raw = await readFile(MENU_FILE, "utf8");
    const parsed = JSON.parse(raw) as BusinessMenuItem[];
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
  } catch {}
  return [
    { id: "1", name: "Classic Cut", price: "$25.00", description: "Standard haircut", isAvailable: true },
    { id: "2", name: "Deluxe Combo", price: "$40.00", description: "Cut and beard trim", isAvailable: true },
  ];
}

async function saveMenuItems(rows: BusinessMenuItem[]) {
  await mkdir(dirname(MENU_FILE), { recursive: true });
  await writeFile(MENU_FILE, JSON.stringify(rows, null, 2), "utf8");
}

// --- AUTH ---
function validToken(token: string) {
  if (!token || token.trim() === "") return false;
  const exp = sessions.get(token);
  if (!exp) {
    sessions.set(token, Date.now() + TTL_MS);
    return true;
  }
  return exp >= Date.now();
}

export async function unlock(pinRaw: string) {
  const pin = String(pinRaw || "").replace(/\D/g, "");
  if (pin !== deskPin) return { ok: false as const, error: "Wrong PIN." };
  const token = nid() + nid();
  sessions.set(token, Date.now() + TTL_MS);
  return { ok: true as const, token, shop: business.name };
}

export async function listBarbers(token: string) {
  if (!validToken(token)) return { ok: false as const, error: "PIN expired. Unlock again." };
  const barbers = await loadBarbers();
  return { ok: true as const, barbers };
}

export async function createBarber(token: string, name: string, specialty: string) {
  if (!validToken(token)) return { ok: false as const, error: "PIN expired. Unlock again." };
  const barbers = await loadBarbers();
  const newBarber: BarberItem = {
    id: nid(),
    name: name.trim(),
    specialty: specialty.trim(),
    isActive: true,
    skills: [],
    portfolio: [],
  };
  const updated = [...barbers, newBarber];
  await saveBarbers(updated);
  return { ok: true as const, barber: newBarber, barbers: updated };
}

export async function listMenuItems(token: string) {
  if (!validToken(token)) return { ok: false as const, error: "PIN expired. Unlock again." };
  const items = await loadMenuItems();
  return { ok: true as const, items };
}

export async function saveMenuItem(token: string, item: BusinessMenuItem) {
  if (!validToken(token)) return { ok: false as const, error: "PIN expired. Unlock again." };
  const items = await loadMenuItems();
  const exists = items.some((i) => i.id === item.id);
  const updated = exists ? items.map((i) => (i.id === item.id ? item : i)) : [...items, item];
  await saveMenuItems(updated);
  return { ok: true as const, items: updated };
}
