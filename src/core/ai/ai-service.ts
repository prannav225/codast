import { ConfigManager } from "../../config/config-manager.js";
import { GeminiProvider } from "./gemini-provider.js";
import { VoyageProvider, type EmbeddingProvider } from "./voyage-provider.js";
import { OllamaProvider } from "./ollama-provider.js";
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

export function createAIService(projectRoot: string): AIService {
  const config = ConfigManager.loadConfig(projectRoot);

  if (config.embeddingProvider === "ollama") {
    return new OllamaProvider({
      chatModel: config.chatModel,
      embeddingModel: config.embeddingModel
    });
  }

  const geminiKey = ConfigManager.getApiKey(projectRoot);
  if (geminiKey) {
    return new GeminiProvider(geminiKey, {
      chatModel: config.chatModel,
      embeddingModel: config.embeddingModel
    });
  }

  throw new MissingApiKeyError();
}

export function createEmbeddingProvider(projectRoot: string): EmbeddingProvider {
  const config = ConfigManager.loadConfig(projectRoot);

  // 1. Ollama offline provider
  if (config.embeddingProvider === "ollama") {
    return new OllamaProvider({
      chatModel: config.chatModel,
      embeddingModel: config.embeddingModel || "nomic-embed-text:latest"
    });
  }

  const voyageKey = ConfigManager.getVoyageApiKey(projectRoot);
  const geminiKey = ConfigManager.getApiKey(projectRoot);

  // 2. Voyage AI for code embeddings
  if (voyageKey && config.embeddingProvider !== "gemini") {
    const validVoyageModel =
      config.embeddingModel && config.embeddingModel.startsWith("voyage")
        ? config.embeddingModel
        : "voyage-code-2";

    return new VoyageProvider(voyageKey, { model: validVoyageModel });
  }

  // 3. Gemini embeddings
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
