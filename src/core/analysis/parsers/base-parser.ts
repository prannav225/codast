import { type AnalysisResult } from "../types.js";

export interface ILanguageParser {
  parse(filePath: string, content: string): AnalysisResult;
}
