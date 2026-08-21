import { Logger } from "../../utils/logger.js";
import { CodebaseAIError } from "../../utils/errors.js";

export interface EmbeddingProvider {
  generateEmbedding(text: string): Promise<number[]>;
  generateEmbeddings(
    texts: string[],
    batchSize?: number,
    onProgress?: (completed: number, total: number, statusMsg?: string) => void
  ): Promise<number[][]>;
}

export class VoyageProvider implements EmbeddingProvider {
  private readonly apiKey: string;
  private readonly model: string;
  private readonly baseUrl = "https://api.voyageai.com/v1/embeddings";

  constructor(apiKey?: string, options: { model?: string } = {}) {
    const key = apiKey || process.env.VOYAGE_API_KEY;
    if (!key || key.trim().length === 0) {
      throw new CodebaseAIError(
        "Voyage API key is not configured.\nSet it via VOYAGE_API_KEY env or run:\n  codebase-ai config set voyage-key <KEY>",
        "MISSING_VOYAGE_KEY"
      );
    }

    this.apiKey = key.trim();
    this.model = options.model || "voyage-code-2";
  }

  /**
   * Generates a single vector embedding for query or text chunk using Voyage AI.
   */
  async generateEmbedding(text: string): Promise<number[]> {
    const embeddings = await this.generateEmbeddings([text], 1);
    return embeddings[0];
  }

  /**
   * Generates embeddings in high-throughput batches (up to 100 chunks per request).
   */
  async generateEmbeddings(
    texts: string[],
    batchSize: number = 80,
    onProgress?: (completed: number, total: number, statusMsg?: string) => void
  ): Promise<number[][]> {
    const results: number[][] = [];

    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);
      const batchEmbeddings = await this.embedBatchWithRetry(batch);
      results.push(...batchEmbeddings);

      if (onProgress) {
        onProgress(results.length, texts.length);
      }

      // Small pause between batches if more remain
      if (i + batchSize < texts.length) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }

    return results;
  }

  private async embedBatchWithRetry(batch: string[], maxRetries: number = 4): Promise<number[][]> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch(this.baseUrl, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${this.apiKey}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: this.model,
            input: batch
          })
        });

        if (!response.ok) {
          const errBody = await response.text();
          if (response.status === 429 && attempt < maxRetries) {
            const waitTimeSec = 5 * attempt;
            Logger.debug("voyage-provider", `Rate limit hit, waiting ${waitTimeSec}s (retry ${attempt}/${maxRetries})...`);
            await new Promise(resolve => setTimeout(resolve, waitTimeSec * 1000));
            continue;
          }
          throw new Error(`Voyage AI API HTTP ${response.status}: ${errBody}`);
        }

        const data: any = await response.json();
        if (!data.data || !Array.isArray(data.data)) {
          throw new Error("Invalid response format from Voyage AI API");
        }

        // Sort by index to ensure order matches input
        const sorted = data.data.sort((a: any, b: any) => (a.index ?? 0) - (b.index ?? 0));
        return sorted.map((item: any) => item.embedding);
      } catch (error: any) {
        if (attempt >= maxRetries) {
          Logger.error(`Voyage AI embedding failed: ${error.message}`);
          throw error;
        }
        await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
      }
    }

    throw new Error("Max retries exceeded with Voyage AI API");
  }
}
