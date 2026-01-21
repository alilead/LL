#!/bin/bash
# Clear Python bytecode cache to fix import issues

echo "🧹 Clearing Python bytecode cache..."

# Remove all __pycache__ directories
find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true

# Remove all .pyc files
find . -type f -name "*.pyc" -delete 2>/dev/null || true

# Remove all .pyo files
find . -type f -name "*.pyo" -delete 2>/dev/null || true

echo "✅ Cache cleared!"
echo ""
echo "Now run: python3 -m uvicorn main:app --reload"
