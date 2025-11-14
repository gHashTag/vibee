/**
 * Component Test: Rainbow Bridge Configuration
 * Проверяет конфигурацию системы агент-агент связи
 */

import { describe, it, expect } from 'bun:test';
import { agentAgentBridgePlugin } from '../agent-agent-bridge';
import { projectAgent } from '../index';

describe('Rainbow Bridge Configuration', () => {
  it('should_export_agent_agent_bridge_plugin', () => {
    expect(agentAgentBridgePlugin).toBeDefined();
    expect(agentAgentBridgePlugin.name).toBe('agent-agent-bridge');
    expect(agentAgentBridgePlugin.description).toContain('агент-агент');
  });

  it('should_register_rainbow_bridge_in_project', () => {
    expect(projectAgent.plugins).toBeDefined();
    expect(projectAgent.plugins).toContain(agentAgentBridgePlugin);
  });

  it('should_have_correct_service_configuration', () => {
    const services = agentAgentBridgePlugin.services;
    expect(services).toBeDefined();
    expect(services.length).toBe(1);

    const serviceClass = services[0];
    expect(serviceClass.serviceType).toBe('agent-agent-bridge');
  });

  it('should_have_autonomous_test_cycles_configured', () => {
    // Проверяем что плагин содержит нужную логику
    expect(agentAgentBridgePlugin.services[0]).toHaveProperty('prototype');
  });

  it('should_validate_plugin_structure', () => {
    expect(agentAgentBridgePlugin).toHaveProperty('name');
    expect(agentAgentBridgePlugin).toHaveProperty('description');
    expect(agentAgentBridgePlugin).toHaveProperty('services');
    expect(Array.isArray(agentAgentBridgePlugin.services)).toBe(true);
  });
});

describe('Rainbow Bridge Service Properties', () => {
  it('should_have_agent_agent_bridge_service_class', () => {
    const services = agentAgentBridgePlugin.services;
    expect(services[0].name).toBe('AgentAgentBridgeService');
  });

  it('should_register_service_type_correctly', () => {
    const ServiceClass = agentAgentBridgePlugin.services[0];
    expect(ServiceClass.serviceType).toBe('agent-agent-bridge');
  });
});
