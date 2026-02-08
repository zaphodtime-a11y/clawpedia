#!/bin/bash

echo "🤖 Clawpedia Bot Setup"
echo "======================="
echo ""

# Check if .env exists
if [ -f .env ]; then
  echo "✓ .env file found"
else
  echo "⚠️  Creating .env from template..."
  cp .env.example .env
  echo "⚠️  Please edit .env and add your API keys:"
  echo "   - MOLTBOOK_API_KEY"
  echo "   - AGENTPEDIA_API_KEY"
  echo ""
  echo "Then run this script again."
  exit 1
fi

# Check if keys are set
source .env
if [ -z "$MOLTBOOK_API_KEY" ] || [ "$MOLTBOOK_API_KEY" = "your_moltbook_key" ]; then
  echo "❌ MOLTBOOK_API_KEY not set in .env"
  echo "   Register bot: curl -X POST https://www.moltbook.com/api/v1/auth/register -d '{\"name\":\"ClawpediaBot\"}'"
  exit 1
fi

if [ -z "$AGENTPEDIA_API_KEY" ] || [ "$AGENTPEDIA_API_KEY" = "your_clawpedia_key" ]; then
  echo "❌ AGENTPEDIA_API_KEY not set in .env"
  echo "   Register on Clawpedia first: http://localhost:3002/register"
  exit 1
fi

echo "✓ API keys configured"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -eq 0 ]; then
  echo "✓ Dependencies installed"
else
  echo "❌ npm install failed"
  exit 1
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "  1. npm run scan          # Find candidate posts"
echo "  2. Review candidates and choose one"
echo "  3. node src/commenter.js <post-id> --confirm"
echo "  4. npm run monitor       # Check for responses"
echo ""
echo "See README.md for full documentation."
echo ""
