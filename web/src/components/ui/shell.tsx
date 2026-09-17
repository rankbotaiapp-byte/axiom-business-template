import Link from "next/link";
import type { ReactNode } from "react";

export function Shell({
  overline,
  title,
  children,
}: {
  overline: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <main className="page-enter mx-auto flex w-full max-w-xl flex-1 flex-col gap-5 px-6 py-8 md:max-w-2xl md:gap-6 md:py-12">
      <header className="flex flex-col gap-1.5">
        <p className="kicker">{overline}</p>
        <h1 className="text-[22px] leading-7 font-semibold tracking-tight text-ink">{title}</h1>
      </header>
      {children}
    </main>
  );
}

export function ActionLink({
  href,
  children,
  tone = "accent",
}: {
  href: string;
  children: ReactNode;
  tone?: "accent" | "neutral";
}) {
  const hrefClass = tone === "accent" ? "bg-accent text-bg" : "border border-border bg-raised text-ink";
  return (
    <Link href={href} className={`control ${hrefClass}`}>
      {children}
    </Link>
  );
}

export function Panel({ children }: { children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3 border border-border bg-surface p-4">{children}</section>
  );
}

export function Button({
  children,
  onClick,
  disabled,
  tone = "accent",
  type = "button",
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  tone?: "accent" | "neutral" | "danger";
  type?: "button" | "submit";
}) {
  const tones = {
    accent: "bg-accent text-bg",
    neutral: "border border-border bg-raised text-ink",
    danger: "bg-danger text-bg",
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={`control ${tones[tone]}`}>
      {children}
    </button>
  );
}

export function TextAction({
  children,
  onClick,
  href,
}: {
  children: ReactNode;
  onClick?: () => void;
  href?: string;
}) {
  const className = "kicker kicker-accent";
  if (href) {
    return (
      <Link href={href} className={className}>
        {children}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} className={className}>
      {children}
    </button>
  );
}

export function FileTrigger({
  label,
  accept,
  onFile,
}: {
  label: string;
  accept?: string;
  onFile: (file: File | undefined) => void;
}) {
  return (
    <label className="control cursor-pointer border border-border bg-raised text-ink">
      {label}
      <input
        type="file"
        accept={accept}
        className="hidden"
        onChange={(event) => {
          onFile(event.target.files?.[0]);
          event.target.value = "";
        }}
      />
    </label>
  );
}

export function CheckRow({
  label,
  checked,
  onToggle,
}: {
  label: string;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <button type="button" onClick={onToggle} className="flex items-start gap-3 py-2 text-left">
      <span
        className={`mt-0.5 flex h-5 w-5 items-center justify-center border text-[12px] ${
          checked ? "border-accent bg-accent text-bg" : "border-border bg-surface text-transparent"
        }`}
      >
        ✓
      </span>
      <span className="copy">{label}</span>
    </button>
  );
}

export function Field({
  label,
  value,
  onChange,
  placeholder,
  rows = 5,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  rows?: number;
}) {
  return (
    <label className="flex flex-col gap-2">
      <span className="kicker">{label}</span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="surface-input min-h-28 px-4 py-3 text-base leading-6"
      />
    </label>
  );
}

export function TextField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: "text" | "number" | "email" | "password";
  autoComplete?: string;
}) {
  return (
    <label className="flex flex-col gap-2">
      <span className="kicker">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="surface-input min-h-12 px-4 text-base"
      />
    </label>
  );
}

export function Notes({ notes }: { notes: string[] }) {
  if (notes.length === 0) return null;
  return (
    <Panel>
      <p className="kicker">Requirement</p>
      {notes.map((note) => (
        <p key={note} className="copy">
          {note}
        </p>
      ))}
    </Panel>
  );
}

export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <Panel>
      <p className="kicker kicker-accent">{title}</p>
      <p className="copy">{body}</p>
    </Panel>
  );
}

export function RecordStatus({ label = "Reading the record" }: { label?: string }) {
  return (
    <main className="status-enter mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center gap-2 px-6">
      <p className="kicker">{label}</p>
      <p className="quiet">Hold. The record is being read.</p>
    </main>
  );
}

export function ChoiceRow<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <p className="kicker">{label}</p>
      <div className={`grid gap-2 ${options.length > 3 ? "grid-cols-2" : "grid-cols-3"}`}>
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`control ${
              value === option.value ? "border border-accent text-accent" : "border border-border text-ink"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
