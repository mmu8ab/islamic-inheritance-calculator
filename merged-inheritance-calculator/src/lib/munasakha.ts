import { add, div, lcm, type Frac } from "./fraction";
import type { CalcResult, HeirKey } from "./faraid";

export type Gender = "male" | "female";

export type Person = {
  id: string; // immutable, e.g. "P001" — never changes, even if the display name does
  name: string; // display label, may be edited
  role: HeirKey; // relation to the deceased of the relevant stage
  gender: Gender;
};

export type ShareMap = Record<string, number>;

export type StageShareRow = { id: string; name: string; role: HeirKey; units: number };

export type MunasakhaStage = {
  stageNumber: number;
  deceasedId: string;
  deceasedName: string;
  deceasedRole: HeirKey;
  accumulatedShare: number; // S_accum — deceased's CURRENT share just before this stage
  previousJamia: number;
  localBase: number; // A_k — corrected local base AFTER Tashih (lcm of per-person denominators)
  gcdValue: number; // جزء السہم
  globalMultiplier: number; // M_global — scales existing shares
  localMultiplier: number; // M_local — converts local shares into the new denominator
  newJamia: number;
  previousRows: StageShareRow[];
  updatedRows: StageShareRow[]; // existing heirs × M_global (deceased removed)
  newHeirRows: StageShareRow[]; // local heirs × M_local
  mergedRows: StageShareRow[]; // final merged state (merged by person id)
};

export type MunasakhaState = {
  persons: Record<string, Person>;
  living: ShareMap; // personId -> integer units in current jamia
  jamia: number; // current Al-Jami'ah
  initialJamia: number;
  initialLiving: ShareMap;
  stages: MunasakhaStage[];
  error: string | null;
};

/* ── person id factory ─────────────────────────────────────────── */
let personCounter = 0;
export function resetPersonIds() {
  personCounter = 0;
}
export function nextPersonId(): string {
  personCounter += 1;
  return "P" + String(personCounter).padStart(3, "0");
}

export function genderOfHeir(key: HeirKey): Gender {
  const male: HeirKey[] = [
    "husband", "son", "grandson", "ggrandson", "father", "grandfather", "ggrandfather",
    "fullBrother", "paternalBrother", "maternalBrother", "fullNephew", "paternalNephew",
    "fullUncle", "paternalUncle", "fullUncleSon", "paternalUncleSon",
  ];
  return male.includes(key) ? "male" : "female";
}

export function gcd(a: number, b: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) {
    const t = a % b;
    a = b;
    b = t;
  }
  return a || 1;
}

const lcmAll = (xs: number[]) => xs.reduce((a, b) => lcm(a, b), 1);

/* ── expand a CalcResult into per-person fractions ─────────────── */
export function expandPersons(
  calc: CalcResult,
  makePerson: (key: HeirKey, index: number, total: number) => Person,
): (Person & { frac: Frac })[] {
  const out: (Person & { frac: Frac })[] = [];
  calc.rows.forEach((row) => {
    const per = div(row.fraction, { n: row.count, d: 1 });
    for (let i = 0; i < row.count; i++) {
      out.push({ ...makePerson(row.key, i, row.count), frac: per });
    }
  });
  return out;
}

/* ── Stage 0: build the unified state from the original deceased ─ */
export function createInitialState(
  base: CalcResult,
  makePerson: (key: HeirKey, index: number, total: number) => Person,
): MunasakhaState {
  const expanded = expandPersons(base, makePerson);
  const persons: Record<string, Person> = {};
  expanded.forEach((p) => {
    persons[p.id] = { id: p.id, name: p.name, role: p.role, gender: p.gender };
  });
  const empty: MunasakhaState = {
    persons,
    living: {},
    jamia: 1,
    initialJamia: 1,
    initialLiving: {},
    stages: [],
    error: null,
  };
  if (expanded.length === 0) {
    return { ...empty, error: "کوئی وارث درج نہیں۔ / No heirs entered." };
  }
  // Jamia = lcm of per-person denominators ⇒ every person gets whole units (Tashih)
  const jamia = lcmAll(expanded.map((p) => p.frac.d));
  const living: ShareMap = {};
  expanded.forEach((p) => {
    living[p.id] = (p.frac.n * jamia) / p.frac.d;
  });
  const sum = Object.values(living).reduce((a, b) => a + b, 0);
  if (sum !== jamia) {
    return { ...empty, error: "داخلی حسابی خرابی (internal calculation error) — اصل مسئلہ درست نہیں بن سکا۔" };
  }
  return { ...empty, living, jamia, initialJamia: jamia, initialLiving: { ...living } };
}

export type StageInput = {
  deceasedId: string;
  localCalc: CalcResult; // full Hanafi calc of the secondary deceased (Awl/Radd/Tashih already applied)
  makeLocalPerson: (key: HeirKey, index: number, total: number) => Person;
};

/* ── Munasakha coupling (spec §10–§16) ─────────────────────────── */
export function applyMunasakhaStage(prev: MunasakhaState, input: StageInput): MunasakhaState {
  if (prev.error) return prev;

  const dec = prev.persons[input.deceasedId];
  if (!dec) {
    return { ...prev, error: "یہ شخص اس مسئلے میں موجود نہیں۔ / This person is not part of the case." };
  }
  // §23: accumulated share = CURRENT share from the latest unified state, never the stage-1 value
  const sAccum = prev.living[input.deceasedId];
  if (sAccum === undefined) {
    return {
      ...prev,
      error: "موت کی ترتیب واضح نہیں، اس لیے مناسخہ کا درست حساب نہیں کیا جا سکتا۔",
    };
  }
  if (sAccum <= 0) {
    return { ...prev, error: "مرحوم کا کوئی موجودہ حصہ نہیں ہے۔ / The deceased has no current share." };
  }

  const local = expandPersons(input.localCalc, input.makeLocalPerson);
  if (local.length === 0) {
    return {
      ...prev,
      error: "یہ مناسخہ کی صورت موجودہ قواڑ کے تحت خودکار طور پر حل نہیں کی جا سکتی۔ مزید شرعی تحقیق/تصدیق درکار ہے۔",
    };
  }

  // §30: if several local instances map to the same existing person, combine their fractions
  const byId = new Map<string, Person & { frac: Frac }>();
  local.forEach((p) => {
    const e = byId.get(p.id);
    if (e) e.frac = add(e.frac, p.frac);
    else byId.set(p.id, p);
  });
  const locals = [...byId.values()];

  // §22: local base = corrected base after Tashih (lcm of final per-person denominators)
  const aK = lcmAll(locals.map((p) => p.frac.d));
  const localUnits = new Map<string, number>();
  locals.forEach((p) => localUnits.set(p.id, (p.frac.n * aK) / p.frac.d));

  const g = gcd(sAccum, aK);
  const mGlobal = aK / g; // scales the existing problem
  const mLocal = sAccum / g; // converts local shares into the unified denominator
  const newJamia = prev.jamia * mGlobal;

  const persons: Record<string, Person> = { ...prev.persons };
  locals.forEach((p) => {
    if (!persons[p.id]) persons[p.id] = { id: p.id, name: p.name, role: p.role, gender: p.gender };
  });

  // §12: existing living heirs (except the deceased) × M_global
  const updated: ShareMap = {};
  Object.entries(prev.living).forEach(([id, u]) => {
    if (id !== input.deceasedId) updated[id] = u * mGlobal;
  });
  // §13: local heirs × M_local
  const newHeirs: ShareMap = {};
  locals.forEach((p) => {
    newHeirs[p.id] = (newHeirs[p.id] ?? 0) + localUnits.get(p.id)! * mLocal;
  });
  // §14: merge by immutable person id — never "P10_1"/"P10_2"
  const merged: ShareMap = { ...updated };
  Object.entries(newHeirs).forEach(([id, u]) => {
    merged[id] = (merged[id] ?? 0) + u;
  });

  // §15/§27: the deceased's share must be fully redistributed — never lost
  const sum = Object.values(merged).reduce((a, b) => a + b, 0);
  if (sum !== newJamia) {
    return {
      ...prev,
      error:
        "داخلی حسابی خرابی: مناسخہ کا یہ مرحلہ میزان پر پورا نہیں اترتا، اس لیے نتیجہ درست نہیں دکھایا جا رہا۔ مرحلے کی تفصیل محفوظ ہے۔",
    };
  }

  const rows = (m: ShareMap): StageShareRow[] =>
    Object.entries(m).map(([id, units]) => ({
      id,
      units,
      name: persons[id]?.name ?? id,
      role: persons[id]?.role ?? "son",
    }));

  const stage: MunasakhaStage = {
    stageNumber: prev.stages.length + 1,
    deceasedId: dec.id,
    deceasedName: dec.name,
    deceasedRole: dec.role,
    accumulatedShare: sAccum,
    previousJamia: prev.jamia,
    localBase: aK,
    gcdValue: g,
    globalMultiplier: mGlobal,
    localMultiplier: mLocal,
    newJamia,
    previousRows: rows(prev.living),
    updatedRows: rows(updated),
    newHeirRows: rows(newHeirs),
    mergedRows: rows(merged),
  };

  return {
    persons,
    living: merged,
    jamia: newJamia,
    initialJamia: prev.initialJamia,
    initialLiving: prev.initialLiving,
    stages: [...prev.stages, stage],
    error: null,
  };
}
