import { ArrowRight, ArrowUpRight } from "lucide-react";
import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

/** Shared easing curve used across all Clad Protocol motion. */
export const EASE = "cubic-bezier(0.25,0.1,0.25,1)";

/** Vertically-rolling label used on hover for pill buttons. */
export function RollText({ label }: { label: string }) {
  return (
    <span className="flex flex-col overflow-hidden h-[20px] leading-[20px]">
      <span
        className="transition-transform duration-500 group-hover:-translate-y-1/2"
        style={{ transitionTimingFunction: EASE }}
      >
        <span className="block h-[20px]">{label}</span>
        <span className="block h-[20px]">{label}</span>
      </span>
    </span>
  );
}

type PillVariant = "dark" | "accent" | "outline";

const PILL_BASE =
  "group text-[13px] sm:text-[14px] font-medium rounded-full inline-flex items-center gap-3 transition-colors shrink-0";

const PILL_VARIANTS: Record<PillVariant, string> = {
  dark: "bg-gray-900 text-white hover:bg-gray-800 pl-5 pr-2 py-2",
  accent: "bg-[#ECE81A] hover:bg-[#d4ce15] text-gray-900 pl-5 sm:pl-6 pr-2 py-2",
  outline: "border border-gray-300 hover:border-gray-900 text-gray-900 px-5 py-2",
};

function PillInner({ label, variant }: { label: string; variant: PillVariant }) {
  if (variant === "outline") {
    return (
      <>
        <span>{label}</span>
        <ArrowRight size={14} className="transition-transform duration-500 group-hover:translate-x-0.5" />
      </>
    );
  }
  const circle = variant === "accent" ? "bg-gray-900" : "bg-white";
  const arrow = variant === "accent" ? "text-[#ECE81A]" : "text-gray-900";
  return (
    <>
      <RollText label={label} />
      <span
        className={`w-7 h-7 sm:w-8 sm:h-8 ${circle} rounded-full flex items-center justify-center transition-transform duration-500 group-hover:-rotate-45`}
        style={{ transitionTimingFunction: EASE }}
      >
        <ArrowRight size={14} className={arrow} />
      </span>
    </>
  );
}

type PillButtonProps = {
  label: string;
  variant?: PillVariant;
  className?: string;
} & (
  | { to: string; params?: Record<string, string>; href?: never; onClick?: never }
  | { href: string; to?: never; params?: never; onClick?: never }
  | { onClick: () => void; to?: never; href?: never; params?: never }
);

/** The canonical Clad pill button — renders as a Link, anchor, or button. */
export function PillButton({ label, variant = "accent", className = "", ...rest }: PillButtonProps) {
  const cls = `${PILL_BASE} ${PILL_VARIANTS[variant]} ${className}`;
  if ("to" in rest && rest.to) {
    return (
      <Link to={rest.to} params={rest.params} className={cls}>
        <PillInner label={label} variant={variant} />
      </Link>
    );
  }
  if ("href" in rest && rest.href) {
    return (
      <a href={rest.href} className={cls}>
        <PillInner label={label} variant={variant} />
      </a>
    );
  }
  return (
    <button onClick={"onClick" in rest ? rest.onClick : undefined} className={cls}>
      <PillInner label={label} variant={variant} />
    </button>
  );
}

/** A numbered / dotted section label like "1  Introducing Clad". */
export function SectionTag({ index, label, dark = false }: { index?: number; label: string; dark?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      {index !== undefined ? (
        <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gray-900 text-white text-[11px] sm:text-[12px] font-semibold flex items-center justify-center">
          {index}
        </div>
      ) : (
        <span className="w-2 h-2 rounded-full bg-[#ECE81A]" />
      )}
      <span
        className={`text-[11px] sm:text-[12px] uppercase tracking-[0.18em] ${
          dark ? "text-gray-400" : "text-gray-600"
        }`}
      >
        {label}
      </span>
    </div>
  );
}

/** Small accent badge (yellow underline rule used as a section opener). */
export function AccentRule({ className = "" }: { className?: string }) {
  return <div className={`h-0.5 w-16 bg-[#ECE81A] ${className}`} />;
}

const STATUS_STYLES: Record<string, string> = {
  active: "bg-[#ECE81A] text-gray-900",
  idle: "bg-gray-200 text-gray-700",
  paused: "bg-gray-200 text-gray-700",
  halted: "bg-gray-900 text-white",
  anchored: "bg-[#ECE81A] text-gray-900",
  pending: "bg-gray-200 text-gray-700",
  settled: "bg-[#ECE81A] text-gray-900",
  success: "bg-[#ECE81A] text-gray-900",
  reverted: "bg-gray-900 text-white",
};

/** Status pill used in tables across the command center. */
export function StatusBadge({ status }: { status: string }) {
  const cls = STATUS_STYLES[status] ?? "bg-gray-200 text-gray-700";
  return (
    <span className={`text-[11px] font-medium px-2 py-1 rounded-full capitalize ${cls}`}>{status}</span>
  );
}

/** Inline "see more" link with the rotating up-right arrow. */
export function MoreLink({
  to,
  params,
  label,
  className = "",
}: {
  to: string;
  params?: Record<string, string>;
  label: string;
  className?: string;
}) {
  return (
    <Link
      to={to}
      params={params}
      className={`group inline-flex items-center gap-1 text-[13px] font-medium hover:opacity-70 transition-opacity ${className}`}
    >
      {label}
      <ArrowUpRight size={14} className="transition-transform duration-500 group-hover:-rotate-12" />
    </Link>
  );
}

/** Generic card wrapper to keep radius / border consistent. */
export function Panel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`bg-white rounded-2xl ${className}`}>{children}</div>;
}

/** Lightweight CSS bar chart for a labelled numeric series. */
export function MiniBars({
  data,
  height = 120,
  accent = "#ECE81A",
}: {
  data: { label: string; value: number }[];
  height?: number;
  accent?: string;
}) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="flex items-end gap-2" style={{ height }}>
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-2 min-w-0">
          <div className="w-full flex items-end justify-center" style={{ height: height - 22 }}>
            <div
              className="w-full rounded-t-md transition-all"
              style={{
                height: `${Math.max(4, (d.value / max) * (height - 22))}px`,
                backgroundColor: accent,
              }}
              title={`${d.label}: ${d.value}`}
            />
          </div>
          <span className="text-[10px] text-gray-400 truncate w-full text-center">{d.label}</span>
        </div>
      ))}
    </div>
  );
}
