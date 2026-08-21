#!/usr/bin/env bash

set -e

echo ""
echo "  ◆ Installing Codast — AI Codebase Intelligence CLI..."
echo "  ────────────────────────────────────────────────────"

# 1. Check Node.js prerequisite
if ! command -v node >/dev/null 2>&1; then
    echo "  [x] Error: Node.js (v20+) is required to run Codast."
    echo "      Please install Node.js from https://nodejs.org or via nvm/brew."
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
    echo "  [!] Warning: Node.js version $NODE_VERSION detected. Node.js 20+ is strongly recommended."
fi

# 2. Check npm
if ! command -v npm >/dev/null 2>&1; then
    echo "  [x] Error: npm is required."
    exit 1
fi

# 3. Install globally via npm
echo "  • Installing codast globally..."
npm install -g codast

echo ""
echo "  ✔ Codast installed successfully!"
echo ""
echo "  To start, navigate to any JS/TS codebase and run:"
echo "    codast"
echo "    # or"
echo "    cai"
echo ""
