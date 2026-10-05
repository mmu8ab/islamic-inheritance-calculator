import { useEffect, useMemo, useRef, useState } from "react";
import MunasakhaPanel from "./components/MunasakhaPanel";
import Results from "./components/Results";
import Stepper from "./components/Stepper";
import { MAX_COUNT, calculate, emptyCounts, type Counts, type HeirKey } from "./lib/faraid";
import {
  GROUPS,
  HEIR_HINT,
  HEIR_LABEL,
  INSTRUCTIONS,
  MUNA,
  SAMPLES,
  UI,
  type Lang,
} from "./lib/i18n";

export default function App() {
  const [lang, setLang] = useState<Lang>("ur");
  const [mode, setMode] = useState<"normal" | "muna">("normal");
  const [gender, setGender] = useState<"male" | "female">("male");
  const [counts, setCounts] = useState<Counts>(emptyCounts());
  const [estate, setEstate] = useState<string>("");
  const [funeral, setFuneral] = useState<string>("");
  const [debts, setDebts] = useState<string>("");
  const [bequest, setBequest] = useState<string>("");
  const [openInfo, setOpenInfo] = useState(false);
  const [openAdv, setOpenAdv] = useState(false);
  const resultRef = useRef<HTMLDivElement | null>(null);

  const ur = lang === "ur";
  const f = (o: { ur: string; en: string }) => (ur ? o.ur : o.en);
  const urf = ur ? "font-ur" : "font-en";

  useEffect(() => {
    document.documentElement.lang = ur ? "ur" : "en";
    document.documentElement.dir = ur ? "rtl" : "ltr";
  }, [ur]);

  const res = useMemo(
    () =>
      calculate({
        counts,
        gender,
        estate: parseFloat(estate) || 0,
        funeral: parseFloat(funeral) || 0,
        debts: parseFloat(debts) || 0,
        bequest: parseFloat(bequest) || 0,
      }),
    [counts, gender, estate, funeral, debts, bequest],
  );

  const set = (k: HeirKey, v: number) => setCounts((p) => ({ ...p, [k]: v }));

  const reset = () => {
    setCounts(emptyCounts());
    setEstate("");
    setFuneral("");
    setDebts("");
    setBequest("");
  };

  const applySample = (s: (typeof SAMPLES)[number]) => {
    const base = emptyCounts();
    (Object.entries(s.counts) as [HeirKey, number][]).forEach(([k, v]) => (base[k] = v));
    setGender(s.gender);
    setCounts(base);
    setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
  };

  const selected = (Object.entries(counts) as [HeirKey, number][]).filter(([k, v]) => {
    if (v <= 0) return false;
    if (k === "husband" && gender === "male") return false;
    if (k === "wife" && gender === "female") return false;
    return true;
  });

  const visibleKeys = (keys: HeirKey[]) =>
    keys.filter((k) => {
      if (k === "husband") return gender === "female";
      if (k === "wife") return gender === "male";
      return true;
    });

  return (
    <div className="min-h-screen bg-[#f5f7f6] text-slate-800">
      {/* ── Header ───────────────────────────────────────────── */}
      <header className="relative overflow-hidden bg-gradient-to-bl from-[#04261d] via-[#075244] to-[#0b6b52] text-white">
        <div className="pattern-geo absolute inset-0 opacity-70" />
        <div className="absolute -top-24 start-1/4 h-72 w-72 rounded-full bg-emerald-400/20 blur-3xl" />
        <div className="absolute -bottom-32 end-10 h-80 w-80 rounded-full bg-amber-300/10 blur-3xl" />

        <div className="relative mx-auto max-w-6xl px-4 pb-14 pt-5 sm:px-6">
          <nav className="mb-10 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-2xl ring-1 ring-white/20 backdrop-blur">
                ☪︎
              </div>
              <div className="leading-tight">
                <div className={["text-sm font-bold tracking-wide", urf].join(" ")}>
                  {ur ? "علمِ فرائض" : "ʿIlm al-Farāʾiḍ"}
                </div>
                <div className="font-en text-[10px] uppercase tracking-[0.25em] text-emerald-200/80">
                  Faraid Engine
                </div>
              </div>
            </div>

            <div className="no-print flex items-center gap-1 rounded-full bg-white/10 p-1 ring-1 ring-white/20 backdrop-blur">
              {(["ur", "en"] as Lang[]).map((l) => (
                <button
                  key={l}
                  onClick={() => setLang(l)}
                  className={[
                    "rounded-full px-4 py-1.5 text-xs font-bold transition",
                    lang === l ? "bg-white text-emerald-800 shadow" : "text-white/80 hover:text-white",
                  ].join(" ")}
                >
                  {l === "ur" ? "اردو" : "English"}
                </button>
              ))}
            </div>
          </nav>

          <div className="max-w-3xl">
            <p className={["mb-3 text-amber-200/90", ur ? "font-amiri text-xl" : "font-amiri text-lg"].join(" ")}>
              {UI.quran.ur}
            </p>
            <h1
              className={[
                "text-4xl font-extrabold leading-[1.6] drop-shadow-sm sm:text-5xl",
                ur ? "font-ur" : "font-en",
              ].join(" ")}
            >
              {f(UI.brand)}
            </h1>
            <p className={["mt-2 max-w-xl text-emerald-100/90", urf].join(" ")}>{f(UI.tagline)}</p>

            <div className="mt-6 flex flex-wrap gap-2">
              {[
                ur ? "حجب و محرومی" : "Exclusion (Hijab)",
                ur ? "عول" : "ʿAwl",
                ur ? "رد" : "Radd",
                ur ? "عصبہ مع الغیر" : "ʿAsabah maʿa al-ghayr",
                ur ? "مسئلہ عمریتین" : "Umariyyatayn",
                ur ? "مناسخہ" : "Munasakha",
              ].map((t) => (
                <span
                  key={t}
                  className={["rounded-full bg-white/10 px-3 py-1 text-xs ring-1 ring-white/15 backdrop-blur", urf].join(" ")}
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>

        <svg viewBox="0 0 1440 60" className="relative block w-full" preserveAspectRatio="none">
          <path d="M0 60 C 240 0 480 0 720 30 C 960 60 1200 60 1440 20 L1440 60 Z" fill="#f5f7f6" />
        </svg>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
        {/* ── Mode tabs: عام تقسیم میراث | مناسخہ ─────────────── */}
        <div className="no-print -mt-4 mb-6 flex justify-center">
          <div className="inline-flex rounded-2xl border border-emerald-200 bg-white p-1 shadow-sm">
            {(
              [
                { id: "normal", label: f(MUNA.tabNormal) },
                { id: "muna", label: f(MUNA.tabMuna) },
              ] as const
            ).map((t) => (
              <button
                key={t.id}
                onClick={() => setMode(t.id)}
                className={[
                  "rounded-xl px-6 py-2.5 text-sm font-bold transition",
                  mode === t.id
                    ? "bg-gradient-to-l from-emerald-600 to-teal-600 text-white shadow"
                    : "text-slate-500 hover:text-emerald-700",
                  urf,
                ].join(" ")}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {mode === "muna" ? (
          <MunasakhaPanel lang={lang} />
        ) : (
          <>
            {/* ── Instructions ─────────────────────────────────── */}
            <section className="no-print -mt-4 mb-6">
              <button
                onClick={() => setOpenInfo((o) => !o)}
                className="flex w-full items-center justify-between rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-start shadow-sm transition hover:border-emerald-300"
              >
                <span className={["flex items-center gap-2 font-bold text-emerald-900", urf].join(" ")}>
                  <span className="text-lg">📌</span> {f(UI.instructions)}
                </span>
                <span className={`text-emerald-600 transition-transform ${openInfo ? "rotate-180" : ""}`}>▾</span>
              </button>
              {openInfo && (
                <ul className="animate-fade-up mt-2 space-y-2 rounded-2xl border border-emerald-100 bg-white/80 p-4">
                  {INSTRUCTIONS.map((t, i) => (
                    <li key={i} className={["text-[13px] leading-loose text-slate-600", urf].join(" ")}>
                      <span className="me-1 font-bold text-emerald-600">{i + 1}.</span>
                      {f(t)}
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <div className="grid gap-6 lg:grid-cols-12">
              {/* ── Inputs ─────────────────────────────────────── */}
              <div className="space-y-5 lg:col-span-7">
                <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
                  <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                    <h2 className={["text-xl font-bold text-emerald-900", urf].join(" ")}>
                      {f(UI.heirsTitle)}
                    </h2>
                    <div className="flex items-center gap-2">
                      <span className={["text-xs text-slate-500", urf].join(" ")}>{f(UI.gender)}</span>
                      <div className="flex rounded-xl bg-slate-100 p-1">
                        {(["male", "female"] as const).map((g) => (
                          <button
                            key={g}
                            onClick={() => setGender(g)}
                            className={[
                              "rounded-lg px-4 py-1.5 text-xs font-bold transition",
                              gender === g
                                ? "bg-emerald-600 text-white shadow"
                                : "text-slate-500 hover:text-emerald-700",
                              urf,
                            ].join(" ")}
                          >
                            {g === "male" ? f(UI.male) : f(UI.female)}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <p className={["mb-4 text-xs text-slate-400", urf].join(" ")}>{f(UI.countPrompt)}</p>

                  <div className="space-y-6">
                    {GROUPS.map((grp) => {
                      const keys = visibleKeys(grp.keys);
                      if (!keys.length) return null;
                      return (
                        <div key={grp.id}>
                          <div className="mb-3 flex items-center gap-2">
                            <span className="text-base">{grp.icon}</span>
                            <h3 className={["text-sm font-bold text-emerald-800", urf].join(" ")}>
                              {f(grp.title)}
                            </h3>
                            <span className="h-px flex-1 bg-gradient-to-l from-transparent via-emerald-200 to-transparent" />
                          </div>
                          <div className="grid gap-2.5 sm:grid-cols-2">
                            {keys.map((k) => (
                              <Stepper
                                key={k}
                                lang={lang}
                                label={f(HEIR_LABEL[k])}
                                hint={HEIR_HINT[k] ? f(HEIR_HINT[k]!) : undefined}
                                value={counts[k]}
                                max={MAX_COUNT[k] ?? 30}
                                onChange={(v) => set(k, v)}
                              />
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>

                {/* estate */}
                <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
                  <h2 className={["mb-1 text-lg font-bold text-emerald-900", urf].join(" ")}>
                    {f(UI.estate)}
                  </h2>
                  <p className={["mb-4 text-xs text-slate-400", urf].join(" ")}>{f(UI.estateHint)}</p>
                  <div className="relative">
                    <input
                      type="number"
                      inputMode="decimal"
                      value={estate}
                      onChange={(e) => setEstate(e.target.value)}
                      placeholder="0"
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50/60 px-4 py-3 font-en text-lg font-bold tabular-nums text-emerald-800 outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                    />
                  </div>

                  <button
                    onClick={() => setOpenAdv((o) => !o)}
                    className={["mt-3 flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-900", urf].join(" ")}
                  >
                    <span className={`transition-transform ${openAdv ? "rotate-180" : ""}`}>▾</span>
                    {f(UI.advanced)}
                  </button>

                  {openAdv && (
                    <div className="animate-fade-up mt-3 grid gap-3 sm:grid-cols-3">
                      {[
                        { label: f(UI.funeral), v: funeral, s: setFuneral },
                        { label: f(UI.debts), v: debts, s: setDebts },
                        { label: f(UI.bequest), v: bequest, s: setBequest },
                      ].map((it) => (
                        <div key={it.label}>
                          <label className={["mb-1 block text-[11px] text-slate-500", urf].join(" ")}>
                            {it.label}
                          </label>
                          <input
                            type="number"
                            inputMode="decimal"
                            value={it.v}
                            onChange={(e) => it.s(e.target.value)}
                            placeholder="0"
                            className="w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2 font-en text-sm font-semibold tabular-nums outline-none transition focus:border-emerald-400 focus:bg-white"
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="no-print mt-5 flex flex-wrap gap-2">
                    <button
                      onClick={() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
                      className={["flex-1 rounded-xl bg-gradient-to-l from-emerald-600 to-teal-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-600/20 transition hover:shadow-xl hover:brightness-110", urf].join(" ")}
                    >
                      {f(UI.calculate)}
                    </button>
                    <button
                      onClick={reset}
                      className={["rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-600 transition hover:border-rose-300 hover:text-rose-600", urf].join(" ")}
                    >
                      {f(UI.reset)}
                    </button>
                    <button
                      onClick={() => window.print()}
                      className={["rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-600 transition hover:border-emerald-300 hover:text-emerald-700", urf].join(" ")}
                    >
                      {f(UI.print)}
                    </button>
                  </div>
                </section>

                {/* samples */}
                <section className="no-print rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                  <h3 className={["mb-3 flex items-center gap-2 text-sm font-bold text-emerald-900", urf].join(" ")}>
                    <span>✨</span> {f(UI.examples)}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {SAMPLES.map((s, i) => (
                      <button
                        key={i}
                        onClick={() => applySample(s)}
                        className={["rounded-full border border-emerald-200 bg-emerald-50/60 px-3.5 py-1.5 text-xs font-semibold text-emerald-800 transition hover:bg-emerald-100", urf].join(" ")}
                      >
                        {f(s.title)}
                      </button>
                    ))}
                  </div>
                </section>
              </div>

              {/* ── Results ────────────────────────────────────── */}
              <div className="lg:col-span-5" ref={resultRef}>
                <div className="lg:sticky lg:top-5">
                  {selected.length > 0 && (
                    <div className="no-print mb-4 flex flex-wrap items-center gap-2 rounded-2xl border border-emerald-100 bg-white/70 p-3">
                      <span className={["text-[11px] font-bold text-slate-400", urf].join(" ")}>
                        {f(UI.selected)}:
                      </span>
                      {selected.map(([k, v]) => (
                        <button
                          key={k}
                          onClick={() => set(k, 0)}
                          className={["group flex items-center gap-1 rounded-full bg-emerald-600/10 px-2.5 py-1 text-[11px] font-bold text-emerald-800 transition hover:bg-rose-100 hover:text-rose-700", urf].join(" ")}
                          title={ur ? "ہٹائیں" : "Remove"}
                        >
                          {f(HEIR_LABEL[k])}
                          <span className="font-en opacity-70">×{v}</span>
                        </button>
                      ))}
                      <button
                        onClick={reset}
                        className={["ms-auto text-[11px] font-bold text-slate-400 hover:text-rose-600", urf].join(" ")}
                      >
                        {f(UI.clearAll)}
                      </button>
                    </div>
                  )}
                  <div className="max-h-none lg:max-h-[calc(100vh-3rem)] lg:overflow-y-auto lg:pe-1">
                    <Results res={res} lang={lang} />
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        <p
          className={["mt-8 rounded-2xl border border-slate-200 bg-white/60 p-4 text-center text-[12px] leading-loose text-slate-500", urf].join(" ")}
        >
          ⚠️ {f(UI.disclaimer)}
        </p>
      </main>

      <footer className="pattern-soft border-t border-slate-200 bg-white py-8">
        <div className="mx-auto max-w-6xl px-4 text-center sm:px-6">
          <p className="font-amiri text-lg text-emerald-800">
            تِلْكَ حُدُودُ اللَّهِ ۚ وَمَن يُطِعِ اللَّهَ وَرَسُولَهُ يُدْخِلْهُ جَنَّاتٍ
          </p>
          <p className={["mt-2 text-xs text-slate-400", urf].join(" ")}>
            {ur
              ? "قرآن و سنت کی روشنی میں اسلامی طریقۂ تقسیمِ وراثت"
              : "Islamic distribution of inheritance in the light of the Qur'an and Sunnah"}
          </p>
        </div>
      </footer>
    </div>
  );
}
