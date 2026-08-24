import { ConfigManager } from "../../config/config-manager.js";
import { GeminiProvider } from "./gemini-provider.js";
import { VoyageProvider, type EmbeddingProvider } from "./voyage-provider.js";
import { MissingApiKeyError } from "../../utils/errors.js";

export interface CitationSource {
  path: string;
  startLine: number;
  endLine: number;
}

export interface AIAnswerResponse {
  answer: string;
  sources: CitationSource[];
  confidence: "high" | "medium" | "low";
  reasoningNotes?: string;
}

export interface AIService {
  generateEmbedding(text: string): Promise<number[]>;
  generateEmbeddings(texts: string[]): Promise<number[][]>;
  generateAnswer(
    question: string,
    assembledContext: string,
    options?: { systemInstruction?: string; model?: string }
  ): Promise<AIAnswerResponse>;
  generateAnswerStream?(
    question: string,
    assembledContext: string,
    onChunk: (textChunk: string) => void,
    options?: { systemInstruction?: string; model?: string }
  ): Promise<AIAnswerResponse>;
}

export function createEmbeddingProvider(projectRoot: string): EmbeddingProvider {
  const config = ConfigManager.loadConfig(projectRoot);
  const voyageKey = ConfigManager.getVoyageApiKey(projectRoot);
  const geminiKey = ConfigManager.getApiKey(projectRoot);

  // If Voyage key is available, default to Voyage for code embeddings with a valid Voyage model
  if (voyageKey && config.embeddingProvider !== "gemini") {
    const validVoyageModel =
      config.embeddingModel && config.embeddingModel.startsWith("voyage")
        ? config.embeddingModel
        : "voyage-code-2";

    return new VoyageProvider(voyageKey, { model: validVoyageModel });
  }

  if (geminiKey) {
    const validGeminiModel =
      config.embeddingModel && !config.embeddingModel.startsWith("voyage")
        ? config.embeddingModel
        : "gemini-embedding-001";

    return new GeminiProvider(geminiKey, {
      embeddingModel: validGeminiModel,
      chatModel: config.chatModel
    });
  }

  if (voyageKey) {
    return new VoyageProvider(voyageKey, { model: "voyage-code-2" });
  }

  throw new MissingApiKeyError();
}
