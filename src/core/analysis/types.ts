export type SymbolKind =
  | "function"
  | "arrow_function"
  | "class"
  | "method"
  | "interface"
  | "type_alias"
  | "react_component"
  | "react_hook"
  | "variable"
  | "enum";

export interface ExtractedSymbol {
  id: string;
  name: string;
  kind: SymbolKind;
  filePath: string;
  startLine: number;
  endLine: number;
  signature: string;
  docComment?: string;
  isExported: boolean;
  isDefaultExport: boolean;
}

export interface ImportedSymbol {
  name: string;
  alias?: string;
  isDefault: boolean;
  isNamespace: boolean;
}

export interface ExtractedImport {
  sourceModule: string;
  importedSymbols: ImportedSymbol[];
  startLine: number;
  endLine: number;
}

export interface ExtractedExport {
  name: string;
  exportType: "named" | "default" | "all";
  sourceModule?: string;
  startLine: number;
  endLine: number;
}

export type RelationType =
  | "IMPORTS"
  | "EXPORTS"
  | "DEFINES"
  | "CALLS"
  | "USES"
  | "REFERENCES";

export interface ExtractedRelationship {
  sourceFilePath: string;
  sourceSymbolName?: string;
  targetFilePath?: string;
  targetSymbolName?: string;
  targetModule?: string;
  type: RelationType;
  line: number;
}

export interface FileAnalysisResult {
  filePath: string;
  symbols: ExtractedSymbol[];
  imports: ExtractedImport[];
  exports: ExtractedExport[];
  relationships: ExtractedRelationship[];
}
