import { type ReactNode, createContext, useContext } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { EventBusContext } from '../shared/hooks/use-event-bus';
import type { ServiceContainer } from './bootstrap';

/**
 * Provider tree — injects the service container into the React tree.
 *
 * Keeps the component tree clean: components access services via hooks,
 * never by importing singletons directly.
 */

// ---------------------------------------------------------------------------
// Service container context
// ---------------------------------------------------------------------------

const ServiceContainerContext = createContext<ServiceContainer | null>(null);

export function useServices(): ServiceContainer {
  const container = useContext(ServiceContainerContext);
  if (!container) {
    throw new Error('useServices must be used within AppProviders');
  }
  return container;
}

// ---------------------------------------------------------------------------
// Query client (singleton)
// ---------------------------------------------------------------------------

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 30_000,
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 1,
    },
  },
});

// ---------------------------------------------------------------------------
// Provider component
// ---------------------------------------------------------------------------

interface AppProvidersProps {
  services: ServiceContainer;
  children: ReactNode;
}

export function AppProviders({ services, children }: AppProvidersProps) {
  return (
    <ServiceContainerContext.Provider value={services}>
      <QueryClientProvider client={queryClient}>
        <EventBusContext.Provider value={services.eventBus}>
          {children}
        </EventBusContext.Provider>
      </QueryClientProvider>
    </ServiceContainerContext.Provider>
  );
}
