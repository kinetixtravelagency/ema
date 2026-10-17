/**
 * Replace all green/emerald Tailwind colors with beige/navy palette
 * 
 * Mapping strategy:
 *  - bg-emerald-*     → bg-beige (light) or bg-navy (dark context)
 *  - text-emerald-*   → text-beige or text-navy
 *  - border-emerald-* → border-beige/40 or border-navy/30
 *  - ring-emerald-*   → ring-beige
 * 
 * Context-aware replacements to keep semantic meaning
 */

const fs = require("fs");
const path = require("path");

const SRC = path.join(__dirname, "../src");

// Collect all .tsx and .css files
function walk(dir) {
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walk(full));
    else if (/\.(tsx|ts|css)$/.test(entry.name)) files.push(full);
  }
  return files;
}

// Replacement rules — order matters (most specific first)
const REPLACEMENTS = [
  // ── BACKGROUNDS ─────────────────────────────────────────
  // Very light backgrounds (50) → beige/5 or ivory
  [/bg-emerald-50(?:\/(\d+))?/g, (_, a) => a ? `bg-beige/${Math.round(parseInt(a)*0.6)}` : "bg-beige/10"],
  [/dark:bg-emerald-950(?:\/(\d+))?/g, (_, a) => a ? `dark:bg-navy/20` : "dark:bg-navy/20"],
  [/bg-emerald-100(?:\/(\d+))?/g, (_, a) => "bg-beige/20"],
  [/bg-emerald-600(?:\/(\d+))?/g, (_, a) => a ? `bg-navy/${a}` : "bg-navy"],
  [/bg-emerald-500(?:\/(\d+))?/g, (_, a) => a ? `bg-beige/${a}` : "bg-beige"],
  [/bg-emerald-400(?:\/(\d+))?/g, (_, a) => "bg-beige/70"],
  [/bg-emerald-\d{2,3}(?:\/(\d+))?/g, (_, a) => a ? `bg-beige/${a}` : "bg-beige/30"],

  // dark: bg variants
  [/dark:bg-emerald-\d{2,3}(?:\/(\d+))?/g, (_, a) => a ? `dark:bg-navy/${a}` : "dark:bg-navy/30"],

  // hover: bg variants
  [/hover:bg-emerald-\d{2,3}(?:\/(\d+))?/g, () => "hover:bg-navy/80"],

  // ── TEXT ────────────────────────────────────────────────
  [/text-emerald-900(?:\/(\d+))?/g, () => "text-navy"],
  [/text-emerald-800(?:\/(\d+))?/g, () => "text-navy"],
  [/text-emerald-700(?:\/(\d+))?/g, () => "text-navy/80"],
  [/text-emerald-600(?:\/(\d+))?/g, () => "text-beige"],
  [/text-emerald-500(?:\/(\d+))?/g, () => "text-beige"],
  [/text-emerald-400(?:\/(\d+))?/g, () => "text-beige/80"],
  [/text-emerald-300(?:\/(\d+))?/g, () => "text-beige/70"],
  [/text-emerald-\d{2,3}(?:\/(\d+))?/g, () => "text-beige"],

  // dark: text variants
  [/dark:text-emerald-\d{2,3}(?:\/(\d+))?/g, () => "dark:text-beige"],

  // ── BORDERS ─────────────────────────────────────────────
  [/border-emerald-500(?:\/(\d+))?/g, (_, a) => a ? `border-beige/${a}` : "border-beige/60"],
  [/border-emerald-600(?:\/(\d+))?/g, (_, a) => a ? `border-navy/${a}` : "border-navy/40"],
  [/border-emerald-\d{2,3}(?:\/(\d+))?/g, (_, a) => a ? `border-beige/${a}` : "border-beige/40"],

  // dark: border variants
  [/dark:border-emerald-\d{2,3}(?:\/(\d+))?/g, (_, a) => a ? `dark:border-beige/${a}` : "dark:border-beige/30"],

  // ── RINGS ───────────────────────────────────────────────
  [/ring-emerald-\d{2,3}(?:\/(\d+))?/g, () => "ring-beige"],

  // ── from-/to-/via- gradients ────────────────────────────
  [/from-emerald-\d{2,3}(?:\/(\d+))?/g, () => "from-beige"],
  [/to-emerald-\d{2,3}(?:\/(\d+))?/g, () => "to-navy"],
  [/via-emerald-\d{2,3}(?:\/(\d+))?/g, () => "via-beige/50"],

  // ── Catch-all green- variants ───────────────────────────
  [/bg-green-\d{2,3}(?:\/(\d+))?/g, (_, a) => a ? `bg-beige/${a}` : "bg-beige/20"],
  [/text-green-\d{2,3}(?:\/(\d+))?/g, () => "text-beige"],
  [/border-green-\d{2,3}(?:\/(\d+))?/g, (_, a) => a ? `border-beige/${a}` : "border-beige/40"],
  [/dark:bg-green-\d{2,3}(?:\/(\d+))?/g, () => "dark:bg-navy/30"],
  [/dark:text-green-\d{2,3}(?:\/(\d+))?/g, () => "dark:text-beige"],
];

let totalFiles = 0;
let totalReplacements = 0;

for (const file of walk(SRC)) {
  let content = fs.readFileSync(file, "utf8");
  let changed = false;
  let fileReplacements = 0;

  for (const [pattern, replacement] of REPLACEMENTS) {
    const before = content;
    content = content.replace(pattern, replacement);
    if (content !== before) {
      const count = (before.match(pattern) || []).length;
      fileReplacements += count;
      changed = true;
    }
  }

  if (changed) {
    fs.writeFileSync(file, content, "utf8");
    totalFiles++;
    totalReplacements += fileReplacements;
    console.log(`  ✓ ${path.relative(SRC, file)} (${fileReplacements} replacements)`);
  }
}

console.log(`\nDone! Replaced in ${totalFiles} files, ~${totalReplacements} instances.`);
