import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const ENERGY = ["sleep", "energy", "skin", "hair", "digestive", "daily"];
const errors = [];
const files = readdirSync("configs").filter((f) => f.endsWith(".json"));

for (const file of files) {
  const c = JSON.parse(readFileSync(join("configs", file), "utf8"));
  const err = (msg) => errors.push(`${file}: ${msg}`);
  const str = (v) => typeof v === "string" && v.trim().length > 0;

  for (const key of ["id", "lang", "name", "subtitle", "bottle", "doseLine"]) {
    if (!str(c[key])) err(`${key} must be a non-empty string`);
  }
  if (!ENERGY.includes(c.energy)) err(`energy must be one of ${ENERGY.join(", ")}`);
  if (!Array.isArray(c.hook) || c.hook.length < 1 || c.hook.length > 4 || !c.hook.every(str)) err("hook must have 1-4 lines");
  if (!Array.isArray(c.tagline) || c.tagline.length < 1 || c.tagline.length > 2 || !c.tagline.every(str)) err("tagline must have 1-2 lines");
  if (!Number.isInteger(c.capsules) || c.capsules < 1 || c.capsules > 120) err("capsules must be an integer 1-120");
  if (!Number.isInteger(c.days) || c.days < 1 || c.days > 120) err("days must be an integer 1-120");
  if (!str(c.countLabels?.capsules) || !str(c.countLabels?.days)) err("countLabels.capsules and countLabels.days are required");
  if (c.days >= 45 && !str(c.countLabels?.weeks)) err("countLabels.weeks is required when days >= 45");
  if (!Array.isArray(c.ingredients) || c.ingredients.length !== 3) err("ingredients must have exactly 3 items");
  for (const [i, ing] of (c.ingredients ?? []).entries()) {
    if (!str(ing.name) || !str(ing.note)) err(`ingredients[${i}] needs name and note`);
  }
  if (!Array.isArray(c.badges) || c.badges.length > 3) err("badges must have 0-3 items");

  if (c.horizon) {
    if (!Array.isArray(c.horizon.hook) || c.horizon.hook.length < 3) err("horizon.hook needs at least 3 textures");
    if (!str(c.horizon.product)) err("horizon.product texture is required");
    if (!Array.isArray(c.horizon.ingredients) || c.horizon.ingredients.length !== 3) err("horizon.ingredients needs 3 textures");
  }
  const assets = [c.bottle, ...Object.values(c.photos ?? {}), ...(c.horizon ? [...c.horizon.hook, c.horizon.product, ...c.horizon.ingredients] : [])];
  for (const a of assets) {
    if (a && !existsSync(join("assets", a))) err(`asset not found in assets/: ${a}`);
  }
  if (c.photos && !["hook", "product", "dose", "brand"].every((k) => str(c.photos[k]))) {
    err("photos needs hook, product, dose and brand (or remove photos to skip the Lifestyle variant)");
  }
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}
console.log(`${files.length} config(s) OK`);
