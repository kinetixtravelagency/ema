import fs from "node:fs";
import path from "node:path";

const OVERRIDES_FILE = path.resolve(process.cwd(), "src/lib/program_overrides.json");

export function getProgramOverrides(): Record<string, any> {
  try {
    if (fs.existsSync(OVERRIDES_FILE)) {
      const content = fs.readFileSync(OVERRIDES_FILE, "utf-8");
      return JSON.parse(content || "{}");
    }
  } catch (e) {
    console.error("Could not read program overrides:", e);
  }
  return {};
}

export function saveProgramOverride(slug: string, data: any) {
  try {
    const all = getProgramOverrides();
    all[slug] = {
      ...(all[slug] || {}),
      ...data,
      updatedAt: new Date().toISOString(),
    };
    fs.writeFileSync(OVERRIDES_FILE, JSON.stringify(all, null, 2), "utf-8");
  } catch (e) {
    console.error("Could not save program override:", e);
  }
}
