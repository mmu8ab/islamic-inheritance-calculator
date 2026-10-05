import { F, ONE, ZERO, add, div, fmt, gt, lcm, mul, num, sub, type Frac } from "./fraction";

export type HeirKey =
  | "husband"
  | "wife"
  | "son"
  | "daughter"
  | "grandson"
  | "granddaughter"
  | "ggrandson"
  | "ggranddaughter"
  | "father"
  | "mother"
  | "grandfather"
  | "ggrandfather"
  | "paternalGrandmother"
  | "maternalGrandmother"
  | "fullBrother"
  | "fullSister"
  | "paternalBrother"
  | "paternalSister"
  | "maternalBrother"
  | "maternalSister"
  | "fullNephew"
  | "paternalNephew"
  | "fullUncle"
  | "paternalUncle"
  | "fullUncleSon"
  | "paternalUncleSon";

export type Counts = Record<HeirKey, number>;

export const HEIR_KEYS: HeirKey[] = [
  "husband",
  "wife",
  "son",
  "daughter",
  "grandson",
  "granddaughter",
  "ggrandson",
  "ggranddaughter",
  "father",
  "mother",
  "grandfather",
  "ggrandfather",
  "paternalGrandmother",
  "maternalGrandmother",
  "fullBrother",
  "fullSister",
  "paternalBrother",
  "paternalSister",
  "maternalBrother",
  "maternalSister",
  "fullNephew",
  "paternalNephew",
  "fullUncle",
  "paternalUncle",
  "fullUncleSon",
  "paternalUncleSon",
];

export const MAX_COUNT: Partial<Record<HeirKey, number>> = {
  husband: 1,
  wife: 4,
  father: 1,
  mother: 1,
  grandfather: 1,
  ggrandfather: 1,
  paternalGrandmother: 1,
  maternalGrandmother: 1,
};

export const emptyCounts = (): Counts =>
  HEIR_KEYS.reduce((acc, k) => {
    acc[k] = 0;
    return acc;
  }, {} as Counts);

export type Txt = { ur: string; en: string };

export type Status = "fard" | "asaba" | "fard_asaba" | "radd" | "blocked" | "special";

export type ResultRow = {
  key: HeirKey;
  count: number;
  status: Status;
  fraction: Frac; // group total share of net estate
  perPerson: Frac;
  percent: number;
  amount: number;
  perPersonAmount: number;
  units: number; // shares out of final base
  basis: Txt; // which quranic share / reason
};

export type CalcResult = {
  ok: boolean;
  rows: ResultRow[];
  excluded: { key: HeirKey; count: number; reason: Txt }[];
  asl: number;
  finalBase: number;
  awl: boolean;
  radd: boolean;
  residueHolders: HeirKey[];
  leftover: Frac; // to bayt-ul-mal / dhawil arham
  money: {
    estate: number;
    funeral: number;
    debts: number;
    bequest: number;
    bequestPaid: number;
    net: number;
  };
  notes: Txt[];
  totalHeirs: number;
};

export type Inputs = {
  counts: Counts;
  gender: "male" | "female";
  estate: number;
  funeral: number;
  debts: number;
  bequest: number;
};

const T = (ur: string, en: string): Txt => ({ ur, en });

type Member = { key: HeirKey; weight: number };
type AsabaGroup = { id: string; members: Member[]; label: Txt };

export function calculate(input: Inputs): CalcResult {
  const c: Counts = { ...input.counts };
  if (input.gender === "male") c.husband = 0;
  else c.wife = 0;
  HEIR_KEYS.forEach((k) => {
    const max = MAX_COUNT[k];
    c[k] = Math.max(0, Math.floor(c[k] || 0));
    if (max) c[k] = Math.min(c[k], max);
  });

  const fard: Partial<Record<HeirKey, Frac>> = {};
  const basis: Partial<Record<HeirKey, Txt>> = {};
  const excluded: { key: HeirKey; count: number; reason: Txt }[] = [];
  const notes: Txt[] = [];

  const setF = (k: HeirKey, f: Frac, b: Txt) => {
    fard[k] = f;
    basis[k] = b;
  };
  const bar = (k: HeirKey, reason: Txt) => {
    if (c[k] > 0) excluded.push({ key: k, count: c[k], reason });
  };

  const totalHeirs = HEIR_KEYS.reduce((s, k) => s + c[k], 0);
  if (totalHeirs === 0) {
    return {
      ok: false,
      rows: [],
      excluded: [],
      asl: 1,
      finalBase: 1,
      awl: false,
      radd: false,
      residueHolders: [],
      leftover: ZERO,
      money: {
        estate: input.estate,
        funeral: input.funeral,
        debts: input.debts,
        bequest: input.bequest,
        bequestPaid: 0,
        net: 0,
      },
      notes: [],
      totalHeirs: 0,
    };
  }

  /* ───────────────────────── descendants ───────────────────────── */
  const sonActive = c.son > 0;
  const grandsonActive = c.grandson > 0 && !sonActive;
  const ggrandsonActive = c.ggrandson > 0 && !sonActive && c.grandson === 0;

  if (c.grandson > 0 && sonActive)
    bar("grandson", T("بیٹے کی موجودگی میں محجوب", "Excluded by the son (nearer male descendant)"));
  if (c.ggrandson > 0 && (sonActive || c.grandson > 0))
    bar(
      "ggrandson",
      T("قریب تر مذکر اولاد کی موجودگی میں محجوب", "Excluded by a nearer male descendant"),
    );

  // daughters
  let daughterSharers = 0;
  if (c.daughter > 0) {
    if (sonActive) {
      basis.daughter = T("بیٹے کے ساتھ عصبہ (للذکر مثل حظ الانثیین)", "Residuary with son — 2:1");
    } else {
      daughterSharers = c.daughter;
      setF(
        "daughter",
        c.daughter === 1 ? F(1, 2) : F(2, 3),
        c.daughter === 1
          ? T("اکیلی بیٹی کا نصف (1/2) — سورۃ النساء 11", "Sole daughter: 1/2 (Qur'an 4:11)")
          : T("دو یا زائد بیٹیوں کا دو تہائی (2/3)", "Two or more daughters: 2/3 (Qur'an 4:11)"),
      );
    }
  }

  // granddaughters (son's daughters)
  let gdSharers = 0;
  let gdJoinsGgs = false;
  if (c.granddaughter > 0) {
    if (sonActive) {
      bar("granddaughter", T("بیٹے کی موجودگی میں محجوب", "Excluded by the son"));
    } else if (grandsonActive) {
      basis.granddaughter = T("پوتے کے ساتھ عصبہ (2:1)", "Residuary with grandson — 2:1");
    } else if (daughterSharers === 0) {
      gdSharers = c.granddaughter;
      setF(
        "granddaughter",
        c.granddaughter === 1 ? F(1, 2) : F(2, 3),
        c.granddaughter === 1
          ? T("بیٹی نہ ہونے کی صورت میں اکیلی پوتی کا نصف (1/2)", "Sole granddaughter: 1/2")
          : T("دو یا زائد پوتیوں کا دو تہائی (2/3)", "Two or more granddaughters: 2/3"),
      );
    } else if (daughterSharers === 1) {
      gdSharers = c.granddaughter;
      setF(
        "granddaughter",
        F(1, 6),
        T("ایک بیٹی کے ساتھ تکملۃ الثلثین: چھٹا حصہ (1/6)", "1/6 to complete 2/3 with one daughter"),
      );
    } else if (ggrandsonActive) {
      gdJoinsGgs = true;
      basis.granddaughter = T(
        "پڑپوتے کے ساتھ عصبہ (نیچے کا مذکر اپنے اوپر کی محجوب عورتوں کو عصبہ بنا دیتا ہے)",
        "Residuary with the great-grandson (a lower male makes the otherwise-excluded females above him residuary)",
      );
    } else {
      bar(
        "granddaughter",
        T(
          "دو یا زائد بیٹیوں کے دو تہائی لینے کی وجہ سے محجوب (پوتا نہ ہونے کے سبب)",
          "Excluded: two or more daughters take 2/3 and there is no grandson to make them residuary",
        ),
      );
    }
  }

  // great-granddaughters
  if (c.ggranddaughter > 0) {
    const higherFemales = daughterSharers + gdSharers;
    if (sonActive || c.grandson > 0) {
      bar(
        "ggranddaughter",
        T("قریب تر مذکر اولاد کی موجودگی میں محجوب", "Excluded by a nearer male descendant"),
      );
    } else if (ggrandsonActive) {
      basis.ggranddaughter = T("پڑپوتے کے ساتھ عصبہ (2:1)", "Residuary with great-grandson — 2:1");
    } else if (higherFemales === 0) {
      setF(
        "ggranddaughter",
        c.ggranddaughter === 1 ? F(1, 2) : F(2, 3),
        c.ggranddaughter === 1 ? T("اکیلی پڑپوتی کا نصف (1/2)", "Sole great-granddaughter: 1/2") : T("دو یا زائد پڑپوتیوں کا دو تہائی (2/3)", "Two or more: 2/3"),
      );
    } else if (higherFemales === 1) {
      setF(
        "ggranddaughter",
        F(1, 6),
        T("تکملۃ الثلثین: چھٹا حصہ (1/6)", "1/6 to complete two-thirds"),
      );
    } else {
      bar(
        "ggranddaughter",
        T("اوپر کے درجہ کی دو وارث بچیوں کی موجودگی میں محجوب", "Excluded by two inheriting females of a nearer degree"),
      );
    }
  }

  const hasMaleDesc = c.son > 0 || c.grandson > 0 || c.ggrandson > 0;
  const hasAnyDesc =
    hasMaleDesc || c.daughter > 0 || c.granddaughter > 0 || c.ggranddaughter > 0;
  const femaleDescInheriting =
    !hasMaleDesc &&
    (daughterSharers > 0 ||
      gdSharers > 0 ||
      (c.ggranddaughter > 0 && !!fard.ggranddaughter));

  /* ───────────────────────── spouse ───────────────────────── */
  let spouseFrac: Frac = ZERO;
  if (c.husband > 0) {
    spouseFrac = hasAnyDesc ? F(1, 4) : F(1, 2);
    setF(
      "husband",
      spouseFrac,
      hasAnyDesc
        ? T("اولاد کی موجودگی میں چوتھائی (1/4) — النساء 12", "1/4 in presence of descendants (4:12)")
        : T("اولاد نہ ہونے پر نصف (1/2) — النساء 12", "1/2 when there is no descendant (4:12)"),
    );
  }
  if (c.wife > 0) {
    spouseFrac = hasAnyDesc ? F(1, 8) : F(1, 4);
    setF(
      "wife",
      spouseFrac,
      hasAnyDesc
        ? T("اولاد کی موجودگی میں آٹھواں حصہ (1/8) تمام بیویوں میں برابر", "1/8 shared among wives (4:12)")
        : T("اولاد نہ ہونے پر چوتھائی (1/4) تمام بیویوں میں برابر", "1/4 shared among wives (4:12)"),
    );
  }

  /* ───────────────────────── ascendants ───────────────────────── */
  let ascendant: HeirKey | null = null;
  if (c.father > 0) ascendant = "father";
  else if (c.grandfather > 0) ascendant = "grandfather";
  else if (c.ggrandfather > 0) ascendant = "ggrandfather";

  if (c.grandfather > 0 && c.father > 0)
    bar("grandfather", T("باپ کی موجودگی میں محجوب", "Excluded by the father"));
  if (c.ggrandfather > 0 && (c.father > 0 || c.grandfather > 0))
    bar("ggrandfather", T("قریب تر جد کی موجودگی میں محجوب", "Excluded by a nearer ascendant"));

  const ascLabel: Txt =
    ascendant === "father"
      ? T("باپ", "father")
      : ascendant === "grandfather"
        ? T("دادا", "grandfather")
        : T("پڑدادا", "great-grandfather");

  if (ascendant) {
    if (hasMaleDesc) {
      setF(
        ascendant,
        F(1, 6),
        T(
          `${ascLabel.ur} کو مذکر اولاد کی موجودگی میں چھٹا حصہ (1/6)`,
          `1/6 fixed share (male descendant present)`,
        ),
      );
    } else if (femaleDescInheriting) {
      setF(
        ascendant,
        F(1, 6),
        T(
          `چھٹا حصہ (1/6) بطور فرض، اور باقی ماندہ بطور عصبہ`,
          `1/6 as a fixed share plus the residue as residuary`,
        ),
      );
    } else {
      basis[ascendant] = T("تمام باقی ماندہ ترکہ بطور عصبہ", "Takes the entire residue as residuary");
    }
  }

  /* ───────────────────────── mother ───────────────────────── */
  const siblingCount =
    c.fullBrother +
    c.fullSister +
    c.paternalBrother +
    c.paternalSister +
    c.maternalBrother +
    c.maternalSister;

  const isUmariyya =
    c.mother > 0 &&
    c.father > 0 &&
    (c.husband > 0 || c.wife > 0) &&
    totalHeirs === c.mother + c.father + c.husband + c.wife;

  if (c.mother > 0) {
    if (isUmariyya) {
      const m = mul(sub(ONE, spouseFrac), F(1, 3));
      setF(
        "mother",
        m,
        T(
          "مسئلہ عمریتین: زوج/زوجہ کا حصہ نکالنے کے بعد باقی کا تہائی (1/3)",
          "Umariyyatayn: one-third of the remainder after the spouse's share",
        ),
      );
      notes.push(
        T(
          "یہ «مسئلہ عمریتین» ہے: شوہر/بیوی، ماں اور باپ کی صورت میں ماں کو کل ترکہ کے بجائے باقی ماندہ کا تہائی ملتا ہے (فیصلۂ حضرت عمرؓ، جمہور فقہاء)۔",
          "This is the 'Umariyyatayn' case: with a spouse, mother and father, the mother receives one-third of the remainder (not of the whole estate).",
        ),
      );
    } else if (hasAnyDesc || siblingCount >= 2) {
      setF(
        "mother",
        F(1, 6),
        hasAnyDesc
          ? T("اولاد کی موجودگی میں چھٹا حصہ (1/6) — النساء 11", "1/6 (descendant present) — 4:11")
          : T("دو یا زائد بہن بھائیوں کی وجہ سے چھٹا حصہ (1/6)", "1/6 (two or more siblings) — 4:11"),
      );
    } else {
      setF("mother", F(1, 3), T("تہائی (1/3) — النساء 11", "1/3 (Qur'an 4:11)"));
    }
  }

  /* ───────────────────────── grandmothers ───────────────────────── */
  const pgmActive = c.paternalGrandmother > 0 && c.mother === 0 && c.father === 0;
  const mgmActive = c.maternalGrandmother > 0 && c.mother === 0;
  if (c.paternalGrandmother > 0 && !pgmActive)
    bar(
      "paternalGrandmother",
      c.mother > 0
        ? T("ماں کی موجودگی میں محجوب", "Excluded by the mother")
        : T("باپ کی موجودگی میں محجوب", "Excluded by the father"),
    );
  if (c.maternalGrandmother > 0 && !mgmActive)
    bar("maternalGrandmother", T("ماں کی موجودگی میں محجوب", "Excluded by the mother"));

  const gmCount = (pgmActive ? 1 : 0) + (mgmActive ? 1 : 0);
  if (gmCount === 1) {
    const k: HeirKey = pgmActive ? "paternalGrandmother" : "maternalGrandmother";
    setF(k, F(1, 6), T("دادی/نانی کا چھٹا حصہ (1/6) — سنت سے ثابت", "1/6 for the grandmother (established by the Sunnah)"));
  } else if (gmCount === 2) {
    setF("paternalGrandmother", F(1, 12), T("دادی و نانی کے درمیان 1/6 برابر تقسیم", "1/6 shared equally between the two grandmothers"));
    setF("maternalGrandmother", F(1, 12), T("دادی و نانی کے درمیان 1/6 برابر تقسیم", "1/6 shared equally between the two grandmothers"));
  }

  /* ───────────────────────── uterine siblings ───────────────────────── */
  const uterineBlocked = hasAnyDesc || ascendant !== null;
  const uterineTotal = c.maternalBrother + c.maternalSister;
  if (uterineTotal > 0) {
    if (uterineBlocked) {
      const reason = hasAnyDesc
        ? T("میت کی اولاد/اولادِ اولاد کی موجودگی میں محجوب", "Excluded by the deceased's descendants")
        : T(`${ascLabel.ur} کی موجودگی میں محجوب`, "Excluded by a male ascendant");
      bar("maternalBrother", reason);
      bar("maternalSister", reason);
    } else {
      const total = uterineTotal === 1 ? F(1, 6) : F(1, 3);
      const per = F(total.n, total.d * uterineTotal);
      const b =
        uterineTotal === 1
          ? T("ایک اخیافی بہن/بھائی کا چھٹا حصہ (1/6) — النساء 12", "1/6 for a single uterine sibling (4:12)")
          : T("دو یا زائد اخیافی بہن بھائیوں کا تہائی (1/3) برابر تقسیم", "1/3 shared equally among uterine siblings (4:12)");
      if (c.maternalBrother > 0) setF("maternalBrother", F(per.n * c.maternalBrother, per.d), b);
      if (c.maternalSister > 0) setF("maternalSister", F(per.n * c.maternalSister, per.d), b);
    }
  }

  /* ───────────────────────── full siblings ───────────────────────── */
  const sibBlockReason: Txt | null = hasMaleDesc
    ? T("میت کی مذکر اولاد کی موجودگی میں محجوب", "Excluded by a male descendant")
    : ascendant
      ? T(`${ascLabel.ur} کی موجودگی میں محجوب (فقہ حنفی)`, "Excluded by the male ascendant (Hanafi)")
      : null;
  const fullBlocked = sibBlockReason !== null;

  let fullSisterMaalGhair = false;
  let fullSisterSharers = 0;
  if (fullBlocked) {
    if (c.fullBrother > 0) bar("fullBrother", sibBlockReason!);
    if (c.fullSister > 0) bar("fullSister", sibBlockReason!);
  } else if (c.fullBrother > 0) {
    basis.fullBrother = T("باقی ماندہ ترکہ بطور عصبہ", "Takes the residue as residuary");
    if (c.fullSister > 0) basis.fullSister = T("سگے بھائی کے ساتھ عصبہ (2:1)", "Residuary with full brother — 2:1");
  } else if (c.fullSister > 0) {
    if (femaleDescInheriting) {
      fullSisterMaalGhair = true;
      basis.fullSister = T(
        "بیٹی/پوتی کے ساتھ عصبہ مع الغیر — باقی ماندہ ترکہ",
        "ʿAsabah maʿa al-ghayr with daughters — takes the residue",
      );
    } else {
      fullSisterSharers = c.fullSister;
      setF(
        "fullSister",
        c.fullSister === 1 ? F(1, 2) : F(2, 3),
        c.fullSister === 1
          ? T("اکیلی سگی بہن کا نصف (1/2) — النساء 176", "Sole full sister: 1/2 (4:176)")
          : T("دو یا زائد سگی بہنوں کا دو تہائی (2/3)", "Two or more full sisters: 2/3 (4:176)"),
      );
    }
  }

  /* ───────────────────────── consanguine siblings ───────────────────────── */
  let consSisterMaalGhair = false;
  const consBlockReason: Txt | null = fullBlocked
    ? sibBlockReason
    : c.fullBrother > 0
      ? T("سگے بھائی کی موجودگی میں محجوب", "Excluded by the full brother")
      : fullSisterMaalGhair
        ? T("سگی بہن کے عصبہ مع الغیر بننے کی وجہ سے محجوب", "Excluded because the full sister became residuary with the daughters")
        : null;

  if (consBlockReason) {
    if (c.paternalBrother > 0) bar("paternalBrother", consBlockReason);
    if (c.paternalSister > 0) bar("paternalSister", consBlockReason);
  } else if (c.paternalBrother > 0) {
    basis.paternalBrother = T("باقی ماندہ ترکہ بطور عصبہ", "Takes the residue as residuary");
    if (c.paternalSister > 0)
      basis.paternalSister = T("باپ شریک بھائی کے ساتھ عصبہ (2:1)", "Residuary with paternal brother — 2:1");
  } else if (c.paternalSister > 0) {
    if (femaleDescInheriting) {
      consSisterMaalGhair = true;
      basis.paternalSister = T("بیٹی/پوتی کے ساتھ عصبہ مع الغیر", "ʿAsabah maʿa al-ghayr with daughters");
    } else if (fullSisterSharers >= 2) {
      bar(
        "paternalSister",
        T("دو سگی بہنوں کے دو تہائی لینے کی وجہ سے محجوب", "Excluded: two full sisters already take 2/3"),
      );
    } else if (fullSisterSharers === 1) {
      setF(
        "paternalSister",
        F(1, 6),
        T("ایک سگی بہن کے ساتھ تکملۃ الثلثین: چھٹا حصہ (1/6)", "1/6 to complete two-thirds with one full sister"),
      );
    } else {
      setF(
        "paternalSister",
        c.paternalSister === 1 ? F(1, 2) : F(2, 3),
        c.paternalSister === 1
          ? T("اکیلی باپ شریک بہن کا نصف (1/2)", "Sole paternal half-sister: 1/2")
          : T("دو یا زائد باپ شریک بہنوں کا دو تہائی (2/3)", "Two or more paternal half-sisters: 2/3"),
      );
    }
  }

  /* ───────────────────────── residuary (ʿasabah) chain ───────────────────────── */
  const groups: AsabaGroup[] = [];
  const g = (id: string, label: Txt, members: Member[]) => {
    if (members.length) groups.push({ id, label, members });
  };

  if (sonActive)
    g("son", T("بیٹے (اور بیٹیاں)", "Sons (with daughters)"), [
      { key: "son", weight: 2 },
      ...(c.daughter > 0 ? [{ key: "daughter" as HeirKey, weight: 1 }] : []),
    ]);
  if (grandsonActive)
    g("grandson", T("پوتے (اور پوتیاں)", "Grandsons (with granddaughters)"), [
      { key: "grandson", weight: 2 },
      ...(c.granddaughter > 0 ? [{ key: "granddaughter" as HeirKey, weight: 1 }] : []),
    ]);
  if (ggrandsonActive)
    g("ggrandson", T("پڑپوتے (اور پڑپوتیاں)", "Great-grandsons"), [
      { key: "ggrandson", weight: 2 },
      ...(c.ggranddaughter > 0 && !fard.ggranddaughter
        ? [{ key: "ggranddaughter" as HeirKey, weight: 1 }]
        : []),
      ...(gdJoinsGgs ? [{ key: "granddaughter" as HeirKey, weight: 1 }] : []),
    ]);
  if (ascendant && !hasMaleDesc) g(ascendant, ascLabel, [{ key: ascendant, weight: 1 }]);
  if (!fullBlocked && c.fullBrother > 0)
    g("fullBrother", T("سگے بھائی/بہنیں", "Full brothers & sisters"), [
      { key: "fullBrother", weight: 2 },
      ...(c.fullSister > 0 ? [{ key: "fullSister" as HeirKey, weight: 1 }] : []),
    ]);
  if (fullSisterMaalGhair)
    g("fullSisterMG", T("سگی بہنیں (عصبہ مع الغیر)", "Full sisters (residuary with daughters)"), [
      { key: "fullSister", weight: 1 },
    ]);
  if (!consBlockReason && c.paternalBrother > 0)
    g("paternalBrother", T("باپ شریک بھائی/بہنیں", "Paternal half-siblings"), [
      { key: "paternalBrother", weight: 2 },
      ...(c.paternalSister > 0 ? [{ key: "paternalSister" as HeirKey, weight: 1 }] : []),
    ]);
  if (consSisterMaalGhair)
    g("paternalSisterMG", T("باپ شریک بہنیں (عصبہ مع الغیر)", "Paternal half-sisters (residuary)"), [
      { key: "paternalSister", weight: 1 },
    ]);
  (
    [
      ["fullNephew", T("سگے بھتیجے", "Full brother's sons")],
      ["paternalNephew", T("باپ شریک بھتیجے", "Paternal half-brother's sons")],
      ["fullUncle", T("سگے چچا", "Full paternal uncles")],
      ["paternalUncle", T("باپ شریک چچا", "Paternal half-uncles")],
      ["fullUncleSon", T("سگے چچا کے بیٹے", "Sons of full uncles")],
      ["paternalUncleSon", T("باپ شریک چچا کے بیٹے", "Sons of paternal half-uncles")],
    ] as [HeirKey, Txt][]
  ).forEach(([k, label]) => {
    if (c[k] > 0) g(k, label, [{ key: k, weight: 1 }]);
  });

  const activeGroup = groups[0] ?? null;
  // everyone further down the ʿasabah chain is excluded by the nearest residuary
  groups.slice(1).forEach((grp) => {
    grp.members.forEach((m) => {
      if (fard[m.key] || excluded.some((e) => e.key === m.key)) return;
      bar(
        m.key,
        T(
          `قریب تر عصبہ (${activeGroup?.label.ur}) کی موجودگی میں محجوب`,
          `Excluded by a nearer residuary (${activeGroup?.label.en})`,
        ),
      );
    });
  });

  /* ───────────────────────── totals, ʿawl & radd ───────────────────────── */
  const fardEntries = (Object.entries(fard) as [HeirKey, Frac][]).filter(([, f]) => f.n > 0);
  const sumFard = fardEntries.reduce((s, [, f]) => add(s, f), ZERO);

  const asl = fardEntries.reduce((s, [, f]) => lcm(s, f.d), 1);

  let awl = false;
  let radd = false;
  let leftover: Frac = ZERO;
  const finalShares: Partial<Record<HeirKey, Frac>> = {};
  const statuses: Partial<Record<HeirKey, Status>> = {};

  fardEntries.forEach(([k, f]) => {
    finalShares[k] = f;
    statuses[k] = "fard";
  });

  if (activeGroup) {
    const residue = sub(ONE, sumFard);
    if (residue.n > 0) {
      const totalWeight = activeGroup.members.reduce((s, m) => s + m.weight * c[m.key], 0);
      activeGroup.members.forEach((m) => {
        const part = mul(residue, F(m.weight * c[m.key], totalWeight));
        finalShares[m.key] = add(finalShares[m.key] ?? ZERO, part);
        statuses[m.key] = fard[m.key] ? "fard_asaba" : "asaba";
      });
    } else if (residue.n < 0) {
      awl = true;
      activeGroup.members.forEach((m) => {
        if (!fard[m.key]) {
          bar(
            m.key,
            T(
              "عول کی وجہ سے کچھ باقی نہ بچا (اصحاب الفروض نے پورا ترکہ لے لیا)",
              "Nothing remains after the fixed shares (ʿawl) — the residuary receives nothing",
            ),
          );
        }
      });
    } else {
      activeGroup.members.forEach((m) => {
        if (!fard[m.key]) {
          bar(
            m.key,
            T(
              "اصحاب الفروض کے حصص کے بعد کچھ باقی نہ بچا",
              "Nothing remains after the fixed shares",
            ),
          );
        }
      });
    }
  }

  if (gt(sumFard, ONE)) {
    awl = true;
    const factor = div(ONE, sumFard);
    fardEntries.forEach(([k, f]) => {
      finalShares[k] = mul(f, factor);
    });
    notes.push(
      T(
        "اس مسئلہ میں «عول» واقع ہوا ہے: مقررہ حصص کا مجموعہ پورے ترکہ سے زیادہ ہو گیا، اس لیے تمام حصص کو بہ تناسب کم کر دیا گیا ہے۔",
        "This case involves ʿAwl: the fixed shares exceed the whole estate, so every share is reduced proportionally.",
      ),
    );
  } else if (!activeGroup && sumFard.n > 0 && !gt(sumFard, ONE) && num(sumFard) < 1) {
    // Radd
    const raddEntries = fardEntries.filter(([k]) => k !== "husband" && k !== "wife");
    const raddBase = raddEntries.reduce((s, [, f]) => add(s, f), ZERO);
    const remainder = sub(ONE, sumFard);
    if (raddEntries.length > 0 && raddBase.n > 0) {
      radd = true;
      raddEntries.forEach(([k, f]) => {
        finalShares[k] = add(f, mul(remainder, div(f, raddBase)));
        statuses[k] = "radd";
      });
      notes.push(
        T(
          "اس مسئلہ میں «رد» ہوا ہے: کوئی عصبہ موجود نہیں، اس لیے بچا ہوا حصہ شوہر/بیوی کے علاوہ باقی اصحاب الفروض کو ان کے حصص کے تناسب سے واپس کر دیا گیا ہے۔",
          "This case involves Radd: there is no residuary heir, so the surplus is returned proportionally to the fixed-share heirs (excluding the spouse).",
        ),
      );
    } else {
      leftover = remainder;
      notes.push(
        T(
          `کوئی عصبہ یا صاحبِ رد موجود نہیں۔ ${fmt(remainder)} حصہ ذوی الارحام (دور کے رشتہ دار) کو ملے گا، ورنہ بیت المال میں جائے گا۔ (بعض معاصر فتاویٰ میں یہ حصہ زوج/زوجہ کو بھی دیا جاتا ہے، اس میں مفتی صاحب سے رجوع کریں۔)`,
          `No residuary or radd-eligible heir exists. The remaining ${fmt(remainder)} passes to the distant kindred (dhawu al-arham) and, failing them, to the public treasury.`,
        ),
      );
    }
  }

  /* ───────────────────────── money ───────────────────────── */
  const afterFuneral = Math.max(0, (input.estate || 0) - (input.funeral || 0) - (input.debts || 0));
  const bequestPaid = Math.min(Math.max(0, input.bequest || 0), afterFuneral / 3);
  const net = Math.max(0, afterFuneral - bequestPaid);
  if ((input.bequest || 0) > afterFuneral / 3 && afterFuneral > 0) {
    notes.push(
      T(
        "وصیت ایک تہائی ترکہ سے زیادہ نافذ نہیں ہوتی، اس لیے وصیت کو ایک تہائی تک محدود کر دیا گیا ہے (ورثاء کی اجازت ہو تو زیادہ بھی نافذ ہو سکتی ہے)۔",
        "A bequest cannot exceed one third of the estate, so it has been capped at one third (unless all heirs consent).",
      ),
    );
  }

  /* ───────────────────────── rows ───────────────────────── */
  const activeKeys = HEIR_KEYS.filter((k) => c[k] > 0 && (finalShares[k]?.n ?? 0) > 0);
  const finalBase = activeKeys.reduce((s, k) => lcm(s, finalShares[k]!.d), 1);

  const rows: ResultRow[] = activeKeys.map((k) => {
    const frac = finalShares[k]!;
    const perPerson = F(frac.n, frac.d * c[k]);
    return {
      key: k,
      count: c[k],
      status: statuses[k] ?? "fard",
      fraction: frac,
      perPerson,
      percent: num(frac) * 100,
      amount: num(frac) * net,
      perPersonAmount: (num(frac) * net) / c[k],
      units: (frac.n * finalBase) / frac.d,
      basis: basis[k] ?? T("", ""),
    };
  });

  // any heir that has a count but no share and no exclusion recorded
  HEIR_KEYS.forEach((k) => {
    if (c[k] > 0 && !activeKeys.includes(k) && !excluded.some((e) => e.key === k)) {
      excluded.push({
        key: k,
        count: c[k],
        reason: T("اس صورت میں کوئی حصہ نہیں بنتا", "Receives no share in this case"),
      });
    }
  });

  return {
    ok: rows.length > 0 || excluded.length > 0,
    rows,
    excluded,
    asl,
    finalBase,
    awl,
    radd,
    residueHolders: activeGroup ? activeGroup.members.map((m) => m.key) : [],
    leftover,
    money: {
      estate: input.estate || 0,
      funeral: input.funeral || 0,
      debts: input.debts || 0,
      bequest: input.bequest || 0,
      bequestPaid,
      net,
    },
    notes,
    totalHeirs,
  };
}

export { fmt };
