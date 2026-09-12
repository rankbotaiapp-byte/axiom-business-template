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

const FILE = join(process.cwd(), ".data", "desk-bookings.json");
const sessions = new Map<string, number>();
const TTL_MS = 12 * 60 * 60 * 1000;

function nid() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

async function load(): Promise<DeskBooking[]> {
  try {
    const raw = await readFile(FILE, "utf8");
    const parsed = JSON.parse(raw) as DeskBooking[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function save(rows: DeskBooking[]) {
  await mkdir(dirname(FILE), { recursive: true });
  await writeFile(FILE, JSON.stringify(rows, null, 2), "utf8");
}

function validToken(token: string) {
  const exp = sessions.get(token);
  if (!exp || exp < Date.now()) {
    sessions.delete(token);
    return false;
  }
  return true;
}

export async function unlock(pinRaw: string) {
  const pin = String(pinRaw || "").replace(/\D/g, "");
  if (pin !== deskPin) return { ok: false as const, error: "Wrong PIN." };
  const token = nid() + nid();
  sessions.set(token, Date.now() + TTL_MS);
  return { ok: true as const, token, shop: business.name };
}

export async function list(token: string) {
  if (!validToken(token)) return { ok: false as const, error: "PIN expired. Unlock again." };
  const rows = await load();
  rows.sort((a, b) => `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`));
  return { ok: true as const, bookings: rows, phone: business.phone };
}

export async function setStatus(token: string, id: string, status: DeskStatus) {
  if (!validToken(token)) return { ok: false as const, error: "PIN expired. Unlock again." };
  const rows = await load();
  const next = rows.map((row) => (row.id === id ? { ...row, status } : row));
  await save(next);
  return { ok: true as const, bookings: next };
}

export async function taken() {
  const rows = await load();
  return rows.filter((row) => row.status === "booked").map((row) => `${row.date}T${row.time}`);
}

export async function place(input: {
  serviceId: string;
  date: string;
  time: string;
  name: string;
  phone: string;
}) {
  const service = business.services.find((s) => s.id === input.serviceId);
  if (!service) return { ok: false as const, error: "Pick a service." };
  const name = input.name.trim().slice(0, 80);
  const phone = input.phone.replace(/[^\d+() .-]/g, "").slice(0, 24);
  if (!name) return { ok: false as const, error: "Name is required." };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date) || !/^\d{2}:\d{2}$/.test(input.time)) {
    return { ok: false as const, error: "Pick a day and time." };
  }
  const rows = await load();
  const clash = rows.some(
    (row) => row.status === "booked" && row.date === input.date && row.time === input.time,
  );
  if (clash) return { ok: false as const, error: "That slot just filled." };
  const ping = `Logged for ${business.phone} · ${name} · ${service.name} ${input.date} ${input.time}`;
  const row: DeskBooking = {
    id: nid(),
    serviceId: service.id,
    serviceName: service.name,
    date: input.date,
    time: input.time,
    name,
    phone,
    status: "booked",
    createdAt: new Date().toISOString(),
    ping,
  };
  await save([...rows, row]);
  return { ok: true as const, booking: row, ping };
}
