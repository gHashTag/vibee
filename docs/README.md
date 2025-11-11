# 🐝 Vibee Documentation Hub

> Центр документации проекта Vibee - AI-наставник по vibe-coding

## 📚 Навигация по документации

### 🎯 Для разработчиков

| Документ | Описание | Когда использовать |
|----------|----------|-------------------|
| [**PROJECT_KNOWLEDGE_BASE.md**](./PROJECT_KNOWLEDGE_BASE.md) | Полная база знаний о проекте | Изучение архитектуры, решение проблем |
| [**SKILLS_REGISTRY.md**](./SKILLS_REGISTRY.md) | Реестр навыков и компетенций | Изучение паттернов, skill development |
| [**../tests/README.md**](../tests/README.md) | Документация по тестированию | Написание и запуск тестов |
| [**CLAUDE.md**](../CLAUDE.md) | Инструкции для Claude AI | Работа с AI-ассистентом |

### 🚀 Quick Links

**Для новичков:**
1. Начните с [PROJECT_KNOWLEDGE_BASE.md](./PROJECT_KNOWLEDGE_BASE.md) - Project Overview
2. Изучите [архитектуру](./PROJECT_KNOWLEDGE_BASE.md#architecture)
3. Прочитайте [Development Workflow](./PROJECT_KNOWLEDGE_BASE.md#development-workflow)

**Для опытных:**
1. [Troubleshooting Guide](./PROJECT_KNOWLEDGE_BASE.md#troubleshooting-guide) - решение проблем
2. [Problem-Solving Patterns](./SKILLS_REGISTRY.md#problem-solving-patterns) - паттерны решений
3. [Advanced Patterns](./SKILLS_REGISTRY.md#advanced-patterns) - продвинутые техники

**Для тестирования:**
1. [Testing Infrastructure](./PROJECT_KNOWLEDGE_BASE.md#testing-infrastructure)
2. [Test Suite Documentation](../tests/README.md)
3. [Test Commands Reference](../tests/README.md#quick-start)

---

## 🎓 Learning Paths

### Path 1: Getting Started (1-2 days)

**Goal:** Понять проект и запустить локально

1. **Read:** [Project Overview](./PROJECT_KNOWLEDGE_BASE.md#project-overview)
2. **Setup:** Install Bun, clone repo, `bun install`
3. **Configure:** Create `.env.local` with Infisical credentials
4. **Run:** `bun dev` - запустить dev server
5. **Test:** `bun test:auto` - протестировать бота

**Success Criteria:**
- ✅ Бот отвечает на команды
- ✅ Dev server запускается без ошибок
- ✅ Тесты проходят успешно

### Path 2: Understanding Architecture (2-3 days)

**Goal:** Глубокое понимание системы

1. **Study:** [Architecture](./PROJECT_KNOWLEDGE_BASE.md#architecture)
2. **Explore:** [Core Components](./PROJECT_KNOWLEDGE_BASE.md#core-components)
3. **Analyze:** [Telegram Bot System](./PROJECT_KNOWLEDGE_BASE.md#telegram-bot-system)
4. **Debug:** Run with `LOG_LEVEL=debug`
5. **Experiment:** Modify plugin behavior and test

**Success Criteria:**
- ✅ Понимание plugin system
- ✅ Знание event flow
- ✅ Умение читать логи
- ✅ Debugging skills

### Path 3: Contributing Code (3-5 days)

**Goal:** Создать первый PR

1. **Learn:** [Development Workflow](./PROJECT_KNOWLEDGE_BASE.md#development-workflow)
2. **Practice:** [Skills & Best Practices](./PROJECT_KNOWLEDGE_BASE.md#skills--best-practices)
3. **Implement:** Выбрать задачу из Issues
4. **Test:** Написать тесты для изменений
5. **Document:** Обновить документацию
6. **Review:** Создать PR и получить review

**Success Criteria:**
- ✅ Код следует style guide
- ✅ Тесты покрывают изменения
- ✅ Документация обновлена
- ✅ PR одобрен и смержен

### Path 4: Mastering Testing (2-3 days)

**Goal:** Стать экспертом в тестировании

1. **Foundation:** [Testing Infrastructure](./PROJECT_KNOWLEDGE_BASE.md#testing-infrastructure)
2. **Practice:** [Test Suite Docs](../tests/README.md)
3. **Patterns:** [Testing Methodologies](./SKILLS_REGISTRY.md#testing-methodologies)
4. **Hands-on:** Написать integration и E2E тесты
5. **Automation:** Настроить CI/CD для тестов

**Success Criteria:**
- ✅ Написал integration tests
- ✅ Написал E2E tests
- ✅ Понимание test patterns
- ✅ CI/CD pipeline работает

### Path 5: Advanced Topics (Ongoing)

**Goal:** Продвинутые техники и оптимизации

1. **Performance:** [Performance Optimization](./SKILLS_REGISTRY.md#performance-optimization)
2. **Patterns:** [Advanced Patterns](./SKILLS_REGISTRY.md#advanced-patterns)
3. **Troubleshooting:** [Problem-Solving Patterns](./SKILLS_REGISTRY.md#problem-solving-patterns)
4. **Architecture:** Design новых features
5. **Mentoring:** Помогать другим разработчикам

**Success Criteria:**
- ✅ Оптимизировал performance
- ✅ Решил сложные проблемы
- ✅ Спроектировал новую фичу
- ✅ Помог другим разработчикам

---

## 🔍 Search Guide

### Поиск по задачам

**"Как запустить проект?"**
→ [Development Workflow - Daily Development](./PROJECT_KNOWLEDGE_BASE.md#daily-development)

**"Почему бот не отвечает на /start?"**
→ [Troubleshooting - /start Not Working](./PROJECT_KNOWLEDGE_BASE.md#2-start-command-not-working)

**"Как написать плагин?"**
→ [Skills - ElizaOS Plugin Development](./SKILLS_REGISTRY.md#1-elizaos-plugin-development)

**"Как добавить новую команду?"**
→ [Telegram Bot System](./PROJECT_KNOWLEDGE_BASE.md#telegram-bot-system)

**"409 Conflict ошибка!"**
→ [Troubleshooting - 409 Conflict](./PROJECT_KNOWLEDGE_BASE.md#1-409-conflict-error)

**"Как написать тест?"**
→ [Testing Infrastructure](./PROJECT_KNOWLEDGE_BASE.md#testing-infrastructure)

**"Как работают события?"**
→ [Event System](./PROJECT_KNOWLEDGE_BASE.md#2-event-system)

**"Проблемы с памятью/утечки?"**
→ [Pattern 5: Memory Leaks](./SKILLS_REGISTRY.md#pattern-5-memory-leaks)

### Поиск по компонентам

| Компонент | Где найти |
|-----------|-----------|
| Character Config | [Core Components - Character](./PROJECT_KNOWLEDGE_BASE.md#1-character-configuration-srccharacterts) |
| Plugin System | [Core Components - Plugin System](./PROJECT_KNOWLEDGE_BASE.md#3-plugin-system) |
| Telegram Integration | [Telegram Bot System](./PROJECT_KNOWLEDGE_BASE.md#telegram-bot-system) |
| Testing System | [Testing Infrastructure](./PROJECT_KNOWLEDGE_BASE.md#testing-infrastructure) |
| Dev Server | [Development Workflow](./PROJECT_KNOWLEDGE_BASE.md#development-workflow) |
| Scripts | [Scripts Reference](./PROJECT_KNOWLEDGE_BASE.md#scripts-reference) |

---

## 📊 Documentation Stats

| Документ | Размер | Последнее обновление | Статус |
|----------|---------|---------------------|--------|
| PROJECT_KNOWLEDGE_BASE.md | ~15KB | 2025-01-12 | ✅ Complete |
| SKILLS_REGISTRY.md | ~12KB | 2025-01-12 | ✅ Complete |
| tests/README.md | ~8KB | 2025-01-12 | ✅ Complete |
| CLAUDE.md | ~3KB | 2024-XX-XX | ✅ Active |

**Total Documentation:** ~38KB (38,000+ words)

---

## 🎯 Documentation Principles

### 1. Learning-Oriented
Документация должна учить, а не просто описывать.

**Bad:**
> `TelegramService.start()` starts the service.

**Good:**
> `TelegramService.start()` initializes the Telegram bot by calling `initializeBot()`, which sets up command handlers and starts long polling with `bot.launch()`. Only ONE instance can call `bot.launch()` globally, otherwise you'll get a 409 Conflict error.

### 2. Problem-First
Начинать с проблемы, которую решаем.

**Structure:**
```markdown
## Problem: Bot Not Responding to Commands

**Symptoms:**
- Commands work sometimes
- No errors in logs
- Regular messages work fine

**Root Cause:**
Event handlers registered after service initialization.

**Solution:**
Ensure plugin order puts handlers before emitters.
```

### 3. Example-Driven
Показывать код, а не только текст.

**Include:**
- ✅ Code snippets
- ✅ Command examples
- ✅ Error messages
- ✅ Terminal output
- ✅ File structure

### 4. Progressive Disclosure
От простого к сложному.

**Levels:**
1. **Overview** - High-level summary
2. **Getting Started** - Minimal steps to run
3. **Deep Dive** - Architecture and internals
4. **Advanced** - Optimization and edge cases
5. **Reference** - Complete API docs

### 5. Keep Updated
Документация устаревает быстро.

**When to Update:**
- ✅ После каждого PR
- ✅ При изменении архитектуры
- ✅ При добавлении features
- ✅ При обнаружении новых проблем
- ✅ Раз в месяц - review & update

---

## 🤝 Contributing to Docs

### Making Changes

1. **Find What to Update:**
   - Outdated information
   - Missing explanations
   - Unclear sections
   - New features not documented

2. **Make Changes:**
   ```bash
   # Edit documentation
   vim docs/PROJECT_KNOWLEDGE_BASE.md

   # Preview changes (if using Markdown viewer)
   open docs/PROJECT_KNOWLEDGE_BASE.md
   ```

3. **Follow Style:**
   - Use H2 (##) for major sections
   - Use H3 (###) for subsections
   - Use code blocks with language
   - Use tables for structured data
   - Add emojis for visual cues (🎯 ✅ ❌ ⚠️)

4. **Test Examples:**
   - Run all code examples
   - Verify commands work
   - Check links are valid

5. **Commit:**
   ```bash
   git add docs/
   git commit -m "docs: update troubleshooting guide with new 409 fix"
   ```

### Documentation Checklist

Before committing docs:

- [ ] All code examples tested and working
- [ ] All links checked and valid
- [ ] Spelling and grammar checked
- [ ] Follows style guide (H2/H3, emojis, code blocks)
- [ ] Updated "Last Updated" date
- [ ] Added to appropriate section in README.md
- [ ] Cross-referenced with related docs

---

## 📞 Getting Help

### Where to Ask

**Technical Questions:**
- Check [Troubleshooting Guide](./PROJECT_KNOWLEDGE_BASE.md#troubleshooting-guide) first
- Search [Problem-Solving Patterns](./SKILLS_REGISTRY.md#problem-solving-patterns)
- Create Issue on GitHub

**Documentation Issues:**
- Unclear explanation? → Open Issue
- Missing information? → Open PR with addition
- Outdated content? → Open PR with update

**Community:**
- ElizaOS Discord
- GitHub Discussions
- Team chat

### How to Ask

**Bad Question:**
> "Bot not working, help!"

**Good Question:**
> "I'm getting 409 Conflict when running `bun start`. I checked:
> - Only 1 elizaos process running (verified with `ps aux`)
> - Logs show 'Bot info' successfully
> - Error appears 10 seconds after startup
>
> Logs: [paste relevant logs]
> What could be causing this?"

**Template:**
```markdown
## Problem Description
[What's not working]

## Expected Behavior
[What should happen]

## Actual Behavior
[What's actually happening]

## Steps to Reproduce
1. [Step 1]
2. [Step 2]
3. [Step 3]

## Environment
- OS: [macOS/Linux/Windows]
- Bun version: [1.x.x]
- ElizaOS version: [1.6.4]
- Branch: [main/feature-x]

## Logs/Screenshots
[Paste relevant logs or add screenshots]

## What I've Tried
- [Attempt 1 and result]
- [Attempt 2 and result]
```

---

## 🎉 You're All Set!

Эта документация создана чтобы сделать разработку Vibee максимально эффективной и приятной.

**Next Steps:**
1. Выбери learning path выше
2. Открой соответствующий документ
3. Начни изучение и практику

**Remember:**
- 📖 Documentation is your friend
- 🧪 Tests are your safety net
- 🐛 Bugs are learning opportunities
- 🤝 Community is here to help

**Happy Coding! 🚀**

---

**Maintained by:** Vibee Development Team
**Last Updated:** 2025-01-12
**Next Review:** 2025-02-12

_"Documentation is a love letter that you write to your future self."_ - Damian Conway
