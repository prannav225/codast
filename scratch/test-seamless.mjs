import chalk from 'chalk';

const w = chalk.white.bold;
const m = chalk.hex("#676E95");
const t = chalk.white.bold;
const main = chalk.hex("#EEFFFF");
const rule = chalk.hex("#3B4261");

console.log("=== VARIANT 1 (Tight Gap 3 spaces, Connected Slopes) ===");
console.log(`  ${w("█▄   ████")}    ${t("Codast CLI 0.2.0")}`);
console.log(`  ${w("██▄  ████")}    ${m("Local Code Intelligence & REPL")}`);
console.log(`  ${w("██▀      ")}    ${main("Neural AST & Semantic Index Active")}`);
console.log(`  ${w("█▀   ▄▄▄▄")}    ${m("/Volumes/Mac T7/Projects/cmd-line-ai (main)")}`);
console.log(`  ${rule("─────────────────────────────────────────────────────────────────────────────")}`);

console.log("\n=== VARIANT 2 (Tight Gap 2 spaces, Ultra Smooth Chevron) ===");
console.log(`  ${w("█▄  ████")}     ${t("Codast CLI 0.2.0")}`);
console.log(`  ${w("▀█▄ ████")}     ${m("Local Code Intelligence & REPL")}`);
console.log(`  ${w("▄█▀     ")}     ${main("Neural AST & Semantic Index Active")}`);
console.log(`  ${w("█▀  ▄▄▄▄")}     ${m("/Volumes/Mac T7/Projects/cmd-line-ai (main)")}`);
console.log(`  ${rule("─────────────────────────────────────────────────────────────────────────────")}`);

console.log("\n=== VARIANT 3 (2.5-Col Full Density Chevron) ===");
console.log(`  ${w("██▄   ████")}    ${t("Codast CLI 0.2.0")}`);
console.log(`   ${w("▀██▄ ████")}    ${m("Local Code Intelligence & REPL")}`);
console.log(`   ${w("▄██▀     ")}    ${main("Neural AST & Semantic Index Active")}`);
console.log(`  ${w("██▀   ▄▄▄▄")}    ${m("/Volumes/Mac T7/Projects/cmd-line-ai (main)")}`);
console.log(`  ${rule("─────────────────────────────────────────────────────────────────────────────")}`);

console.log("\n=== VARIANT 4 (Pure Solid Polygon Chevron + Block) ===");
console.log(`  ${w("◢█   ████")}    ${t("Codast CLI 0.2.0")}`);
console.log(`  ${w(" ██  ████")}    ${m("Local Code Intelligence & REPL")}`);
console.log(`  ${w(" ██      ")}    ${main("Neural AST & Semantic Index Active")}`);
console.log(`  ${w("◥█   ▄▄▄▄")}    ${m("/Volumes/Mac T7/Projects/cmd-line-ai (main)")}`);
console.log(`  ${rule("─────────────────────────────────────────────────────────────────────────────")}`);
