import {
  type SourceFile,
  type FunctionDeclaration,
  type ArrowFunction,
  type FunctionExpression,
  type VariableDeclaration,
  type ClassDeclaration,
  type MethodDeclaration,
  type InterfaceDeclaration,
  type TypeAliasDeclaration,
  type EnumDeclaration,
  Node,
  SyntaxKind
} from "ts-morph";
import { type ExtractedSymbol, type SymbolKind } from "./types.js";

export class SymbolExtractor {
  static extract(sourceFile: SourceFile, relativePath: string): ExtractedSymbol[] {
    const symbols: ExtractedSymbol[] = [];

    // 1. Function Declarations
    for (const fn of sourceFile.getFunctions()) {
      const name = fn.getName();
      if (!name) continue;

      const kind = this.detectFunctionKind(name, fn);
      const isExported = fn.isExported();
      const isDefaultExport = fn.isDefaultExport();
      const startLine = fn.getStartLineNumber();
      const endLine = fn.getEndLineNumber();
      const signature = this.getFunctionSignature(fn);
      const docComment = this.getDocComment(fn);

      symbols.push({
        id: `${relativePath}#${name}:${startLine}`,
        name,
        kind,
        filePath: relativePath,
        startLine,
        endLine,
        signature,
        docComment,
        isExported,
        isDefaultExport
      });
    }

    // 2. Variable Statement Functions & Arrow Functions (e.g., const MyComponent = () => ... or const useAuth = ...)
    for (const varStatement of sourceFile.getVariableStatements()) {
      const isExported = varStatement.isExported();
      const isDefaultExport = varStatement.isDefaultExport();
      const docComment = this.getDocComment(varStatement);

      for (const declaration of varStatement.getDeclarations()) {
        const name = declaration.getName();
        const initializer = declaration.getInitializer();

        if (initializer) {
          if (Node.isArrowFunction(initializer) || Node.isFunctionExpression(initializer)) {
            const kind = this.detectFunctionKind(name, initializer);
            const startLine = varStatement.getStartLineNumber();
            const endLine = varStatement.getEndLineNumber();
            const signature = this.getVariableFunctionSignature(declaration, initializer);

            symbols.push({
              id: `${relativePath}#${name}:${startLine}`,
              name,
              kind,
              filePath: relativePath,
              startLine,
              endLine,
              signature,
              docComment,
              isExported,
              isDefaultExport
            });
          }
        }
      }
    }

    // 3. Classes & Methods
    for (const cls of sourceFile.getClasses()) {
      const name = cls.getName();
      if (!name) continue;

      const isExported = cls.isExported();
      const isDefaultExport = cls.isDefaultExport();
      const startLine = cls.getStartLineNumber();
      const endLine = cls.getEndLineNumber();
      const docComment = this.getDocComment(cls);
      const heritageClauses = cls.getHeritageClauses().map(h => h.getText()).join(" ");
      const signature = `class ${name} ${heritageClauses}`.trim();

      symbols.push({
        id: `${relativePath}#${name}:${startLine}`,
        name,
        kind: "class",
        filePath: relativePath,
        startLine,
        endLine,
        signature,
        docComment,
        isExported,
        isDefaultExport
      });

      // Class Methods
      for (const method of cls.getMethods()) {
        const methodName = method.getName();
        const methodStart = method.getStartLineNumber();
        const methodEnd = method.getEndLineNumber();
        const methodSignature = `${name}.${method.getName()}(${method.getParameters().map(p => p.getText()).join(", ")}): ${method.getReturnType().getText()}`;
        const methodDoc = this.getDocComment(method);

        symbols.push({
          id: `${relativePath}#${name}.${methodName}:${methodStart}`,
          name: `${name}.${methodName}`,
          kind: "method",
          filePath: relativePath,
          startLine: methodStart,
          endLine: methodEnd,
          signature: methodSignature,
          docComment: methodDoc,
          isExported: false,
          isDefaultExport: false
        });
      }
    }

    // 4. Interfaces
    for (const iface of sourceFile.getInterfaces()) {
      const name = iface.getName();
      const isExported = iface.isExported();
      const isDefaultExport = iface.isDefaultExport();
      const startLine = iface.getStartLineNumber();
      const endLine = iface.getEndLineNumber();
      const docComment = this.getDocComment(iface);
      const signature = `interface ${name}`;

      symbols.push({
        id: `${relativePath}#${name}:${startLine}`,
        name,
        kind: "interface",
        filePath: relativePath,
        startLine,
        endLine,
        signature,
        docComment,
        isExported,
        isDefaultExport
      });
    }

    // 5. Type Aliases
    for (const typeAlias of sourceFile.getTypeAliases()) {
      const name = typeAlias.getName();
      const isExported = typeAlias.isExported();
      const isDefaultExport = typeAlias.isDefaultExport();
      const startLine = typeAlias.getStartLineNumber();
      const endLine = typeAlias.getEndLineNumber();
      const docComment = this.getDocComment(typeAlias);
      const signature = `type ${name} = ${typeAlias.getTypeNode()?.getText() || "..."}`;

      symbols.push({
        id: `${relativePath}#${name}:${startLine}`,
        name,
        kind: "type_alias",
        filePath: relativePath,
        startLine,
        endLine,
        signature,
        docComment,
        isExported,
        isDefaultExport
      });
    }

    // 6. Enums
    for (const enumDecl of sourceFile.getEnums()) {
      const name = enumDecl.getName();
      const isExported = enumDecl.isExported();
      const isDefaultExport = enumDecl.isDefaultExport();
      const startLine = enumDecl.getStartLineNumber();
      const endLine = enumDecl.getEndLineNumber();
      const docComment = this.getDocComment(enumDecl);

      symbols.push({
        id: `${relativePath}#${name}:${startLine}`,
        name,
        kind: "enum",
        filePath: relativePath,
        startLine,
        endLine,
        signature: `enum ${name}`,
        docComment,
        isExported,
        isDefaultExport
      });
    }

    return symbols;
  }

  private static detectFunctionKind(
    name: string,
    node: FunctionDeclaration | ArrowFunction | FunctionExpression
  ): SymbolKind {
    // 1. Custom Hook check: starts with 'use' followed by uppercase letter (e.g. useAuth, useCounter)
    if (/^use[A-Z0-9]/.test(name)) {
      return "react_hook";
    }

    // 2. React Component check: PascalCase name AND (returns JSX, contains JSX, or typed as React.FC)
    const isPascalCase = /^[A-Z][a-zA-Z0-9_]*$/.test(name);
    if (isPascalCase) {
      const hasJsx =
        node.getDescendantsOfKind(SyntaxKind.JsxElement).length > 0 ||
        node.getDescendantsOfKind(SyntaxKind.JsxSelfClosingElement).length > 0 ||
        node.getDescendantsOfKind(SyntaxKind.JsxFragment).length > 0;

      const returnTypeText = Node.isFunctionDeclaration(node)
        ? node.getReturnTypeNode()?.getText() || ""
        : "";

      const isReactReturnType =
        returnTypeText.includes("JSX.Element") ||
        returnTypeText.includes("ReactNode") ||
        returnTypeText.includes("ReactElement");

      if (hasJsx || isReactReturnType) {
        return "react_component";
      }

      // If PascalCase in a .tsx/.jsx file, strongly heuristic towards component
      const sourceExt = node.getSourceFile().getExtension();
      if ((sourceExt === ".tsx" || sourceExt === ".jsx") && hasJsx) {
        return "react_component";
      }
    }

    return Node.isArrowFunction(node) ? "arrow_function" : "function";
  }

  private static getFunctionSignature(fn: FunctionDeclaration): string {
    const name = fn.getName() || "anonymous";
    const params = fn.getParameters().map(p => p.getText()).join(", ");
    const returnType = fn.getReturnType().getText();
    return `function ${name}(${params}): ${returnType}`;
  }

  private static getVariableFunctionSignature(
    decl: VariableDeclaration,
    fn: ArrowFunction | FunctionExpression
  ): string {
    const name = decl.getName();
    const typeNode = decl.getTypeNode()?.getText();
    if (typeNode) {
      return `const ${name}: ${typeNode}`;
    }
    const params = fn.getParameters().map(p => p.getText()).join(", ");
    const returnType = fn.getReturnType().getText();
    return `const ${name} = (${params}): ${returnType}`;
  }

  private static getDocComment(node: Node): string | undefined {
    const comments: string[] = [];
    for (const range of node.getLeadingCommentRanges()) {
      comments.push(range.getText());
    }
    return comments.length > 0 ? comments.join("\n").trim() : undefined;
  }
}
