import { type AIService, type AIAnswerResponse, type CitationSource } from "./ai-service.js";
import { type EmbeddingProvider } from "./voyage-provider.js";
import { ANSWER_SYSTEM_PROMPT, buildUserPrompt } from "./prompts.js";
import { Logger } from "../../utils/logger.js";

export interface OllamaOptions {
  host?: string;
  chatModel?: string;
  embeddingModel?: string;
}

export class OllamaProvider implements AIService, EmbeddingProvider {
  private readonly host: string;
  private readonly chatModel: string;
  private readonly embeddingModel: string;

  constructor(options: OllamaOptions = {}) {
    this.host = (options.host || process.env.OLLAMA_HOST || "http://localhost:11434").replace(/\/$/, "");
    this.chatModel = options.chatModel || process.env.OLLAMA_CHAT_MODEL || "qwen2.5-coder:latest";
    this.embeddingModel = options.embeddingModel || process.env.OLLAMA_EMBED_MODEL || "nomic-embed-text:latest";
  }

  /**
   * Generates embedding for a single text chunk using local Ollama.
   */
  async generateEmbedding(text: string): Promise<number[]> {
    const results = await this.generateEmbeddings([text]);
    return results[0];
  }

  /**
   * Generates embeddings in batches using local Ollama.
   */
  async generateEmbeddings(
    texts: string[],
    batchSize: number = 20,
    onProgress?: (completed: number, total: number, statusMsg?: string) => void
  ): Promise<number[][]> {
    const embeddings: number[][] = [];
    const total = texts.length;

    for (let i = 0; i < total; i++) {
      const text = texts[i];
      try {
        const res = await fetch(`${this.host}/api/embeddings`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: this.embeddingModel,
            prompt: text
          })
        });

        if (!res.ok) {
          const errBody = await res.text();
          throw new Error(`Ollama embedding error HTTP ${res.status}: ${errBody}`);
        }

        const data = (await res.json()) as { embedding: number[] };
        embeddings.push(data.embedding);

        if (onProgress && (i + 1) % 5 === 0) {
          onProgress(i + 1, total, `Embedded ${i + 1}/${total} chunks via Ollama`);
        }
      } catch (err: any) {
        Logger.error(`Ollama embedding failed for chunk ${i + 1}: ${err.message}`);
        // Zero-vector fallback
        embeddings.push(new Array(768).fill(0));
      }
    }

    if (onProgress) {
      onProgress(total, total, "Ollama embeddings completed");
    }

    return embeddings;
  }

  /**
   * Generates a grounded answer from local Ollama model.
   */
  async generateAnswer(
    question: string,
    assembledContext: string,
    options: { systemInstruction?: string; model?: string } = {}
  ): Promise<AIAnswerResponse> {
    const targetModel = options.model || this.chatModel;
    const systemPrompt = options.systemInstruction || ANSWER_SYSTEM_PROMPT;
    const prompt = buildUserPrompt(question, assembledContext);

    const res = await fetch(`${this.host}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: targetModel,
        system: systemPrompt,
        prompt: prompt,
        stream: false,
        options: {
          temperature: 0.1
        }
      })
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Ollama generation failed (HTTP ${res.status}): ${err}`);
    }

    const data = (await res.json()) as { response: string };
    const rawAnswer = data.response || "";

    return this.parseMarkdownCitations(rawAnswer);
  }

  /**
   * Streams grounded answer in real-time from local Ollama.
   */
  async generateAnswerStream(
    question: string,
    assembledContext: string,
    onChunk: (textChunk: string) => void,
    options: { systemInstruction?: string; model?: string } = {}
  ): Promise<AIAnswerResponse> {
    const targetModel = options.model || this.chatModel;
    const systemPrompt = options.systemInstruction || ANSWER_SYSTEM_PROMPT;
    const prompt = buildUserPrompt(question, assembledContext);

    const res = await fetch(`${this.host}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: targetModel,
        system: systemPrompt,
        prompt: prompt,
        stream: true,
        options: {
          temperature: 0.1
        }
      })
    });

    if (!res.ok || !res.body) {
      const err = await res.text();
      throw new Error(`Ollama stream failed (HTTP ${res.status}): ${err}`);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let accumulatedText = "";
    let buffer = "";

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        try {
          const parsed = JSON.parse(trimmed) as { response: string; done: boolean };
          if (parsed.response) {
            accumulatedText += parsed.response;
            onChunk(parsed.response);
          }
        } catch {
          // Incomplete JSON frame
        }
      }
    }

    return this.parseMarkdownCitations(accumulatedText);
  }

  private parseMarkdownCitations(rawText: string): AIAnswerResponse {
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
      confidence: "high"
    };
  }
}
