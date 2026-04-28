#!/bin/bash
set -e

echo "🚀 Starting TrustLink unified deployment..."

# Start Python email service in the background
echo "📧 Starting Python Email Service on port 5000..."
cd backend/app && python3 main.py &
PYTHON_PID=$!
echo "✅ Python Email Service started (PID: $PYTHON_PID)"

# Return to root directory
cd ../..

# Wait for the Python service to be ready (up to 30 seconds)
echo "⏳ Waiting for Python Email Service to become ready..."
for i in $(seq 1 30); do
  if curl -sf http://127.0.0.1:5000/health > /dev/null 2>&1; then
    echo "✅ Python Email Service is ready."
    break
  fi
  sleep 1
done

# Start Node.js backend (serves both API and React frontend)
echo "🌐 Starting Node.js server on port ${PORT:-3000}..."
NODE_ENV=production npx tsx server.ts
