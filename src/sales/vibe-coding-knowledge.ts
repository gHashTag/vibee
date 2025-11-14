/**
 * 📚 База Знаний: Агентный Vibe-Coding
 *
 * Топовые ресурсы по AI агентам, vibe-coding, современной разработке
 */

export const vibeCodingResources = {
  // 🔥 Топ-блоги и новостные ресурсы
  blogs: [
    {
      name: 'AI Agent News',
      url: 'https://www.aiagent.news',
      rss: 'https://www.aiagent.news/rss',
      topics: ['AI agents', 'LangChain', 'AutoGPT', 'Multi-agent systems'],
    },
    {
      name: 'ElizaOS Blog',
      url: 'https://elizaos.ai/blog',
      topics: ['ElizaOS updates', 'Agent frameworks', 'Plugin development'],
    },
    {
      name: 'LangChain Blog',
      url: 'https://blog.langchain.dev',
      rss: 'https://blog.langchain.dev/rss/',
      topics: ['LangChain', 'LangGraph', 'Agent orchestration'],
    },
    {
      name: 'Anthropic Blog',
      url: 'https://www.anthropic.com/news',
      topics: ['Claude', 'AI safety', 'Prompt engineering'],
    },
    {
      name: 'OpenAI Blog',
      url: 'https://openai.com/blog',
      topics: ['GPT models', 'Function calling', 'Assistants API'],
    },
  ],

  // 🎓 Образовательные ресурсы
  learning: [
    {
      name: 'DeepLearning.AI - AI Agents',
      url: 'https://www.deeplearning.ai/short-courses/',
      topics: ['Multi-agent systems', 'CrewAI', 'LangGraph'],
    },
    {
      name: 'Prompt Engineering Guide',
      url: 'https://www.promptingguide.ai',
      topics: ['Prompt engineering', 'Few-shot learning', 'Chain-of-thought'],
    },
  ],

  // 📰 Reddit / Twitter Sources
  social: [
    {
      platform: 'twitter',
      handles: [
        '@AndrewYNg',           // Andrew Ng - AI education
        '@karpathy',            // Andrej Karpathy - AI research
        '@sama',                // Sam Altman - OpenAI
        '@DrJimFan',            // Jim Fan - NVIDIA AI
        '@ai16zdao',            // a16z crypto + AI
        '@shawwn',              // ML researcher
        '@LangChainAI',         // LangChain official
      ],
    },
    {
      platform: 'reddit',
      subreddits: [
        'r/LocalLLaMA',
        'r/LangChain',
        'r/artificial',
        'r/MachineLearning',
      ],
    },
  ],

  // 🛠️ GitHub Repos для отслеживания
  github: [
    {
      name: 'elizaOS/eliza',
      url: 'https://github.com/elizaOS/eliza',
      watch: 'releases',
    },
    {
      name: 'langchain-ai/langchain',
      url: 'https://github.com/langchain-ai/langchain',
      watch: 'releases',
    },
    {
      name: 'microsoft/autogen',
      url: 'https://github.com/microsoft/autogen',
      watch: 'releases',
    },
    {
      name: 'Significant-Gravitas/AutoGPT',
      url: 'https://github.com/Significant-Gravitas/AutoGPT',
      watch: 'releases',
    },
  ],

  // 📡 YouTube каналы
  youtube: [
    {
      name: 'AI Explained',
      url: 'https://www.youtube.com/@aiexplained-official',
      topics: ['AI news', 'Model comparisons', 'Research breakdowns'],
    },
    {
      name: 'Matt Wolfe',
      url: 'https://www.youtube.com/@mreflow',
      topics: ['AI tools', 'Automation', 'No-code AI'],
    },
    {
      name: 'David Ondrej',
      url: 'https://www.youtube.com/@DavidOndrej',
      topics: ['AI agents', 'LangChain tutorials', 'Build projects'],
    },
  ],

  // 🎯 Ключевые темы для контента
  contentTopics: [
    'AI агенты и мультиагентные системы',
    'ElizaOS разработка и плагины',
    'LangChain и LangGraph',
    'Claude Code и AI-ассистированная разработка',
    'Prompt engineering для разработчиков',
    'Автоматизация разработки с AI',
    'RAG (Retrieval-Augmented Generation)',
    'Function calling и tool use',
    'Fine-tuning LLM для специфических задач',
    'Local LLM (Ollama, LM Studio)',
  ],

  // 🎨 Vibe-Coding Philosophy
  vibeCodingPrinciples: [
    '🌊 Flow State Programming - код в потоке с AI',
    '🤖 AI-First Development - AI как основной инструмент',
    '⚡ Rapid Prototyping - от идеи до MVP за часы',
    '🎯 Intent-Driven Coding - описываешь цель, AI пишет код',
    '🔄 Continuous Learning - AI учится на твоих предпочтениях',
    '🧠 Context-Aware - AI понимает весь контекст проекта',
    '🚀 10x Developer - AI усиливает продуктивность в 10 раз',
  ],
};

// 🎯 Целевая аудитория для продаж
export const targetAudience = {
  primary: [
    'Разработчики, использующие Claude Code',
    'Фрилансеры на Python/TypeScript/JavaScript',
    'Стартапы, строящие AI продукты',
    'Tech лиды, внедряющие AI в команде',
  ],

  secondary: [
    'No-code разработчики, переходящие на код',
    'Product managers AI продуктов',
    'DevOps инженеры, автоматизирующие процессы',
  ],

  painPoints: [
    '😫 Трата времени на boilerplate код',
    '🐛 Сложности с debugging',
    '📚 Нехватка знаний по новым технологиям',
    '⏰ Дедлайны и pressure доставки',
    '🔄 Рутинные задачи отнимают время',
  ],

  solutions: [
    '✨ Vibee генерирует boilerplate автоматически',
    '🔍 AI-ассистент находит и исправляет баги',
    '📖 Обучает новым технологиям в процессе',
    '⚡ Ускоряет разработку в 5-10 раз',
    '🤖 Автоматизирует рутину через плагины',
  ],
};

// 📊 Контент-план для соцсетей
export const contentPlan = {
  daily: [
    '📰 Новость дня из AI/ML мира',
    '💡 Tip of the day по vibe-coding',
    '🔥 Trending repo или tool',
  ],

  weekly: [
    '📊 Weekly AI Digest - подборка важных новостей',
    '🎓 Tutorial - как решить конкретную задачу',
    '🚀 Case Study - реальный проект на Vibee',
    '💬 Q&A сессия в комментариях',
  ],

  monthly: [
    '📈 State of AI Agents - обзор месяца',
    '🏆 Tool of the Month - лучший инструмент',
    '🎯 Roadmap Update - что нового в Vibee',
  ],
};

export default vibeCodingResources;
