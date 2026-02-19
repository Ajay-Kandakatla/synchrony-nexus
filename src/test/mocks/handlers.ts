import { http, HttpResponse } from 'msw';

/**
 * MSW request handlers — mock API for development and testing.
 *
 * These handlers replicate the backend API shape so the frontend
 * can be developed independently. They also power integration tests.
 */

const BASE_URL = 'http://localhost:8080/api/v1';

export const handlers = [
  // -----------------------------------------------------------------------
  // Auth
  // -----------------------------------------------------------------------
  http.post(`${BASE_URL}/auth/refresh`, () => {
    return HttpResponse.json({
      accessToken: 'mock-access-token-xyz',
      expiresIn: 300,
    });
  }),

  // -----------------------------------------------------------------------
  // Products
  // -----------------------------------------------------------------------
  http.get(`${BASE_URL}/products`, () => {
    return HttpResponse.json({
      products: [
        {
          id: 'prod-1',
          externalId: 'ext-001',
          category: 'credit_card',
          status: 'active',
          displayName: "Lowe's Advantage Card",
          issuer: 'Nexus',
          partner: { id: 'lowes', name: "Lowe's", logoUrl: '/logos/lowes.svg', category: 'home_improvement' },
          creditLimit: 12000,
          currentBalance: 4560.32,
          availableCredit: 7439.68,
          apr: { purchase: 29.99, cashAdvance: 29.99, promotional: { rate: 0, expiresAt: '2026-03-04T00:00:00Z', remainingBalance: 2340 } },
          minimumPaymentDue: 85,
          paymentDueDate: '2026-02-23T00:00:00Z',
          lastFourDigits: '4521',
          openedAt: '2020-03-15T00:00:00Z',
          metadata: {},
        },
        {
          id: 'prod-2',
          externalId: 'ext-002',
          category: 'bnpl',
          status: 'active',
          displayName: 'Pay Later - Mattress Firm',
          issuer: 'Nexus',
          partner: { id: 'mattressfirm', name: 'Mattress Firm', logoUrl: '/logos/mf.svg', category: 'retail' },
          originalAmount: 1200,
          remainingBalance: 600,
          installments: { total: 12, completed: 6, remaining: 6, nextPaymentAmount: 100, nextPaymentDate: '2026-03-01T00:00:00Z', frequency: 'monthly' },
          merchant: 'Mattress Firm',
          openedAt: '2025-09-01T00:00:00Z',
          metadata: {},
        },
      ],
    });
  }),

  http.get(`${BASE_URL}/products/:productId`, ({ params }) => {
    return HttpResponse.json({
      product: {
        id: params['productId'],
        category: 'credit_card',
        status: 'active',
        displayName: "Lowe's Advantage Card",
        currentBalance: 4560.32,
        creditLimit: 12000,
      },
    });
  }),

  // -----------------------------------------------------------------------
  // Payments
  // -----------------------------------------------------------------------
  http.post(`${BASE_URL}/products/:productId/payments`, async ({ request }) => {
    const body = await request.json() as { amount: number };
    return HttpResponse.json({
      confirmationId: `PAY-${Date.now()}`,
      status: 'confirmed',
      scheduledDate: new Date().toISOString(),
      amount: (body).amount,
    });
  }),

  // -----------------------------------------------------------------------
  // Transactions
  // -----------------------------------------------------------------------
  http.get(`${BASE_URL}/products/:productId/transactions`, () => {
    return HttpResponse.json({
      transactions: [
        { id: 'txn-1', date: '2026-02-15T00:00:00Z', description: 'LOWES #1234', merchantName: "Lowe's", amount: 127.43, category: 'home_improvement', status: 'posted', disputed: false },
        { id: 'txn-2', date: '2026-02-12T00:00:00Z', description: 'LOWES #5678', merchantName: "Lowe's", amount: 54.99, category: 'home_improvement', status: 'posted', disputed: false },
        { id: 'txn-3', date: '2026-02-10T00:00:00Z', description: 'AMAZON MARKETPLACE', merchantName: 'Amazon', amount: 23.47, category: 'retail', status: 'posted', disputed: false },
        { id: 'txn-4', date: '2026-02-08T00:00:00Z', description: 'PAYMENT - THANK YOU', merchantName: '', amount: -200, category: 'payment', status: 'posted', disputed: false },
      ],
      total: 4,
      hasMore: false,
    });
  }),

  // -----------------------------------------------------------------------
  // AI Insights
  // -----------------------------------------------------------------------
  http.get(`${BASE_URL}/ai/insights`, () => {
    return HttpResponse.json({
      insights: [
        {
          id: 'insight-1',
          category: 'promotional_expiry',
          priority: 'high',
          status: 'new',
          title: 'Promotional rate expiring soon',
          summary: "Your 0% APR on Lowe's card expires in 14 days. $2,340 will start accruing 29.99% interest.",
          explanation: {
            reasoning: 'Your promotional financing period ends March 4, 2026. The remaining balance will be subject to the standard purchase APR.',
            dataPoints: [
              { label: 'Promotional balance', value: '$2,340.00', source: 'Account data' },
              { label: 'Days remaining', value: '14', source: 'Calculated' },
              { label: 'Post-promo APR', value: '29.99%', source: 'Account terms' },
            ],
            confidence: 0.98,
          },
          suggestedActions: [
            { id: 'action-1', type: 'navigate', label: 'Pay off promo balance', description: 'Make a payment to clear the promotional balance', estimatedImpact: { metric: 'Interest saved', currentValue: '$0', projectedValue: '$701/yr', timeframe: '1 year' }, payload: { route: '/payments', productId: 'prod-1' } },
            { id: 'action-2', type: 'navigate', label: 'Transfer balance', description: 'Move the balance to a lower rate card', payload: { route: '/transfer' } },
          ],
          relatedProductIds: ['prod-1'],
          createdAt: '2026-02-18T08:00:00Z',
          expiresAt: '2026-03-04T00:00:00Z',
          metadata: {},
        },
        {
          id: 'insight-2',
          category: 'payment_optimization',
          priority: 'medium',
          status: 'new',
          title: 'Optimize your payment strategy',
          summary: 'Paying $50 more per month on your highest-rate card saves $180 in interest this year.',
          explanation: {
            reasoning: 'Based on your current balances and APRs, redirecting extra payments to the highest-rate card provides the best return.',
            dataPoints: [
              { label: 'Current monthly payment', value: '$127.00', source: 'Payment history' },
              { label: 'Optimal monthly payment', value: '$177.00', source: 'Calculated' },
              { label: 'Annual interest saved', value: '$180.00', source: 'Projected' },
            ],
            confidence: 0.87,
          },
          suggestedActions: [
            { id: 'action-3', type: 'navigate', label: 'See payment plan', description: 'View the recommended payment allocation', payload: { route: '/credit-health' } },
          ],
          relatedProductIds: ['prod-1', 'prod-2'],
          createdAt: '2026-02-18T08:00:00Z',
          metadata: {},
        },
      ],
    });
  }),

  // -----------------------------------------------------------------------
  // AI Risk Assessments
  // -----------------------------------------------------------------------
  http.get(`${BASE_URL}/ai/risk-assessments`, () => {
    return HttpResponse.json({
      assessments: [
        {
          productId: 'prod-1',
          riskScore: 35,
          missedPaymentProbability: 0.08,
          contributingFactors: [
            { factor: 'Promotional expiry approaching', direction: 'increasing_risk', magnitude: 'medium' },
            { factor: 'Consistent payment history', direction: 'decreasing_risk', magnitude: 'high' },
          ],
          suggestedInterventions: [],
          assessedAt: '2026-02-18T06:00:00Z',
        },
      ],
    });
  }),

  // -----------------------------------------------------------------------
  // AI Nudges
  // -----------------------------------------------------------------------
  http.get(`${BASE_URL}/ai/nudges`, () => {
    return HttpResponse.json({
      nudges: [
        {
          id: 'nudge-1',
          type: 'savings_prompt',
          trigger: 'pattern_based',
          content: {
            headline: 'You saved $340 this month',
            body: "That's 15% more than last month. Keep the momentum going!",
            cta: { id: 'nudge-action-1', type: 'navigate', label: 'View savings goals', description: '', payload: {} },
          },
          targetProductIds: [],
          priority: 'low',
          displayConstraints: { maxImpressions: 3, cooldownHours: 24, respectDismissals: true },
          createdAt: '2026-02-18T08:00:00Z',
        },
      ],
    });
  }),

  // -----------------------------------------------------------------------
  // AI Conversation
  // -----------------------------------------------------------------------
  http.post(`${BASE_URL}/ai/conversation/messages`, async ({ request }) => {
    const body = await request.json() as { message: string };
    const message = (body).message;

    let response = "I can help you with that. Let me analyze your accounts.";

    if (message.toLowerCase().includes('interest')) {
      response = "Based on your current balances, here's how to minimize interest: Your Lowe's card has $2,340 at a promotional 0% APR expiring March 4. I recommend paying this off first to avoid the 29.99% rate. Your remaining balances are accruing at standard rates. Paying an extra $50/month on the highest-rate card saves approximately $180/year.";
    } else if (message.toLowerCase().includes('credit score') || message.toLowerCase().includes('improve')) {
      response = "Your financial health score is 74/100 (Good). The biggest improvement opportunity is credit utilization — you're currently at 38%. Reducing to under 30% could improve your score by 15-20 points. That means paying down about $1,200 across your cards.";
    } else if (message.toLowerCase().includes('payment')) {
      response = "You have two upcoming payments: Lowe's card ($85 minimum, due Feb 23) and CareCredit ($42 minimum, due Feb 28). Your Mattress Firm installment of $100 is due March 1. Total: $227 due in the next 11 days.";
    }

    return HttpResponse.json({
      id: `msg-${Date.now()}`,
      role: 'assistant',
      content: response,
      timestamp: new Date().toISOString(),
    });
  }),

  // -----------------------------------------------------------------------
  // AI Suggested Actions
  // -----------------------------------------------------------------------
  http.get(`${BASE_URL}/ai/products/:productId/suggested-actions`, () => {
    return HttpResponse.json({
      actions: [
        { id: 'sa-1', type: 'navigate', label: 'Set up autopay', description: 'Never miss a payment', payload: { route: '/autopay' } },
        { id: 'sa-2', type: 'navigate', label: 'View spending by category', description: 'See where your money goes', payload: { route: '/spending' } },
      ],
    });
  }),

  // -----------------------------------------------------------------------
  // Disputes
  // -----------------------------------------------------------------------
  http.post(`${BASE_URL}/disputes`, async ({ request }) => {
    const body = await request.json() as { amount: number; transactionId: string };
    return HttpResponse.json({
      id: `dispute-${Date.now()}`,
      status: 'submitted',
      transactionId: (body).transactionId,
      amount: (body).amount,
      estimatedResolutionDate: '2026-03-15T00:00:00Z',
    });
  }),

  // -----------------------------------------------------------------------
  // Catch-all for insight actions
  // -----------------------------------------------------------------------
  http.post(`${BASE_URL}/ai/insights/:insightId/seen`, () => {
    return HttpResponse.json({});
  }),

  http.post(`${BASE_URL}/ai/insights/:insightId/dismiss`, () => {
    return HttpResponse.json({});
  }),

  http.post(`${BASE_URL}/ai/insights/:insightId/actions`, () => {
    return HttpResponse.json({});
  }),
];
