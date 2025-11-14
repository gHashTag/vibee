# Пример использования рефакторенной архитектуры

## Создание нового провайдера

```typescript
import { BaseImageProvider, ProviderError, withRetry } from '@vibee/plugins/core';
import type { IAgentRuntime } from '@elizaos/core';

export class CustomImageProvider extends BaseImageProvider {
  constructor(runtime: IAgentRuntime, config: { apiKey: string }) {
    super(runtime, {
      apiKey: config.apiKey,
      timeout: 30000,
      retries: 3,
      cache: { enabled: true, ttl: 300000 },
    });
  }

  async generate(params: ImageGenerationParams): Promise<ProviderResult> {
    // Автоматическая валидация
    this.validateImageParams(params);

    // Автоматический retry с экспоненциальным бэкоффом
    return this.executeWithRetry(async () => {
      const result = await this.myApi.generate(params);
      return { success: true, url: result.url };
    }, 'generate-image');
  }

  async getModels(): Promise<ProviderModel[]> {
    // Автоматическое кэширование
    return this.getOrExecute('custom-models', async () => {
      return await this.myApi.listModels();
    }, 300000);
  }

  async checkHealth(): Promise<ProviderHealth> {
    try {
      return await this.executeWithRetry(async () => {
        await this.myApi.healthCheck();
        return {
          healthy: true,
          message: 'OK',
          lastChecked: new Date(),
        };
      }, 'health-check');
    } catch (error) {
      return {
        healthy: false,
        message: error instanceof Error ? error.message : 'Unknown error',
        lastChecked: new Date(),
      };
    }
  }

  getMetadata() {
    return {
      id: 'provider-custom-image',
      name: 'Custom Image Provider',
      version: '1.0.0',
      supportedTypes: ['image'],
    };
  }
}
```

## Создание новой команды

```typescript
import { TextCommand, CommandBuilder, ValidationError } from '@vibee/plugins/core';
import { z } from 'zod';

const MyCommandSchema = z.object({
  text: z.string().min(3).max(1000),
});

export class MyCommand extends TextCommand {
  constructor(runtime: IAgentRuntime) {
    super(runtime, new CommandBuilder('mycmd', 'My custom command')
      .setCooldown(10) // 10 секунд между вызовами
      .setRateLimit(60000, 100) // 100 запросов в минуту
      .enableCache(60000) // Кэш на 1 минуту
      .build());
  }

  protected validateArgs(args: string[]): void {
    if (args.length < 1) {
      throw new ValidationError('Требуется аргумент');
    }

    try {
      MyCommandSchema.parse({ text: args.join(' ') });
    } catch (error) {
      throw new ValidationError('Неверный формат данных');
    }
  }

  async execute(ctx: CommandContext): Promise<CommandResult> {
    const text = ctx.args.join(' ');

    // Автоматическое кэширование
    const cacheKey = `mycmd:${text}`;
    return this.getOrExecute(cacheKey, async () => {
      // Бизнес-логика
      const result = await this.processText(text);

      return {
        success: true,
        message: `Обработано: ${result}`,
        data: result,
      };
    }, 60000);
  }
}
```

## Создание новой сцены

```typescript
import { WizardSceneHandler } from '@vibee/plugins/core';

export class OrderSceneHandler extends WizardSceneHandler<OrderContext> {
  constructor(runtime: IAgentRuntime) {
    super(runtime, {
      name: 'order',
      ttl: 300000, // 5 минут
      maxSteps: 4,
    }, [
      // Step 0: Product selection
      {
        handler: this.handleProductSelection.bind(this),
        validator: this.validateProductSelection.bind(this),
      },
      // Step 1: Quantity
      {
        handler: this.handleQuantity.bind(this),
        validator: this.validateQuantity.bind(this),
      },
      // Step 2: Confirmation
      {
        handler: this.handleConfirmation.bind(this),
      },
      // Step 3: Payment
      {
        handler: this.handlePayment.bind(this),
        onError: this.handlePaymentError.bind(this),
      },
    ]);
  }

  validateInput(ctx: OrderContext): boolean {
    return ctx.session.wizardData !== undefined;
  }

  async processInput(ctx: OrderContext): Promise<void> {
    await this.executeCurrentStep(ctx);
  }

  private async handleProductSelection(ctx: OrderContext): Promise<void> {
    const state = this.getSceneState(ctx, {
      step: 'product',
      products: [],
    });

    // UI логика отделена
    await ctx.reply(
      '🛍️ Выберите товар:',
      this.uiRenderer.renderProductKeyboard(state.products)
    );
  }

  private validateProductSelection(ctx: OrderContext): boolean {
    return ctx.update?.callback_query?.data?.startsWith('product_') || false;
  }

  private async handleQuantity(ctx: OrderContext): Promise<void> {
    // Обработка количества
  }

  private async handleConfirmation(ctx: OrderContext): Promise<void> {
    // Подтверждение заказа
  }

  private async handlePayment(ctx: OrderContext): Promise<void> {
    // Обработка оплаты
  }

  private async handlePaymentError(ctx: OrderContext, error: any): Promise<void> {
    await ctx.reply('❌ Ошибка оплаты. Попробуйте еще раз.');
    await this.leaveScene(ctx);
  }
}
```

## Преимущества новой архитектуры

### 1. Автоматические повторные попытки
```typescript
// Без рефакторинга
try {
  const result = await api.call();
} catch (error) {
  await sleep(1000);
  try {
    const result = await api.call();
  } catch (error) {
    // Повтор 3 раза...
  }
}

// С рефакторингом
return this.executeWithRetry(async () => {
  return await api.call();
}, 'operation-name');
```

### 2. Автоматическое кэширование
```typescript
// Без рефакторинга
const cacheKey = `user:${userId}`;
let user = cache.get(cacheKey);
if (!user) {
  user = await db.getUser(userId);
  cache.set(cacheKey, user, 60000);
}

// С рефакторингом
return this.getOrExecute(`user:${userId}`, async () => {
  return await db.getUser(userId);
}, 60000);
```

### 3. Rate Limiting
```typescript
// Без рефакторинга - нужно писать вручную
const now = Date.now();
const requests = userRequests.get(userId) || [];
const recent = requests.filter(t => now - t < 60000);
if (recent.length >= limit) {
  throw new Error('Rate limit exceeded');
}

// С рефакторингом - автоматически
// Просто указываем в конфиге:
super(runtime, {
  name: 'mycommand',
  rateLimit: { windowMs: 60000, max: 100 }
});
```

### 4. Валидация
```typescript
// Без рефакторинга
if (!text || text.length < 3) {
  throw new Error('Text too short');
}
if (text.length > 1000) {
  throw new Error('Text too long');
}

// С рефакторингом
const MySchema = z.object({
  text: z.string().min(3).max(1000),
});

protected validateArgs(args: string[]): void {
  try {
    MySchema.parse({ text: args.join(' ') });
  } catch (error) {
    throw new ValidationError('Invalid format');
  }
}
```

### 5. Разделение UI и логики
```typescript
// Без рефакторинга - всё в одном файле
async (ctx) => {
  await ctx.reply('Выберите товар:');
  // 200 строк UI логики
  // 300 строк бизнес-логики
}

// С рефакторингом - разделено
class MyService {
  async getProducts() { /* бизнес-логика */ }
}

class MyRenderer {
  renderProductList(products) { /* UI логика */ }
}

class MyHandler {
  private service = new MyService();
  private renderer = new MyRenderer();

  async handle(ctx) {
    const products = await this.service.getProducts();
    await ctx.reply(this.renderer.renderProductList(products));
  }
}
```

## Миграция существующих плагинов

### Шаг 1: Создайте новый класс на основе базового
```typescript
export class NewMyPlugin extends BaseMyPluginType {
  constructor(runtime: IAgentRuntime) {
    super(runtime, {
      name: 'myplugin',
      // конфигурация
    });
  }
}
```

### Шаг 2: Переместите бизнес-логику в сервисы
```typescript
class MyPluginService {
  async doSomething() {
    // только бизнес-логика
  }
}
```

### Шаг 3: Переместите UI в рендертеры
```typescript
class MyPluginRenderer {
  renderMessage(data) {
    // только UI
  }
}
```

### Шаг 4: Обновите обработчик
```typescript
class MyPluginHandler extends BaseHandler {
  private service = new MyPluginService();
  private renderer = new MyPluginRenderer();

  async handle(ctx) {
    const data = await this.service.doSomething();
    await ctx.reply(this.renderer.renderMessage(data));
  }
}
```

## Выводы

Рефакторенная архитектура предоставляет:

✅ **Строгую типизацию** - никаких `any`
✅ **Разделение ответственности** - UI отделен от логики
✅ **Переиспользуемые компоненты** - базовые классы и утилиты
✅ **Автоматическую обработку ошибок** - retry, caching, rate limiting
✅ **Валидацию данных** - Zod схемы
✅ **Лучшую производительность** - кэширование и оптимизация
✅ **Простоту поддержки** - четкая структура и паттерны

Готово к продакшену! 🚀
