import { type ComponentType, type ReactNode, Suspense } from 'react';
import type { ProductCapability, BaseProduct } from '../../core/types/product';
import type { PluginRegistry } from '../registry/plugin-registry';

/**
 * Capability-based rendering system.
 *
 * Instead of hardcoding product-specific UI, the shell app asks:
 * "Does this product support capability X? If so, render the component
 *  registered for that capability."
 *
 * This inverts the traditional product-type switch statement:
 * - Old: if (product.type === 'credit_card') { render <CreditCardPayment /> }
 * - New: if (product.capabilities.has('make_payment')) { render <registry.getComponent('make_payment')> }
 *
 * Benefits:
 * - New products get capabilities automatically
 * - UI adapts to what the product can DO, not what it IS
 * - Graceful degradation when a capability isn't available
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CapabilityRendererProps {
  product: BaseProduct;
  capability: ProductCapability;
  registry: PluginRegistry;
  fallback?: ReactNode;
  loadingFallback?: ReactNode;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CapabilityRenderer({
  product,
  capability,
  registry,
  fallback = null,
  loadingFallback = null,
}: CapabilityRendererProps): ReactNode {
  // Check if the product supports this capability
  if (!product.capabilities.has(capability)) {
    return fallback;
  }

  // Find the plugin and its component for this capability
  const plugin = registry.getPluginForCategory(product.category);
  if (!plugin) return fallback;

  const Component = plugin.components.capabilityComponents?.[capability];
  if (!Component) return fallback;

  return (
    <Suspense fallback={loadingFallback}>
      <Component productId={product.id} />
    </Suspense>
  );
}

// ---------------------------------------------------------------------------
// Hook for capability checks
// ---------------------------------------------------------------------------

export function useProductCapabilities(
  product: BaseProduct | undefined,
  registry: PluginRegistry,
) {
  if (!product) {
    return {
      has: (_cap: ProductCapability) => false,
      getComponent: (_cap: ProductCapability) => null as ComponentType<{ productId: string }> | null,
      availableCapabilities: [] as ProductCapability[],
    };
  }

  const plugin = registry.getPluginForCategory(product.category);

  return {
    has: (cap: ProductCapability) => product.capabilities.has(cap),

    getComponent: (cap: ProductCapability) => {
      if (!product.capabilities.has(cap)) return null;
      return plugin?.components.capabilityComponents?.[cap] ?? null;
    },

    availableCapabilities: Array.from(product.capabilities),
  };
}
