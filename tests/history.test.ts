import assert from "node:assert";
import { SessionHistory } from "../src/core/conversation/session-history.js";

console.log("\nStarting Multi-Turn Conversational Memory test suite...\n");

const history = new SessionHistory({ maxTurns: 4, maxTokensEstimate: 500 });

// 1. Test adding turns
history.addUserTurn("Where is authentication handled?");
history.addAssistantTurn("Authentication is implemented in AuthService.ts with login and logout methods.");
history.addUserTurn("What happens on failed login?");
history.addAssistantTurn("It throws an InvalidCredentialsError with HTTP 401.");

const turns = history.getTurns();
assert.strictEqual(turns.length, 4, "Should record exactly 4 turns");
assert.strictEqual(turns[0].role, "user");
assert.strictEqual(turns[1].role, "assistant");
assert.strictEqual(turns[2].role, "user");
assert.strictEqual(turns[3].role, "assistant");
console.log("✔ Recording turns verified.");

// 2. Test formatted prompt history
const formatted = history.getFormattedHistory();
assert.ok(formatted.includes("User: Where is authentication handled?"), "Formatted context should include prior user query");
assert.ok(formatted.includes("Assistant: Authentication is implemented in AuthService.ts"), "Formatted context should include prior assistant response");
console.log("✔ Context formatting for AI prompt verified.");

// 3. Test sliding window compaction (adding 5th and 6th turn should evict oldest)
history.addUserTurn("Can we add rate limiting?");
history.addAssistantTurn("Yes, we can wrap the endpoint in express-rate-limit.");

const compactedTurns = history.getTurns();
assert.strictEqual(compactedTurns.length, 4, "Should maintain maxTurns limit (4 turns)");
assert.strictEqual(compactedTurns[0].content, "What happens on failed login?", "Oldest turns should be smoothly evicted");
console.log("✔ Sliding window compaction verified.");

// 4. Test clearing history
history.clear();
assert.strictEqual(history.getTurns().length, 0, "History should be empty after clear()");
assert.strictEqual(history.getFormattedHistory(), "", "Formatted history should be empty string");
console.log("✔ History clear verified.");

console.log("\n🎉 All Multi-Turn Conversational Memory tests passed successfully!\n");
