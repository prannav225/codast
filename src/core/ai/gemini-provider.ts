import { GoogleGenAI } from "@google/genai";
import { type AIService, type AIAnswerResponse, type CitationSource } from "./ai-service.js";
import { ANSWER_SYSTEM_PROMPT, buildUserPrompt } from "./prompts.js";
import { DEFAULT_CHAT_MODEL, DEFAULT_EMBEDDING_MODEL } from "../../config/constants.js";
import { MissingApiKeyError } from "../../utils/errors.js";
import { Logger } from "../../utils/logger.js";

export class GeminiProvider implements AIService {
  private readonly client: GoogleGenAI;
  private readonly embeddingModel: string;
  private readonly chatModel: string;

  constructor(apiKey?: string, options: { embeddingModel?: string; chatModel?: string } = {}) {
    const key = apiKey || process.env.GEMINI_API_KEY;
    if (!key || key.trim().length === 0) {
      throw new MissingApiKeyError();
    }

    this.client = new GoogleGenAI({ apiKey: key.trim() });
    this.embeddingModel = options.embeddingModel || DEFAULT_EMBEDDING_MODEL;
    this.chatModel = options.chatModel || DEFAULT_CHAT_MODEL;
  }

  /**
   * Generates a single vector embedding with automatic retry on rate limit (429).
   */
  async generateEmbedding(text: string): Promise<number[]> {
    const embeddings = await this.generateEmbeddings([text], 1);
    return embeddings[0];
  }

  /**
   * Generates embeddings using native Gemini batching (up to 50 texts per single HTTP request)
   * with automatic exponential retry and rate-limit throttle protection.
   */
  async generateEmbeddings(
    texts: string[],
    batchSize: number = 50,
    onProgress?: (completed: number, total: number, statusMsg?: string) => void
  ): Promise<number[][]> {
    const results: number[][] = [];

    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);
      const batchEmbeddings = await this.embedBatchWithRetry(batch, (retryMsg) => {
        if (onProgress) {
          onProgress(results.length, texts.length, retryMsg);
        }
      });
      results.push(...batchEmbeddings);

      if (onProgress) {
        onProgress(results.length, texts.length);
      }

      // 1-second pause between batches to smoothly stay under free tier RPM limits
      if (i + batchSize < texts.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return results;
  }

  private async embedBatchWithRetry(
    batch: string[],
    onRateLimit?: (msg: string) => void,
    maxRetries: number = 8
  ): Promise<number[][]> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await this.client.models.embedContent({
          model: this.embeddingModel,
          contents: batch.length === 1 ? batch[0] : batch
        });

        if (batch.length === 1) {
          const singleValues = (response as any)?.embeddings?.[0]?.values || (response as any)?.embedding?.values;
          if (!singleValues || !Array.isArray(singleValues)) {
            throw new Error("Invalid embedding response received from Gemini API");
          }
          return [singleValues];
        }

        const embeddingsList = (response as any)?.embeddings;
        if (!embeddingsList || !Array.isArray(embeddingsList)) {
          throw new Error("Invalid batch embedding response received from Gemini API");
        }

        return embeddingsList.map(e => e.values);
      } catch (error: any) {
        const errStr = JSON.stringify(error) || "";
        const msgStr = error?.message || "";
        const isRateLimit =
          error?.status === 429 ||
          error?.code === 429 ||
          msgStr.includes("429") ||
          msgStr.includes("RESOURCE_EXHAUSTED") ||
          errStr.includes("429") ||
          errStr.includes("RESOURCE_EXHAUSTED") ||
          msgStr.includes("quota");

        if (isRateLimit && attempt < maxRetries) {
          const waitTimeSec = 20 * attempt;
          const retryNotice = `Rate limit reached. Waiting ${waitTimeSec}s for quota replenishment (retry ${attempt}/${maxRetries})...`;
          Logger.debug("gemini-provider", retryNotice);
          if (onRateLimit) {
            onRateLimit(retryNotice);
          }
          await new Promise(resolve => setTimeout(resolve, waitTimeSec * 1000));
          continue;
        }

        if (attempt >= maxRetries) {
          Logger.error(`Batch embedding generation failed: ${error.message || error}`);
          throw error;
        }
      }
    }

    throw new Error("Max retries exceeded while generating embeddings");
  }

  /**
   * Sends assembled code context and user question to Gemini for grounded reasoning with citations.
   */
  async generateAnswer(
    question: string,
    assembledContext: string,
    options: { systemInstruction?: string; model?: string } = {}
  ): Promise<AIAnswerResponse> {
    const targetModel = options.model || this.chatModel;
    const systemPrompt = options.systemInstruction || ANSWER_SYSTEM_PROMPT;
    const prompt = buildUserPrompt(question, assembledContext);

    const modelCandidates = [
      targetModel,
      "gemini-3.1-flash-lite",
      "gemini-3.5-flash-lite",
      "gemini-3.6-flash",
      "gemini-3.7-flash"
    ];

    const uniqueModels = Array.from(new Set(modelCandidates));
    let lastError: any = null;

    for (const modelName of uniqueModels) {
      try {
        const response = await this.client.models.generateContent({
          model: modelName,
          contents: prompt,
          config: {
            systemInstruction: systemPrompt,
            temperature: 0.1,
            responseMimeType: "application/json"
          }
        });

        const text = response.text || "";
        return this.parseStructuredAnswer(text);
      } catch (error: any) {
        lastError = error;
        Logger.debug("gemini-provider", `Model ${modelName} returned error: ${error.message}. Attempting fallback model...`);

        try {
          const fallbackResponse = await this.client.models.generateContent({
            model: modelName,
            contents: `${systemPrompt}\n\n${prompt}`
          });
          const rawText = fallbackResponse.text || "";
          return this.parseStructuredAnswer(rawText);
        } catch {
          // Continue to next model candidate
        }
      }
    }

    throw lastError || new Error("Failed to generate answer across all available Gemini model candidates");
  }

  private parseStructuredAnswer(rawText: string): AIAnswerResponse {
    const cleaned = rawText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

    try {
      const parsed = JSON.parse(cleaned);
      return {
        answer: parsed.answer || rawText,
        sources: Array.isArray(parsed.sources) ? parsed.sources : [],
        confidence: parsed.confidence === "high" || parsed.confidence === "medium" || parsed.confidence === "low"
          ? parsed.confidence
          : "medium",
        reasoningNotes: parsed.reasoningNotes
      };
    } catch {
      const sources: CitationSource[] = [];
      const citationRegex = /([a-zA-Z0-9_\-\/\\.]+\.[a-zA-Z0-9]+):(\d+)(?:-(\d+))?/g;
      let match;
      while ((match = citationRegex.exec(rawText)) !== null) {
        sources.push({
          path: match[1],
          startLine: parseInt(match[2], 10),
          endLine: match[3] ? parseInt(match[3], 10) : parseInt(match[2], 10)
        });
      }

      return {
        answer: rawText,
        sources,
        confidence: "medium"
      };
    }
  }
}
