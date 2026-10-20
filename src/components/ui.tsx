"use client";
import Link from "next/link";
import { forwardRef, useEffect, useRef, type ReactNode, type ComponentProps } from "react";
import { X } from "@phosphor-icons/react";
import type { Org } from "@/lib/types";

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");
export { cx };

type BtnVariant = "primary" | "dark" | "outline" | "ghost" | "danger";
const btn: Record<BtnVariant, string> = {
  primary: "bg-brick text-white hover:bg-brick-d",
  dark: "bg-ink text-paper hover:bg-slate",
  outline: "border border-line bg-card text-ink hover:border-ink-3",
  ghost: "text-ink-2 hover:bg-sunk hover:text-ink",
  danger: "bg-bad text-white hover:opacity-90",
};
const size = { sm: "h-9 px-3.5 text-sm gap-1.5", md: "h-11 px-5 text-[15px] gap-2", lg: "h-13 px-6 text-base gap-2.5" };

type BtnProps = { variant?: BtnVariant; size?: keyof typeof size; href?: string; external?: boolean } & ComponentProps<"button">;

export const Button = forwardRef<HTMLButtonElement, BtnProps>(function Button(
  { variant = "primary", size: s = "md", href, external, className, children, ...rest },
  ref,
) {
  const cls = cx("press inline-flex items-center justify-center rounded-full font-semibold whitespace-nowrap disabled:opacity-50 disabled:pointer-events-none", btn[variant], size[s], className);
  if (href) {
    return external ? (
      <a href={href} target="_blank" rel="noopener" className={cls}>{children}</a>
    ) : (
      <Link href={href} className={cls}>{children}</Link>
    );
  }
  return <button ref={ref} className={cls} {...rest}>{children}</button>;
});

export function Badge({ tone = "neutral", children, className }: { tone?: "neutral" | "brick" | "ok" | "warn" | "bad" | "dark"; children: ReactNode; className?: string }) {
  const t = {
    neutral: "bg-sunk text-ink-2",
    brick: "bg-brick-soft text-brick-d",
    ok: "bg-ok-soft text-ok",
    warn: "bg-warn-soft text-warn",
    bad: "bg-bad-soft text-bad",
    dark: "bg-ink text-paper",
  }[tone];
  return <span className={cx("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold", t, className)}>{children}</span>;
}

export function Field({ label, hint, error, children, htmlFor }: { label: string; hint?: string; error?: string; children: ReactNode; htmlFor?: string }) {
  return (
    <div className="grid gap-1.5">
      <label htmlFor={htmlFor} className="text-sm font-semibold text-ink-2">{label}</label>
      {children}
      {hint && !error && <p className="text-xs text-ink-3">{hint}</p>}
      {error && <p className="text-xs font-medium text-bad" role="alert">{error}</p>}
    </div>
  );
}

const fieldCls = "rounded-[10px] border border-line bg-card px-3.5 text-[15px] text-ink placeholder:text-ink-3 transition-[border-color,box-shadow] duration-200 focus:border-ink focus:outline-none focus:ring-2 focus:ring-ink/10 aria-[invalid=true]:border-bad";

export const Input = forwardRef<HTMLInputElement, ComponentProps<"input">>(function Input({ className, ...p }, ref) {
  return <input ref={ref} className={cx(fieldCls, "h-11", /\bw-/.test(className ?? "") ? "" : "w-full", className)} {...p} />;
});
export const Select = forwardRef<HTMLSelectElement, ComponentProps<"select">>(function Select({ className, ...p }, ref) {
  return <select ref={ref} className={cx(fieldCls, "h-11 pr-8", /\bw-/.test(className ?? "") ? "" : "w-full", className)} {...p} />;
});
export const Textarea = forwardRef<HTMLTextAreaElement, ComponentProps<"textarea">>(function Textarea({ className, ...p }, ref) {
  return <textarea ref={ref} className={cx(fieldCls, "w-full py-2.5 leading-relaxed", className)} {...p} />;
});

export function OrgLogo({ org, size: s = 44, className }: { org: Pick<Org, "initials" | "color" | "name">; size?: number; className?: string }) {
  return (
    <span
      aria-hidden
      className={cx("inline-grid shrink-0 place-items-center rounded-[10px] font-display font-semibold text-white", className)}
      style={{ width: s, height: s, background: org.color, fontSize: s * 0.36, letterSpacing: "-0.02em" }}
    >
      {org.initials}
    </span>
  );
}

export function Avatar({ name, size: s = 36, className }: { name: string; size?: number; className?: string }) {
  const ini = name.split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) % 360;
  return (
    <span aria-hidden className={cx("inline-grid shrink-0 place-items-center rounded-full font-semibold text-ink", className)} style={{ width: s, height: s, background: `hsl(${h} 25% 86%)`, fontSize: s * 0.38 }}>
      {ini}
    </span>
  );
}

/** Diálogo modal nativo: foco atrapado, Escape y fondo los da el navegador. */
export function Dialog({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title: string; children: ReactNode; wide?: boolean }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      className={cx(
        "m-auto w-[calc(100%-2rem)] rounded-[18px] bg-card p-0 text-ink shadow-[var(--shadow-pop)] backdrop:bg-ink/45 backdrop:backdrop-blur-[2px]",
        "opacity-0 translate-y-2 open:opacity-100 open:translate-y-0 transition-[opacity,translate,display,overlay] duration-300 ease-[var(--ease-out)] transition-discrete starting:open:opacity-0 starting:open:translate-y-2",
        wide ? "max-w-3xl" : "max-w-lg",
      )}
    >
      <div className="flex items-center justify-between gap-4 border-b border-line px-6 py-4">
        <h2 className="font-display text-xl font-semibold tracking-tight">{title}</h2>
        <button onClick={onClose} className="press grid size-9 place-items-center rounded-full text-ink-2 hover:bg-sunk" aria-label="Cerrar">
          <X size={18} />
        </button>
      </div>
      <div className="max-h-[75dvh] overflow-y-auto px-6 py-5">{children}</div>
    </dialog>
  );
}

export function Empty({ title, children, action }: { title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="grid place-items-center gap-3 rounded-[14px] border border-dashed border-line bg-card/60 px-6 py-14 text-center">
      <p className="font-display text-lg font-semibold">{title}</p>
      {children && <div className="max-w-md text-sm text-ink-2">{children}</div>}
      {action}
    </div>
  );
}

export function Logo({ className, light }: { className?: string; light?: boolean }) {
  return (
    <span className={cx("inline-flex items-center gap-2", className)}>
      <svg width="26" height="26" viewBox="0 0 26 26" aria-hidden>
        <rect x="1" y="1" width="24" height="24" rx="7" fill={light ? "#f3f3ef" : "#15181c"} />
        <path d="M8 20V11a5 5 0 0 1 10 0v9" fill="none" stroke={light ? "#15181c" : "#f3f3ef"} strokeWidth="2.2" />
        <path d="M5 20.5h16" stroke="#b4441a" strokeWidth="2.6" strokeLinecap="round" />
      </svg>
      <span className={cx("font-display text-[21px] font-semibold tracking-[-0.03em]", light ? "text-paper" : "text-ink")}>umbral</span>
    </span>
  );
}
