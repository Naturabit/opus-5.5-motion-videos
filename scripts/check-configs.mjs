import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const errors = [];
const files = readdirSync("configs").filter((f) => f.endsWith(".json"));

for (const file of files) {
  const c = JSON.parse(readFileSync(join("configs", file), "utf8"));
  const err = (msg) => errors.push(`${file}: ${msg}`);
  for (const key of ["brandName", "headline", "cta"]) {
    if (typeof c[key] !== "string" || !c[key].trim()) err(`${key} must be a non-empty string`);
  }
  if (!Array.isArray(c.benefits) || c.benefits.length < 1 || c.benefits.length > 4) err("benefits must have 1-4 items");
  if (!(c.durationSeconds >= 6 && c.durationSeconds <= 45)) err("durationSeconds must be 6-45");
  for (const key of ["background", "accent", "text"]) {
    if (!/^#[0-9a-fA-F]{6}$/.test(c.colors?.[key] ?? "")) err(`colors.${key} must be a #rrggbb hex color`);
  }
  if (c.productImage && !existsSync(join("assets", c.productImage))) err(`productImage not found in assets/: ${c.productImage}`);
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}
console.log(`${files.length} config(s) OK`);
