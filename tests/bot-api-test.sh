#!/bin/bash
#
# Простой HTTP тест бота через Telegram Bot API
# Использует sendMessage для отправки команд и getUpdates для чтения ответов
#

set -e

# Получаем BOT_TOKEN из .env или переменной окружения
if [ -f "../.env" ]; then
    source ../.env
fi

BOT_TOKEN="${TELEGRAM_BOT_TOKEN}"
CHAT_ID="${TEST_CHAT_ID}"  # ID чата для тестов

if [ -z "$BOT_TOKEN" ]; then
    echo "❌ Error: TELEGRAM_BOT_TOKEN not set"
    exit 1
fi

if [ -z "$CHAT_ID" ]; then
    echo "❌ Error: TEST_CHAT_ID not set"
    echo "Получи свой CHAT_ID: отправь сообщение @userinfobot"
    exit 1
fi

BASE_URL="https://api.telegram.org/bot${BOT_TOKEN}"

echo "🤖 Testing bot: ${BOT_TOKEN:0:10}..."
echo "💬 Chat ID: ${CHAT_ID}"
echo ""

# Функция отправки сообщения
send_message() {
    local text="$1"
    echo "📤 Sending: $text"

    curl -s -X POST "$BASE_URL/sendMessage" \
        -d "chat_id=${CHAT_ID}" \
        -d "text=${text}" \
        | jq -r '.result.message_id // "ERROR"'
}

# Функция получения последних сообщений
get_updates() {
    curl -s "$BASE_URL/getUpdates?offset=-1&limit=5" \
        | jq -r '.result[] | select(.message.chat.id == '"$CHAT_ID"') | .message.text' \
        | head -5
}

# Функция ожидания ответа бота
wait_for_response() {
    local keyword="$1"
    local timeout=10
    local elapsed=0

    echo "⏳ Waiting for response containing: $keyword"

    while [ $elapsed -lt $timeout ]; do
        response=$(get_updates)

        if echo "$response" | grep -q "$keyword"; then
            echo "✅ Got response!"
            echo "$response" | head -3
            return 0
        fi

        sleep 1
        elapsed=$((elapsed + 1))
    done

    echo "❌ Timeout: no response"
    return 1
}

echo "============================================================"
echo "🧪 TEST 1: /train start"
echo "============================================================"

send_message "/train start TestModel test_trigger"
sleep 3

if wait_for_response "Отлично"; then
    echo "✅ PASS: /train start"
else
    echo "❌ FAIL: /train start"
fi

echo ""
echo "============================================================"
echo "🧪 TEST 2: /train cancel"
echo "============================================================"

send_message "/train cancel"
sleep 3

if wait_for_response "отменена"; then
    echo "✅ PASS: /train cancel"
else
    echo "❌ FAIL: /train cancel"
fi

echo ""
echo "============================================================"
echo "📊 Test Summary"
echo "============================================================"
echo "See results above"
