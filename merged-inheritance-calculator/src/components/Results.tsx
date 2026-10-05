import type { CalcResult } from "../lib/faraid";
import { fmt } from "../lib/fraction";
import { HEIR_LABEL, STATUS_LABEL, UI, type Lang } from "../lib/i18n";

const PALETTE = [
  "from-emerald-500 to-teal-500",
  "from-amber-400 to-orange-500",
  "from-sky-500 to-cyan-500",
  "from-violet-500 to-fuchsia-500",
  "from-rose-500 to-pink-500",
  "from-lime-500 to-green-500",
  "from-indigo-500 to-blue-500",
  "from-yellow-400 to-amber-500",
];

const money = (n: number) =>
  new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(Math.round(n * 100) / 100);

export default function Results({ res, lang }: { res: CalcResult; lang: Lang }) {
  const ur = lang === "ur";
  const f = (o: { ur: string; en: string }) => (ur ? o.ur : o.en);
  const urf = ur ? "font-ur" : "font-en";
  const showMoney = res.money.net > 0;

  if (!res.ok) {
    return (
      <div className="rounded-3xl border border-dashed border-emerald-200 bg-white/70 p-10 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-2xl">
          🧮
        </div>
        <p className={["text-lg font-bold text-slate-700", urf].join(" ")}>{f(UI.noHeirs)}</p>
        <p className={["mt-1 text-sm text-slate-500", urf].join(" ")}>{f(UI.noHeirsSub)}</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* summary strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label={f(UI.asl)} value={`${res.asl}`} tone="emerald" rtl={ur} />
        <Stat label={f(UI.finalBase)} value={`${res.finalBase}`} tone="teal" rtl={ur} />
        <Stat
          label={f(UI.awl)}
          value={res.awl ? f(UI.yes) : f(UI.no)}
          tone={res.awl ? "amber" : "slate"}
          urdu={ur}
          rtl={ur}
        />
        <Stat
          label={f(UI.radd)}
          value={res.radd ? f(UI.yes) : f(UI.no)}
          tone={res.radd ? "sky" : "slate"}
          urdu={ur}
          rtl={ur}
        />
      </div>

      {showMoney && (
        <div className="overflow-hidden rounded-2xl border border-emerald-200 bg-gradient-to-l from-emerald-600 to-teal-700 p-4 text-white shadow-lg shadow-emerald-900/10">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className={["text-xs opacity-80", urf].join(" ")}>{f(UI.netEstate)}</div>
              <div className="font-en text-2xl font-extrabold tabular-nums">{money(res.money.net)}</div>
            </div>
            <div className={["grid grid-cols-2 gap-x-6 gap-y-1 text-xs opacity-90 sm:grid-cols-4", urf].join(" ")}>
              <Mini label={f(UI.estate)} v={money(res.money.estate)} />
              <Mini label={f(UI.funeral)} v={money(res.money.funeral)} />
              <Mini label={f(UI.debts)} v={money(res.money.debts)} />
              <Mini label={f(UI.bequest)} v={money(res.money.bequestPaid)} />
            </div>
          </div>
        </div>
      )}

      {/* bars */}
      <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <h3 className={["mb-4 text-base font-bold text-emerald-900", urf].join(" ")}>
          {f(UI.results)}
        </h3>
        <div className="space-y-3">
          {res.rows.map((r, i) => (
            <div key={r.key} className="animate-fade-up" style={{ animationDelay: `${i * 45}ms` }}>
              <div className="mb-1 flex items-baseline justify-between gap-2">
                <span className={["text-sm font-bold text-slate-700", urf].join(" ")}>
                  {f(HEIR_LABEL[r.key])}
                  {r.count > 1 && <span className="font-en text-xs text-slate-400"> × {r.count}</span>}
                </span>
                <span className="font-en text-xs font-bold tabular-nums text-slate-500">
                  {fmt(r.fraction)} · {r.percent.toFixed(2)}%
                </span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className={`animate-bar h-full rounded-full bg-gradient-to-l ${PALETTE[i % PALETTE.length]}`}
                  style={{ width: `${Math.max(1.2, r.percent)}%` }}
                />
              </div>
            </div>
          ))}
          {res.leftover.n > 0 && (
            <div>
              <div className="mb-1 flex items-baseline justify-between gap-2">
                <span className={["text-sm font-bold text-slate-500", urf].join(" ")}>
                  {ur ? "ذوی الارحام / بیت المال" : "Distant kindred / Treasury"}
                </span>
                <span className="font-en text-xs font-bold text-slate-400">{fmt(res.leftover)}</span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-[repeating-linear-gradient(45deg,#cbd5e1_0,#cbd5e1_6px,#e2e8f0_6px,#e2e8f0_12px)]"
                  style={{ width: `${(res.leftover.n / res.leftover.d) * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* detail table */}
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full text-start">
            <thead>
              <tr className="bg-emerald-50/80 text-emerald-900">
                {[UI.heir, UI.count, UI.share, UI.shareUnits, UI.perPerson, UI.percent].map((h, i) => (
                  <th key={i} className={["px-4 py-3 text-start text-xs font-bold", urf].join(" ")}>
                    {f(h)}
                  </th>
                ))}
                {showMoney && (
                  <th className={["px-4 py-3 text-start text-xs font-bold", urf].join(" ")}>
                    {f(UI.amount)}
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {res.rows.map((r) => (
                <tr key={r.key} className="border-t border-slate-100 align-top hover:bg-emerald-50/40">
                  <td className="px-4 py-3">
                    <div className={["text-sm font-bold text-slate-800", urf].join(" ")}>
                      {f(HEIR_LABEL[r.key])}
                    </div>
                    <div className={["mt-0.5 text-[11px] leading-snug text-slate-500", urf].join(" ")}>
                      {f(r.basis)}
                    </div>
                    <span
                      className={[
                        "mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold",
                        r.status === "asaba"
                          ? "bg-amber-100 text-amber-800"
                          : r.status === "fard_asaba"
                            ? "bg-violet-100 text-violet-800"
                            : r.status === "radd"
                              ? "bg-sky-100 text-sky-800"
                              : "bg-emerald-100 text-emerald-800",
                        urf,
                      ].join(" ")}
                    >
                      {f(STATUS_LABEL[r.status])}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-en text-sm tabular-nums text-slate-600">{r.count}</td>
                  <td className="px-4 py-3 font-en text-base font-extrabold tabular-nums text-emerald-700">
                    {fmt(r.fraction)}
                  </td>
                  <td className="px-4 py-3 font-en text-sm tabular-nums text-slate-600">
                    {r.units} / {res.finalBase}
                  </td>
                  <td className="px-4 py-3 font-en text-sm tabular-nums text-slate-600">
                    {fmt(r.perPerson)}
                  </td>
                  <td className="px-4 py-3 font-en text-sm tabular-nums text-slate-600">
                    {r.percent.toFixed(2)}%
                  </td>
                  {showMoney && (
                    <td className="px-4 py-3">
                      <div className="font-en text-sm font-bold tabular-nums text-slate-800">
                        {money(r.amount)}
                      </div>
                      {r.count > 1 && (
                        <div className="font-en text-[11px] tabular-nums text-slate-400">
                          {money(r.perPersonAmount)} × {r.count}
                        </div>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* mobile cards */}
        <div className="divide-y divide-slate-100 md:hidden">
          {res.rows.map((r) => (
            <div key={r.key} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className={["text-sm font-bold text-slate-800", urf].join(" ")}>
                    {f(HEIR_LABEL[r.key])}
                    {r.count > 1 && <span className="font-en text-xs text-slate-400"> × {r.count}</span>}
                  </div>
                  <div className={["mt-1 text-[11px] leading-snug text-slate-500", urf].join(" ")}>
                    {f(r.basis)}
                  </div>
                </div>
                <div className="text-end">
                  <div className="font-en text-lg font-extrabold text-emerald-700">{fmt(r.fraction)}</div>
                  <div className="font-en text-[11px] text-slate-400">{r.percent.toFixed(2)}%</div>
                </div>
              </div>
              {showMoney && (
                <div className="mt-2 flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
                  <span className={["text-[11px] text-slate-500", urf].join(" ")}>{f(UI.amount)}</span>
                  <span className="font-en text-sm font-bold tabular-nums text-slate-800">
                    {money(r.amount)}
                    {r.count > 1 && (
                      <span className="text-[11px] font-normal text-slate-400">
                        {" "}
                        ({money(r.perPersonAmount)} × {r.count})
                      </span>
                    )}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* excluded */}
      {res.excluded.length > 0 && (
        <div className="rounded-3xl border border-rose-100 bg-rose-50/50 p-4 sm:p-5">
          <h3 className={["mb-3 flex items-center gap-2 text-sm font-bold text-rose-900", urf].join(" ")}>
            <span className="text-base">⛔</span> {f(UI.excludedTitle)}
          </h3>
          <ul className="space-y-2">
            {res.excluded.map((e) => (
              <li
                key={e.key}
                className="flex flex-wrap items-baseline gap-x-2 rounded-xl bg-white/70 px-3 py-2"
              >
                <span className={["text-sm font-bold text-slate-700", urf].join(" ")}>
                  {f(HEIR_LABEL[e.key])}
                  {e.count > 1 && <span className="font-en text-xs text-slate-400"> × {e.count}</span>}
                </span>
                <span className={["text-[12px] leading-relaxed text-slate-500", urf].join(" ")}>
                  — {f(e.reason)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* notes */}
      {res.notes.length > 0 && (
        <div className="rounded-3xl border border-amber-200 bg-amber-50/60 p-4 sm:p-5">
          <h3 className={["mb-2 flex items-center gap-2 text-sm font-bold text-amber-900", urf].join(" ")}>
            <span>📜</span> {f(UI.notes)}
          </h3>
          <ul className="space-y-2">
            {res.notes.map((n, i) => (
              <li key={i} className={["text-[13px] leading-loose text-amber-900/90", urf].join(" ")}>
                • {f(n)}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
  urdu,
  rtl,
}: {
  label: string;
  value: string;
  tone: "emerald" | "teal" | "amber" | "sky" | "slate";
  urdu?: boolean;
  rtl?: boolean;
}) {
  const tones: Record<string, string> = {
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-800",
    teal: "border-teal-200 bg-teal-50 text-teal-800",
    amber: "border-amber-300 bg-amber-50 text-amber-800",
    sky: "border-sky-300 bg-sky-50 text-sky-800",
    slate: "border-slate-200 bg-slate-50 text-slate-500",
  };
  return (
    <div className={`rounded-2xl border px-3 py-2.5 text-center ${tones[tone]}`}>
      <div className={`${rtl ? "font-ur" : "font-en"} text-[11px] opacity-80`}>{label}</div>
      <div className={`${urdu ? "font-ur text-base" : "font-en text-xl"} font-extrabold tabular-nums`}>
        {value}
      </div>
    </div>
  );
}

function Mini({ label, v }: { label: string; v: string }) {
  return (
    <div className="flex items-baseline gap-1">
      <span className="opacity-70">{label}:</span>
      <span className="font-en font-semibold tabular-nums">{v}</span>
    </div>
  );
}
