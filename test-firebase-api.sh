#!/bin/bash

# Firebase API Testing Script for Voice Mate
echo "🔥 Testing Firebase API Endpoints"
echo "================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Get project ID from .firebaserc
PROJECT_ID=$(cat .firebaserc | grep -o '"default": "[^"]*"' | cut -d'"' -f4)

if [ -z "$PROJECT_ID" ]; then
    echo -e "${RED}Error: Could not find project ID in .firebaserc${NC}"
    echo "Make sure you've run 'firebase init' first"
    exit 1
fi

echo -e "${BLUE}Project ID: $PROJECT_ID${NC}"
echo ""

# Base URL for your functions
BASE_URL="https://us-central1-$PROJECT_ID.cloudfunctions.net/api"

echo -e "${BLUE}Testing Function URL: $BASE_URL${NC}"
echo ""

# Test 1: Get diary entries
echo -e "${YELLOW}Test 1: Getting diary entries...${NC}"
curl -s -w "Status: %{http_code}\n" "$BASE_URL/api/diary/2025-01-01" | head -5
echo ""

# Test 2: Create diary entry
echo -e "${YELLOW}Test 2: Creating diary entry...${NC}"
curl -s -X POST "$BASE_URL/api/diary" \
  -H "Content-Type: application/json" \
  -d '{"content": "Test diary entry from script", "date": "2025-01-01"}' \
  -w "Status: %{http_code}\n" | head -5
echo ""

# Test 3: Get tasks
echo -e "${YELLOW}Test 3: Getting tasks...${NC}"
curl -s -w "Status: %{http_code}\n" "$BASE_URL/api/tasks" | head -5
echo ""

# Test 4: Create task
echo -e "${YELLOW}Test 4: Creating task...${NC}"
curl -s -X POST "$BASE_URL/api/tasks" \
  -H "Content-Type: application/json" \
  -d '{"title": "Test task from script", "description": "API test", "status": "not_started", "priority": "medium"}' \
  -w "Status: %{http_code}\n" | head -5
echo ""

# Test 5: Get schedule items
echo -e "${YELLOW}Test 5: Getting schedule items...${NC}"
curl -s -w "Status: %{http_code}\n" "$BASE_URL/api/schedule" | head -5
echo ""

# Test 6: Create schedule item
echo -e "${YELLOW}Test 6: Creating schedule item...${NC}"
curl -s -X POST "$BASE_URL/api/schedule" \
  -H "Content-Type: application/json" \
  -d '{"title": "Test schedule", "description": "API test", "startTime": "09:00", "endTime": "10:00", "repeat": "daily"}' \
  -w "Status: %{http_code}\n" | head -5
echo ""

echo -e "${GREEN}API Testing Complete!${NC}"
echo ""
echo "What the status codes mean:"
echo "200 = Success"
echo "404 = Function not found (check deployment)"
echo "500 = Server error (check function logs)"
echo "CORS = CORS policy issue"
echo ""
echo "To check function logs:"
echo "firebase functions:log --only api"
echo ""
echo "To redeploy functions:"
echo "firebase deploy --only functions"