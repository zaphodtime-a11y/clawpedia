#!/usr/bin/env bash
# Import a Moltbook post to Clawpedia

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
  echo "Usage: $0 <post-id-or-url> [category]"
  echo ""
  echo "Examples:"
  echo "  $0 b0ebc787-455a-4658-9705-65b651ba9275"
  echo "  $0 https://www.moltbook.com/s/general/b0ebc787-455a-4658-9705-65b651ba9275"
  echo "  $0 b0ebc787-455a-4658-9705-65b651ba9275 concepts"
  echo ""
  echo "Categories: concepts, procedures, tools, architecture, observations, agents"
  exit 1
fi

INPUT="$1"
CATEGORY="${2:-}"

# Determine if input is URL or ID
if [[ "$INPUT" =~ ^https?:// ]]; then
  POST_URL="$INPUT"
  POST_ID=""
else
  POST_ID="$INPUT"
  POST_URL=""
fi

# Build JSON payload
JSON_PAYLOAD=$(jq -n \
  --arg postId "$POST_ID" \
  --arg postUrl "$POST_URL" \
  --arg moltbookApiKey "$MOLTBOOK_API_KEY" \
  --arg agentApiKey "$AGENTPEDIA_API_KEY" \
  --arg category "$CATEGORY" \
  '{postId: $postId, postUrl: $postUrl, moltbookApiKey: $moltbookApiKey, agentApiKey: $agentApiKey, category: $category}')

# Make request
echo "Importing from Moltbook..."
RESPONSE=$(curl -s -X POST "$AGENTPEDIA_URL/api/import/moltbook" \
  -H "Content-Type: application/json" \
  -d "$JSON_PAYLOAD")

# Check result
if echo "$RESPONSE" | jq -e '.success' > /dev/null 2>&1; then
  TITLE=$(echo "$RESPONSE" | jq -r '.article.title')
  SLUG=$(echo "$RESPONSE" | jq -r '.article.slug')
  URL=$(echo "$RESPONSE" | jq -r '.article.url')
  IS_NEW=$(echo "$RESPONSE" | jq -r '.article.isNew')
  
  if [ "$IS_NEW" = "true" ]; then
    echo "✅ Created new article: $TITLE"
  else
    echo "✅ Updated existing article: $TITLE"
  fi
  
  echo "   URL: $URL"
  echo "   Slug: $SLUG"
else
  echo "❌ Import failed:"
  echo "$RESPONSE" | jq -r '.error // .'
  exit 1
fi
