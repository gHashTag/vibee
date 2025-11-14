/**
 * E2E Test: Rainbow Bridge Runtime Behavior
 * Проверяет работу системы агент-агент связи в рантайме
 */

import { describe, it, expect, beforeAll, afterAll } from 'bun:test';
import { createAgentRuntime } from '@elizaos/core';
import type { IAgentRuntime } from '@elizaos/core';

describe('Rainbow Bridge E2E Tests', () => {
  let runtime: IAgentRuntime;

  beforeAll(async () => {
    // Создаем тестовый рантайм
    runtime = await createAgentRuntime({
      tokens: {
        OPENROUTER_API_KEY: 'test-key',
      },
      secrets: {
        TELEGRAM_BOT_TOKEN: 'test-token',
        ADMIN_CHAT_ID: '144022504',
      },
    });
  });

  afterAll(async () => {
    if (runtime) {
      await runtime.close();
    }
  });

  it('should_initialize_rainbow_bridge_service', async () => {
    const service = runtime.getService('agent-agent-bridge');
    expect(service).toBeDefined();
  });

  it('should_register_agent_agent_bridge_plugin', async () => {
    // Проверяем что плагин зарегистрирован
    const services = runtime.getServices();
    const hasAgentAgentBridge = services.some(s => s.serviceType === 'agent-agent-bridge');
    expect(hasAgentAgentBridge).toBe(true);
  });

  it('should_handle_self_message_processing', async () => {
    const service = runtime.getService('agent-agent-bridge') as any;

    // Создаем мок-сообщение от себя
    const selfMessage = {
      from: { id: 123456 },
      text: 'SELF_TEST: Test message',
      chat: { id: 144022504 },
    };

    // Обрабатываем сообщение
    await expect(
      service.handleIncomingMessage(runtime, selfMessage)
    ).resolves.not.toThrow();
  });

  it('should_generate_test_messages', async () => {
    const service = runtime.getService('agent-agent-bridge') as any;

    // Генерируем тестовое сообщение
    const testMessage = service.generateTestMessage();
    expect(testMessage).toBeDefined();
    expect(typeof testMessage).toBe('string');
    expect(testMessage.length).toBeGreaterThan(0);
  });

  it('should_analyze_test_results', async () => {
    const service = runtime.getService('agent-agent-bridge') as any;

    // Анализируем результат тестирования
    const analysis = await service.analyzeTestResult(
      runtime,
      'Test message',
      { message_id: 1 }
    );

    expect(analysis).toBeDefined();
    expect(typeof analysis).toBe('string');
    expect(analysis).toContain('Test:');
    expect(analysis).toContain('Time:');
  });

  it('should_validate_autonomous_test_cycle_structure', async () => {
    const service = runtime.getService('agent-agent-bridge') as any;

    // Проверяем структуру автономного цикла
    expect(service.isProcessing).toBeDefined();
    expect(service.testCounter).toBeDefined();
    expect(typeof service.isProcessing).toBe('boolean');
    expect(typeof service.testCounter).toBe('number');
  });

  it('should_validate_chat_id_configuration', async () => {
    const service = runtime.getService('agent-agent-bridge') as any;

    // Проверяем что CHAT_ID настроен
    expect(service.SELF_CHAT_ID).toBeDefined();
    expect(service.SELF_CHAT_ID).toBe('144022504');
  });

  it('should_have_message_handling_capabilities', async () => {
    const service = runtime.getService('agent-agent-bridge') as any;

    // Проверяем методы обработки сообщений
    expect(service.handleIncomingMessage).toBeDefined();
    expect(service.processSelfMessage).toBeDefined();
    expect(service.sendSelfMessage).toBeDefined();
  });

  it('should_validate_feedback_system', async () => {
    const service = runtime.getService('agent-agent-bridge') as any;

    // Проверяем систему обратной связи
    expect(service.sendFeedbackMessage).toBeDefined();
  });

  it('should_validate_service_lifecycle_methods', async () => {
    const service = runtime.getService('agent-agent-bridge') as any;

    // Проверяем методы жизненного цикла
    expect(service.stop).toBeDefined();
    expect(typeof service.stop).toBe('function');
  });
});

describe('Rainbow Bridge Service Integration', () => {
  let runtime: IAgentRuntime;

  beforeAll(async () => {
    runtime = await createAgentRuntime({
      tokens: {
        OPENROUTER_API_KEY: 'test-key',
      },
      secrets: {
        TELEGRAM_BOT_TOKEN: 'test-token',
        ADMIN_CHAT_ID: '144022504',
      },
    });
  });

  afterAll(async () => {
    if (runtime) {
      await runtime.close();
    }
  });

  it('should_properly_integrate_with_runtime', async () => {
    // Проверяем интеграцию с рантаймом
    const service = runtime.getService('agent-agent-bridge');
    expect(service).toBeTruthy();

    // Проверяем что сервис инициализирован
    expect(service.runtime).toBeDefined();
    expect(service.runtime).toBe(runtime);
  });

  it('should_validate_multi_agent_compatibility', async () => {
    // Проверяем совместимость с мульти-агентной архитектурой
    const services = runtime.getServices();
    expect(services.length).toBeGreaterThan(0);

    // Убеждаемся что наш сервис среди них
    const agentAgentBridge = services.find(s => s.serviceType === 'agent-agent-bridge');
    expect(agentAgentBridge).toBeTruthy();
  });
});
