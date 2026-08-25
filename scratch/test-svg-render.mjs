import chalk from 'chalk';

const w = chalk.white.bold;
const m = chalk.hex("#676E95");
const t = chalk.white.bold;

console.log("=== TRY 1: High-Res Box Drawing Diagonals ===");
console.log(`  ${w("╲       ██")}    ${t("Codast CLI 0.2.0")}`);
console.log(`   ╲      ██    ${m("Local Code Intelligence & REPL")}`);
console.log(`   ╱            ${chalk.hex("#EEFFFF")("Neural AST & Semantic Index Active")}`);
console.log(`  ╱       ▄▄    ${m("/workspace (main)")}`);

console.log("\n=== TRY 2: Bold Smooth Chevron ===");
console.log(`  ${w("╲      ██")}     ${t("Codast CLI 0.2.0")}`);
console.log(`   ╲     ██     ${m("Local Code Intelligence & REPL")}`);
console.log(`   ╱            ${chalk.hex("#EEFFFF")("Neural AST & Semantic Index Active")}`);
console.log(`  ╱      ██     ${m("/workspace (main)")}`);

console.log("\n=== TRY 3: Solid Connected Slopes (Quadrant Diagonals) ===");
console.log(`  ${w("◢█      ██")}    ${t("Codast CLI 0.2.0")}`);
console.log(`    ◥█    ██    ${m("Local Code Intelligence & REPL")}`);
console.log(`    ◢█          ${chalk.hex("#EEFFFF")("Neural AST & Semantic Index Active")}`);
console.log(`  ◥█      ▀▀    ${m("/workspace (main)")}`);

console.log("\n=== TRY 4: Classic Clean Terminal Prompt > + █ + _ ===");
console.log(`  ${w("❯")}   ${w("█")}         ${t("Codast CLI 0.2.0")}`);
console.log(`  ${w("❯")}   ${w("█")}         ${m("Local Code Intelligence & REPL")}`);
console.log(`  ${w("❯")}             ${chalk.hex("#EEFFFF")("Neural AST & Semantic Index Active")}`);
console.log(`      ${w("▀")}         ${m("/workspace (main)")}`);

console.log("\n=== TRY 5: Big ASCII Chevron ===");
console.log(`  ${w(" \\       ██")}   ${t("Codast CLI 0.2.0")}`);
console.log(`   \\      ██   ${m("Local Code Intelligence & REPL")}`);
console.log(`   /           ${chalk.hex("#EEFFFF")("Neural AST & Semantic Index Active")}`);
console.log(`  /       ██   ${m("/workspace (main)")}`);
