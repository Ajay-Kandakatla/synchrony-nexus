import type { ComponentType } from 'react';
import type { ProductCapability, ProductCategory } from '../../core/types/product';

/**
 * Plugin system — the extension point for new financial products.
 *
 * A plugin encapsulates everything needed to service a product type:
 * - UI components (cards, detail views, action sheets)
 * - Service adapters (API integration)
 * - Capabilities (what actions are available)
 * - Routes (navigation paths)
 * - AI hints (what insights are relevant)
 *
 * Adding a new product type (e.g., a new partner's credit card) is:
 * 1. Implement the ProductPlugin interface
 * 2. Register it at app startup
 * 3. Done — the shell app renders everything dynamically
 */

// ---------------------------------------------------------------------------
// Plugin interface
// ---------------------------------------------------------------------------

export interface ProductPlugin {
  /** Unique plugin identifier */
  readonly id: string;

  /** Product categories this plugin handles */
  readonly categories: readonly ProductCategory[];

  /** Display metadata */
  readonly display: PluginDisplayInfo;

  /** Capabilities this plugin enables */
  readonly capabilities: readonly ProductCapability[];

  /** UI components provided by this plugin */
  readonly components: PluginComponents;

  /** Route definitions */
  readonly routes: readonly PluginRoute[];

  /** AI engine hints — tells the AI what's relevant for this product */
  readonly aiHints?: PluginAIHints;

  /** Lifecycle hook — called when plugin is activated */
  onActivate?(): Promise<void>;

  /** Lifecycle hook — called when plugin is deactivated */
  onDeactivate?(): Promise<void>;
}

export interface PluginDisplayInfo {
  readonly name: string;
  readonly description: string;
  readonly icon: string;
  readonly color: string;
}

export interface PluginComponents {
  /** Summary card shown on the dashboard */
  readonly SummaryCard: ComponentType<{ productId: string }>;

  /** Full detail view */
  readonly DetailView: ComponentType<{ productId: string }>;

  /** Quick action sheet (bottom sheet on mobile) */
  readonly ActionSheet?: ComponentType<{ productId: string }>;

  /** Settings panel for this product */
  readonly SettingsPanel?: ComponentType<{ productId: string }>;

  /** Custom components keyed by capability */
  readonly capabilityComponents?: Readonly<
    Partial<Record<ProductCapability, ComponentType<{ productId: string }>>>
  >;
}

export interface PluginRoute {
  readonly path: string;
  readonly component: ComponentType<Record<string, unknown>>;
  readonly label: string;
  readonly icon?: string;
}

export interface PluginAIHints {
  /** Insight categories relevant to this product */
  readonly relevantInsightCategories: readonly string[];
  /** Custom prompts for the conversational assistant */
  readonly conversationPrompts?: readonly string[];
  /** Risk factors specific to this product */
  readonly riskFactors?: readonly string[];
}

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

export class PluginRegistry {
  private readonly plugins = new Map<string, ProductPlugin>();
  private readonly categoryIndex = new Map<ProductCategory, Set<string>>();

  register(plugin: ProductPlugin): void {
    if (this.plugins.has(plugin.id)) {
      throw new Error(`Plugin "${plugin.id}" is already registered`);
    }

    this.plugins.set(plugin.id, plugin);

    for (const category of plugin.categories) {
      if (!this.categoryIndex.has(category)) {
        this.categoryIndex.set(category, new Set());
      }
      this.categoryIndex.get(category)!.add(plugin.id);
    }
  }

  unregister(pluginId: string): void {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) return;

    for (const category of plugin.categories) {
      this.categoryIndex.get(category)?.delete(pluginId);
    }
    this.plugins.delete(pluginId);
  }

  getPlugin(pluginId: string): ProductPlugin | undefined {
    return this.plugins.get(pluginId);
  }

  getPluginForCategory(category: ProductCategory): ProductPlugin | undefined {
    const pluginIds = this.categoryIndex.get(category);
    if (!pluginIds || pluginIds.size === 0) return undefined;
    // Return the first registered plugin for this category
    const firstId = pluginIds.values().next().value;
    return firstId ? this.plugins.get(firstId) : undefined;
  }

  getAllPlugins(): readonly ProductPlugin[] {
    return Array.from(this.plugins.values());
  }

  getCapabilitiesForCategory(category: ProductCategory): readonly ProductCapability[] {
    const plugin = this.getPluginForCategory(category);
    return plugin?.capabilities ?? [];
  }

  getAllRoutes(): readonly PluginRoute[] {
    return Array.from(this.plugins.values()).flatMap((p) => p.routes);
  }

  async activateAll(): Promise<void> {
    const activations = Array.from(this.plugins.values())
      .filter((p) => p.onActivate)
      .map((p) => p.onActivate!());
    await Promise.allSettled(activations);
  }

  async deactivateAll(): Promise<void> {
    const deactivations = Array.from(this.plugins.values())
      .filter((p) => p.onDeactivate)
      .map((p) => p.onDeactivate!());
    await Promise.allSettled(deactivations);
  }
}

// ---------------------------------------------------------------------------
// Singleton (created at app bootstrap, injected via React context)
// ---------------------------------------------------------------------------

let globalRegistry: PluginRegistry | null = null;

export function getPluginRegistry(): PluginRegistry {
  if (!globalRegistry) {
    globalRegistry = new PluginRegistry();
  }
  return globalRegistry;
}
