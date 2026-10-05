import type { Lang } from "../lib/i18n";

type Props = {
  label: string;
  hint?: string;
  value: number;
  max: number;
  lang: Lang;
  onChange: (v: number) => void;
};

export default function Stepper({ label, hint, value, max, lang, onChange }: Props) {
  const active = value > 0;
  const ur = lang === "ur";
  return (
    <div
      className={[
        "group relative flex items-center justify-between gap-3 rounded-2xl border px-3 py-2.5 transition-all duration-300",
        active
          ? "border-emerald-300 bg-gradient-to-br from-emerald-50 to-white shadow-[0_6px_20px_-12px_rgba(6,95,70,0.55)]"
          : "border-slate-200/80 bg-white/70 hover:border-emerald-200 hover:bg-white",
      ].join(" ")}
    >
      {active && (
        <span className="absolute inset-y-2 start-0 w-1 rounded-full bg-gradient-to-b from-emerald-500 to-teal-600" />
      )}
      <div className="min-w-0 ps-1.5">
        <div
          className={[
            "truncate text-[15px] font-semibold text-slate-800",
            ur ? "font-ur leading-loose" : "font-en",
          ].join(" ")}
        >
          {label}
        </div>
        {hint && (
          <div className={["truncate text-[11px] text-slate-400", ur ? "font-ur" : "font-en"].join(" ")}>
            {hint}
          </div>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-1 rounded-xl bg-slate-100/80 p-1">
        <button
          type="button"
          aria-label="minus"
          onClick={() => onChange(Math.max(0, value - 1))}
          disabled={value === 0}
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-lg font-bold text-slate-500 shadow-sm transition hover:bg-rose-50 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-40"
        >
          −
        </button>
        <input
          type="number"
          value={value}
          min={0}
          max={max}
          onChange={(e) => {
            const v = parseInt(e.target.value || "0", 10);
            onChange(Math.min(max, Math.max(0, isNaN(v) ? 0 : v)));
          }}
          className={[
            "w-9 bg-transparent text-center font-en text-base font-bold tabular-nums outline-none",
            active ? "text-emerald-700" : "text-slate-400",
          ].join(" ")}
        />
        <button
          type="button"
          aria-label="plus"
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-lg font-bold text-slate-500 shadow-sm transition hover:bg-emerald-50 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          +
        </button>
      </div>
    </div>
  );
}
