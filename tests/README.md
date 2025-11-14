# Telegram Bot Automated Testing

Автоматическое тестирование Telegram бота через MTProto (Telethon).

## Установка

```bash
pip install -r requirements.txt
```

## Настройка

1. Получи API credentials на https://my.telegram.org/apps
2. Создай `.env` файл с переменными:
   - `TELEGRAM_API_ID`
   - `TELEGRAM_API_HASH`
   - `TELEGRAM_PHONE`
   - `BOT_USERNAME`

## Использование

```bash
# Все тесты
python telegram-bot-test.py

# Конкретный тест
python telegram-bot-test.py --test train_start
python telegram-bot-test.py --test photo_upload --photo test.jpg
```

См. полную документацию в `telegram-bot-test.py`
