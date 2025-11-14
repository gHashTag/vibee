/**
 * Prompt Assistant
 * Помогает пользователям создавать лучшие промпты
 */

interface PromptExample {
  title: string;
  prompt: string;
  category: string;
}

export class PromptAssistant {
  private static examples: PromptExample[] = [
    {
      title: '🌅 Пейзаж',
      prompt: 'Красивый закат над морем, золотой час, мягкие облака, фотореалистично, 4K',
      category: 'landscape'
    },
    {
      title: '👤 Портрет',
      prompt: 'Портрет девушки, студийное освещение, мягкие тени, профессиональная фотография',
      category: 'portrait'
    },
    {
      title: '🦸‍♂️ Герой',
      prompt: 'Супергерой в полете, динамичная поза, комикс стиль, яркие цвета',
      category: 'hero'
    },
    {
      title: '🏙️ Архитектура',
      prompt: 'Современное здание, минимализм, стекло и бетон, дневное освещение',
      category: 'architecture'
    },
    {
      title: '🎨 Арт',
      prompt: 'Абстрактная композиция, яркие цвета, акрил на холсте, текстуры',
      category: 'art'
    },
    {
      title: '🌃 Ночной город',
      prompt: 'Ночной город, неоновые огни, дождь на асфальте, отражения, кинематографично',
      category: 'city'
    }
  ];

  static async suggestImprovements(userPrompt: string): Promise<string[]> {
    const suggestions: string[] = [];

    // Анализируем промпт
    if (userPrompt.length < 20) {
      suggestions.push('💡 Добавьте больше деталей для лучшего результата');
    }

    if (!/style|стиль/i.test(userPrompt)) {
      suggestions.push('🎨 Укажите стиль: "фотореалистично", "акварель", "кино", "комикс"');
    }

    if (!/lighting|освещение/i.test(userPrompt)) {
      suggestions.push('💡 Добавьте освещение: "мягкий свет", "золотой час", "драматичное освещение"');
    }

    if (!/quality|качество|4k|8k/i.test(userPrompt)) {
      suggestions.push('✨ Укажите качество: "высокое разрешение", "4K", "ультра детализировано"');
    }

    if (!/camera|камера|angle|ракурс/i.test(userPrompt)) {
      suggestions.push('📸 Добавьте ракурс: "крупный план", "общий план", "вид сверху", "снизу"');
    }

    if (!/color|цвет|palette/i.test(userPrompt)) {
      suggestions.push('🎨 Укажите палитру: "теплые тона", "холодные цвета", "монохром"');
    }

    return suggestions.slice(0, 3);
  }

  static async showExamples(ctx: any, category?: string): Promise<void> {
    const examples = category
      ? this.examples.filter(ex => ex.category === category)
      : this.examples;

    const examplesText = examples.slice(0, 3).map((ex, i) =>
      `${i + 1}. <b>${ex.title}</b>:\n<code>${ex.prompt}</code>\n`
    ).join('');

    await ctx.reply(
      `💡 <b>Примеры промптов${category ? ` (${category})` : ''}:</b>\n\n${examplesText}`,
      {
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            ...examples.slice(0, 3).map(ex => [
              { text: `Использовать: ${ex.title}`, callback_data: `use_example_${ex.title.toLowerCase().replace(' ', '_')}` }
            ]),
            [
              { text: '🎨 Другие примеры', callback_data: 'more_examples' },
              { text: '💡 Помощь с промптом', callback_data: 'prompt_help' }
            ]
          ]
        }
      }
    );
  }

  static enhancePrompt(userPrompt: string): string {
    let enhanced = userPrompt.trim();

    // Добавляем улучшения если их нет
    if (!/quality|resolution|4k/i.test(enhanced)) {
      enhanced += ', high quality, 4K resolution';
    }

    if (!/lighting|lighting/i.test(enhanced)) {
      enhanced += ', professional lighting';
    }

    if (!/detailed/i.test(enhanced)) {
      enhanced += ', highly detailed';
    }

    return enhanced;
  }

  static analyzePrompt(prompt: string): {
    score: number;
    issues: string[];
    suggestions: string[];
  } {
    const issues: string[] = [];
    const suggestions: string[] = [];
    let score = 50; // Базовый балл

    // Проверяем длину
    if (prompt.length < 10) {
      issues.push('Слишком короткий промпт');
      suggestions.push('Добавьте больше деталей');
    } else if (prompt.length > 100) {
      score += 10;
    } else {
      score += 5;
    }

    // Проверяем стиль
    if (!/style|art|realistic|photo/i.test(prompt)) {
      issues.push('Не указан стиль');
      suggestions.push('Добавьте описание стиля');
    } else {
      score += 10;
    }

    // Проверяем освещение
    if (!/light|lighting|bright|dark/i.test(prompt)) {
      issues.push('Не указано освещение');
      suggestions.push('Опишите освещение сцены');
    } else {
      score += 10;
    }

    // Проверяем качество
    if (!/quality|resolution|4k|detailed/i.test(prompt)) {
      issues.push('Не указано качество');
      suggestions.push('Добавьте требования к качеству');
    } else {
      score += 10;
    }

    // Проверяем эмоции/настроение
    if (!/mood|emotion|atmosphere|feeling/i.test(prompt)) {
      suggestions.push('Добавьте описание настроения');
    } else {
      score += 5;
    }

    // Проверяем композицию
    if (!/composition|angle|view|perspective/i.test(prompt)) {
      suggestions.push('Опишите композицию и ракурс');
    } else {
      score += 5;
    }

    // Ограничиваем балл
    score = Math.min(100, score);

    return { score, issues, suggestions };
  }
}
