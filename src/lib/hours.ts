import { business, type Weekday } from "@/config/business";

const DAYS: Weekday[] = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function weekdayInZone(date: Date, tz = business.timezone): Weekday {
  const name = new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    timeZone: tz,
  }).format(date);
  return DAYS.find((d) => name.startsWith(d.slice(0, 3))) ?? "Sun";
}

export function hmInZone(date: Date, tz = business.timezone): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone: tz,
  }).formatToParts(date);
  const h = parts.find((p) => p.type === "hour")?.value ?? "00";
  const m = parts.find((p) => p.type === "minute")?.value ?? "00";
  return `${h.padStart(2, "0")}:${m.padStart(2, "0")}`;
}

export function ymdInZone(date: Date, tz = business.timezone): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: tz,
  }).format(date);
  return parts;
}

function blockFor(day: Weekday) {
  return business.hours.find((h) => h.days.includes(day));
}

export function isOpenAt(date: Date): boolean {
  const block = blockFor(weekdayInZone(date));
  if (!block) return false;
  const t = hmInZone(date);
  return t >= block.open && t < block.close;
}

export function hoursLabel(): string {
  return business.hours
    .map((h) => `${h.days.join("–")} ${formatClock(h.open)}–${formatClock(h.close)}`)
    .join(" · ");
}

export function formatClock(hm: string): string {
  const [hs, ms] = hm.split(":");
  const h = Number(hs);
  const m = Number(ms);
  const ampm = h >= 12 ? "pm" : "am";
  const hr = h % 12 || 12;
  return m ? `${hr}:${String(m).padStart(2, "0")}${ampm}` : `${hr}${ampm}`;
}

export function formatMoney(n: number): string {
  return `$${n}`;
}

export function formatDay(ymd: string): string {
  const [y, m, d] = ymd.split("-").map(Number);
  const utc = new Date(Date.UTC(y, m - 1, d, 18, 0, 0));
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: business.timezone,
  }).format(utc);
}

export type DaySlots = {
  date: string;
  weekday: Weekday;
  label: string;
  slots: string[];
};

export function upcomingDays(count = 8, taken: Set<string> = new Set()): DaySlots[] {
  const out: DaySlots[] = [];
  const now = new Date();
  for (let i = 0; i < 14 && out.length < count; i++) {
    const d = new Date(now.getTime() + i * 86400000);
    const day = weekdayInZone(d);
    const block = blockFor(day);
    if (!block) continue;
    const date = ymdInZone(d);
    const slots = slotsFor(date, day, block.open, block.close, i === 0 ? hmInZone(now) : null, taken);
    if (slots.length === 0) continue;
    const label = new Intl.DateTimeFormat("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      timeZone: business.timezone,
    }).format(d);
    out.push({ date, weekday: day, label, slots });
  }
  return out;
}

function slotsFor(
  date: string,
  _day: Weekday,
  open: string,
  close: string,
  nowHm: string | null,
  taken: Set<string>,
): string[] {
  const step = business.bookingIntervalMin;
  const slots: string[] = [];
  let t = toMin(open);
  const end = toMin(close);
  while (t + 15 <= end) {
    const hm = fromMin(t);
    if (nowHm && hm <= nowHm) {
      t += step;
      continue;
    }
    if (!taken.has(`${date}T${hm}`)) slots.push(hm);
    t += step;
  }
  return slots;
}

function toMin(hm: string): number {
  const [h, m] = hm.split(":").map(Number);
  return h * 60 + m;
}

function fromMin(n: number): string {
  const h = Math.floor(n / 60);
  const m = n % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function axiomBrief(): string {
  const b = business;
  const hours = b.hours
    .map((h) => `${h.days.join(", ")} ${h.open}–${h.close}`)
    .join("; ");
  const services = b.services
    .map((s) => `${s.name} (${s.tag}) $${s.price}, ${s.durationMin} min — ${s.description}`)
    .join("; ");
  const products = b.products
    .map((p) => `${p.name} (${p.tag}) $${p.price} — ${p.description}`)
    .join("; ");
  return [
    `${b.name} is a ${b.kind} at ${b.location}.`,
    `Tagline: ${b.tagline}`,
    `Hours: ${hours}. Closed other days.`,
    `Walk-ins: ${b.walkins}`,
    `Services: ${services}`,
    `Shop products: ${products}`,
    `Policies: ${b.policies.join(" ")}`,
    `Phone ${b.phone}. ${b.afterHoursNote}`,
  ].join("\n");
}
