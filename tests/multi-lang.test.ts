import assert from "node:assert";
import { AstParser } from "../src/core/analysis/ast-parser.js";
import { LogicalChunker } from "../src/core/analysis/chunker.js";

console.log("\nStarting Universal Multi-Language Support test suite...\n");

const parser = new AstParser(process.cwd());

// 1. Test Python Parsing
console.log("Testing Python (.py) parsing...");
const pythonCode = `import os
from fastapi import FastAPI, Depends
from .services import AuthService

app = FastAPI()

class UserAccount:
    """Represents a user account in the system."""
    def __init__(self, username: str, email: str):
        self.username = username
        self.email = email

    def get_display_name(self) -> str:
        return self.username

@app.get("/users/me")
async def get_current_user(auth: AuthService = Depends()):
    return auth.get_user()
`;

const pyResult = parser.parseSourceFile("api/main.py", pythonCode);
console.log("  Python symbols:", pyResult.symbols.map(s => `${s.kind}: ${s.name} (${s.startLine}-${s.endLine})`));

assert.strictEqual(pyResult.symbols.some(s => s.name === "UserAccount" && s.kind === "class"), true);
assert.strictEqual(pyResult.symbols.some(s => s.name === "UserAccount.__init__" && s.kind === "method"), true);
assert.strictEqual(pyResult.symbols.some(s => s.name === "UserAccount.get_display_name" && s.kind === "method"), true);
assert.strictEqual(pyResult.symbols.some(s => s.name === "get_current_user" && s.kind === "function"), true);
assert.strictEqual(pyResult.imports.some(i => i.moduleSpecifier === "fastapi"), true);
console.log("✔ Python parsing verified.");

// 2. Test Go Parsing
console.log("Testing Go (.go) parsing...");
const goCode = `package auth

import (
	"context"
	"fmt"
	"net/http"
)

type TokenService interface {
	ValidateToken(token string) bool
}

type User struct {
	ID   string
	Name string
}

type AuthService struct {
	tokens TokenService
}

func (s *AuthService) Login(ctx context.Context, username string) (*User, error) {
	fmt.Println("Logging in:", username)
	return &User{ID: "123", Name: username}, nil
}

func NewAuthService(tokens TokenService) *AuthService {
	return &AuthService{tokens: tokens}
}
`;

const goResult = parser.parseSourceFile("pkg/auth/service.go", goCode);
console.log("  Go symbols:", goResult.symbols.map(s => `${s.kind}: ${s.name} (${s.startLine}-${s.endLine})`));

assert.strictEqual(goResult.symbols.some(s => s.name === "TokenService" && s.kind === "interface"), true);
assert.strictEqual(goResult.symbols.some(s => s.name === "User" && s.kind === "class"), true);
assert.strictEqual(goResult.symbols.some(s => s.name === "AuthService" && s.kind === "class"), true);
assert.strictEqual(goResult.symbols.some(s => s.name === "AuthService.Login" && s.kind === "method"), true);
assert.strictEqual(goResult.symbols.some(s => s.name === "NewAuthService" && s.kind === "function"), true);
assert.strictEqual(goResult.imports.some(i => i.moduleSpecifier === "net/http"), true);
console.log("✔ Go parsing verified.");

// 3. Test Rust Parsing
console.log("Testing Rust (.rs) parsing...");
const rustCode = `use std::collections::HashMap;

pub trait Authenticatable {
    fn verify(&self) -> bool;
}

pub struct Session {
    pub token: String,
    pub user_id: u64,
}

impl Authenticatable for Session {
    fn verify(&self) -> bool {
        !self.token.is_empty()
    }
}

pub async fn handle_request(session: &Session) -> bool {
    session.verify()
}
`;

const rustResult = parser.parseSourceFile("src/auth.rs", rustCode);
console.log("  Rust symbols:", rustResult.symbols.map(s => `${s.kind}: ${s.name} (${s.startLine}-${s.endLine})`));

assert.strictEqual(rustResult.symbols.some(s => s.name === "Authenticatable" && s.kind === "interface"), true);
assert.strictEqual(rustResult.symbols.some(s => s.name === "Session" && s.kind === "class"), true);
assert.strictEqual(rustResult.symbols.some(s => s.name === "handle_request" && s.kind === "function"), true);
assert.strictEqual(rustResult.imports.some(i => i.moduleSpecifier === "std::collections::HashMap"), true);
console.log("✔ Rust parsing verified.");

// 4. Test Java / C++ / SQL Parsing
console.log("Testing Java & SQL Polyglot parsing...");
const javaCode = `package com.app.services;

import java.util.List;

public class PaymentProcessor {
    public void processPayment(double amount) {
        System.out.println("Processing: " + amount);
    }
}
`;

const javaResult = parser.parseSourceFile("src/main/java/com/app/PaymentProcessor.java", javaCode);
assert.strictEqual(javaResult.symbols.some(s => s.name === "PaymentProcessor" && s.kind === "class"), true);
assert.strictEqual(javaResult.symbols.some(s => s.name === "processPayment" && s.kind === "function"), true);

const sqlCode = `CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE VIEW active_users AS
SELECT * FROM users WHERE active = true;
`;

const sqlResult = parser.parseSourceFile("db/schema.sql", sqlCode);
assert.strictEqual(sqlResult.symbols.some(s => s.name === "users" && s.kind === "class"), true);
assert.strictEqual(sqlResult.symbols.some(s => s.name === "active_users"), true);
console.log("✔ Polyglot (Java, SQL) parsing verified.");

// 5. Test Multi-Language Logical Chunking
console.log("Testing Multi-Language Logical Chunking...");
const pyChunks = LogicalChunker.chunkFile("api/main.py", pythonCode, pyResult.symbols);
assert.strictEqual(pyChunks.length > 0, true);
assert.strictEqual(pyChunks[0].enrichedContent.includes("# File: api/main.py"), true);

const goChunks = LogicalChunker.chunkFile("pkg/auth/service.go", goCode, goResult.symbols);
assert.strictEqual(goChunks.length > 0, true);
assert.strictEqual(goChunks[0].enrichedContent.includes("// File: pkg/auth/service.go"), true);

console.log(`✔ Generated ${pyChunks.length} Python chunks with Python '#' headers.`);
console.log(`✔ Generated ${goChunks.length} Go chunks with Go '//' headers.`);

console.log("\n🎉 All Universal Multi-Language Support tests passed successfully!\n");
