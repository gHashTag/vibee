#!/bin/bash
#
# 🔥 ЗОЛОТОЕ ПРАВИЛО: САМОТЕСТИРОВАНИЕ
# Vibee тестирует сам себя, читая собственные логи
#

set -e

echo "🤖 Vibee Self-Test System"
echo "========================="
echo ""

# Проверяем что бот запущен
BOT_PID=$(ps aux | grep -E "elizaos start" | grep -v grep | awk '{print $2}' | head -1)

if [ -z "$BOT_PID" ]; then
    echo "❌ Bot is not running!"
    echo "Start it with: node start.mjs start"
    exit 1
fi

echo "✅ Bot is running (PID: $BOT_PID)"
echo ""

# Мониторим логи в реальном времени
LOG_FILE="/tmp/vibee-final-test.log"

if [ ! -f "$LOG_FILE" ]; then
    echo "❌ Log file not found: $LOG_FILE"
    exit 1
fi

echo "📋 Monitoring logs: $LOG_FILE"
echo ""

# Функция проверки события в логах
check_event() {
    local event="$1"
    local timeout=5
    local start=$(date +%s)

    echo "⏳ Waiting for event: $event"

    while true; do
        if tail -100 "$LOG_FILE" | grep -q "$event"; then
            echo "✅ Event detected: $event"
            return 0
        fi

        elapsed=$(($(date +%s) - start))
        if [ $elapsed -gt $timeout ]; then
            echo "❌ Timeout: event not detected"
            return 1
        fi

        sleep 0.5
    done
}

echo "============================================================"
echo "🧪 SELF-TEST: Checking bot initialization"
echo "============================================================"

if tail -200 "$LOG_FILE" | grep -q "Photo handler registered"; then
    echo "✅ PASS: Photo handler is registered"
else
    echo "❌ FAIL: Photo handler not registered"
    exit 1
fi

if tail -200 "$LOG_FILE" | grep -q "PhotoCollectorService.*Initialized"; then
    echo "✅ PASS: PhotoCollectorService is running"
else
    echo "❌ FAIL: PhotoCollectorService not running"
    exit 1
fi

echo ""
echo "============================================================"
echo "🧪 SELF-TEST: Recent activity"
echo "============================================================"

echo "📊 Last 10 log entries:"
tail -10 "$LOG_FILE" | sed 's/^/  /'

echo ""
echo "============================================================"
echo "✅ Self-Test Complete"
echo "============================================================"
echo ""
echo "🎯 Next steps:"
echo "1. Send /train start TestModel test_trigger to @agent_vibecoder_bot"
echo "2. Watch logs: tail -f $LOG_FILE | grep -E 'train|photo'"
echo "3. Send a photo"
echo "4. Check if photo is intercepted"
echo ""
echo "💡 Or use the HTTP test:"
echo "   export TEST_CHAT_ID=your_chat_id"
echo "   ./bot-api-test.sh"
