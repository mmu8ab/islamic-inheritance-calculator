import type { HeirKey } from "./faraid";

export type Lang = "ur" | "en";

type L = { ur: string; en: string };

export const HEIR_LABEL: Record<HeirKey, L> = {
  husband: { ur: "شوہر", en: "Husband" },
  wife: { ur: "بیوی", en: "Wife" },
  son: { ur: "بیٹا", en: "Son" },
  daughter: { ur: "بیٹی", en: "Daughter" },
  grandson: { ur: "پوتا", en: "Grandson (son's son)" },
  granddaughter: { ur: "پوتی", en: "Granddaughter (son's daughter)" },
  ggrandson: { ur: "پڑپوتا", en: "Great-grandson" },
  ggranddaughter: { ur: "پڑپوتی", en: "Great-granddaughter" },
  father: { ur: "والد (باپ)", en: "Father" },
  mother: { ur: "والدہ (ماں)", en: "Mother" },
  grandfather: { ur: "دادا", en: "Paternal grandfather" },
  ggrandfather: { ur: "پڑدادا", en: "Paternal great-grandfather" },
  paternalGrandmother: { ur: "دادی", en: "Paternal grandmother" },
  maternalGrandmother: { ur: "نانی", en: "Maternal grandmother" },
  fullBrother: { ur: "سگا بھائی", en: "Full brother" },
  fullSister: { ur: "سگی بہن", en: "Full sister" },
  paternalBrother: { ur: "باپ شریک بھائی", en: "Paternal half-brother" },
  paternalSister: { ur: "باپ شریک بہن", en: "Paternal half-sister" },
  maternalBrother: { ur: "ماں شریک بھائی", en: "Maternal half-brother" },
  maternalSister: { ur: "ماں شریک بہن", en: "Maternal half-sister" },
  fullNephew: { ur: "سگا بھتیجا", en: "Full brother's son" },
  paternalNephew: { ur: "باپ شریک بھتیجا", en: "Paternal half-brother's son" },
  fullUncle: { ur: "سگا چچا", en: "Full paternal uncle" },
  paternalUncle: { ur: "باپ شریک چچا", en: "Paternal half-uncle" },
  fullUncleSon: { ur: "سگے چچا کا بیٹا", en: "Son of full paternal uncle" },
  paternalUncleSon: { ur: "باپ شریک چچا کا بیٹا", en: "Son of paternal half-uncle" },
};

export const HEIR_HINT: Partial<Record<HeirKey, L>> = {
  wife: { ur: "زیادہ سے زیادہ چار", en: "Maximum four" },
  grandson: { ur: "بیٹے کا بیٹا", en: "Son of the son" },
  granddaughter: { ur: "بیٹے کی بیٹی", en: "Daughter of the son" },
  ggrandson: { ur: "پوتے کا بیٹا", en: "Son of the grandson" },
  ggranddaughter: { ur: "پوتے کی بیٹی", en: "Daughter of the grandson" },
  grandfather: { ur: "باپ کا باپ", en: "Father's father" },
  ggrandfather: { ur: "باپ کا دادا", en: "Father's grandfather" },
  paternalGrandmother: { ur: "باپ کی ماں", en: "Father's mother" },
  maternalGrandmother: { ur: "ماں کی ماں", en: "Mother's mother" },
  maternalBrother: { ur: "اخیافی بھائی", en: "Uterine brother" },
  maternalSister: { ur: "اخیافی بہن", en: "Uterine sister" },
  paternalBrother: { ur: "علاتی بھائی", en: "Consanguine brother" },
  paternalSister: { ur: "علاتی بہن", en: "Consanguine sister" },
};

export type Group = { id: string; title: L; icon: string; keys: HeirKey[] };

export const GROUPS: Group[] = [
  {
    id: "spouse",
    title: { ur: "زوجیت", en: "Spouse" },
    icon: "💍",
    keys: ["wife", "husband"],
  },
  {
    id: "children",
    title: { ur: "اولاد و اولادِ اولاد", en: "Children & their descendants" },
    icon: "👨‍👩‍👧",
    keys: ["son", "daughter", "grandson", "granddaughter", "ggrandson", "ggranddaughter"],
  },
  {
    id: "parents",
    title: { ur: "والدین و اجداد", en: "Parents & grandparents" },
    icon: "🕊️",
    keys: [
      "father",
      "mother",
      "grandfather",
      "paternalGrandmother",
      "maternalGrandmother",
      "ggrandfather",
    ],
  },
  {
    id: "siblings",
    title: { ur: "بہن بھائی", en: "Brothers & sisters" },
    icon: "🤝",
    keys: [
      "fullBrother",
      "fullSister",
      "paternalBrother",
      "paternalSister",
      "maternalBrother",
      "maternalSister",
    ],
  },
  {
    id: "others",
    title: { ur: "دیگر عصبات", en: "Other residuaries" },
    icon: "🌿",
    keys: [
      "fullNephew",
      "paternalNephew",
      "fullUncle",
      "paternalUncle",
      "fullUncleSon",
      "paternalUncleSon",
    ],
  },
];

export const STATUS_LABEL: Record<string, L> = {
  fard: { ur: "ذوی الفروض", en: "Fixed share" },
  asaba: { ur: "عصبہ", en: "Residuary" },
  fard_asaba: { ur: "فرض + عصبہ", en: "Fixed + residuary" },
  radd: { ur: "فرض + رد", en: "Fixed + radd" },
  blocked: { ur: "محجوب", en: "Excluded" },
  special: { ur: "خاص", en: "Special" },
};

export const UI = {
  brand: { ur: "میراث کیلکولیٹر", en: "Inheritance Calculator" },
  tagline: {
    ur: "فقہ حنفی کے مطابق وارثوں کے شرعی حصص معلوم کریں",
    en: "Determine the Shariah shares of heirs according to the Hanafi school",
  },
  quran: {
    ur: "لِلرِّجَالِ نَصِيبٌ مِّمَّا تَرَكَ الْوَالِدَانِ وَالْأَقْرَبُونَ",
    en: "For men is a share of what the parents and close relatives leave",
  },
  quranRef: { ur: "سورۃ النساء — 7", en: "Surah An-Nisa 4:7" },
  instructions: { ur: "اہم ہدایات", en: "Important instructions" },
  heirsTitle: { ur: "ورثاء کی تفصیل", en: "Details of the heirs" },
  gender: { ur: "میت کی جنس", en: "Gender of the deceased" },
  male: { ur: "مرد", en: "Male" },
  female: { ur: "عورت", en: "Female" },
  countPrompt: { ur: "ورثاء کی تعداد درج کریں", en: "Enter the number of each heir" },
  estate: { ur: "کل ترکہ (اختیاری)", en: "Total estate (optional)" },
  estateHint: {
    ur: "ہر وارث کا حصہ رقم میں بھی دکھایا جائے گا",
    en: "Each heir's share will also be shown as an amount",
  },
  advanced: { ur: "واجب الادا اخراجات (اختیاری)", en: "Deductions before distribution (optional)" },
  funeral: { ur: "تجہیز و تکفین", en: "Funeral expenses" },
  debts: { ur: "قرض", en: "Debts" },
  bequest: { ur: "وصیت (زیادہ سے زیادہ ⅓)", en: "Bequest (max ⅓)" },
  calculate: { ur: "حساب کریں", en: "Calculate" },
  reset: { ur: "دوبارہ شروع", en: "Reset" },
  print: { ur: "پرنٹ / محفوظ کریں", en: "Print / Save" },
  results: { ur: "نتیجۂ تقسیم", en: "Distribution result" },
  heir: { ur: "وارث", en: "Heir" },
  count: { ur: "تعداد", en: "No." },
  share: { ur: "کل حصہ", en: "Total share" },
  perPerson: { ur: "فی کس", en: "Per person" },
  percent: { ur: "فیصد", en: "Percent" },
  amount: { ur: "رقم", en: "Amount" },
  basis: { ur: "بنیاد", en: "Basis" },
  excludedTitle: { ur: "محروم (محجوب) رشتہ دار", en: "Excluded relatives" },
  noHeirs: {
    ur: "کم از کم ایک وارث منتخب کریں",
    en: "Please select at least one heir",
  },
  noHeirsSub: {
    ur: "اوپر دیے گئے خانوں میں ورثاء کی تعداد درج کریں، نتیجہ خود بخود ظاہر ہو جائے گا۔",
    en: "Enter the number of heirs above and the result will appear automatically.",
  },
  masla: { ur: "تفصیلِ مسئلہ", en: "Case summary" },
  asl: { ur: "اصلِ مسئلہ", en: "Base (asl al-mas'ala)" },
  finalBase: { ur: "تقسیم بر", en: "Divided into" },
  awl: { ur: "عول", en: "ʿAwl" },
  radd: { ur: "رد", en: "Radd" },
  yes: { ur: "ہاں", en: "Yes" },
  no: { ur: "نہیں", en: "No" },
  netEstate: { ur: "قابلِ تقسیم ترکہ", en: "Distributable estate" },
  notes: { ur: "اہم وضاحتیں", en: "Important notes" },
  shareUnits: { ur: "سہام", en: "Shares" },
  selected: { ur: "منتخب ورثاء", en: "Selected heirs" },
  clearAll: { ur: "سب صاف کریں", en: "Clear all" },
  examples: { ur: "نمونہ مسائل", en: "Sample cases" },
  disclaimer: {
    ur: "یہ کیلکولیٹر فقہ حنفی کے مشہور اقوال کی روشنی میں خودکار حساب پیش کرتا ہے۔ پیچیدہ یا خاص صورتوں (حمل، مفقود، قاتل، مرتد، لے پالک، وقف و وصیت کے مسائل) میں کسی مستند مفتی سے تحریری فتویٰ ضرور لیں۔",
    en: "This calculator applies the well-known positions of the Hanafi school. For complex or special cases (unborn child, missing person, killer, apostate, adopted child, endowments) always consult a qualified mufti.",
  },
};

export const INSTRUCTIONS: { ur: string; en: string }[] = [
  {
    ur: "سب سے پہلے میت کے ترکہ سے تجہیز و تکفین کا خرچ نکالا جائے گا، پھر قرض ادا کیا جائے گا، پھر باقی مال کے ایک تہائی تک وصیت نافذ کی جائے گی، اس کے بعد بچا ہوا مال ورثاء میں تقسیم ہوگا۔",
    en: "First the funeral expenses are paid from the estate, then the debts, then any bequest up to one third of the remainder; only afterwards is the balance distributed among the heirs.",
  },
  {
    ur: "ورثاء کی صرف وہ تعداد درج کریں جو میت کی وفات کے وقت زندہ تھے۔",
    en: "Enter only those heirs who were alive at the moment of death.",
  },
  {
    ur: "یہ کیلکولیٹر خودکار طور پر حجب (محرومی)، عول اور رد کے قواعد لاگو کرتا ہے۔",
    en: "The calculator automatically applies the rules of exclusion (hijab), ʿawl and radd.",
  },
  {
    ur: "بیوی زیادہ سے زیادہ چار تک درج کی جا سکتی ہیں، اور ان کا حصہ آپس میں برابر تقسیم ہوتا ہے۔",
    en: "Up to four wives may be entered; their share is divided equally among them.",
  },
  {
    ur: "فقہ حنفی کے مطابق دادا کی موجودگی میں بھائی بہن محروم ہو جاتے ہیں (قول امام ابو حنیفہ رحمہ اللہ)۔",
    en: "According to Imam Abu Hanifa, siblings are excluded by the presence of the paternal grandfather.",
  },
];

export const SAMPLES: { title: L; counts: Partial<Record<HeirKey, number>>; gender: "male" | "female" }[] = [
  {
    title: { ur: "بیوی، 2 بیٹے، 1 بیٹی، ماں", en: "Wife, 2 sons, 1 daughter, mother" },
    gender: "male",
    counts: { wife: 1, son: 2, daughter: 1, mother: 1 },
  },
  {
    title: { ur: "شوہر، ماں، باپ (عمریتین)", en: "Husband, mother, father (Umariyyatayn)" },
    gender: "female",
    counts: { husband: 1, mother: 1, father: 1 },
  },
  {
    title: { ur: "شوہر، 2 سگی بہنیں، ماں (عول)", en: "Husband, 2 full sisters, mother (ʿAwl)" },
    gender: "female",
    counts: { husband: 1, fullSister: 2, mother: 1 },
  },
  {
    title: { ur: "1 بیٹی، 2 پوتیاں، سگا بھائی", en: "1 daughter, 2 granddaughters, full brother" },
    gender: "male",
    counts: { daughter: 1, granddaughter: 2, fullBrother: 1 },
  },
  {
    title: { ur: "ماں، 1 بیٹی (رد)", en: "Mother and one daughter (Radd)" },
    gender: "male",
    counts: { mother: 1, daughter: 1 },
  },
];

export const MUNA = {
  tabNormal: { ur: "عام تقسیمِ میراث", en: "Standard distribution" },
  tabMuna: { ur: "مناسخہ", en: "Munasakha" },
  munaIntro: {
    ur: "مناسخہ: جب کوئی وارث پہلی میت کا حصہ پا کر، تقسیم سے پہلے فوت ہو جائے، تو اس کا حصہ اس کے اپنے ورثاء میں منتقل ہو جاتا ہے۔",
    en: "Munasakha: when an heir dies after inheriting but before distribution, their share passes into their own estate.",
  },
  step1: { ur: "مرحلہ 1 — پہلا متوفی اور اس کے ورثاء", en: "Step 1 — first deceased and their heirs" },
  saveBase: { ur: "اصل مسئلہ محفوظ کریں", en: "Save the base case" },
  baseResult: { ur: "اصل ترکہ — تقسیم", en: "Original estate — distribution" },
  pickDeceased: {
    ur: "کس وارث کا انتقال ہوا؟ (ترتیبِ وفات کے مطابق)",
    en: "Which heir passed away? (in order of death)",
  },
  died: { ur: "اس وارث کا انتقال ہوا", en: "This heir passed away" },
  enterLocalHeirs: { ur: "مرحوم کے ورثہ درج کریں", en: "Enter the deceased's heirs" },
  deceasedShare: { ur: "مرحوم کا سابقہ حصہ", en: "Deceased's accumulated share" },
  calcMuna: { ur: "مناسخہ کا حساب کریں", en: "Apply Munasakha" },
  cancel: { ur: "منسوخ کریں", en: "Cancel" },
  finalResult: { ur: "آخری یکجا تقسیم", en: "Final unified distribution" },
  currentState: { ur: "موجودہ یکجا تقسیم", en: "Current unified distribution" },
  stageHistory: { ur: "مناسخہ کے مراحل", en: "Munasakha stages" },
  stageLabel: { ur: "مرحلہ", en: "Stage" },
  prevJamia: { ur: "سابقہ الجامعة", en: "Previous base" },
  localBase: { ur: "دوسرے مسئلے کا اصل (تصحیح کے بعد)", en: "Secondary base (after correction)" },
  gcdLabel: { ur: "جزء السہم", en: "GCD" },
  mGlobal: { ur: "بڑا ضارب", en: "Global multiplier" },
  mLocal: { ur: "مقامی ضارب", en: "Local multiplier" },
  newJamia: { ur: "نئی الجامعة", en: "New Al-Jami'ah" },
  updatedHeirs: { ur: "پurane وارث (بڑے ضارب سے ضرب)", en: "Existing heirs (× global multiplier)" },
  newHeirs: { ur: "نئے وارث (مقامی ضارب سے ضرب)", en: "New heirs (× local multiplier)" },
  verification: { ur: "میزان کی تصدیق", en: "Reconciliation" },
  verified: { ur: "میزان درست ہے — مجموعہ نئی الجامعة کے برابر ہے۔", en: "Reconciled — the total equals the new base." },
  details: { ur: "تفصیلی حساب دیکھیں", en: "View detailed calculation" },
  newPerson: { ur: "نیا وارث", en: "New person" },
  samePerson: { ur: "پہلے سے موجود وارث:", en: "Already-existing heir:" },
  total: { ur: "میزان", en: "Total" },
  resetAll: { ur: "نیا مسئلہ (سب صاف کریں)", en: "New case (reset all)" },
  errNoLocalHeirs: {
    ur: "مرحوم کے کوئی وارث درج نہیں۔ کم از کم ایک وارث درج کریں۔",
    en: "No heirs entered for the deceased. Enter at least one.",
  },
};
