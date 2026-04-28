#!/bin/bash
set -e

echo "🚀 Starting TrustLink unified deployment..."

# Try to start Python email service (but don't block if it fails)
if [ -f "backend/app/main.py" ]; then
  echo "📧 Attempting to start Python Email Service on port 5000..."
  # Run in a subshell so we don't change the main shell's directory
  ( cd backend/app && nohup python3 main.py > /tmp/python_email_service.log 2>&1 & )
  
  # Wait briefly for Python to be ready (max 10 seconds)
  echo "⏳ Waiting for Python Email Service..."
  for i in $(seq 1 10); do
    if lsof -i :5000 > /dev/null 2>&1; then
      echo "✅ Python Email Service is ready on port 5000"
      break
    fi
    sleep 1
  done
else
  echo "⚠️ Python email service not found, continuing without it..."
fi

# Start Node.js backend (serves both API and React frontend)
echo "🌐 Starting Node.js server on port ${PORT:-3000}..."
NODE_ENV=production npx tsx server.ts
