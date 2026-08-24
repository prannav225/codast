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
    const relationships = this.repoManager.getAllRelationships(this.repoId);
    const files = this.repoManager.getAllFiles(this.repoId);
    const fileIdMap = new Map<number, string>(files.map(f => [f.id, f.path]));

    const filteredRels = relationships.filter(r => {
      if (r.type !== "IMPORTS" && r.type !== "CALLS" && r.type !== "USES") return false;
      if (!filterPath) return true;
      const sourceFile = r.source_file_path || fileIdMap.get(r.source_file_id) || "";
      const sourceSym = r.source_symbol_name || "";
      const targetSym = r.target_symbol_name || r.target_module || "";
      return sourceFile.toLowerCase().includes(filterPath.toLowerCase()) ||
             sourceSym.toLowerCase().includes(filterPath.toLowerCase()) ||
             targetSym.toLowerCase().includes(filterPath.toLowerCase());
    });

    if (filteredRels.length === 0) {
      return "```mermaid\ngraph TD\n  Empty[No matching architectural relationships found]\n```";
    }

    const lines: string[] = ["```mermaid", "graph TD"];
    const seenEdges = new Set<string>();

    for (const rel of filteredRels.slice(0, 35)) {
      const sourceFile = rel.source_file_path || fileIdMap.get(rel.source_file_id) || rel.source_symbol_name || "Source";
      const sourceNode = this.sanitizeNodeName(path.basename(sourceFile));
      const targetNode = this.sanitizeNodeName(rel.target_symbol_name || rel.target_module || "External");

      const edgeKey = `${sourceNode}->${targetNode}`;
      if (seenEdges.has(edgeKey)) continue;
      seenEdges.add(edgeKey);

      lines.push(`  ${sourceNode}["${sourceNode}"] -->|${rel.type.toLowerCase()}| ${targetNode}["${targetNode}"]`);
    }

    lines.push("```");
    return lines.join("\n");
  }

  /**
   * Generates a Mermaid Sequence Diagram tracing call flows.
   */
  generateCallFlowMermaid(symbolName?: string): string {
    const relationships = this.repoManager.getAllRelationships(this.repoId);
    const callRels = relationships.filter(r => r.type === "CALLS");

    const filtered = symbolName
      ? callRels.filter(r => (r.source_symbol_name || "").toLowerCase().includes(symbolName.toLowerCase()) || (r.target_symbol_name || "").toLowerCase().includes(symbolName.toLowerCase()))
      : callRels;

    if (filtered.length === 0) {
      return "```mermaid\nsequenceDiagram\n  autonumber\n  Note over Caller, Target: No direct CALLS relationships found\n```";
    }

    const lines: string[] = ["```mermaid", "sequenceDiagram", "  autonumber"];
    const seenCalls = new Set<string>();

    for (const rel of filtered.slice(0, 20)) {
      const callerRaw = rel.source_symbol_name || "Caller";
      const calleeRaw = rel.target_symbol_name || rel.target_module || "Target";
      const caller = this.sanitizeNodeName(callerRaw.split(".").pop() || callerRaw);
      const callee = this.sanitizeNodeName(calleeRaw.split(".").pop() || calleeRaw);
      const callKey = `${caller}->>${callee}`;

      if (seenCalls.has(callKey)) continue;
      seenCalls.add(callKey);

      lines.push(`  ${caller}->>${callee}: execute`);
    }

    lines.push("```");
    return lines.join("\n");
  }

  /**
   * Generates clean ASCII component flow for quick terminal viewing.
   */
  generateAsciiFlow(filterPath?: string): string {
    const relationships = this.repoManager.getAllRelationships(this.repoId);
    const files = this.repoManager.getAllFiles(this.repoId);
    const fileIdMap = new Map<number, string>(files.map(f => [f.id, f.path]));

    const filtered = relationships.filter(r => r.type === "IMPORTS" || r.type === "CALLS");
    const grouped = new Map<string, string[]>();

    for (const rel of filtered.slice(0, 30)) {
      const source = path.basename(rel.source_file_path || fileIdMap.get(rel.source_file_id) || rel.source_symbol_name || "Source");
      const target = rel.target_symbol_name || rel.target_module || "Target";
      if (!grouped.has(source)) {
        grouped.set(source, []);
      }
      grouped.get(source)!.push(target);
    }

    const lines: string[] = [];
    for (const [src, targets] of grouped.entries()) {
      lines.push(`  [ ${src} ]`);
      targets.slice(0, 4).forEach((tgt, idx) => {
        const isLast = idx === targets.slice(0, 4).length - 1;
        lines.push(`    ${isLast ? "└──" : "├──"} ${tgt}`);
      });
      lines.push("");
    }

    return lines.join("\n");
  }

  private sanitizeNodeName(name: string): string {
    return name.replace(/[^a-zA-Z0-9_]/g, "_");
  }
}
