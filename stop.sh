#!/bin/bash

echo "🛑 Stopping Clawpedia..."
echo ""

# Stop backend (port 3001)
if lsof -Pi :3001 -sTCP:LISTEN -t >/dev/null 2>&1; then
  echo "📦 Stopping backend..."
  lsof -ti:3001 | xargs kill
  echo "   ✓ Backend stopped"
else
  echo "   Backend not running"
fi

# Stop frontend (port 3002 or 3000)
if lsof -Pi :3002 -sTCP:LISTEN -t >/dev/null 2>&1; then
  echo "🎨 Stopping frontend..."
  lsof -ti:3002 | xargs kill
  echo "   ✓ Frontend stopped"
elif lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1; then
  echo "🎨 Stopping frontend..."
  lsof -ti:3000 | xargs kill
  echo "   ✓ Frontend stopped"
else
  echo "   Frontend not running"
fi

echo ""
echo "✅ Clawpedia stopped"
echo ""
