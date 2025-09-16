import React, { useEffect, useMemo, useState } from "react";

/**
 * Daily Inventory Form – Mobile-first, RTL/LTR, no server.
 * Version v1.5.0
 * WHAT'S NEW
 * - Fixed build issues: full definitions (LANGS, CATEGORIES, etc.).
 * - Robust EN translations: fallback when missing.
 * - WhatsApp-only export: list non-zero items (L), then a final Shortages/חוסרים section (zeros only, no categories).
 * - UI: names no longer truncated; inputs wrap on small screens.
 * - Self-tests extended.
 */

// ===== Languages =====
const LANGS = {
  he: {
    appTitle: "טופס מלאי יומי",
    subtitle: "קלט בליטרים/קופסאות. נשמר אוטומטית.",
    date: "תאריך",
    search: "חיפוש…",
    clear: "ניקוי",
    cold: "פס קר",
    hot: "פס חם",
    nines: "תשיעיות",
    note: (l: string) => `הערה (${l})`,
    generalNote: "הערה כללית",
    share: "שליחה בווצאפ",
    copy: "העתקה ללוח",
    resetAll: "איפוס מלא",
    resetCat: "איפוס קטגוריה",
    nameCol: "שם",
    qtyCol: "כמות (ל׳)",
    addCustom: "+ פריט מותאם",
    jumpToInput: "קפיצה לקלט",
    liters: "ליטרים",
    boxes: "קופסאות (2 ל׳)",
    total: "סה\"כ",
    unit: "ל׳",
    version: "גרסה 1.5.0 – יצוא וואטסאפ + חוסרים",
    dailyTitle: (d: string) => `מלאי יומי – ${d}`,
    emoji: { cold: "🧊", hot: "🔥", nines: "🗂️" },
    shortages: "חוסרים",
  },
  en: {
    appTitle: "Daily Inventory Form",
    subtitle: "Liters & 2L boxes. Auto-saved.",
    date: "Date",
    search: "Search…",
    clear: "Clear",
    cold: "Cold Line",
    hot: "Hot Line",
    nines: "Nines",
    note: (l: string) => `Note (${l})`,
    generalNote: "General note",
    share: "Send via WhatsApp",
    copy: "Copy",
    resetAll: "Reset all",
    resetCat: "Reset category",
    nameCol: "Name",
    qtyCol: "Qty (L)",
    addCustom: "+ Custom item",
    jumpToInput: "Jump to input",
    liters: "Liters",
    boxes: "Boxes (2L)",
    total: "Total",
    unit: "L",
    version: "v1.5.0 – WhatsApp export + shortages",
    dailyTitle: (d: string) => `Daily Inventory – ${d}`,
    emoji: { cold: "🧊", hot: "🔥", nines: "🗂️" },
    shortages: "Shortages",
  },
} as const;

type LangKey = keyof typeof LANGS;

// ===== Categories =====
const CATEGORIES = [
  { id: "cold", labelKey: "cold", noteKey: "noteCold" },
  { id: "hot", labelKey: "hot", noteKey: "noteHot" },
  { id: "nines", labelKey: "nines", noteKey: "noteNines" },
] as const;

type CatId = (typeof CATEGORIES)[number]["id"];

// ===== Palette (playful, higher contrast) =====
const PALETTES: Record<CatId, any> = {
  cold: {
    bg: "from-cyan-50 via-cyan-100 to-sky-100",
    border: "border-cyan-300",
    ring: "ring-cyan-500",
    chip: "bg-gradient-to-r from-cyan-300 to-sky-300 text-cyan-950",
    btn: { plus: "bg-cyan-600 text-white hover:bg-cyan-700", minus: "bg-white hover:bg-cyan-50" },
    accent: "text-cyan-700",
  },
  hot: {
    bg: "from-amber-50 via-orange-100 to-rose-100",
    border: "border-amber-300",
    ring: "ring-amber-500",
    chip: "bg-gradient-to-r from-amber-300 to-orange-300 text-amber-950",
    btn: { plus: "bg-amber-600 text-white hover:bg-amber-700", minus: "bg-white hover:bg-amber-50" },
    accent: "text-amber-700",
  },
  nines: {
    bg: "from-emerald-50 via-emerald-100 to-lime-100",
    border: "border-emerald-300",
    ring: "ring-emerald-500",
    chip: "bg-gradient-to-r from-emerald-300 to-lime-300 text-emerald-950",
    btn: { plus: "bg-emerald-600 text-white hover:bg-emerald-700", minus: "bg-white hover:bg-emerald-50" },
    accent: "text-emerald-700",
  },
};

// ===== Default items (Hebrew keys) including requested changes =====
const DEFAULT_ITEMS: Record<CatId, string[]> = {
  cold: [
    "וואפו",
    "בייס שיטאקי",
    "ויני שיטאקי",
    "אמאזו",
    "סונומונו",
    "ויניגרט ווסאבי",
    "סודצ׳י פונזו",
  ],
  hot: [
    "דן מיסו",
    "מייפל קוג׳י",
    "גומה דארה",
    "קצואובושי טסויו",
    "שמן קומבו",
    "פונזו",
    "איולי יוזו קושו",
    "בייס קצבושי",
    "קרמל קצבושי",
    "טארה גרון",
    "טארה בקר",
    "טריאקי",
    "רוטב כרוב",
    "אגדאשי",
    "ניטסוקה",
    "סאקה מירין",
    "נוזל יוזו",
    "קומבו דאשי",
    "צ׳ילי אוממי",
  ],
  nines: [
    "יקיניקו",
    "טונקאצו",
    "חמאת טופנג׳ן",
    "שומר סונומונו",
    "פטריות מוחמצות",
    "צ׳ילי טארה",
    "דאי דאי",
  ],
};

// ===== English display map (complete) =====
const NAME_MAP_EN: Record<string, string> = {
  // cold
  "וואפו": "Wafu",
  "בייס שיטאקי": "Shiitake Base",
  "ויני שיטאקי": "Shiitake Vinaigrette",
  "אמאזו": "Amazu",
  "סונומונו": "Sunomono",
  "ויניגרט ווסאבי": "Wasabi Vinaigrette",
  "סודצ׳י פונזו": "Sudachi Ponzu",
  // hot
  "דן מיסו": "Dan Miso",
  "מייפל קוג׳י": "Maple Koji",
  "גומה דארה": "Goma Dare",
  "קצואובושי טסויו": "Katsuobushi Tsuyu",
  "שמן קומבו": "Kombu Oil",
  "פונזו": "Ponzu",
  "איולי יוזו קושו": "Yuzu-Kosho Aioli",
  "בייס קצבושי": "Katsuobushi Base",
  "קרמל קצבושי": "Katsuobushi Caramel",
  "טארה גרון": "Tare – Throat",
  "טארה בקר": "Tare – Beef",
  "טריאקי": "Teriyaki",
  "רוטב כרוב": "Cabbage Sauce",
  "אגדאשי": "Agedashi",
  "ניטסוקה": "Nitsuke",
  "סאקה מירין": "Sake–Mirin",
  "נוזל יוזו": "Yuzu Liquid",
  "קומבו דאשי": "Kombu Dashi",
  "צ׳ילי אוממי": "Umami Chili",
  // nines
  "יקיניקו": "Yakiniku",
  "טונקאצו": "Tonkatsu",
  "חמאת טופנג׳ן": "Topengen Butter",
  "שומר סונומונו": "Fennel Sunomono",
  "פטריות מוחמצות": "Pickled Mushrooms",
  "צ׳ילי טארה": "Chili Tare",
  "דאי דאי": "Daidai",
};

function displayName(heName: string, lang: LangKey) {
  // Fallback to Hebrew if translation missing
  return lang === "en" ? (NAME_MAP_EN[heName] ?? heName) : heName;
}

// ===== Initial State =====
const initialState = () => {
  const byCat: Record<string, Record<string, number>> = {};
  CATEGORIES.forEach((c) => {
    byCat[c.id] = {};
    DEFAULT_ITEMS[c.id].forEach((name) => (byCat[c.id][name] = 0));
  });
  return {
    meta: { date: new Date().toISOString().slice(0, 10) },
    items: byCat,
    notes: { noteCold: "", noteHot: "", noteNines: "", general: "" },
    custom: { cold: [], hot: [], nines: [] as { name: string; amount: number }[] },
    lang: "he" as string, // runtime-validated
    search: "",
  };
};

const LS_KEY = "daily-inventory-form-v1";

export default function InventoryForm() {
  const [state, setState] = useState(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      return raw ? JSON.parse(raw) : initialState();
    } catch {
      return initialState();
    }
  });

  // Safe language fallback
  const lang: LangKey = (state.lang in LANGS ? state.lang : "he") as LangKey;
  const t = LANGS[lang];
  const dir = lang === "he" ? "rtl" : "ltr";

  useEffect(() => {
    localStorage.setItem(LS_KEY, JSON.stringify(state));
  }, [state]);

  // Meta & notes
  const setMeta = (k: string, v: string) => setState((s: any) => ({ ...s, meta: { ...s.meta, [k]: v } }));
  const setNote = (k: string, v: string) => setState((s: any) => ({ ...s, notes: { ...s.notes, [k]: v } }));

  // Update amounts (value kept in liters)
  const updateAmount = (cat: string, name: string, v: number) =>
    setState((s: any) => ({
      ...s,
      items: { ...s.items, [cat]: { ...s.items[cat], [name]: Math.max(0, Number.isFinite(v) ? v : 0) } },
    }));

  // Custom items
  const addCustom = (cat: string) => setState((s: any) => ({ ...s, custom: { ...s.custom, [cat]: [...s.custom[cat], { name: "", amount: 0 }] } }));
  const setCustom = (cat: string, idx: number, k: "name" | "amount", v: any) =>
    setState((s: any) => {
      const arr = [...s.custom[cat]];
      const cur = { ...arr[idx], [k]: k === "amount" ? Math.max(0, Number(v) || 0) : v };
      arr[idx] = cur;
      return { ...s, custom: { ...s.custom, [cat]: arr } };
    });
  const removeCustom = (cat: string, idx: number) => setState((s: any) => ({ ...s, custom: { ...s.custom, [cat]: s.custom[cat].filter((_: any, i: number) => i !== idx) } }));

  // Clearers
  const clearCategory = (cat: string) =>
    setState((s: any) => ({
      ...s,
      items: { ...s.items, [cat]: Object.fromEntries(Object.keys(s.items[cat]).map((k) => [k, 0])) },
      custom: { ...s.custom, [cat]: [] },
      notes: { ...s.notes, [`note${cap(cat)}`]: "" },
    }));
  const resetAll = () => setState(initialState());

  // Debounced search (minimal UI)
  const [q, setQ] = useState("");
  useEffect(() => {
    const id = setTimeout(() => setState((s: any) => ({ ...s, search: q })), 180);
    return () => clearTimeout(id);
  }, [q]);

  // Matching: search in he key + EN display
  const norm = (s: string) => (s || "").toString().toLowerCase();
  const matches = (heName: string) => {
    if (!state.search) return true;
    const disp = displayName(heName, lang);
    const n = norm(state.search);
    return norm(heName).includes(n) || norm(disp).includes(n);
  };

  // ===== Share helpers (WhatsApp-only) =====
  const shareText = useMemo(() => formatShareText(state), [state]);

  const doCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      alert(lang === "he" ? "הועתק ללוח." : "Copied to clipboard.");
    } catch {
      alert(lang === "he" ? "לא ניתן להעתיק בדפדפן זה." : "Copy failed in this browser.");
    }
  };

  const doShare = async () => {
    const waText = formatShareText(state);
    const url = `https://wa.me/?text=${encodeURIComponent(waText)}`;
    window.open(url, "_blank");
  };

  return (
    <div dir={dir} className="min-h-screen bg-gradient-to-b from-violet-50 via-slate-50 to-pink-50 text-slate-900 px-3 py-4">
      <div className="max-w-xl mx-auto">
        <header className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-fuchsia-600 to-sky-600">{t.appTitle}</h1>
            <p className="text-sm text-slate-600">{t.subtitle}</p>
          </div>
          <button
            onClick={() => setState((s: any) => ({ ...s, lang: (s.lang === "he" ? "en" : "he") }))}
            className="rounded-full border border-slate-300 px-3 py-1 text-sm bg-white shadow hover:shadow-md"
            aria-label="toggle language"
          >{(state.lang in LANGS ? state.lang : "he") === "he" ? "EN" : "HE"}</button>
        </header>

        {/* Date + Search */}
        <section className="grid grid-cols-1 gap-3 mb-4">
          <label className="flex flex-col gap-1">
            <span className="text-sm">{t.date}</span>
            <input
              type="date"
              value={state.meta.date}
              onChange={(e) => setMeta("date", e.target.value)}
              className="rounded-2xl border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-500 bg-white"
            />
          </label>

          {/* minimal pill search */}
          <div className="flex items-center gap-2">
            <div className="flex-1 rounded-full border border-slate-300 bg-white px-3 py-2 shadow-sm focus-within:ring-2 focus-within:ring-slate-500">
              <div className="flex items-center gap-2">
                <span className="opacity-60">🔎</span>
                <input
                  placeholder={t.search}
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  className="w-full focus:outline-none bg-transparent"
                />
                {q && (
                  <button onClick={() => setQ("")} className="text-xs opacity-60 hover:opacity-100">{t.clear}</button>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Categories */}
        {CATEGORIES.map((cat) => (
          <CategoryCard
            key={cat.id}
            id={cat.id}
            label={`${(LANGS as any)[lang][cat.labelKey]} ${((LANGS as any)[lang].emoji as Record<string, string>)[cat.id]}`}
            palette={PALETTES[cat.id]}
            lang={lang}
            items={Object.fromEntries(Object.entries(state.items[cat.id]).filter(([name]) => matches(name)))}
            custom={state.custom[cat.id].filter((row) => matches(row.name || ""))}
            note={(state.notes as any)[cat.noteKey]}
            onNote={(v) => setNote((cat as any).noteKey, v)}
            onAmount={(name, v) => updateAmount(cat.id, name, v)}
            onAddCustom={() => addCustom(cat.id)}
            onSetCustom={(idx, k, v) => setCustom(cat.id, idx, k as any, v)}
            onRemoveCustom={(idx) => removeCustom(cat.id, idx)}
            onClear={() => clearCategory(cat.id)}
            t={t}
          />
        ))}

        {/* General note + actions */}
        <section className="mt-4">
          <label className="flex flex-col gap-1">
            <span className="text-sm">{t.generalNote}</span>
            <textarea
              rows={3}
              value={state.notes.general}
              onChange={(e) => setNote("general", e.target.value)}
              className="rounded-2xl border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-500 bg-white"
            />
          </label>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <button onClick={doShare} className="rounded-2xl px-4 py-3 font-medium bg-slate-900 text-white shadow hover:shadow-md hover:opacity-90">{t.share}</button>
            <button onClick={doCopy} className="rounded-2xl px-4 py-3 font-medium border border-slate-300 bg-white shadow hover:shadow-md">{t.copy}</button>
            <button onClick={resetAll} className="col-span-2 rounded-2xl px-4 py-3 font-medium border border-rose-300 text-rose-700 bg-white hover:bg-rose-50">{t.resetAll}</button>
          </div>
        </section>

        <footer className="text-center text-xs text-slate-500 mt-6 mb-2">{t.version}</footer>
      </div>
    </div>
  );
}

function CategoryCard({
  id,
  label,
  palette,
  lang,
  items,
  custom,
  note,
  onNote,
  onAmount,
  onAddCustom,
  onSetCustom,
  onRemoveCustom,
  onClear,
  t,
}: {
  id: string;
  label: string;
  palette: any;
  lang: LangKey;
  items: Record<string, number>;
  custom: { name: string; amount: number }[];
  note: string;
  onNote: (v: string) => void;
  onAmount: (name: string, v: number) => void;
  onAddCustom: () => void;
  onSetCustom: (idx: number, k: "name" | "amount", v: any) => void;
  onRemoveCustom: (idx: number) => void;
  onClear: () => void;
  t: (typeof LANGS)[LangKey];
}) {
  const names = Object.keys(items);
  return (
    <section id={id} className={`mb-4 rounded-2xl border ${palette.border} bg-gradient-to-b ${palette.bg} p-3 shadow-sm`}>
      <div className="flex items-center justify-between gap-2 mb-2">
        <h2 className="text-lg font-semibold">
          <span className={`inline-flex items-center px-2 py-0.5 rounded-xl ${palette.chip}`}>{label}</span>
        </h2>
        <button onClick={onClear} className="text-xs underline opacity-70 hover:opacity-100">{t.resetCat}</button>
      </div>

      <div className="flex items-center justify-between text-xs text-slate-600 px-1 mb-1">
        <span>{t.nameCol}</span>
        <span>{t.qtyCol}</span>
      </div>

      <ul className="space-y-3">
        {names.map((heName) => (
          <li key={heName} className="bg-white rounded-2xl border border-slate-200 px-2 py-2 shadow-sm">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex-1 min-w-[60%] sm:min-w-[50%]">
                <div className="font-semibold whitespace-normal break-words leading-tight">{displayName(heName, lang)}</div>
                {lang === "en" && (
                  <div className={`${palette.accent} text-xs opacity-80 whitespace-normal break-words`}>{heName}</div>
                )}
              </div>
              <QuantityInput value={items[heName]} onChange={(v) => onAmount(heName, v)} palette={PALETTES[id as CatId]} t={t} />
            </div>
          </li>
        ))}

        {custom.map((row, idx) => (
          <li key={`c-${idx}`} className="bg-white rounded-2xl border border-slate-200 px-2 py-2 shadow-sm">
            <div className="flex items-center gap-2 flex-wrap">
              <input
                placeholder={t.addCustom.replace("+ ", "")}
                value={row.name}
                onChange={(e) => onSetCustom(idx, "name", e.target.value)}
                className="flex-1 min-w-[60%] sm:min-w-[50%] rounded-xl border border-slate-300 px-2 py-2 focus:outline-none focus:ring-2 focus:ring-slate-500"
              />
              <QuantityInput value={row.amount} onChange={(v) => onSetCustom(idx, "amount", v)} palette={PALETTES[id as CatId]} t={t} />
              <button onClick={() => onRemoveCustom(idx)} className="text-xs px-2 py-1 rounded-xl border border-slate-300 bg-white hover:bg-slate-50">{t.clear}</button>
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-2 flex gap-2">
        <button onClick={onAddCustom} className={`rounded-xl px-3 py-2 text-sm font-medium ${palette.btn.plus}`}>{t.addCustom}</button>
        <button onClick={() => focusFirstNumber(id)} className={`rounded-xl px-3 py-2 text-sm font-medium border ${palette.border} bg-white`}>{t.jumpToInput}</button>
      </div>

      <label className="block mt-3">
        <span className="text-sm">{t.note(label)}</span>
        <textarea rows={2} value={note} onChange={(e) => onNote(e.target.value)} className="w-full rounded-2xl border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-500 bg-white" />
      </label>
    </section>
  );
}

function QuantityInput({ value, onChange, palette, t }: { value: number; onChange: (v: number) => void; palette: any; t: (typeof LANGS)[LangKey] }) {
  // Split into 2L boxes + remainder liters (0.5 steps)
  const stepL = 0.5;
  const safeVal = Number.isFinite(value) ? value : 0;
  const boxes = Math.floor(safeVal / 2);
  const litersRemainder = roundTo(safeVal - boxes * 2, stepL);

  const setBoxes = (b: number) => onChange(Math.max(0, roundTo(b, 1)) * 2 + litersRemainder);
  const setLiters = (l: number) => onChange(Math.max(0, roundTo(l, stepL)) + boxes * 2);

  const incBox = () => setBoxes(boxes + 1);
  const decBox = () => setBoxes(Math.max(0, boxes - 1));

  const incL = () => setLiters(litersRemainder + stepL);
  const decL = () => setLiters(Math.max(0, litersRemainder - stepL));

  const total = roundTo(boxes * 2 + litersRemainder, stepL);

  return (
    <div className="flex items-stretch gap-2 select-none flex-wrap sm:flex-nowrap w-full">
      {/* Boxes card */}
      <div className="flex items-center gap-1 rounded-xl border px-2 py-1.5 bg-white shadow-sm min-w-[120px] sm:min-w-[150px] justify-between">
        <div className="text-xs opacity-70 mr-1">{t.boxes}</div>
        <div className="flex items-center gap-1">
          <button type="button" onClick={decBox} className={`px-2 py-1 rounded-lg border ${palette.border} ${palette.btn.minus}`}>–</button>
          <input
            inputMode="numeric"
            pattern="[0-9]*"
            value={Number.isFinite(boxes) ? boxes : 0}
            onChange={(e) => setBoxes(Number(e.target.value.replace(/[^0-9]/g, "")) || 0)}
            className={`w-12 text-center rounded-lg border ${palette.border} px-2 py-1 focus:outline-none ${palette.ring} focus:ring-2`}
            aria-label={t.boxes}
            title={t.boxes}
          />
          <button type="button" onClick={incBox} className={`px-2 py-1 rounded-lg ${palette.btn.plus}`}>+</button>
        </div>
      </div>

      {/* Liters card */}
      <div className="flex items-center gap-1 rounded-xl border px-2 py-1.5 bg-white shadow-sm min-w-[120px] sm:min-w-[150px] justify-between">
        <div className="text-xs opacity-70 mr-1">{t.liters}</div>
        <div className="flex items-center gap-1">
          <button type="button" onClick={decL} className={`px-2 py-1 rounded-lg border ${palette.border} ${palette.btn.minus}`}>–</button>
          <input
            inputMode="decimal"
            pattern="[0-9]*"
            value={Number.isFinite(litersRemainder) ? litersRemainder : 0}
            onChange={(e) => setLiters(Number(e.target.value.replace(/[^0-9.]/g, "")) || 0)}
            className={`w-14 text-center rounded-lg border ${palette.border} px-2 py-1 focus:outline-none ${palette.ring} focus:ring-2`}
            aria-label={t.liters}
            title={t.liters}
          />
          <button type="button" onClick={incL} className={`px-2 py-1 rounded-lg ${palette.btn.plus}`}>+</button>
        </div>
      </div>

      {/* Total badge */}
      <div className="flex items-center rounded-full bg-slate-900 text-white px-3 text-xs font-semibold sm:ml-auto mt-2 sm:mt-0">
        {t.total}:&nbsp;{total}&nbsp;{t.unit}
      </div>
    </div>
  );
}

// ===== Utils =====
function roundTo(n: number, step: number) {
  const k = Math.round(n / step) * step;
  return Number(k.toFixed(2));
}
function cap(s: string) { return s.charAt(0).toUpperCase() + s.slice(1); }

function focusFirstNumber(categoryId: string) {
  const el = document.querySelector(`#${CSS.escape(categoryId)} input[inputmode="decimal"]`) as HTMLInputElement | null;
  el?.focus();
}

// ===== Export text (WhatsApp) =====
function formatShareText(state: any) {
  const lang: LangKey = (state.lang in LANGS ? state.lang : "he") as LangKey;
  const t = LANGS[lang];
  const unit = t.unit;
  const lines: string[] = [];
  lines.push(t.dailyTitle(state.meta.date));
  lines.push("");

  // Body: list only items with >0 (grouped by category)
  for (const cat of CATEGORIES) {
    const base = state.items[cat.id];
    const nonZero = Object.keys(base).filter((k) => Number(base[k]) > 0);
    const customNZ = (state.custom[cat.id] || []).filter((r: any) => r.name && Number(r.amount) > 0);
    if (nonZero.length || customNZ.length) {
      const label = (LANGS[lang] as any)[cat.labelKey] as string;
      lines.push(label + ":");
      nonZero.forEach((heName) => {
        const v = Number(base[heName]);
        lines.push(`• ${displayName(heName, lang)} – ${v} ${unit}`);
      });
      customNZ.forEach((row: any) => {
        lines.push(`• ${row.name} – ${Number(row.amount)} ${unit}`);
      });
      lines.push("");
    }
  }

  // Shortages: items with 0 or missing (no category grouping)
  const shortageLines: string[] = [];
  for (const cat of CATEGORIES) {
    const base = state.items[cat.id];
    const zeros = Object.keys(base).filter((k) => !Number(base[k]));
    const customZeros = (state.custom[cat.id] || []).filter((r: any) => r.name && !Number(r.amount));
    zeros.forEach((heName) => shortageLines.push(`• ${displayName(heName, lang)}`));
    customZeros.forEach((row: any) => shortageLines.push(`• ${row.name}`));
  }
  if (shortageLines.length) {
    lines.push(t.shortages + ":");
    lines.push(...shortageLines);
  }

  return lines.join("\n");
}

// ===== DEV SELF-TESTS (runtime, non-breaking) =====
(function runSelfTests() {
  try {
    // T1: basic share text is string with newline
    const base = initialState();
    const a = formatShareText(base);
    console.assert(typeof a === "string" && a.includes("\n"), "share text should be a string with newlines");

    // T2: shortages appear when all zero
    console.assert(a.toLowerCase().includes("חוסרים") || a.toLowerCase().includes("shortages"), "should list shortages when all zero");

    // T3: set one item -> appears in body and not in shortages
    const s = initialState();
    s.items.cold["וואפו"] = 2.5; // liters
    const t3 = formatShareText(s);
    console.assert(t3.includes("וואפו") || t3.includes("Wafu"), "entered item should appear in body");
    const inShortages = /(?:חוסרים|Shortages):[\s\S]*(וואפו|Wafu)/.test(t3);
    console.assert(!inShortages, "entered item must not appear in shortages");

    // T4: EN UI shows English display names in body
    s.lang = "en" as any;
    const t4 = formatShareText(s);
    console.assert(t4.includes("Wafu"), "English display name should appear when UI is EN");

    // T5: language fallback on invalid key
    const s2: any = initialState();
    s2.lang = "xx"; // invalid
    const t5 = formatShareText(s2);
    console.assert(typeof t5 === "string", "fallback language should work");

    // T6: displayName fallback when mapping missing
    // Use a fake key not in map
    const fallback = displayName("שם לא קיים", "en");
    console.assert(fallback === "שם לא קיים", "displayName should fallback to Hebrew if translation missing");
  } catch (e) {
    console.warn("Self-tests failed:", e);
  }
})();
