#!/bin/bash

# LinguaLabel Development Server Script
# This script starts all development services

echo "🌍 Starting LinguaLabel Development Environment..."

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Start Backend
echo -e "${BLUE}Starting Backend (FastAPI)...${NC}"
cd backend
if [ ! -d "venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv venv
fi
source venv/bin/activate
pip install -r requirements.txt --quiet
uvicorn main:app --reload --port 8000 &
BACKEND_PID=$!
cd ..

# Start Frontend
echo -e "${BLUE}Starting Frontend (Next.js)...${NC}"
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

# Start Label Studio (if installed)
if command -v label-studio &> /dev/null; then
    echo -e "${BLUE}Starting Label Studio...${NC}"
    label-studio start --port 8080 &
    LABELSTUDIO_PID=$!
fi

echo -e "${GREEN}✅ All services started!${NC}"
echo ""
echo "🖥  Frontend:     http://localhost:3000"
echo "🔌 Backend API:  http://localhost:8000"
echo "📝 API Docs:     http://localhost:8000/docs"
echo "🏷  Label Studio: http://localhost:8080"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait and cleanup on exit
trap "kill $BACKEND_PID $FRONTEND_PID $LABELSTUDIO_PID 2>/dev/null" EXIT
wait
