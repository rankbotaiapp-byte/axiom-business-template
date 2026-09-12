import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowUp,
  Clock,
  LayoutGrid,
  Mic,
  Signal,
  Wifi,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import { PhoneFrame } from "@/components/phone-frame";
import { AxiomMark } from "@/components/axiom-halo";
import { business } from "@/config/business";
import { useAxiom } from "@/lib/axiom-store";
import {
  formatClock,
  formatDay,
  formatMoney,
  hmInZone,
  isOpenAt,
  upcomingDays,
  weekdayInZone,
} from "@/lib/hours";

export function AxiomApp() {
  const mode = useAxiom((s) => s.mode);
  const tab = useAxiom((s) => s.tab);
  const view = useAxiom((s) => s.view);
  const setMode = useAxiom((s) => s.setMode);
  const setTab = useAxiom((s) => s.setTab);
  const send = useAxiom((s) => s.send);
  const sending = useAxiom((s) => s.sending);
  const error = useAxiom((s) => s.error);
  const clearError = useAxiom((s) => s.clearError);

  const [draft, setDraft] = useState("");
  const [now, setNow] = useState(() => new Date());
  const recRef = useRef<SpeechRecognition | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 30000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    void useAxiom.getState().hydrateTaken();
  }, []);

  const open = isOpenAt(now);
  const time = formatTime(now);

  function submit(text = draft) {
    const value = text.trim();
    if (!value) return;
    stopListen();
    void send(value);
    setDraft("");
  }

  function stopListen() {
    recRef.current?.stop();
    recRef.current = null;
  }

  function toggleListen() {
    if (mode === "listen") {
      stopListen();
      setMode("idle");
      return;
    }
    const SR =
      typeof window !== "undefined"
        ? window.SpeechRecognition || window.webkitSpeechRecognition
        : undefined;
    if (!SR) {
      setMode("listen");
      inputRef.current?.focus();
      return;
    }
    const rec = new SR();
    rec.lang = "en-US";
    rec.interimResults = false;
    rec.onresult = (event: SpeechRecognitionEvent) => {
      const said = event.results[0]?.[0]?.transcript ?? "";
      if (said) submit(said);
    };
    rec.onerror = () => {
      recRef.current = null;
      if (useAxiom.getState().mode === "listen") setMode("idle");
    };
    rec.onend = () => {
      recRef.current = null;
      if (useAxiom.getState().mode === "listen" && !useAxiom.getState().sending) {
        setMode("idle");
      }
    };
    recRef.current = rec;
    setMode("listen");
    rec.start();
  }

  return (
    <PhoneFrame mode={mode}>
      <div className="app-shell">
        <header className="status-bar">
          <span className="tabular-nums">{time}</span>
          <span className="status-bar__icons" aria-hidden="true">
            <Signal className="size-3.5" strokeWidth={2.2} />
            <Wifi className="size-3.5" strokeWidth={2.2} />
            <span className="inline-flex items-center gap-1">
              <span className="tabular-nums text-[11px]">86</span>
              <span className="relative h-2.5 w-5 rounded-[3px] shadow-[0_0_0_1px_rgb(255_255_255_/_0.7)]">
                <span className="absolute inset-[1px] w-[86%] rounded-[1px] bg-fg" />
              </span>
            </span>
          </span>
        </header>

        <nav className="mode-row mt-3" role="tablist" aria-label="Shop or studio">
          <button
            type="button"
            role="tab"
            data-on={tab === "shop"}
            aria-selected={tab === "shop"}
            onClick={() => setTab("shop")}
          >
            Shop
          </button>
          <button
            type="button"
            role="tab"
            data-on={tab === "studio"}
            aria-selected={tab === "studio"}
            onClick={() => setTab("studio")}
          >
            Studio
          </button>
        </nav>

        <main className="mt-4 flex min-h-0 flex-1 flex-col overflow-hidden">
          {tab === "studio" ? (
            <Studio />
          ) : view === "services" ? (
            <Services />
          ) : view === "hours" ? (
            <Hours now={now} open={open} />
          ) : view === "book" ? (
            <Book />
          ) : view === "ask" ? (
            <Desk />
          ) : (
            <Home now={now} open={open} />
          )}
        </main>

        {error ? (
          <p className="mb-2 px-1 text-center text-[12px] text-muted">
            {error}{" "}
            <button
              type="button"
              className="underline decoration-line underline-offset-2"
              onClick={clearError}
            >
              Dismiss
            </button>
          </p>
        ) : null}

        <form
          className="composer mt-3"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <AxiomMark size="sm" />
          <input
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={`Ask ${business.axiomName}`}
            aria-label={`Ask ${business.axiomName}`}
            disabled={sending}
            autoComplete="off"
            suppressHydrationWarning
          />
          <button
            type="button"
            className="icon-btn icon-btn--listen"
            data-on={mode === "listen"}
            aria-pressed={mode === "listen"}
            aria-label={mode === "listen" ? "Stop listening" : "Listen"}
            onClick={toggleListen}
          >
            <Mic className="size-5" strokeWidth={1.75} />
          </button>
          <button
            type="submit"
            className="icon-btn icon-btn--send"
            aria-label="Send"
            disabled={sending || draft.trim().length === 0}
          >
            <ArrowUp className="size-5" strokeWidth={2.2} />
          </button>
        </form>
        <div className="home-bar" aria-hidden="true" />
      </div>
    </PhoneFrame>
  );
}

function Home({ now, open }: { now: Date; open: boolean }) {
  const setView = useAxiom((s) => s.setView);
  const last = useAxiom((s) => s.lastBooking);
  const service = last
    ? business.services.find((s) => s.id === last.serviceId)
    : null;

  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-y-auto">
      <div className="shop-hero" aria-hidden="true">
        <img src={business.heroImage} alt="" />
      </div>
      <div className="relative z-[1] flex min-h-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="wordmark">{business.kind}</p>
            <p className="caption mt-1">{business.location}</p>
          </div>
          <span className={open ? "chip chip--open" : "chip"}>
            <span className="chip__dot" />
            {open ? "Open" : business.afterHoursLabel}
          </span>
        </div>

        <h1 className="display-name enter enter-d1 mt-6">{business.name}</h1>
        <p className="enter enter-d2 mt-3 text-[17px] leading-snug text-fg">
          {business.tagline}
        </p>
        <p className="caption enter enter-d3 mt-4 max-w-[34ch] leading-relaxed">
          {business.story}
        </p>

        {last && service ? (
          <p className="enter enter-d4 mt-4 text-[13px] text-fg">
            {last.name.split(" ")[0]}, you’re in — {service.name}, {formatDay(last.date)} at{" "}
            {formatClock(last.time)}. The shop desk has it.
          </p>
        ) : null}

        <div className="mt-auto flex flex-col gap-2.5 pt-8">
          <button type="button" className="cta-fill" onClick={() => setView("book")}>
            Book now
          </button>
          <div className="grid grid-cols-2 gap-2.5">
            <button type="button" className="cta-line" onClick={() => setView("services")}>
              <LayoutGrid className="size-4" strokeWidth={1.75} />
              Services
            </button>
            <button type="button" className="cta-line" onClick={() => setView("hours")}>
              <Clock className="size-4" strokeWidth={1.75} />
              Hours
            </button>
          </div>
          <Link to="/desk" className="desk-entry">
            Owner desk
          </Link>
        </div>
      </div>
    </div>
  );
}

function Studio() {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      <Back fallback="shop" />
      <p className="wordmark">Studio</p>
      <h2 className="display-sub mt-2">On the shelf</h2>
      <p className="caption mt-2">What we put in your hands after the chair.</p>
      <div className="mt-4 grid grid-cols-2 gap-3">
        {business.products.map((p) => (
          <article key={p.id} className="card-tile">
            <div className="card-tile__img">
              <img src={p.image} alt={p.name} />
              <span className="tag">{p.tag}</span>
            </div>
            <div className="px-1 pt-2">
              <p className="text-[14px] font-medium">{p.name}</p>
              <p className="caption mt-0.5">{formatMoney(p.price)}</p>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function Services() {
  const patch = useAxiom((s) => s.patchDraft);
  const setView = useAxiom((s) => s.setView);
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      <Back />
      <p className="wordmark">The chair</p>
      <h2 className="display-sub mt-2">Services</h2>
      <ul className="mt-4 flex flex-col gap-3">
        {business.services.map((s) => (
          <li key={s.id}>
            <button
              type="button"
              className="service-row"
              onClick={() => {
                patch({ serviceId: s.id, date: null, time: null });
                setView("book");
              }}
            >
              <img src={s.image} alt="" className="service-row__img" />
              <span className="min-w-0 flex-1 text-left">
                <span className="tag">{s.tag}</span>
                <span className="mt-1 block text-[15px] font-medium">{s.name}</span>
                <span className="caption mt-0.5 block">
                  {s.durationMin} min
                </span>
              </span>
              <span className="text-[15px] tabular-nums">{formatMoney(s.price)}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Hours({ now, open }: { now: Date; open: boolean }) {
  const day = weekdayInZone(now);
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      <Back />
      <p className="wordmark">The desk</p>
      <h2 className="display-sub mt-2">Hours</h2>
      <p className="caption mt-2">
        {open ? `Open now · ${formatClock(hmInZone(now))}` : business.afterHoursNote}
      </p>
      <ul className="mt-5 flex flex-col gap-2">
        {(["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const).map((d) => {
          const block = business.hours.find((h) => h.days.includes(d));
          const on = d === day;
          return (
            <li
              key={d}
              className={`flex items-baseline justify-between rounded-md px-3 py-2.5 text-[14px] ${
                on ? "bg-raised" : ""
              }`}
            >
              <span className={on ? "text-fg" : "text-muted"}>{d}</span>
              <span className="tabular-nums text-fg">
                {block
                  ? `${formatClock(block.open)} – ${formatClock(block.close)}`
                  : "Closed"}
              </span>
            </li>
          );
        })}
      </ul>
      <p className="caption mt-5">{business.walkins}</p>
    </div>
  );
}

function Book() {
  const draft = useAxiom((s) => s.draft);
  const patch = useAxiom((s) => s.patchDraft);
  const bookings = useAxiom((s) => s.bookings);
  const takenRemote = useAxiom((s) => s.taken);
  const confirm = useAxiom((s) => s.confirmBooking);
  const error = useAxiom((s) => s.error);
  const [holding, setHolding] = useState(false);
  const taken = useMemo(() => {
    const set = new Set(takenRemote);
    for (const b of bookings) set.add(`${b.date}T${b.time}`);
    return set;
  }, [bookings, takenRemote]);
  const days = useMemo(() => upcomingDays(8, taken), [taken]);
  const service = business.services.find((s) => s.id === draft.serviceId);
  const day = days.find((d) => d.date === draft.date);

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      <Back />
      <p className="wordmark">Book</p>
      <h2 className="display-sub mt-2">A chair</h2>

      <p className="caption mt-5">Service</p>
      <div className="mt-2 flex flex-col gap-2">
        {business.services.map((s) => (
          <button
            key={s.id}
            type="button"
            className="pick"
            data-on={draft.serviceId === s.id}
            onClick={() => patch({ serviceId: s.id })}
          >
            <span>
              <span className="block text-[14px] font-medium">{s.name}</span>
              <span className="caption">{s.tag} · {s.durationMin} min</span>
            </span>
            <span className="tabular-nums">{formatMoney(s.price)}</span>
          </button>
        ))}
      </div>

      {draft.serviceId ? (
        <>
          <p className="caption mt-5">Day</p>
          <div className="mt-2 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {days.map((d) => (
              <button
                key={d.date}
                type="button"
                className="day-chip"
                data-on={draft.date === d.date}
                onClick={() => patch({ date: d.date, time: null })}
              >
                {d.label}
              </button>
            ))}
          </div>
        </>
      ) : null}

      {day ? (
        <>
          <p className="caption mt-5">Time</p>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {day.slots.map((t) => (
              <button
                key={t}
                type="button"
                className="pick pick--center"
                data-on={draft.time === t}
                onClick={() => patch({ time: t })}
              >
                {formatClock(t)}
              </button>
            ))}
          </div>
        </>
      ) : null}

      {draft.time ? (
        <form
          className="mt-5 flex flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            setHolding(true);
            void confirm().finally(() => setHolding(false));
          }}
        >
          <label className="caption" htmlFor="book-name">
            Your name
          </label>
          <input
            id="book-name"
            className="field"
            value={draft.name}
            onChange={(e) => patch({ name: e.target.value })}
            placeholder="First and last"
            autoComplete="name"
            required
          />
          <label className="caption" htmlFor="book-phone">
            Phone
          </label>
          <input
            id="book-phone"
            className="field"
            type="tel"
            value={draft.phone}
            onChange={(e) => patch({ phone: e.target.value })}
            placeholder="So the shop can reach you"
            autoComplete="tel"
          />
          {error ? <p className="desk-err">{error}</p> : null}
          <button
            type="submit"
            className="cta-fill"
            disabled={!draft.name.trim() || !service || holding}
          >
            {holding ? "Holding…" : `Hold ${service?.name ?? "the chair"}`}
          </button>
        </form>
      ) : null}
    </div>
  );
}

function Desk() {
  const messages = useAxiom((s) => s.messages);
  const sending = useAxiom((s) => s.sending);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length, sending]);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <Back />
      <div className="mb-3 flex items-center gap-2">
        <AxiomMark size="sm" />
        <p className="wordmark !tracking-[0.28em]">{business.axiomName}</p>
      </div>
      {messages.length === 0 && !sending ? (
        <div className="mb-3 flex flex-wrap gap-2">
          {business.prompts.map((p) => (
            <button
              key={p}
              type="button"
              className="prompt-chip"
              onClick={() => void useAxiom.getState().send(p)}
            >
              {p}
            </button>
          ))}
        </div>
      ) : null}
      <div ref={listRef} className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto">
        {messages.map((m) => (
          <div
            key={m.id}
            className={m.role === "user" ? "bubble bubble--user" : "bubble bubble--axiom"}
          >
            {m.text}
          </div>
        ))}
        {sending ? (
          <div className="bubble bubble--axiom caption !text-[13px]">Considering…</div>
        ) : null}
      </div>
    </div>
  );
}

function Back({ fallback }: { fallback?: "shop" }) {
  const setView = useAxiom((s) => s.setView);
  const setTab = useAxiom((s) => s.setTab);
  return (
    <button
      type="button"
      className="back-btn"
      onClick={() => {
        if (fallback === "shop") setTab("shop");
        else setView("home");
      }}
    >
      <ArrowLeft className="size-4" strokeWidth={2} />
      Back
    </button>
  );
}

function formatTime(d: Date) {
  return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

type SpeechRecognition = {
  lang: string;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
};

type SpeechRecognitionEvent = {
  results: { [index: number]: { [index: number]: { transcript: string } } };
};

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognition;
    webkitSpeechRecognition?: new () => SpeechRecognition;
  }
}
