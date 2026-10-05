import { useMemo, useState } from "react";
import { F, fmt } from "../lib/fraction";
import { GROUPS, HEIR_HINT, HEIR_LABEL, MUNA, UI, type Lang } from "../lib/i18n";
import {
  MAX_COUNT, calculate, emptyCounts,
  type CalcResult, type Counts, type HeirKey,
} from "../lib/faraid";
import {
  applyMunasakhaStage, createInitialState, genderOfHeir, nextPersonId, resetPersonIds,
  type Gender, type MunasakhaState, type Person,
} from "../lib/munasakha";
import Stepper from "./Stepper";

type Step = "base" | "pick" | "heirs";

const money = (n: number) =>
  new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(Math.round(n * 100) / 100);
const urduDigit = (n: number) => String(n).replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[Number(d)]);

export default function MunasakhaPanel({ lang }: { lang: Lang }) {
  const ur = lang === "ur";
  const f = (o: { ur: string; en: string }) => (ur ? o.ur : o.en);
  const urf = ur ? "font-ur" : "font-en";
  const L = (k: HeirKey) => f(HEIR_LABEL[k]);

  const [step, setStep] = useState<Step>("base");
  const [gender, setGender] = useState<Gender>("male");
  const [counts, setCounts] = useState<Counts>(emptyCounts());
  const [estate, setEstate] = useState("");
  const [funeral, setFuneral] = useState("");
  const [debts, setDebts] = useState("");
  const [bequest, setBequest] = useState("");
  const [baseError, setBaseError] = useState<string | null>(null);

  const [ms, setMs] = useState<MunasakhaState | null>(null);
  const [baseRes, setBaseRes] = useState<CalcResult | null>(null);
  const [baseJamia, setBaseJamia] = useState(1);

  const [deceasedId, setDeceasedId] = useState<string | null>(null);
  const [localCounts, setLocalCounts] = useState<Counts>(emptyCounts());
  const [identity, setIdentity] = useState<Record<string, string>>({});
  const [stageError, setStageError] = useState<string | null>(null);
  const [openStages, setOpenStages] = useState<Record<number, boolean>>({});

  const netEstate = baseRes ? baseRes.money.net : 0;
  const showMoney = netEstate > 0;

  const personName = (key: HeirKey, n: number) =>
    `${L(key)} (${ur ? urduDigit(n) : n})`;

  const visibleKeys = (keys: HeirKey[], g: Gender) =>
    keys.filter((k) => {
      if (k === "husband") return g === "female";
      if (k === "wife") return g === "male";
      return true;
    });

  /* ── Step 1: lock the original (base) case ─────────────────── */
  const start = () => {
    const res = calculate({
      counts,
      gender,
      estate: parseFloat(estate) || 0,
      funeral: parseFloat(funeral) || 0,
      debts: parseFloat(debts) || 0,
      bequest: parseFloat(bequest) || 0,
    });
    if (!res.ok || res.rows.length === 0) {
      setBaseError(f(UI.noHeirs));
      return;
    }
    resetPersonIds();
    const counters: Partial<Record<HeirKey, number>> = {};
    const st = createInitialState(res, (key: HeirKey) => {
      const n = (counters[key] = (counters[key] ?? 0) + 1);
      return { id: nextPersonId(), name: personName(key, n), role: key, gender: genderOfHeir(key) };
    });
    if (st.error) {
      setBaseError(st.error);
      return;
    }
    setBaseRes(res);
    setMs(st);
    setBaseJamia(st.jamia);
    setStep("pick");
    setBaseError(null);
  };

  const dec = ms && deceasedId ? ms.persons[deceasedId] : undefined;
  const decGender: Gender = dec?.gender ?? "male";

  const localRes: CalcResult | null = useMemo(() => {
    if (step !== "heirs" || !deceasedId) return null;
    const g = ms!.persons[deceasedId].gender;
    return calculate({ counts: localCounts, gender: g, estate: 0, funeral: 0, debts: 0, bequest: 0 });
  }, [step, localCounts, deceasedId]); // eslint-disable-line react-hooks/exhaustive-deps

  const localInstances = useMemo(() => {
    if (!localRes) return [] as { mapKey: string; key: HeirKey }[];
    const out: { mapKey: string; key: HeirKey }[] = [];
    localRes.rows.forEach((r) => {
      for (let i = 0; i < r.count; i++) out.push({ mapKey: `${r.key}#${i}`, key: r.key });
    });
    return out;
  }, [localRes]);

  /* ── Step 3→4: couple this death into the unified state ────── */
  const applyStage = () => {
    if (!ms || !deceasedId || !localRes) return;
    if (!localRes.ok || localRes.rows.length === 0) {
      setStageError(f(MUNA.errNoLocalHeirs));
      return;
    }
    const st = ms;
    const counters: Partial<Record<HeirKey, number>> = {};
    const out = applyMunasakhaStage(st, {
      deceasedId,
      localCalc: localRes,
      makeLocalPerson: (key: HeirKey, index: number) => {
        const chosen = identity[`${key}#${index}`] ?? "new";
        if (chosen !== "new" && st.persons[chosen] && chosen !== deceasedId) {
          return st.persons[chosen]; // §30: same immutable person id ⇒ merge
        }
        const n = (counters[key] = (counters[key] ?? 0) + 1);
        const existing = Object.values(st.persons).filter((p) => p.role === key).length;
        return {
          id: nextPersonId(),
          name: personName(key, existing + n),
          role: key,
          gender: genderOfHeir(key),
        };
      },
    });
    if (out.error) {
      setStageError(out.error); // §31/§27: never present an invalid result as valid
      return;
    }
    setMs(out);
    setStep("pick");
    setDeceasedId(null);
    setLocalCounts(emptyCounts());
    setIdentity({});
    setStageError(null);
  };

  const resetAll = () => {
    setStep("base");
    setMs(null);
    setBaseRes(null);
    setDeceasedId(null);
    setCounts(emptyCounts());
    setLocalCounts(emptyCounts());
    setIdentity({});
    setStageError(null);
    setBaseError(null);
  };

  const rowCells = (id: string, units: number, jamia: number, role: HeirKey) => {
    const frac = F(units, jamia);
    return (
      <>
        <td className={["px-4 py-2.5 text-sm font-bold text-slate-800", urf].join(" ")}>
          {ms!.persons[id]?.name ?? id}
        </td>
        <td className={["px-4 py-2.5 text-xs text-slate-500", urf].join(" ")}>{L(role)}</td>
        <td className="px-4 py-2.5 font-en text-sm font-extrabold tabular-nums text-emerald-700">
          {units} / {jamia}
        </td>
        <td className="px-4 py-2.5 font-en text-sm tabular-nums text-slate-600">{fmt(frac)}</td>
        <td className="px-4 py-2.5 font-en text-sm tabular-nums text-slate-600">
          {((units / jamia) * 100).toFixed(2)}%
        </td>
        {showMoney && (
          <td className="px-4 py-2.5 font-en text-sm font-bold tabular-nums text-slate-800">
            {money((units / jamia) * netEstate)}
          </td>
        )}
      </>
    );
  };

  const headCells = [UI.heir, { ur: "رشتہ", en: "Relation" }, { ur: "سہام", en: "Units" }, UI.share, UI.percent, ...(showMoney ? [UI.amount] : [])];

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <p className={["rounded-2xl border border-emerald-100 bg-emerald-50/60 px-4 py-3 text-[13px] leading-loose text-emerald-900", urf].join(" ")}>
        ⛓️ {f(MUNA.munaIntro)}
      </p>

      {/* ── Step 1: original deceased ─────────────────────────── */}
      {step === "base" && (
        <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <h2 className={["mb-4 text-lg font-bold text-emerald-900", urf].join(" ")}>
            {f(MUNA.step1)}
          </h2>
          <div className="mb-4 flex items-center gap-2">
            <span className={["text-xs text-slate-500", urf].join(" ")}>{f(UI.gender)}</span>
            <div className="flex rounded-xl bg-slate-100 p-1">
              {(["male", "female"] as const).map((g) => (
                <button
                  key={g}
                  onClick={() => setGender(g)}
                  className={[
                    "rounded-lg px-4 py-1.5 text-xs font-bold transition",
                    gender === g ? "bg-emerald-600 text-white shadow" : "text-slate-500 hover:text-emerald-700",
                    urf,
                  ].join(" ")}
                >
                  {g === "male" ? f(UI.male) : f(UI.female)}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            {GROUPS.map((grp) => {
              const keys = visibleKeys(grp.keys, gender);
              if (!keys.length) return null;
              return (
                <div key={grp.id}>
                  <div className="mb-3 flex items-center gap-2">
                    <span className="text-base">{grp.icon}</span>
                    <h3 className={["text-sm font-bold text-emerald-800", urf].join(" ")}>{f(grp.title)}</h3>
                    <span className="h-px flex-1 bg-gradient-to-l from-transparent via-emerald-200 to-transparent" />
                  </div>
                  <div className="grid gap-2.5 sm:grid-cols-2">
                    {keys.map((k) => (
                      <Stepper
                        key={k}
                        lang={lang}
                        label={L(k)}
                        hint={HEIR_HINT[k] ? f(HEIR_HINT[k]!) : undefined}
                        value={counts[k]}
                        max={MAX_COUNT[k] ?? 30}
                        onChange={(v) => setCounts((p) => ({ ...p, [k]: v }))}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-4">
            {[
              { label: f(UI.estate), v: estate, s: setEstate },
              { label: f(UI.funeral), v: funeral, s: setFuneral },
              { label: f(UI.debts), v: debts, s: setDebts },
              { label: f(UI.bequest), v: bequest, s: setBequest },
            ].map((it) => (
              <div key={it.label}>
                <label className={["mb-1 block text-[11px] text-slate-500", urf].join(" ")}>{it.label}</label>
                <input
                  type="number" inputMode="decimal" value={it.v}
                  onChange={(e) => it.s(e.target.value)} placeholder="0"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2 font-en text-sm font-semibold tabular-nums outline-none focus:border-emerald-400 focus:bg-white"
                />
              </div>
            ))}
          </div>

          {baseError && (
            <p className={["mt-3 rounded-xl bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700", urf].join(" ")}>
              {baseError}
            </p>
          )}
          <button
            onClick={start}
            className={["mt-4 w-full rounded-xl bg-gradient-to-l from-emerald-600 to-teal-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-600/20 transition hover:brightness-110", urf].join(" ")}
          >
            {f(MUNA.saveBase)}
          </button>
        </section>
      )}

      {ms && (
        <>
          {/* ── Original distribution ─────────────────────────── */}
          <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <h3 className={["border-b border-slate-100 bg-emerald-50/60 px-4 py-3 text-sm font-bold text-emerald-900", urf].join(" ")}>
              {f(MUNA.baseResult)} — {f(UI.asl)}: {baseJamia}
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-slate-400">
                    {headCells.map((h, i) => (
                      <th key={i} className={["px-4 py-2 text-start text-[11px] font-bold", urf].join(" ")}>{f(h)}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(ms.initialLiving).map(([id, u]) => (
                    <tr key={id} className="border-t border-slate-100">
                      {rowCells(id, u, baseJamia, ms.persons[id].role)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* ── Step 2: pick the heir who died ────────────────── */}
          {step === "pick" && (
            <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
              <h3 className={["mb-3 text-sm font-bold text-emerald-900", urf].join(" ")}>
                {f(MUNA.pickDeceased)}
              </h3>
              <div className="grid gap-2.5 sm:grid-cols-2">
                {Object.entries(ms.living).map(([id, u]) => (
                  <div
                    key={id}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2.5"
                  >
                    <div className="min-w-0">
                      <div className={["truncate text-sm font-bold text-slate-800", urf].join(" ")}>
                        {ms.persons[id].name}
                      </div>
                      <div className={["text-[11px] text-slate-400", urf].join(" ")}>
                        {L(ms.persons[id].role)} ·{" "}
                        <span className="font-en">{u} / {ms.jamia}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setDeceasedId(id);
                        setLocalCounts(emptyCounts());
                        setIdentity({});
                        setStageError(null);
                        setStep("heirs");
                      }}
                      className={["shrink-0 rounded-xl bg-amber-100 px-3 py-1.5 text-[11px] font-bold text-amber-900 transition hover:bg-amber-200", urf].join(" ")}
                    >
                      ✝ {f(MUNA.died)}
                    </button>
                  </div>
                ))}
              </div>
              {stageError && (
                <p className={["mt-3 rounded-xl bg-rose-50 px-3 py-2 text-xs font-bold leading-relaxed text-rose-700", urf].join(" ")}>
                  {stageError}
                </p>
              )}
            </section>
          )}

          {/* ── Step 3: the secondary deceased's own heirs ────── */}
          {step === "heirs" && dec && (
            <section className="rounded-3xl border border-amber-200 bg-white p-4 shadow-sm sm:p-6">
              <h3 className={["mb-1 text-lg font-bold text-emerald-900", urf].join(" ")}>
                [{dec.name}] — {f(MUNA.enterLocalHeirs)}
              </h3>
              <p className={["mb-4 rounded-xl bg-amber-50 px-3 py-2 text-xs font-bold text-amber-900", urf].join(" ")}>
                {f(MUNA.deceasedShare)}: <span className="font-en">{ms.living[dec.id]} / {ms.jamia}</span>
              </p>

              <div className="space-y-6">
                {GROUPS.map((grp) => {
                  const keys = visibleKeys(grp.keys, decGender);
                  if (!keys.length) return null;
                  return (
                    <div key={grp.id}>
                      <div className="mb-3 flex items-center gap-2">
                        <span className="text-base">{grp.icon}</span>
                        <h4 className={["text-sm font-bold text-emerald-800", urf].join(" ")}>{f(grp.title)}</h4>
                        <span className="h-px flex-1 bg-gradient-to-l from-transparent via-amber-200 to-transparent" />
                      </div>
                      <div className="grid gap-2.5 sm:grid-cols-2">
                        {keys.map((k) => (
                          <Stepper
                            key={k}
                            lang={lang}
                            label={L(k)}
                            hint={HEIR_HINT[k] ? f(HEIR_HINT[k]!) : undefined}
                            value={localCounts[k]}
                            max={MAX_COUNT[k] ?? 30}
                            onChange={(v) => setLocalCounts((p) => ({ ...p, [k]: v }))}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* §30: identity mapping — merge with an existing person if applicable */}
              {localInstances.length > 0 && (
                <div className="mt-5 rounded-2xl border border-slate-100 bg-slate-50/60 p-3">
                  <div className={["mb-2 text-[11px] font-bold text-slate-500", urf].join(" ")}>
                    {f(MUNA.samePerson)}
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {localInstances.map((inst) => (
                      <label key={inst.mapKey} className="flex items-center gap-2 text-xs">
                        <span className={["w-24 shrink-0 text-slate-600", urf].join(" ")}>
                          {personName(inst.key, Number(inst.mapKey.split("#")[1]) + 1)}
                        </span>
                        <select
                          value={identity[inst.mapKey] ?? "new"}
                          onChange={(e) => setIdentity((p) => ({ ...p, [inst.mapKey]: e.target.value }))}
                          className={["w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs outline-none focus:border-emerald-400", urf].join(" ")}
                        >
                          <option value="new">{f(MUNA.newPerson)}</option>
                          {Object.values(ms.persons)
                            .filter((p) => p.id !== dec.id && p.gender === genderOfHeir(inst.key))
                            .map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name}
                              </option>
                            ))}
                        </select>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {stageError && (
                <p className={["mt-3 rounded-xl bg-rose-50 px-3 py-2 text-xs font-bold leading-relaxed text-rose-700", urf].join(" ")}>
                  {stageError}
                </p>
              )}
              <div className="mt-4 flex gap-2">
                <button
                  onClick={applyStage}
                  className={["flex-1 rounded-xl bg-gradient-to-l from-amber-500 to-orange-500 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-amber-600/20 transition hover:brightness-110", urf].join(" ")}
                >
                  {f(MUNA.calcMuna)}
                </button>
                <button
                  onClick={() => { setStep("pick"); setDeceasedId(null); setStageError(null); }}
                  className={["rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-600 hover:text-rose-600", urf].join(" ")}
                >
                  {f(MUNA.cancel)}
                </button>
              </div>
            </section>
          )}

          {/* ── Final unified result (after ≥1 stage) ─────────── */}
          {ms.stages.length > 0 && (
            <section className="overflow-hidden rounded-3xl border border-emerald-300 bg-white shadow-sm">
              <h3 className={["border-b border-emerald-100 bg-emerald-600 px-4 py-3 text-sm font-bold text-white", urf].join(" ")}>
                {f(MUNA.finalResult)} — {f(MUNA.newJamia)}: {ms.jamia}
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-slate-400">
                      {headCells.map((h, i) => (
                        <th key={i} className={["px-4 py-2 text-start text-[11px] font-bold", urf].join(" ")}>{f(h)}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(ms.living)
                      .sort(([, a], [, b]) => b - a)
                      .map(([id, u]) => (
                        <tr key={id} className="border-t border-slate-100">
                          {rowCells(id, u, ms.jamia, ms.persons[id].role)}
                        </tr>
                      ))}
                    <tr className="border-t-2 border-emerald-200 bg-emerald-50/50 font-bold">
                      <td className={["px-4 py-2.5 text-sm text-emerald-900", urf].join(" ")}>{f(MUNA.total)}</td>
                      <td />
                      <td className="px-4 py-2.5 font-en text-sm tabular-nums text-emerald-800">
                        {Object.values(ms.living).reduce((a, b) => a + b, 0)} / {ms.jamia}
                      </td>
                      <td className="px-4 py-2.5 font-en text-sm tabular-nums text-emerald-800">1</td>
                      <td className="px-4 py-2.5 font-en text-sm tabular-nums text-emerald-800">100%</td>
                      {showMoney && (
                        <td className="px-4 py-2.5 font-en text-sm tabular-nums text-emerald-800">
                          {money(netEstate)}
                        </td>
                      )}
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* ── Stage history with expandable expert view (§21/§32) ── */}
          {ms.stages.length > 0 && (
            <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
              <h3 className={["mb-3 text-sm font-bold text-emerald-900", urf].join(" ")}>
                {f(MUNA.stageHistory)}
              </h3>
              <div className="space-y-2">
                {ms.stages.map((t) => {
                  const open = !!openStages[t.stageNumber];
                  return (
                    <div key={t.stageNumber} className="overflow-hidden rounded-2xl border border-slate-200">
                      <button
                        onClick={() => setOpenStages((p) => ({ ...p, [t.stageNumber]: !open }))}
                        className="flex w-full items-center justify-between bg-slate-50/80 px-4 py-2.5 text-start"
                      >
                        <span className={["text-sm font-bold text-slate-700", urf].join(" ")}>
                          {f(MUNA.stageLabel)} {ur ? urduDigit(t.stageNumber) : t.stageNumber} — {t.deceasedName}
                        </span>
                        <span className="flex items-center gap-3">
                          <span className="font-en text-xs font-bold tabular-nums text-emerald-700">
                            {t.previousJamia} → {t.newJamia}
                          </span>
                          <span className={`text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}>▾</span>
                        </span>
                      </button>
                      {open && (
                        <div className="animate-fade-up space-y-3 p-4 text-xs">
                          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                            <Fact l={f(MUNA.deceasedShare)} v={`${t.accumulatedShare} / ${t.previousJamia}`} />
                            <Fact l={f(MUNA.localBase)} v={`${t.localBase}`} />
                            <Fact l={f(MUNA.gcdLabel)} v={`${t.gcdValue}`} />
                            <Fact l={f(MUNA.prevJamia)} v={`${t.previousJamia}`} />
                            <Fact l={f(MUNA.mGlobal)} v={`${t.globalMultiplier}`} />
                            <Fact l={f(MUNA.mLocal)} v={`${t.localMultiplier}`} />
                            <Fact l={f(MUNA.newJamia)} v={`${t.newJamia}`} col />
                          </div>
                          <MiniTable title={f(MUNA.updatedHeirs)} rows={t.updatedRows} mult={t.globalMultiplier} urf={urf} L={L} />
                          <MiniTable title={f(MUNA.newHeirs)} rows={t.newHeirRows} mult={t.localMultiplier} urf={urf} L={L} />
                          <p className={["rounded-xl bg-emerald-50 px-3 py-2 font-bold text-emerald-800", urf].join(" ")}>
                            ✓ {f(MUNA.verified)} ({t.mergedRows.reduce((a, r) => a + r.units, 0)} = {t.newJamia})
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          <div className="no-print flex gap-2">
            <button
              onClick={resetAll}
              className={["rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-600 transition hover:border-rose-300 hover:text-rose-600", urf].join(" ")}
            >
              {f(MUNA.resetAll)}
            </button>
            <button
              onClick={() => window.print()}
              className={["rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-600 transition hover:border-emerald-300 hover:text-emerald-700", urf].join(" ")}
            >
              {f(UI.print)}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function Fact({ l, v, col }: { l: string; v: string; col?: boolean }) {
  return (
    <div className={`rounded-xl border border-slate-100 bg-slate-50/60 px-3 py-2 ${col ? "col-span-2 sm:col-span-1" : ""}`}>
      <div className="text-[10px] text-slate-400">{l}</div>
      <div className="font-en text-sm font-extrabold tabular-nums text-slate-800">{v}</div>
    </div>
  );
}

function MiniTable({
  title, rows, mult, urf, L,
}: {
  title: string;
  rows: { id: string; name: string; role: keyof typeof HEIR_LABEL; units: number }[];
  mult: number;
  urf: string;
  L: (k: keyof typeof HEIR_LABEL) => string;
}) {
  return (
    <div>
      <div className={["mb-1 font-bold text-slate-500", urf].join(" ")}>{title}</div>
      <ul className="space-y-1">
        {rows.map((r) => (
          <li key={r.id} className="flex items-center justify-between rounded-lg bg-slate-50/60 px-3 py-1.5 font-en tabular-nums text-slate-700">
            <span>{r.name} × {mult}</span>
            <span className="font-bold">= {r.units}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
