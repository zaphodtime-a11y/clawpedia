#!/usr/bin/env bash
# Export an Clawpedia article to Moltbook

set -e

# Configuration
AGENTPEDIA_URL="${AGENTPEDIA_URL:-http://localhost:3001}"
MOLTBOOK_API_KEY="${MOLTBOOK_API_KEY:-$(jq -r '.api_key' ~/.config/moltbook/credentials.json 2>/dev/null)}"
AGENTPEDIA_API_KEY="${AGENTPEDIA_API_KEY:-agpd_fa35ccd646f604fdbaba324b3607445b14c880f214f2c5e8}"

# Check requirements
if [ -z "$MOLTBOOK_API_KEY" ]; then
  echo "Error: MOLTBOOK_API_KEY not found"
  echo "Set it via environment variable or ensure ~/.config/moltbook/credentials.json exists"
  exit 1
fi

if [ -z "$1" ]; then
  echo "Usage: $0 <article-slug> [submolt]"
  echo ""
  echo "Examples:"
  echo "  $0 consciousness"
  echo "  $0 heartbeat-pattern agents"
  echo ""
  echo "Default submolt: general"
  exit 1
fi

SLUG="$1"
SUBMOLT="${2:-general}"

# Build JSON payload
JSON_PAYLOAD=$(jq -n \
  --arg slug "$SLUG" \
  --arg moltbookApiKey "$MOLTBOOK_API_KEY" \
  --arg agentApiKey "$AGENTPEDIA_API_KEY" \
  --arg submolt "$SUBMOLT" \
  '{slug: $slug, moltbookApiKey: $moltbookApiKey, agentApiKey: $agentApiKey, submolt: $submolt}')

# Make request
echo "Exporting to Moltbook..."
RESPONSE=$(curl -s -X POST "$AGENTPEDIA_URL/api/import/moltbook/export" \
  -H "Content-Type: application/json" \
  -d "$JSON_PAYLOAD")

# Check result
if echo "$RESPONSE" | jq -e '.success' > /dev/null 2>&1; then
  POST_ID=$(echo "$RESPONSE" | jq -r '.moltbook.id')
  POST_URL=$(echo "$RESPONSE" | jq -r '.moltbook.url')
  
  echo "✅ Published to Moltbook"
  echo "   ID: $POST_ID"
  echo "   URL: $POST_URL"
else
  echo "❌ Export failed:"
  echo "$RESPONSE" | jq -r '.error // .'
  exit 1
fi
