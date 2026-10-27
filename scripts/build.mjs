import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const out = path.join(root, "dist");
const required = ["index.html", "styles.css", "app.js", "core.js", "data/research.json"];
for (const file of required) {
  if (!fs.existsSync(path.join(root, file))) throw new Error(`Missing required site file: ${file}`);
}
const research = JSON.parse(fs.readFileSync(path.join(root, "data/research.json"), "utf8"));
if (research.competitors?.length !== 4 || research.pricing_offers?.length !== 28) throw new Error("Bundled Mission 1 research failed the 4-competitor / 28-offer integrity check.");
fs.mkdirSync(out, { recursive: true });
for (const file of ["index.html", "styles.css", "app.js", "core.js", ".nojekyll"]) fs.copyFileSync(path.join(root, file), path.join(out, file));
fs.cpSync(path.join(root, "data"), path.join(out, "data"), { recursive: true, force: true });
console.log(`Built static laboratory into ${out}`);
console.log(`Validated ${research.competitors.length} competitors and ${research.pricing_offers.length} offer records.`);
