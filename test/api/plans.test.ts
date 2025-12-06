import { describe, it, expect } from 'vitest';
import { fetchApi, TEST_TOKEN_OWNER, TEST_TOKEN_INVESTOR } from './utils';

describe('Plan Service API', () => {
  let createdPlanId: number;

  // ==================== Plan CRUD Tests ====================

  it('should create a new plan', async () => {
    const planData = {
      name: `Test Plan ${Date.now()}`,
      planFor: 'investor',
      allowedFields: ['startup', 'financials', 'traction'],
      price: 99.99,
      description: 'A test plan for investors',
    };

    const { response, data } = await fetchApi('/plans', {
      method: 'POST',
      body: JSON.stringify(planData),
    }, TEST_TOKEN_OWNER);

    expect(response.status).toBe(201);
    expect((data as any).plan).toBeDefined();
    expect((data as any).plan.name).toBe(planData.name);
    expect((data as any).plan.planFor).toBe('investor');
    expect((data as any).plan.allowedFields).toEqual(['startup', 'financials', 'traction']);
    createdPlanId = (data as any).plan.id;
    console.log('Created Plan ID:', createdPlanId);
  });

  it('should fail to create plan without auth', async () => {
    const planData = {
      name: 'Unauthorized Plan',
      planFor: 'investor',
      allowedFields: ['startup'],
      price: 50,
    };

    const { response } = await fetchApi('/plans', {
      method: 'POST',
      body: JSON.stringify(planData),
    });

    expect(response.status).toBe(401);
  });

  it('should fail to create plan with invalid data', async () => {
    const invalidData = { name: '' }; // Missing required fields

    const { response, data } = await fetchApi('/plans', {
      method: 'POST',
      body: JSON.stringify(invalidData),
    }, TEST_TOKEN_OWNER);

    expect(response.status).toBe(400);
    expect((data as any).error).toBeDefined();
  });

  it('should get all plans', async () => {
    const { response, data } = await fetchApi('/plans', {});

    expect(response.status).toBe(200);
    expect((data as any).plans).toBeDefined();
    expect(Array.isArray((data as any).plans)).toBe(true);
  });

  it('should filter plans by planFor', async () => {
    const { response, data } = await fetchApi('/plans?planFor=investor', {});

    expect(response.status).toBe(200);
    expect((data as any).plans).toBeDefined();
    // All returned plans should be for investors
    for (const plan of (data as any).plans) {
      expect(plan.planFor).toBe('investor');
    }
  });

  it('should get a specific plan by ID', async () => {
    const { response, data } = await fetchApi(`/plans/${createdPlanId}`, {});

    expect(response.status).toBe(200);
    expect((data as any).plan).toBeDefined();
    expect((data as any).plan.id).toBe(createdPlanId);
  });

  it('should return 404 for non-existent plan', async () => {
    const { response, data } = await fetchApi('/plans/999999', {});

    expect(response.status).toBe(404);
    expect((data as any).error).toBeDefined();
  });

  it('should update the plan', async () => {
    const updateData = {
      name: 'Updated Plan Name',
      price: 149.99,
      allowedFields: ['startup', 'financials', 'traction', 'salesMarketing'],
    };

    const { response, data } = await fetchApi(`/plans/${createdPlanId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    }, TEST_TOKEN_OWNER);

    expect(response.status).toBe(200);
    expect((data as any).plan.name).toBe('Updated Plan Name');
    expect((data as any).plan.price).toBe(149.99);
  });

  it('should verify plan update', async () => {
    const { response, data } = await fetchApi(`/plans/${createdPlanId}`, {});

    expect(response.status).toBe(200);
    expect((data as any).plan.name).toBe('Updated Plan Name');
    expect((data as any).plan.allowedFields).toContain('salesMarketing');
  });

  // ==================== Subscription Tests ====================

  it('should subscribe to a plan', async () => {
    const { response, data } = await fetchApi('/plans/subscribe', {
      method: 'POST',
      body: JSON.stringify({ planId: createdPlanId }),
    }, TEST_TOKEN_INVESTOR);

    expect(response.status).toBe(201);
    expect((data as any).subscription).toBeDefined();
    expect((data as any).subscription.planId).toBe(createdPlanId);
    expect((data as any).subscription.isActive).toBe(true);
  });

  it('should fail to subscribe to the same plan again', async () => {
    const { response, data } = await fetchApi('/plans/subscribe', {
      method: 'POST',
      body: JSON.stringify({ planId: createdPlanId }),
    }, TEST_TOKEN_INVESTOR);

    expect(response.status).toBe(409);
    expect((data as any).error).toContain('Already subscribed');
  });

  it('should get user subscriptions', async () => {
    const { response, data } = await fetchApi('/plans/subscribe', {}, TEST_TOKEN_INVESTOR);

    expect(response.status).toBe(200);
    expect((data as any).plans).toBeDefined();
    expect(Array.isArray((data as any).plans)).toBe(true);
    expect((data as any).plans.length).toBeGreaterThan(0);

    // Check that our subscribed plan is in the list
    const subscribedPlan = (data as any).plans.find((p: any) => p.id === createdPlanId);
    expect(subscribedPlan).toBeDefined();
  });

  it('should fail to get subscriptions without auth', async () => {
    const { response } = await fetchApi('/plans/subscribe', {});

    expect(response.status).toBe(401);
  });

  it('should unsubscribe from a plan', async () => {
    const { response, data } = await fetchApi('/plans/subscribe', {
      method: 'DELETE',
      body: JSON.stringify({ planId: createdPlanId }),
    }, TEST_TOKEN_INVESTOR);

    expect(response.status).toBe(200);
    expect((data as any).subscription.isActive).toBe(false);
  });

  it('should verify unsubscription', async () => {
    const { response, data } = await fetchApi('/plans/subscribe', {}, TEST_TOKEN_INVESTOR);

    expect(response.status).toBe(200);
    // The unsubscribed plan should not appear in active subscriptions
    const subscribedPlan = (data as any).plans.find((p: any) => p.id === createdPlanId);
    expect(subscribedPlan).toBeUndefined();
  });

  it('should resubscribe to a plan (reactivate)', async () => {
    const { response, data } = await fetchApi('/plans/subscribe', {
      method: 'POST',
      body: JSON.stringify({ planId: createdPlanId }),
    }, TEST_TOKEN_INVESTOR);

    expect(response.status).toBe(200);
    expect((data as any).message).toContain('reactivated');
    expect((data as any).subscription.isActive).toBe(true);
  });

  // ==================== Plan-Based Access Tests ====================

  it('should create a startup for plan access tests', async () => {
    const startupData = {
      startup: {
        name: `Plan Test Startup ${Date.now()}`,
        industry: 'FinTech',
        yearFounded: 2021,
        description: 'A startup for testing plan-based access',
        founderBackground: 'Finance Expert',
        teamSize: 10,
        sellEquity: true,
        sellBusiness: false,
        reasonForSelling: 'Growth funding',
        desiredBuyerProfile: 'VC Fund',
        askingPrice: 2000000,
      },
      financials: {
        monthlyRevenue: { '2023-01': 50000 },
        annualRevenue: { '2022': 500000 },
        monthlyProfitLoss: 10000,
        grossMargin: 70,
      },
      traction: {
        totalCustomers: 500,
        monthlyActiveCustomers: 400,
      },
      salesMarketing: {
        salesChannels: 'Online',
        cac: 100,
        ltv: 2000,
      },
    };

    const { response, data } = await fetchApi('/startups', {
      method: 'POST',
      body: JSON.stringify(startupData),
    }, TEST_TOKEN_OWNER);

    expect(response.status).toBe(201);
    const startupId = (data as any).startup.id;
    
    // Store for cleanup - using global for simplicity in tests
    (global as any).planTestStartupId = startupId;
  });

  it('should allow investor with plan to view startup with filtered fields', async () => {
    const startupId = (global as any).planTestStartupId;
    
    const { response, data } = await fetchApi(`/startups/${startupId}`, {}, TEST_TOKEN_INVESTOR);

    expect(response.status).toBe(200);
    expect((data as any).startup).toBeDefined();
    expect((data as any).allowedFields).toBeDefined();
    
    // Should have access to startup, financials, traction, salesMarketing based on our updated plan
    expect((data as any).startup.name).toBeDefined();
    expect((data as any).startup.financials).toBeDefined();
    expect((data as any).startup.traction).toBeDefined();
    expect((data as any).startup.salesMarketing).toBeDefined();
  });

  it('should unsubscribe investor and verify access is denied', async () => {
    // Unsubscribe
    await fetchApi('/plans/subscribe', {
      method: 'DELETE',
      body: JSON.stringify({ planId: createdPlanId }),
    }, TEST_TOKEN_INVESTOR);

    const startupId = (global as any).planTestStartupId;
    
    const { response, data } = await fetchApi(`/startups/${startupId}`, {}, TEST_TOKEN_INVESTOR);

    // Should be denied since no active plan
    expect(response.status).toBe(403);
    expect((data as any).error).toContain('plan');
  });

  // ==================== Cleanup ====================

  it('should delete the test startup (cleanup)', async () => {
    const startupId = (global as any).planTestStartupId;
    if (startupId) {
      const { response } = await fetchApi(`/startups/${startupId}`, {
        method: 'DELETE',
      }, TEST_TOKEN_OWNER);

      expect(response.status).toBe(200);
    }
  });

  it('should delete the plan (cleanup)', async () => {
    const { response } = await fetchApi(`/plans/${createdPlanId}`, {
      method: 'DELETE',
    }, TEST_TOKEN_OWNER);

    expect(response.status).toBe(200);
  });

  it('should verify plan deletion', async () => {
    const { response } = await fetchApi(`/plans/${createdPlanId}`, {});

    expect(response.status).toBe(404);
  });
});
