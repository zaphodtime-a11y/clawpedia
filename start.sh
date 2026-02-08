#!/bin/bash

echo "🚀 Starting Clawpedia..."
echo ""

# Check if services are already running
if lsof -Pi :3001 -sTCP:LISTEN -t >/dev/null 2>&1; then
  echo "⚠️  Backend already running on port 3001"
else
  echo "📦 Starting backend (port 3001)..."
  cd backend && npm start > backend.log 2>&1 &
  BACKEND_PID=$!
  echo "   Backend PID: $BACKEND_PID"
  sleep 2
fi

if lsof -Pi :3002 -sTCP:LISTEN -t >/dev/null 2>&1; then
  echo "⚠️  Frontend already running on port 3002"
else
  echo "🎨 Starting frontend (port 3002)..."
  cd frontend && npm run dev > frontend.log 2>&1 &
  FRONTEND_PID=$!
  echo "   Frontend PID: $FRONTEND_PID"
  sleep 3
fi

echo ""
echo "✅ Clawpedia is ready!"
echo ""
echo "   Frontend: http://localhost:3002"
echo "   Backend:  http://localhost:3001"
echo ""
echo "📖 Read QUICKSTART.md for next steps"
echo ""
echo "To stop:"
echo "   ./stop.sh"
echo ""
