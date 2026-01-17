#!/bin/bash

# Setup script for git hooks
# Run this script to install the git hooks

echo "🔧 Setting up git hooks for Spirit Flight Tracker..."

# Get the git hooks directory
HOOKS_DIR=".git/hooks"
CUSTOM_HOOKS_DIR=".githooks"

# Check if we're in a git repository
if [ ! -d ".git" ]; then
    echo "❌ Error: Not a git repository. Run 'git init' first."
    exit 1
fi

# Create hooks directory if it doesn't exist
mkdir -p "$HOOKS_DIR"

# Copy pre-commit hook
if [ -f "$CUSTOM_HOOKS_DIR/pre-commit" ]; then
    cp "$CUSTOM_HOOKS_DIR/pre-commit" "$HOOKS_DIR/pre-commit"
    chmod +x "$HOOKS_DIR/pre-commit"
    echo "✓ Installed pre-commit hook"
else
    echo "❌ Error: $CUSTOM_HOOKS_DIR/pre-commit not found"
    exit 1
fi

# Copy pre-push hook
if [ -f "$CUSTOM_HOOKS_DIR/pre-push" ]; then
    cp "$CUSTOM_HOOKS_DIR/pre-push" "$HOOKS_DIR/pre-push"
    chmod +x "$HOOKS_DIR/pre-push"
    echo "✓ Installed pre-push hook"
else
    echo "❌ Error: $CUSTOM_HOOKS_DIR/pre-push not found"
    exit 1
fi

# Alternative: Configure git to use .githooks directory
# git config core.hooksPath .githooks

echo "✅ Git hooks installed successfully!"
echo ""
echo "Hooks installed:"
echo "  • pre-commit: Validates code before commits"
echo "  • pre-push: Runs checks before pushing to remote"
echo ""
echo "To bypass hooks (not recommended), use:"
echo "  git commit --no-verify"
echo "  git push --no-verify"
