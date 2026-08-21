import { z } from "zod";
import { DEFAULT_CHAT_MODEL, DEFAULT_EMBEDDING_MODEL } from "./constants.js";

export const ConfigSchema = z.object({
  apiKey: z.string().optional(),
  voyageApiKey: z.string().optional(),
  embeddingProvider: z.enum(["voyage", "gemini"]).default("voyage"),
  embeddingModel: z.string().default("voyage-code-2"),
  chatModel: z.string().default(DEFAULT_CHAT_MODEL),
  exclude: z.array(z.string()).default([])
});

export type Config = z.infer<typeof ConfigSchema>;

export const ProjectStatusSchema = z.object({
  name: z.string(),
  rootPath: z.string(),
  initialized: z.boolean(),
  indexed: z.boolean(),
  lastIndexedAt: z.string().nullable(),
  fileCount: z.number().default(0),
  symbolCount: z.number().default(0),
  relationshipCount: z.number().default(0),
  chunkCount: z.number().default(0)
});

export type ProjectStatus = z.infer<typeof ProjectStatusSchema>;
