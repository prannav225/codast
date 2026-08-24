import path from "node:path";
import type { Database } from "better-sqlite3";
import { SqliteRepositoryManager } from "../../storage/sqlite/repositories.js";

export class DiagramGenerator {
  private readonly repoManager: SqliteRepositoryManager;
  private readonly repoId: number;

  constructor(db: Database, repoId: number) {
    this.repoManager = new SqliteRepositoryManager(db);
    this.repoId = repoId;
  }

  /**
   * Generates a Mermaid Architecture Dependency Graph (graph TD).
   */
  generateArchitectureMermaid(filterPath?: string): string {
    const cleanFilter = (filterPath || "").replace(/^@/, "").trim().toLowerCase();
    const relationships = this.repoManager.getAllRelationships(this.repoId);
    const files = this.repoManager.getAllFiles(this.repoId);
    const fileIdMap = new Map<number, string>(files.map(f => [f.id, f.path]));

    const filteredRels = relationships.filter(r => {
      if (r.type !== "IMPORTS" && r.type !== "CALLS" && r.type !== "USES") return false;
      if (!cleanFilter) return true;
      const sourceFile = r.source_file_path || fileIdMap.get(r.source_file_id) || "";
      const sourceSym = r.source_symbol_name || "";
      const targetSym = r.target_symbol_name || "";
      const targetMod = r.target_module || "";
      return (
        sourceFile.toLowerCase().includes(cleanFilter) ||
        sourceSym.toLowerCase().includes(cleanFilter) ||
        targetSym.toLowerCase().includes(cleanFilter) ||
        targetMod.toLowerCase().includes(cleanFilter)
      );
    });

    if (filteredRels.length === 0) {
      // Check if filter matches files in a directory or single file without relationships
      const matchingFiles = cleanFilter
        ? files.filter(f => f.path.toLowerCase().includes(cleanFilter))
        : files.slice(0, 15);

      if (matchingFiles.length > 0) {
        const lines: string[] = ["```mermaid", "graph TD"];
        const parentLabel = cleanFilter ? path.basename(cleanFilter) || "Module" : "Project";
        const parentNode = this.sanitizeNodeName(parentLabel);
        lines.push(`  ${parentNode}["${cleanFilter || "Root"}"]`);
        for (const mf of matchingFiles.slice(0, 20)) {
          const childLabel = `${path.basename(mf.path)} (${mf.line_count}L)`;
          const childNode = this.sanitizeNodeName(path.basename(mf.path));
          if (childNode !== parentNode) {
            lines.push(`  ${parentNode} --> ${childNode}["${childLabel}"]`);
          }
        }
        lines.push("```");
        return lines.join("\n");
      }

      return "```mermaid\ngraph TD\n  Empty[No matching architectural relationships found]\n```";
    }

    const lines: string[] = ["```mermaid", "graph TD"];
    const seenEdges = new Set<string>();

    for (const rel of filteredRels.slice(0, 40)) {
      const sourceFile = rel.source_file_path || fileIdMap.get(rel.source_file_id) || rel.source_symbol_name || "Source";
      const sourceLabel = this.formatLabel(path.basename(sourceFile));
      const sourceNode = this.sanitizeNodeName(sourceLabel);

      const rawTarget = rel.target_symbol_name || (rel.target_module ? path.basename(rel.target_module) : "External");
      const targetLabel = this.formatLabel(rawTarget);
      const targetNode = this.sanitizeNodeName(targetLabel);

      if (!sourceNode || !targetNode || sourceNode === targetNode) continue;

      const edgeKey = `${sourceNode}->${targetNode}`;
      if (seenEdges.has(edgeKey)) continue;
      seenEdges.add(edgeKey);

      lines.push(`  ${sourceNode}["${sourceLabel}"] -->|${rel.type.toLowerCase()}| ${targetNode}["${targetLabel}"]`);
    }

    lines.push("```");
    return lines.join("\n");
  }

  /**
   * Generates a Mermaid Sequence Diagram tracing call flows.
   */
  generateCallFlowMermaid(symbolName?: string): string {
    const cleanSymbol = (symbolName || "").replace(/^@/, "").trim().toLowerCase();
    const relationships = this.repoManager.getAllRelationships(this.repoId);
    const callRels = relationships.filter(r => r.type === "CALLS");

    const filtered = cleanSymbol
      ? callRels.filter(r =>
          (r.source_symbol_name || "").toLowerCase().includes(cleanSymbol) ||
          (r.target_symbol_name || "").toLowerCase().includes(cleanSymbol) ||
          (r.source_file_path || "").toLowerCase().includes(cleanSymbol)
        )
      : callRels;

    if (filtered.length === 0) {
      return "```mermaid\nsequenceDiagram\n  autonumber\n  Note over Caller, Target: No direct CALLS relationships found\n```";
    }

    const lines: string[] = ["```mermaid", "sequenceDiagram", "  autonumber"];
    const seenCalls = new Set<string>();

    for (const rel of filtered.slice(0, 25)) {
      const callerRaw = rel.source_symbol_name || "Caller";
      const calleeRaw = rel.target_symbol_name || rel.target_module || "Target";
      const callerLabel = this.formatLabel(callerRaw.split(".").pop() || callerRaw);
      const calleeLabel = this.formatLabel(calleeRaw.split(".").pop() || calleeRaw);
      const caller = this.sanitizeNodeName(callerLabel);
      const callee = this.sanitizeNodeName(calleeLabel);

      if (!caller || !callee || caller === callee) continue;

      const callKey = `${caller}->>${callee}`;
      if (seenCalls.has(callKey)) continue;
      seenCalls.add(callKey);

      lines.push(`  ${caller}->>${callee}: execute (${rel.line || "call"})`);
    }

    lines.push("```");
    return lines.join("\n");
  }

  /**
   * Generates clean ASCII component flow for quick terminal viewing.
   */
  generateAsciiFlow(filterPath?: string): string {
    const cleanFilter = (filterPath || "").replace(/^@/, "").trim().toLowerCase();
    const relationships = this.repoManager.getAllRelationships(this.repoId);
    const files = this.repoManager.getAllFiles(this.repoId);
    const fileIdMap = new Map<number, string>(files.map(f => [f.id, f.path]));

    const filtered = relationships.filter(r => {
      if (r.type !== "IMPORTS" && r.type !== "CALLS") return false;
      if (!cleanFilter) return true;
      const src = r.source_file_path || fileIdMap.get(r.source_file_id) || "";
      return src.toLowerCase().includes(cleanFilter);
    });

    const grouped = new Map<string, string[]>();

    for (const rel of filtered.slice(0, 30)) {
      const source = path.basename(rel.source_file_path || fileIdMap.get(rel.source_file_id) || rel.source_symbol_name || "Source");
      const target = this.formatLabel(rel.target_symbol_name || (rel.target_module ? path.basename(rel.target_module) : "Target"));
      if (!grouped.has(source)) {
        grouped.set(source, []);
      }
      if (!grouped.get(source)!.includes(target)) {
        grouped.get(source)!.push(target);
      }
    }

    const lines: string[] = [];
    for (const [src, targets] of grouped.entries()) {
      lines.push(`  [ ${src} ]`);
      targets.slice(0, 5).forEach((tgt, idx) => {
        const isLast = idx === targets.slice(0, 5).length - 1;
        lines.push(`    ${isLast ? "└──" : "├──"} ${tgt}`);
      });
      lines.push("");
    }

    return lines.join("\n");
  }

  private sanitizeNodeName(name: string): string {
    return name.replace(/[^a-zA-Z0-9_]/g, "_").replace(/^_+|_+$/g, "") || "Node";
  }

  private formatLabel(label: string): string {
    let clean = label.split("\n")[0].split("(")[0].trim();
    if (clean.length > 35) {
      clean = clean.slice(0, 32) + "...";
    }
    return clean.replace(/["\\]/g, "");
  }
}
