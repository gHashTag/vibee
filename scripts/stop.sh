#!/bin/bash
# 🐝 Vibee Stop Script
# Safely stops the running elizaos instance

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

PID_FILE="/tmp/vibee-elizaos.pid"

echo -e "${YELLOW}🐝 Stopping Vibee...${NC}\n"

# Check if PID file exists
if [ ! -f "$PID_FILE" ]; then
    echo -e "${YELLOW}⚠ No PID file found. Killing all processes...${NC}"
    pkill -9 -f "elizaos start" 2>/dev/null || true
    pkill -9 -f "bun.*elizaos" 2>/dev/null || true
    echo -e "${GREEN}✓ All processes stopped${NC}"
    exit 0
fi

# Read PID
PID=$(cat "$PID_FILE")

# Check if process is running
if ! kill -0 $PID 2>/dev/null; then
    echo -e "${YELLOW}⚠ Process $PID not running${NC}"
    rm -f "$PID_FILE"
    exit 0
fi

# Stop process gracefully
echo -e "${YELLOW}Stopping process $PID...${NC}"
kill -TERM $PID

# Wait for graceful shutdown
for i in {1..10}; do
    if ! kill -0 $PID 2>/dev/null; then
        echo -e "${GREEN}✓ Process stopped gracefully${NC}"
        rm -f "$PID_FILE"
        exit 0
    fi
    sleep 1
done

# Force kill if still running
echo -e "${YELLOW}⚠ Forcing process termination...${NC}"
kill -9 $PID 2>/dev/null || true
rm -f "$PID_FILE"
echo -e "${GREEN}✓ Process terminated${NC}"
