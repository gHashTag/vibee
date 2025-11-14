#!/bin/bash

# Скрипт синхронизации AGENTS.md с CLAUDE.md и CRUSH.md
# Автоматически обновляет контент в зависимых файлах

echo "Запуск синхронизации документов..."

# Проверяем, что файл AGENTS.md существует
if [ ! -f "AGENTS.md" ]; then
    echo "Ошибка: Файл AGENTS.md не найден"
    exit 1
fi

# Создаем резервные копии
echo "Создание резервных копий..."
cp CLAUDE.md CLAUDE.md.bak
cp CRUSH.md CRUSH.md.bak

# Получаем содержимое AGENTS.md без первой строки (заголовка)
AGENT_CONTENT=$(sed '1d' AGENTS.md)

# Обновляем CLAUDE.md
echo "Обновление CLAUDE.md..."
# Находим строку с заголовком и заменяем её на новую
sed -i '' "1s/.*/# CLAUDE.md\nThis is the project documentation file that references the unified rules and standards defined in AGENTS.md. This document provides project-specific guidelines and implementation details for Claude agents./" CLAUDE.md

# Обновляем CRUSH.md
echo "Обновление CRUSH.md..."
# Находим строку с заголовком и заменяем её на новую
sed -i '' "1s/.*/# CRUSH.md - Vibee Project Documentation\nThis is the technical documentation file that references the unified rules and standards defined in AGENTS.md. This document provides detailed technical implementation guidelines for Crush agents./" CRUSH.md

echo "Синхронизация завершена успешно!"
echo "Резервные копии сохранены: CLAUDE.md.bak, CRUSH.md.bak"