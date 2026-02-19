import { describe, it, expect, vi } from 'vitest';
import { PluginRegistry } from './plugin-registry';
import type { ProductPlugin } from './plugin-registry';

function createMockPlugin(overrides?: Partial<ProductPlugin>): ProductPlugin {
  return {
    id: 'test-plugin',
    categories: ['credit_card'],
    display: {
      name: 'Test Plugin',
      description: 'A test plugin',
      icon: '🧪',
      color: '#000',
    },
    capabilities: ['make_payment', 'view_statements'],
    components: {
      SummaryCard: () => null,
      DetailView: () => null,
    },
    routes: [],
    ...overrides,
  };
}

describe('PluginRegistry', () => {
  it('should register and retrieve a plugin', () => {
    const registry = new PluginRegistry();
    const plugin = createMockPlugin();

    registry.register(plugin);

    expect(registry.getPlugin('test-plugin')).toBe(plugin);
  });

  it('should throw on duplicate registration', () => {
    const registry = new PluginRegistry();
    const plugin = createMockPlugin();

    registry.register(plugin);

    expect(() => registry.register(plugin)).toThrow('already registered');
  });

  it('should find plugin by category', () => {
    const registry = new PluginRegistry();
    const plugin = createMockPlugin();

    registry.register(plugin);

    expect(registry.getPluginForCategory('credit_card')).toBe(plugin);
    expect(registry.getPluginForCategory('bnpl')).toBeUndefined();
  });

  it('should return capabilities for a category', () => {
    const registry = new PluginRegistry();
    const plugin = createMockPlugin();

    registry.register(plugin);

    expect(registry.getCapabilitiesForCategory('credit_card')).toEqual([
      'make_payment',
      'view_statements',
    ]);
  });

  it('should unregister a plugin', () => {
    const registry = new PluginRegistry();
    const plugin = createMockPlugin();

    registry.register(plugin);
    registry.unregister('test-plugin');

    expect(registry.getPlugin('test-plugin')).toBeUndefined();
    expect(registry.getPluginForCategory('credit_card')).toBeUndefined();
  });

  it('should list all plugins', () => {
    const registry = new PluginRegistry();
    const plugin1 = createMockPlugin({ id: 'plugin-1', categories: ['credit_card'] });
    const plugin2 = createMockPlugin({ id: 'plugin-2', categories: ['bnpl'] });

    registry.register(plugin1);
    registry.register(plugin2);

    expect(registry.getAllPlugins()).toHaveLength(2);
  });

  it('should aggregate all routes from all plugins', () => {
    const registry = new PluginRegistry();
    const plugin1 = createMockPlugin({
      id: 'plugin-1',
      routes: [{ path: '/a', component: () => null, label: 'A' }],
    });
    const plugin2 = createMockPlugin({
      id: 'plugin-2',
      categories: ['bnpl'],
      routes: [{ path: '/b', component: () => null, label: 'B' }],
    });

    registry.register(plugin1);
    registry.register(plugin2);

    expect(registry.getAllRoutes()).toHaveLength(2);
  });

  it('should call onActivate for all plugins', async () => {
    const registry = new PluginRegistry();
    const onActivate = vi.fn();
    const plugin = createMockPlugin({ onActivate });

    registry.register(plugin);
    await registry.activateAll();

    expect(onActivate).toHaveBeenCalledTimes(1);
  });

  it('should handle activation errors gracefully', async () => {
    const registry = new PluginRegistry();
    const plugin = createMockPlugin({
      onActivate: async () => { throw new Error('activation failed'); },
    });

    registry.register(plugin);

    // Should not throw — uses Promise.allSettled
    await expect(registry.activateAll()).resolves.toBeUndefined();
  });
});
