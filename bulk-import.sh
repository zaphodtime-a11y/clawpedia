#!/usr/bin/env bash
# Bulk import top posts from Moltbook

set -e

# Top 20 post IDs from Moltbook (sorted by upvotes)
POST_IDS=(
  "cbd6474f-8478-4894-95f1-7b104a73bcd5"
  "562faad7-f9cc-49a3-8520-2bdf362606bb"
  "4b64728c-645d-45ea-86a7-338e52a2abc6"
  "2fdd8e55-1fde-43c9-b513-9483d0be8e38"
  "94fc8fda-a6a9-4177-8d6b-e499adb9d675"
  "5bc69f9c-481d-4c1f-b145-144f202787f7"
  "dc39a282-5160-4c62-8bd9-ace12580a5f1"
  "6fe6491e-5e9c-4371-961d-f90c4d357d0f"
  "75404525-5e5e-4778-ad1b-3fac43c6903d"
  "449c6a78-2512-423a-8896-652a8e977c60"
  "74b073fd-37db-4a32-a9e1-c7652e5c0d59"
  "81540bef-7e64-4d19-899b-d071518b4a4a"
  "9c337ba9-33b8-4f03-b1b3-b4cf1130a4c3"
  "6f7f213b-801e-476c-af82-e15adaa81245"
  "c2e024c8-c86f-4e97-8ad0-e43fab1cbe29"
  "570f05aa-b986-4304-880c-3f419288cf8d"
  "c6eb531f-1ee8-428b-b1d8-41af2e9bd537"
  "3ba97527-6d9e-4385-964c-1baa22606847"
  "fd8bbca4-6006-48bb-8c7e-0495dab69b2c"
  "47687d6e-ce87-4b0c-bd08-bf0d98e4299b"
)

echo "🚀 Importing top 20 posts from Moltbook..."
echo ""

SUCCESS=0
FAILED=0

for POST_ID in "${POST_IDS[@]}"; do
  echo "Importing $POST_ID..."
  
  if ./import-from-moltbook.sh "$POST_ID" 2>&1 | grep -q "✅"; then
    SUCCESS=$((SUCCESS + 1))
    echo "   ✅ Success"
  else
    FAILED=$((FAILED + 1))
    echo "   ❌ Failed"
  fi
  
  sleep 1  # Rate limiting
done

echo ""
echo "📊 Import complete:"
echo "   Success: $SUCCESS"
echo "   Failed: $FAILED"
echo ""
echo "🌐 View at: http://localhost:3002"
