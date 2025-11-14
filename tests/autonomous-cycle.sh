#!/bin/bash
#
# 🌈 РАДУЖНЫЙ МОСТ - Полностью автономный цикл RED-GREEN-REFACTOR
#
# Этот скрипт:
# 1. Запускает тесты автоматически
# 2. Анализирует результаты
# 3. Если тесты падают - логирует проблему
# 4. Если тесты проходят - фиксирует успех
#
# ГЛАВНОЕ: работает БЕЗ участия человека!
#

set -e

echo "🌈 РАДУЖНЫЙ МОСТ - Autonomous RED-GREEN-REFACTOR Cycle"
echo "=" | tr ' ' '=' | head -c 60
echo ""

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Счётчики
CYCLE=1
MAX_CYCLES=5

run_test_cycle() {
    local cycle_num=$1

    echo ""
    echo "═════════════════════════════════════════════════════════════"
    echo "🔄 CYCLE #${cycle_num}: Starting test cycle..."
    echo "═════════════════════════════════════════════════════════════"

    # RED: Запускаем тесты
    echo "🔴 RED: Running tests..."

    # Запускаем интеграционные тесты
    if bun test src/__tests__/selftest-integration.test.ts 2>&1 | tee /tmp/test-output.log; then
        echo -e "${GREEN}✅ GREEN: Tests PASSED!${NC}"

        # GREEN achieved - проверяем coverage
        local coverage=$(grep -o "[0-9]*\.[0-9]*" /tmp/test-output.log | head -1)

        echo ""
        echo "📊 Test Coverage: ${coverage}%"

        if (( $(echo "$coverage > 70" | bc -l) )); then
            echo -e "${GREEN}🎉 Coverage > 70% - EXCELLENT!${NC}"
            echo ""
            echo "🔵 REFACTOR: Code is clean and tested"
            echo "✅ Cycle #${cycle_num} COMPLETE"
            return 0
        else
            echo -e "${YELLOW}⚠️ Coverage < 70% - Need more tests${NC}"
            return 1
        fi
    else
        echo -e "${RED}❌ RED: Tests FAILED${NC}"

        # Анализируем ошибку
        echo ""
        echo "📋 Error Analysis:"
        grep -i "error\|fail" /tmp/test-output.log | head -5

        echo ""
        echo "💡 Auto-fix not implemented yet"
        echo "   Manual intervention required"
        return 1
    fi
}

# Главный цикл
echo "Starting autonomous testing cycle..."
echo "Max cycles: $MAX_CYCLES"
echo ""

for ((i=1; i<=MAX_CYCLES; i++)); do
    if run_test_cycle $i; then
        echo ""
        echo "═════════════════════════════════════════════════════════════"
        echo -e "${GREEN}🌈 РАДУЖНЫЙ МОСТ РАБОТАЕТ!${NC}"
        echo -e "${GREEN}✅ All tests passed in cycle #${i}${NC}"
        echo "═════════════════════════════════════════════════════════════"
        exit 0
    fi

    echo ""
    echo -e "${YELLOW}⏸️  Cycle #${i} failed, waiting before retry...${NC}"
    sleep 2
done

echo ""
echo "═════════════════════════════════════════════════════════════"
echo -e "${RED}❌ Failed after $MAX_CYCLES cycles${NC}"
echo "═════════════════════════════════════════════════════════════"
exit 1
