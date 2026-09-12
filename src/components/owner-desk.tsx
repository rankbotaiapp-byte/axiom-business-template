import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Check, Phone, Undo2, X } from "lucide-react";
import { business } from "@/config/business";
import {
  listDesk,
  setDeskStatus,
  unlockDesk,
  type DeskBooking,
  type DeskStatus,
} from "@/lib/desk-api";
import { formatClock, formatDay, ymdInZone } from "@/lib/hours";

type Filter = "today" | "upcoming" | "done";

const TOKEN_KEY = `axiom-desk:${business.name}`;

export function OwnerDeskPage() {
  const [pin, setPin] = useState("");
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [rows, setRows] = useState<DeskBooking[]>([]);
  const [shopPhone, setShopPhone] = useState(business.phone);
  const [filter, setFilter] = useState<Filter>("today");

  useEffect(() => {
    const saved = sessionStorage.getItem(TOKEN_KEY);
    if (saved) setToken(saved);
  }, []);

  useEffect(() => {
    if (!token) return;
    let live = true;
    setBusy(true);
    void listDesk({ data: { token } }).then((res) => {
      if (!live) return;
      setBusy(false);
      if (!res.ok) {
        sessionStorage.removeItem(TOKEN_KEY);
        setToken("");
        setError(res.error);
        return;
      }
      setRows(res.bookings);
      setShopPhone(res.phone);
    });
    const id = window.setInterval(() => {
      void listDesk({ data: { token } }).then((res) => {
        if (!live || !res.ok) return;
        setRows(res.bookings);
      });
    }, 8000);
    return () => {
      live = false;
      window.clearInterval(id);
    };
  }, [token]);

  async function unlock(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await unlockDesk({ data: { pin } });
    setBusy(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    sessionStorage.setItem(TOKEN_KEY, res.token);
    setToken(res.token);
    setPin("");
  }

  async function mark(id: string, status: DeskStatus) {
    const res = await setDeskStatus({ data: { token, id, status } });
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setRows(res.bookings);
  }

  const today = ymdInZone(new Date());
  const visible = useMemo(() => {
    return rows.filter((row) => {
      if (filter === "done") return row.status !== "booked";
      if (filter === "today") return row.status === "booked" && row.date === today;
      return row.status === "booked" && row.date > today;
    });
  }, [rows, filter, today]);

  const todayCount = rows.filter((r) => r.status === "booked" && r.date === today).length;

  if (!token) {
    return (
      <main className="desk-shell">
        <header className="desk-head">
          <p className="wordmark">Owner desk</p>
          <h1 className="display-sub mt-2">{business.name}</h1>
          <p className="caption mt-2 max-w-[36ch]">
            PIN stays with the shop. Customers never see this board.
          </p>
        </header>
        <form className="desk-gate" onSubmit={(e) => void unlock(e)}>
          <label className="caption" htmlFor="desk-pin">
            Four-digit PIN
          </label>
          <input
            id="desk-pin"
            className="field desk-pin"
            inputMode="numeric"
            autoComplete="off"
            maxLength={4}
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
            placeholder="••••"
          />
          {error ? <p className="desk-err">{error}</p> : null}
          <button type="submit" className="cta-fill" disabled={busy || pin.length < 4}>
            Open the board
          </button>
        </form>
        <Link to="/" className="caption mt-8">
          Back to the shop
        </Link>
      </main>
    );
  }

  return (
    <main className="desk-shell">
      <header className="desk-head">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="wordmark">Owner desk</p>
            <h1 className="display-sub mt-2">{business.name}</h1>
            <p className="caption mt-2">
              Pings land at {shopPhone}. Jobs stay here until you close them.
            </p>
          </div>
          <span className="chip">
            <span className="chip__dot" />
            {todayCount} today
          </span>
        </div>
        <div className="desk-filters">
          {(
            [
              ["today", "Today"],
              ["upcoming", "Upcoming"],
              ["done", "Closed"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              className="desk-filter"
              data-on={filter === id}
              onClick={() => setFilter(id)}
            >
              {label}
            </button>
          ))}
        </div>
      </header>

      {error ? <p className="desk-err">{error}</p> : null}

      {busy && rows.length === 0 ? (
        <p className="caption mt-8">Loading the board…</p>
      ) : visible.length === 0 ? (
        <p className="caption mt-8 max-w-[40ch] leading-relaxed">
          Nobody on this list. A booking on the shop page shows up here — name,
          time, and a ping to {shopPhone}.
        </p>
      ) : (
        <ul className="desk-list">
          {visible.map((row) => (
            <li key={row.id} className="desk-card" data-status={row.status}>
              <div className="desk-card__time">
                <span className="tabular-nums">{formatClock(row.time)}</span>
                <span className="caption">{formatDay(row.date)}</span>
              </div>
              <div className="desk-card__body">
                <p className="text-[16px] font-medium">{row.name}</p>
                <p className="caption mt-0.5">{row.serviceName}</p>
                {row.phone ? (
                  <a className="desk-tel" href={`tel:${row.phone.replace(/\s/g, "")}`}>
                    <Phone className="size-3.5" strokeWidth={2} />
                    {row.phone}
                  </a>
                ) : (
                  <p className="caption mt-1">No phone left</p>
                )}
              </div>
              {row.status === "booked" ? (
                <div className="desk-card__acts">
                  <button
                    type="button"
                    className="desk-act desk-act--ok"
                    onClick={() => void mark(row.id, "done")}
                  >
                    <Check className="size-4" strokeWidth={2.2} />
                    Done
                  </button>
                  <button
                    type="button"
                    className="desk-act"
                    onClick={() => void mark(row.id, "no-show")}
                  >
                    <X className="size-4" strokeWidth={2.2} />
                    No-show
                  </button>
                </div>
              ) : (
                <div className="desk-card__acts">
                  <span className="desk-status">{row.status === "done" ? "Done" : "No-show"}</span>
                  <button
                    type="button"
                    className="desk-act"
                    onClick={() => void mark(row.id, "booked")}
                  >
                    <Undo2 className="size-4" strokeWidth={2} />
                    Restore
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      <footer className="desk-foot">
        <Link to="/" className="caption">
          Shop page
        </Link>
        <button
          type="button"
          className="caption"
          onClick={() => {
            sessionStorage.removeItem(TOKEN_KEY);
            setToken("");
          }}
        >
          Lock
        </button>
      </footer>
    </main>
  );
}
