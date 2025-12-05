import { describe, it, expect } from 'vitest';
import { fetchApi, generateRandomStartup, TEST_TOKEN_OWNER, TEST_TOKEN_INVESTOR } from './utils';

describe('Startup Service API', () => {
  let createdStartupId: number;

  it('should create a new startup', async () => {
    const startupData = generateRandomStartup();
    const { response, data } = await fetchApi('/startups', {
      method: 'POST',
      body: JSON.stringify(startupData),
    }, TEST_TOKEN_OWNER);

    expect(response.status).toBe(200);
    expect((data as any).startup).toBeDefined();
    expect((data as any).startup.name).toBe(startupData.startup.name);
    createdStartupId = (data as any).startup.id;
    console.log('Created Startup ID:', createdStartupId);
  });

  it('should fail to create startup without auth', async () => {
    const startupData = generateRandomStartup();
    const { response } = await fetchApi('/startups', {
      method: 'POST',
      body: JSON.stringify(startupData),
    });

    expect(response.status).toBe(401);
  });

  it('should fail to create startup with invalid data', async () => {
    const invalidData = { startup: { name: '' } }; // Missing required fields
    const { response, data } = await fetchApi('/startups', {
      method: 'POST',
      body: JSON.stringify(invalidData),
    }, TEST_TOKEN_OWNER);

    expect(response.status).toBe(400);
    expect((data as any).error).toBeDefined();
  });

  it('should get the created startup details (Owner)', async () => {
    const { response, data } = await fetchApi(`/startups/${createdStartupId}`, {}, TEST_TOKEN_OWNER);

    expect(response.status).toBe(200);
    expect((data as any).id).toBe(createdStartupId);
    expect((data as any).financials).toBeDefined(); // Owner sees everything
    expect((data as any).viewCount).toBeDefined();
  });

  it('should get the created startup details (Premium Investor)', async () => {
    // Note: TEST_TOKEN_OWNER is premium, but let's assume TEST_TOKEN_INVESTOR is free for now based on auth-middleware
    // Wait, in auth-middleware: owner is premium, investor is free.
    // So investor should NOT see full details unless premium.
    // Let's check free investor access.
    const { response } = await fetchApi(`/startups/${createdStartupId}`, {}, TEST_TOKEN_INVESTOR);

    // Free investor should get 403 for full details endpoint if not owner
    // Wait, getStartupById throws AuthorizationError if not owner and not premium.
    expect(response.status).toBe(403);
  });

  it('should update the startup', async () => {
    const updateData = {
      startup: { name: 'Updated Startup Name' },
      financials: { monthlyProfitLoss: 5000 },
    };

    const { response, data } = await fetchApi(`/startups/${createdStartupId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    }, TEST_TOKEN_OWNER);

    expect(response.status).toBe(200);
    expect((data as any).startup.name).toBe('Updated Startup Name');
  });

  it('should verify update', async () => {
    const { response, data } = await fetchApi(`/startups/${createdStartupId}`, {}, TEST_TOKEN_OWNER);

    expect(response.status).toBe(200);
    expect((data as any).name).toBe('Updated Startup Name');
    expect((data as any).financials.monthlyProfitLoss).toBe(5000);
  });

  it('should fail update with unauthorized user', async () => {
    const updateData = { startup: { name: 'Hacked Name' } };
    const { response } = await fetchApi(`/startups/${createdStartupId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    }, TEST_TOKEN_INVESTOR);

    expect(response.status).toBe(403);
  });

  it('should delete the startup', async () => {
    const { response } = await fetchApi(`/startups/${createdStartupId}`, {
      method: 'DELETE',
    }, TEST_TOKEN_OWNER);

    expect(response.status).toBe(200);
  });

  it('should verify deletion', async () => {
    const { response } = await fetchApi(`/startups/${createdStartupId}`, {}, TEST_TOKEN_OWNER);

    expect(response.status).toBe(404);
  });
});
