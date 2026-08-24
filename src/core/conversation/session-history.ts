export interface ConversationTurn {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

export class SessionHistory {
  private turns: ConversationTurn[] = [];
  private readonly maxTurns: number;
  private readonly maxTokensEstimate: number;

  constructor(options: { maxTurns?: number; maxTokensEstimate?: number } = {}) {
    this.maxTurns = options.maxTurns || 10;
    this.maxTokensEstimate = options.maxTokensEstimate || 3000;
  }

  /**
   * Adds a user query turn.
   */
  addUserTurn(content: string): void {
    this.turns.push({
      role: "user",
      content: content.trim(),
      timestamp: Date.now()
    });
    this.compact();
  }

  /**
   * Adds an assistant response turn.
   */
  addAssistantTurn(content: string): void {
    this.turns.push({
      role: "assistant",
      content: content.trim(),
      timestamp: Date.now()
    });
    this.compact();
  }

  /**
   * Returns all active conversation turns.
   */
  getTurns(): ConversationTurn[] {
    return [...this.turns];
  }

  /**
   * Returns formatted conversation history string for prompting context.
   */
  getFormattedHistory(): string {
    if (this.turns.length <= 1) return "";

    // Exclude the most recent turn (current query)
    const priorTurns = this.turns.slice(0, -1);
    if (priorTurns.length === 0) return "";

    const lines: string[] = ["### Previous Conversation Turns (Context):"];
    for (const t of priorTurns) {
      const prefix = t.role === "user" ? "User" : "Assistant";
      lines.push(`${prefix}: ${t.content}\n`);
    }

    return lines.join("\n");
  }

  /**
   * Clears the conversation history.
   */
  clear(): void {
    this.turns = [];
  }

  /**
   * Compacts history to stay within turn and token budgets.
   */
  private compact(): void {
    // 1. Cap by turn count
    if (this.turns.length > this.maxTurns) {
      this.turns = this.turns.slice(this.turns.length - this.maxTurns);
    }

    // 2. Cap by estimated tokens
    while (this.turns.length > 2 && this.estimateTokens() > this.maxTokensEstimate) {
      this.turns.shift();
    }
  }

  private estimateTokens(): number {
    const totalChars = this.turns.reduce((sum, t) => sum + t.content.length, 0);
    return Math.round(totalChars / 4);
  }
}
