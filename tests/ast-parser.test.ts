import { AstParser } from "../src/core/analysis/ast-parser.js";

async function runTests() {
  console.log("Starting AST Intelligence & Parser test suite...\n");

  const parser = new AstParser("/test/project");

  // 1. Test TypeScript Service / Class file
  const authServiceCode = `
import { apiClient } from './apiClient';
import type { User, LoginCredentials } from '../types/user';

export class AuthService {
  private token: string | null = null;

  async login(credentials: LoginCredentials): Promise<User> {
    const response = await apiClient.post('/auth/login', credentials);
    this.token = response.data.token;
    return response.data.user;
  }

  logout(): void {
    this.token = null;
  }
}

export const defaultAuth = new AuthService();
`;

  const authServiceResult = parser.parseSourceFile("src/services/authService.ts", authServiceCode);

  console.log("Testing AuthService.ts parsing...");
  console.log("  Extracted symbols:", authServiceResult.symbols.map(s => `${s.kind}: ${s.name} (${s.startLine}-${s.endLine})`));
  console.log("  Extracted imports:", authServiceResult.imports.map(i => `${i.sourceModule} -> ${i.importedSymbols.map(s => s.name).join(", ")}`));
  console.log("  Extracted exports:", authServiceResult.exports.map(e => `${e.exportType}: ${e.name}`));
  console.log("  Extracted relationships:", authServiceResult.relationships.map(r => `${r.sourceSymbolName || r.sourceFilePath} -[${r.type}]-> ${r.targetSymbolName || r.targetModule}`));

  // Assertions for AuthService
  const classSym = authServiceResult.symbols.find(s => s.name === "AuthService" && s.kind === "class");
  if (!classSym || !classSym.isExported) {
    throw new Error("❌ AuthService class symbol not extracted properly");
  }
  const loginMethod = authServiceResult.symbols.find(s => s.name === "AuthService.login" && s.kind === "method");
  if (!loginMethod) {
    throw new Error("❌ AuthService.login method not extracted properly");
  }
  const apiCallRel = authServiceResult.relationships.find(r => r.type === "CALLS" && r.targetSymbolName?.includes("apiClient.post"));
  if (!apiCallRel) {
    throw new Error("❌ apiClient.post call relationship not detected");
  }
  console.log("✔ AuthService AST extraction verified.");

  // 2. Test React Hook & Component with JSX/TSX
  const useAuthCode = `
import { useState, useEffect } from 'react';
import { AuthService } from '../services/authService';

export function useAuth() {
  const [user, setUser] = useState(null);
  const auth = new AuthService();

  const handleLogin = async (creds) => {
    const u = await auth.login(creds);
    setUser(u);
  };

  return { user, login: handleLogin };
}
`;

  const useAuthResult = parser.parseSourceFile("src/hooks/useAuth.ts", useAuthCode);
  const hookSym = useAuthResult.symbols.find(s => s.name === "useAuth" && s.kind === "react_hook");
  if (!hookSym) {
    throw new Error("❌ useAuth custom hook symbol not detected as react_hook");
  }
  console.log("✔ React Hook detection verified.");

  // 3. Test React Component with JSX
  const loginPageCode = `
import React from 'react';
import { useAuth } from '../hooks/useAuth';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();

  return (
    <div className="login-container">
      <h1>Login</h1>
      <button onClick={() => login({ user: 'admin' })}>Submit</button>
    </div>
  );
};
`;

  const loginPageResult = parser.parseSourceFile("src/pages/LoginPage.tsx", loginPageCode);
  const componentSym = loginPageResult.symbols.find(s => s.name === "LoginPage" && s.kind === "react_component");
  if (!componentSym) {
    throw new Error("❌ LoginPage not detected as react_component");
  }

  const hookUseRel = loginPageResult.relationships.find(r => r.type === "USES" && r.targetSymbolName === "useAuth");
  if (!hookUseRel) {
    throw new Error("❌ LoginPage -[USES]-> useAuth relationship not detected");
  }
  console.log("✔ React Component and Hook Usage relationship verified.");

  // 4. Test Types & Interfaces
  const typesCode = `
export interface User {
  id: string;
  name: string;
  email: string;
}

export type LoginCredentials = {
  username: string;
  passwordHash: string;
};

export enum UserRole {
  ADMIN = 'ADMIN',
  USER = 'USER'
}
`;

  const typesResult = parser.parseSourceFile("src/types/user.ts", typesCode);
  const iface = typesResult.symbols.find(s => s.name === "User" && s.kind === "interface");
  const typeAlias = typesResult.symbols.find(s => s.name === "LoginCredentials" && s.kind === "type_alias");
  const enumSym = typesResult.symbols.find(s => s.name === "UserRole" && s.kind === "enum");

  if (!iface || !typeAlias || !enumSym) {
    throw new Error("❌ Interface, type alias, or enum extraction failed");
  }
  console.log("✔ Interfaces, Types, and Enums verified.");

  console.log("\n🎉 All Phase 3 AST Intelligence tests passed successfully!");
}

runTests().catch(err => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
