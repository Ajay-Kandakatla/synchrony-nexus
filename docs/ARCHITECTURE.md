# Synchrony Nexus — Next-Generation Servicing Platform

## 1. Executive Vision

### The Problem: Servicing Is Broken

Financial servicing in 2026 is still reactive, fragmented, and anxiety-inducing.
Customers log in when something is already wrong — a payment is due, a charge
looks suspicious, a promotional rate is expiring. The experience is defensive:
check balance, make payment, leave. Every interaction carries stress.

This is the opposite of what modern financial technology should deliver.

### The Paradigm Shift: From Reactive Servicing to Financial Co-Piloting

**Synchrony Nexus** replaces the dashboard-centric model with an
**event-driven, AI-native servicing platform** that operates on three principles:

1. **Invisible servicing** — The best interaction is the one that never needs
   to happen. Autopay configured before a payment is missed. A promotional
   rate flagged weeks before it expires. A spending anomaly caught before it
   becomes a dispute.

2. **Proactive intelligence** — Every screen adapts to what the user needs
   right now, driven by predictive models. A user with high utilization sees
   debt reduction paths. A user with excellent payment history sees credit
   optimization opportunities. The UI is different for every person.

3. **Intent-driven interaction** — Instead of navigation trees, users express
   intent: "I want to pay less interest" → the system routes them to the
   optimal action across all their products. No menus. No hunting.

### Why This Matters for Synchrony

Synchrony operates across 500K+ partner locations with products spanning
credit cards, BNPL, CareCredit, savings, and installment loans. The current
marketplace connects consumers to products. **Nexus turns that connection into
a lifelong servicing relationship** that:

- Reduces delinquency through predictive intervention
- Increases product engagement through personalized insights
- Drives cross-sell through context-aware recommendations
- Differentiates from Capital One/Discover consolidation plays

---

## 2. Disruption Strategy

### Why servicing feels reactive and painful today

| Friction Point | Root Cause | Nexus Solution |
|---|---|---|
| Users only log in when anxious | No reason to engage proactively | AI generates positive insights (savings milestones, credit improvements) |
| Every product has a different dashboard | Product-centric architecture | Unified experience with capability-based rendering |
| Payments feel like punishment | Transactional framing | Reframe as progress toward financial goals |
| Disputes are adversarial | Multi-step manual process | AI-triaged automated dispute with real-time status |
| Promotional rates expire silently | Static notification system | Behavioral nudge framework with countdown + suggested actions |
| Credit utilization is invisible | Data buried in statements | Real-time utilization visualization with optimization paths |

### The New Model: Five Pillars

1. **AI Financial Co-Pilot** — Not a chatbot. A system component that
   generates insights, predicts risk, suggests actions, and adapts the UI.

2. **Event-Driven Servicing Engine** — Every state change (payment, balance
   update, risk change) is an event that flows through the system in real-time.
   No polling. No stale data.

3. **Proactive Credit Optimization** — Continuously analyzes the user's product
   portfolio and suggests restructuring, balance transfers, and payment
   strategies that reduce cost and improve credit health.

4. **Behavioral Nudge Framework** — Timed, context-aware interventions based
   on behavioral economics (loss aversion for expiring promos, goal gradient
   for payment progress, social proof for savings benchmarks).

5. **Smart Dispute Automation** — AI classifies dispute type, pre-fills forms,
   estimates resolution timeline, and provides real-time status tracking.
   Reduces dispute-to-resolution from weeks to days.

---

## 3. System Architecture Blueprint

### Architecture Principles

- **Feature-driven modules**: Each domain (accounts, payments, disputes,
  credit-health, ai-copilot, marketplace) is a self-contained module with
  its own types, hooks, components, services, and store.

- **Domain-driven design**: Core types model the business domain, not the
  API response shapes. Adapters transform API data into domain models.

- **Capability-based rendering**: UI components don't switch on product type.
  They ask "what can this product do?" and render accordingly.

- **Event-driven state**: Domain events flow through a typed event bus.
  Server-pushed events (WebSocket/SSE) bridge into the same bus.

- **Plugin architecture**: New product types are self-contained plugins that
  register components, routes, and capabilities at startup.

### Folder Structure

```
src/
├── core/                          # Shared kernel — no UI, no framework deps
│   ├── types/                     # Domain types (Product, User, AI, Events)
│   ├── events/                    # Event bus implementation
│   ├── errors/                    # Domain error types
│   └── config/                    # App configuration
│
├── domains/                       # Feature modules — domain-driven
│   ├── accounts/                  # Account overview & management
│   │   ├── types/
│   │   ├── hooks/                 # React Query hooks, custom hooks
│   │   ├── components/            # UI components
│   │   ├── services/              # Business logic
│   │   └── store/                 # Zustand store (client state)
│   ├── payments/
│   ├── disputes/
│   ├── credit-health/
│   ├── ai-copilot/                # AI insights, conversation, nudges
│   └── marketplace/
│
├── infrastructure/                # Technical concerns — framework & I/O
│   ├── api/                       # API client + adapter pattern
│   ├── auth/                      # Token lifecycle, session management
│   ├── realtime/                  # WebSocket/SSE client
│   ├── observability/             # Telemetry, logging, tracing
│   ├── feature-flags/             # Feature flag service
│   ├── storage/                   # Safe storage (no PII)
│   └── security/                  # PII boundary, CSP, input sanitization
│
├── plugins/                       # Extension system
│   ├── registry/                  # Plugin registration & lifecycle
│   ├── adapters/                  # Partner API adapters
│   └── capabilities/              # Capability-based rendering system
│
└── shared/                        # Cross-cutting UI
    ├── components/
    │   ├── ui/                    # Design system primitives
    │   ├── layout/                # Shell, nav, responsive grid
    │   ├── feedback/              # Error boundary, loading, empty states
    │   └── data-display/          # Charts, tables, cards
    ├── hooks/                     # Shared hooks
    ├── utils/                     # Pure utility functions
    └── constants/
```

### State Management Decision

**Zustand + React Query + Event Bus**

| Concern | Tool | Why |
|---|---|---|
| Server state (products, transactions) | React Query | Automatic caching, dedup, background refresh, optimistic updates |
| Client state (UI, selections, flows) | Zustand + Immer | Minimal boilerplate, TypeScript-first, no provider wrapping |
| Cross-module communication | Event Bus | Decoupled, typed, enables real-time + audit trail |
| Real-time updates | WebSocket/SSE → Event Bus → React Query invalidation | Server pushes events that invalidate relevant caches |

This hybrid avoids the Redux Toolkit trap (too much boilerplate for this use case)
while providing the caching sophistication of React Query and the simplicity
of Zustand for local state.

---

## 4. UX Innovation Framework

### Design Principles

1. **Intent, not navigation** — Users don't think in terms of "go to payments
   tab then select account then click pay." They think "I want to pay my
   Lowe's card." The AI copilot understands intent and routes directly.

2. **Contextual actions** — The most likely next action is always visible.
   Payment due? "Pay now" is the primary CTA. High utilization? "Reduce
   balance" paths are surfaced.

3. **Smart defaults** — Payment amounts default to the optimal choice (minimum
   vs. statement balance vs. custom), with explanations for each option's
   impact on interest.

4. **Progressive disclosure** — Dashboard shows the critical signal. Details
   expand on demand. Advanced features are discoverable but not overwhelming.

5. **Risk-adaptive UI** — High-risk users see simplified, guided flows with
   more guardrails. Low-risk users see advanced tools and optimizations.

### Component Hierarchy

```
<App>
  <AuthBoundary>
    <PluginProvider>
      <EventBusProvider>
        <Shell>                          ← Responsive shell with adaptive nav
          <AIInsightsBanner />           ← Critical insights at the top
          <Routes>
            <Dashboard>                  ← Unified product overview
              <ProductGrid>              ← Capability-rendered product cards
                <CapabilityRenderer />   ← Dynamic per-product components
              </ProductGrid>
              <AIActionFeed />           ← Suggested actions stream
              <FinancialHealthScore />   ← Gamified health visualization
            </Dashboard>
            <ProductDetail />            ← Plugin-rendered detail view
            <PaymentFlow />             ← Multi-step payment wizard
            <DisputeCenter />           ← AI-triaged dispute management
            <CreditHealthCenter />      ← Utilization, score factors, optimization
            <ConversationAssistant />   ← AI copilot chat
          </Routes>
          <NudgeOverlay />              ← Behavioral nudge display layer
        </Shell>
      </EventBusProvider>
    </PluginProvider>
  </AuthBoundary>
</App>
```

### AI Interaction Model

The conversational assistant is not a floating chatbot. It's integrated into
the action flow:

- **Contextual entry**: "Help me pay less interest" → AI analyzes all products,
  suggests optimal payment allocation
- **Inline suggestions**: Within the payment flow, AI shows "If you pay $50
  more, you save $120 in interest over 6 months"
- **Proactive prompts**: "Your Lowe's promo rate expires in 14 days. Here are
  your options."

Every AI suggestion includes:
- **Explanation**: Why this was suggested (data points + reasoning)
- **Confidence**: How confident the model is
- **Impact projection**: What changes if the user acts
- **Dismiss**: Always optional, with feedback capture

### Accessibility (WCAG 2.1 AA)

- All interactive elements have focus indicators and ARIA labels
- Color is never the sole indicator of state
- Animations respect `prefers-reduced-motion`
- Screen reader optimized with semantic HTML and live regions
- Font sizing respects user preferences (rem-based)
- Touch targets minimum 44x44px on mobile

---

## 5. Security & Compliance

### PII Boundary Pattern

PII is wrapped in `PIIContainer` objects that:
- Prevent accidental serialization (custom `toString()` and `toJSON()`)
- Audit every access with timestamp and context
- Block writes to localStorage/sessionStorage via storage guard
- Provide masked versions for general display

### Token Lifecycle

- Access tokens: 5-minute TTL, stored in memory only
- Refresh tokens: httpOnly secure cookies, managed by BFF
- Automatic transparent refresh via the API client
- No tokens in URLs, localStorage, or logs

### Zero-Trust Frontend

- Every API call is authenticated (no implicit sessions)
- CSP headers enforced (no inline scripts, no eval)
- Input sanitization on all user-provided data
- Rate limiting on mutation operations
- Subresource integrity for CDN assets

### Audit Trail

The event bus doubles as an audit system. Every meaningful user action
and system event is captured with:
- Correlation ID (traces across client/server)
- Timestamp
- User context
- Event payload (PII-free)

---

## 6. Deployment & DevOps

### CI/CD Pipeline

1. **PR checks**: Type check → Lint → Unit tests → Integration tests
2. **Build**: Vite production build with code splitting
3. **Preview**: Auto-deploy PR previews for design review
4. **Staging**: Merge to main → deploy to staging → smoke tests
5. **Production**: Manual promotion with canary rollout (10% → 50% → 100%)

### Testing Layers

| Layer | Tool | Coverage Target |
|---|---|---|
| Unit | Vitest | Domain logic, hooks, utils: 90%+ |
| Component | Testing Library | UI components: 80%+ |
| Integration | MSW + Testing Library | API integration: critical paths |
| E2E | Playwright | Happy paths + critical flows |
| Visual | Storybook + Chromatic | Component regression |

### Performance Budget

- First Contentful Paint: < 1.5s
- Largest Contentful Paint: < 2.5s
- Time to Interactive: < 3.0s
- Bundle size (gzipped): < 200KB initial, < 50KB per lazy chunk

### A/B Experimentation

The feature flag service supports multi-variant experiments:
- Variant assignment via server-side bucketing (consistent across sessions)
- Exposure tracking for statistical analysis
- Real-time flag updates without deploys
- Kill switches for any experiment

---

## 7. Scalability & Evolution

### Phase 1: Foundation (Current)
- Core platform with credit card and BNPL plugins
- AI insights engine with basic predictions
- Event-driven state with real-time updates

### Phase 2: AI-First Servicing
- Conversational assistant with full product knowledge
- Predictive payment intervention
- Automated dispute triage
- Personalized restructuring suggestions

### Phase 3: Micro-Frontend Architecture
- Each domain module becomes an independently deployable micro-frontend
- Shared shell with module federation
- Teams own end-to-end product verticals

### Phase 4: Multi-Tenant Product Ecosystem
- White-label capability for partner-branded experiences
- Theme engine for per-partner customization
- Partner SDK for custom plugin development
- Multi-tenant data isolation

### Phase 5: Embedded Finance Expansion
- Nexus components embeddable in partner sites
- Web Components for framework-agnostic integration
- Partner admin portal for configuration
- Real-time settlement and reconciliation

### Observability-Driven Optimization
- Every feature has instrumented metrics
- AI engagement tracked for model feedback loops
- Performance regression detection in CI
- User journey analytics for UX optimization
