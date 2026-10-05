import { beforeEach, describe, expect, it } from "vitest";
import { calculate, emptyCounts, type Counts, type HeirKey } from "./faraid";
import {
  applyMunasakhaStage,
  createInitialState,
  genderOfHeir,
  nextPersonId,
  resetPersonIds,
  type MunasakhaState,
  type Person,
} from "./munasakha";

const mkCounts = (p: Partial<Counts>): Counts => ({ ...emptyCounts(), ...p });
const calc = (c: Counts, gender: "male" | "female") =>
  calculate({ counts: c, gender, estate: 0, funeral: 0, debts: 0, bequest: 0 });
const autoPerson = (key: HeirKey): Person => ({
  id: nextPersonId(),
  name: key,
  role: key,
  gender: genderOfHeir(key),
});
const pickUnit = (st: MunasakhaState, units: number): string =>
  Object.entries(st.living).find(([, u]) => u === units)![0];
const total = (st: MunasakhaState) => Object.values(st.living).reduce((a, b) => a + b, 0);

beforeEach(resetPersonIds);

describe("Munasakha — required regression test (spec §28)", () => {
  it("wife + 2 sons (base 16); son 1 dies leaving 2 sons ⇒ jamia 32, shares 4/14/7/7", () => {
    const base = calc(mkCounts({ wife: 1, son: 2 }), "male");
    expect(base.finalBase).toBe(16);

    let st = createInitialState(base, autoPerson);
    expect(st.error).toBeNull();
    expect(st.jamia).toBe(16);
    expect(Object.values(st.living).sort((a, b) => a - b)).toEqual([2, 7, 7]);
    expect(total(st)).toBe(16);

    const son1 = pickUnit(st, 7);
    const local = calc(mkCounts({ grandson: 2 }), "male");
    st = applyMunasakhaStage(st, { deceasedId: son1, localCalc: local, makeLocalPerson: autoPerson });

    expect(st.error).toBeNull();
    expect(st.jamia).toBe(32);
    expect(Object.values(st.living).sort((a, b) => a - b)).toEqual([4, 7, 7, 14]); // wife 4, son2 14, G1 7, G2 7
    expect(total(st)).toBe(32); // §15 golden rule: nothing disappears

    const t = st.stages[0];
    expect(t.accumulatedShare).toBe(7);
    expect(t.localBase).toBe(2);
    expect(t.gcdValue).toBe(1);
    expect(t.globalMultiplier).toBe(2);
    expect(t.localMultiplier).toBe(7);
    expect(t.newJamia).toBe(32);
  });
});

describe("Munasakha — advanced test (spec §29): three successive deaths", () => {
  it("every stage reconciles exactly (incl. a non-trivial GCD stage)", () => {
    let st = createInitialState(calc(mkCounts({ wife: 1, son: 2 }), "male"), autoPerson);
    // Death 2: son 1 (7) → his 2 sons. S=7, A_k=2, g=1 ⇒ ×2/×7 ⇒ jamia 32
    st = applyMunasakhaStage(st, {
      deceasedId: pickUnit(st, 7),
      localCalc: calc(mkCounts({ grandson: 2 }), "male"),
      makeLocalPerson: autoPerson,
    });
    expect(st.jamia).toBe(32);
    // Death 3: a grandson (7) → his 2 sons. g=1 ⇒ jamia 64
    st = applyMunasakhaStage(st, {
      deceasedId: pickUnit(st, 7),
      localCalc: calc(mkCounts({ ggrandson: 2 }), "male"),
      makeLocalPerson: autoPerson,
    });
    expect(st.jamia).toBe(64);
    // Death 4: the other grandson, now holding 14 → his 2 sons.
    // S=14, A_k=2, g=2 ⇒ M_global=1, M_local=7 ⇒ jamia stays 64 — exercises g>1
    st = applyMunasakhaStage(st, {
      deceasedId: pickUnit(st, 14),
      localCalc: calc(mkCounts({ ggrandson: 2 }), "male"),
      makeLocalPerson: autoPerson,
    });
    expect(st.error).toBeNull();
    expect(st.jamia).toBe(64);
    expect(Object.values(st.living).sort((a, b) => a - b)).toEqual([7, 7, 7, 7, 8, 28]);

    for (const t of st.stages) {
      expect(t.newJamia).toBe(t.previousJamia * t.globalMultiplier);
      expect(t.gcdValue).toBe(
        (t.accumulatedShare * t.localBase) / (t.globalMultiplier * t.localMultiplier),
      );
      const s = t.mergedRows.reduce((a, r) => a + r.units, 0);
      expect(s).toBe(t.newJamia); // §27 invariant at every stage
    }
    expect(total(st)).toBe(st.jamia);
  });
});

describe("Munasakha — same person in multiple branches (spec §30)", () => {
  it("mother inherits from husband, then from her son — merged by person id", () => {
    // D1: wife + 1 son ⇒ jamia 8: wife 1, son 7
    let st = createInitialState(calc(mkCounts({ wife: 1, son: 1 }), "male"), autoPerson);
    const son = pickUnit(st, 7);
    const wife = pickUnit(st, 1);
    // Son dies leaving his mother (the SAME wife person) + his own son.
    // Local: mother 1/6, son 5/6 ⇒ A_k = 6. S=7 ⇒ g=1, M_global=6, M_local=7 ⇒ jamia 48
    st = applyMunasakhaStage(st, {
      deceasedId: son,
      localCalc: calc(mkCounts({ mother: 1, son: 1 }), "male"),
      makeLocalPerson: (key: HeirKey) => (key === "mother" ? st.persons[wife] : autoPerson(key)),
    });
    expect(st.error).toBeNull();
    expect(st.jamia).toBe(48);
    expect(st.living[wife]).toBe(1 * 6 + 1 * 7); // (old × M_global) + (local × M_local) = 13
    const others = Object.entries(st.living).filter(([id]) => id !== wife);
    expect(others).toHaveLength(1); // merged, NOT duplicated into two persons
    expect(others[0][1]).toBe(5 * 7); // 35
    expect(total(st)).toBe(48);
  });
});

describe("Munasakha — chronological validation (spec §6, §23)", () => {
  it("rejects unknown or already-distributed persons instead of guessing", () => {
    let st = createInitialState(calc(mkCounts({ wife: 1, son: 2 }), "male"), autoPerson);
    const son1 = pickUnit(st, 7);
    const out = applyMunasakhaStage(st, {
      deceasedId: "P999",
      localCalc: calc(mkCounts({ grandson: 1 }), "male"),
      makeLocalPerson: autoPerson,
    });
    expect(out.error).toContain("یہ شخص اس مسئلے میں موجود نہیں");
    expect(out.stages).toHaveLength(0);

    st = applyMunasakhaStage(st, {
      deceasedId: son1,
      localCalc: calc(mkCounts({ grandson: 2 }), "male"),
      makeLocalPerson: autoPerson,
    });
    const again = applyMunasakhaStage(st, {
      deceasedId: son1, // already dead — must NOT use his stage-1 share of 7
      localCalc: calc(mkCounts({ grandson: 1 }), "male"),
      makeLocalPerson: autoPerson,
    });
    expect(again.error).toContain("یہ شخص اس مسئلے میں موجود نہیں");
    expect(again.jamia).toBe(32); // state untouched
  });
});

describe("Munasakha — money & percentage invariants (spec §26–§27)", () => {
  it("Rs 3,200,000 over jamia 32 ⇒ 400k / 1.4M / 700k / 700k; sums reconcile", () => {
    const base = calculate({
      counts: mkCounts({ wife: 1, son: 2 }),
      gender: "male",
      estate: 3_200_000,
      funeral: 0,
      debts: 0,
      bequest: 0,
    });
    let st = createInitialState(base, autoPerson);
    st = applyMunasakhaStage(st, {
      deceasedId: pickUnit(st, 7),
      localCalc: calc(mkCounts({ grandson: 2 }), "male"),
      makeLocalPerson: autoPerson,
    });
    const amounts = Object.values(st.living).map((u) => (u / st.jamia) * base.money.net);
    expect(amounts.sort((a, b) => a - b)).toEqual([400000, 700000, 700000, 1400000]);
    expect(amounts.reduce((a, b) => a + b, 0)).toBeCloseTo(3_200_000, 6);
    const pct = Object.values(st.living).reduce((a, u) => a + (u / st.jamia) * 100, 0);
    expect(pct).toBeCloseTo(100, 9);
  });
});
