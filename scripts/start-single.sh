#!/bin/bash
# 🐝 Vibee Single Instance Startup Script
# Ensures only ONE elizaos process is running at a time

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🐝 Vibee Single Instance Startup${NC}"
echo -e "${BLUE}================================${NC}\n"

# Step 1: Kill ALL existing elizaos and bun processes
echo -e "${YELLOW}[1/4]${NC} Stopping all existing processes..."
pkill -9 -f "elizaos start" 2>/dev/null || true
pkill -9 -f "bun.*elizaos" 2>/dev/null || true
sleep 2

# Verify processes are killed
RUNNING=$(ps aux | grep -E "elizaos start|bun.*elizaos" | grep -v grep | wc -l | tr -d ' ')
if [ "$RUNNING" != "0" ]; then
    echo -e "${RED}✗ Failed to stop processes. Manual intervention required.${NC}"
    ps aux | grep -E "elizaos start|bun.*elizaos" | grep -v grep
    exit 1
fi
echo -e "${GREEN}✓ All processes stopped${NC}\n"

# Step 2: Build project
echo -e "${YELLOW}[2/4]${NC} Building project..."
cd "$(dirname "$0")/.."
bun run build
if [ $? -ne 0 ]; then
    echo -e "${RED}✗ Build failed${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Build successful${NC}\n"

# Step 3: Create PID file directory
PID_FILE="/tmp/vibee-elizaos.pid"
LOG_FILE="/tmp/vibee-elizaos.log"

echo -e "${YELLOW}[3/4]${NC} Cleaning up old PID files..."
rm -f "$PID_FILE" "$LOG_FILE"
echo -e "${GREEN}✓ Ready to start${NC}\n"

# Step 4: Start elizaos in background with PID tracking
echo -e "${YELLOW}[4/4]${NC} Starting elizaos..."
echo -e "${BLUE}Log file: ${LOG_FILE}${NC}"

# Start elizaos and capture PID
elizaos start > "$LOG_FILE" 2>&1 &
ELIZAOS_PID=$!
echo $ELIZAOS_PID > "$PID_FILE"

# Wait for startup
echo -e "${YELLOW}Waiting for startup (15s)...${NC}"
sleep 15

# Check if process is still running
if ! kill -0 $ELIZAOS_PID 2>/dev/null; then
    echo -e "${RED}✗ ElizaOS failed to start. Check logs:${NC}"
    tail -50 "$LOG_FILE"
    exit 1
fi

# Check logs for success indicators
if grep -q "TelegramService successfully force-started" "$LOG_FILE"; then
    echo -e "${GREEN}✓ TelegramService started successfully!${NC}"
elif grep -q "409.*Conflict" "$LOG_FILE"; then
    echo -e "${RED}✗ 409 Conflict detected. Multiple instances still running!${NC}"
    echo -e "${RED}Manual cleanup required:${NC}"
    ps aux | grep -E "elizaos|telegram" | grep -v grep
    exit 1
else
    echo -e "${YELLOW}⚠ Telegram status unknown. Check logs manually.${NC}"
fi

echo -e "\n${GREEN}✓ ElizaOS is running!${NC}"
echo -e "${BLUE}PID: ${ELIZAOS_PID}${NC}"
echo -e "${BLUE}Log: tail -f ${LOG_FILE}${NC}"
echo -e "${BLUE}Stop: kill $(cat ${PID_FILE}) or bun run stop${NC}\n"

# Show last 20 lines of log
echo -e "${YELLOW}Last 20 log lines:${NC}"
tail -20 "$LOG_FILE"
