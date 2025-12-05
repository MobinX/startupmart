import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { fetchApi, generateRandomStartup, TEST_TOKEN_OWNER, TEST_TOKEN_INVESTOR } from './utils';

describe('Favorites Service API', () => {
  let startupId: number;

  // Setup: Create a startup to favorite
  beforeAll(async () => {
    const startupData = generateRandomStartup();
    const { data } = await fetchApi('/startups', {
      method: 'POST',
      body: JSON.stringify(startupData),
    }, TEST_TOKEN_OWNER);
    startupId = (data as any).startup.id;
    console.log('Setup: Created Startup ID:', startupId);
  });

  // Cleanup: Delete the startup
  afterAll(async () => {
    if (startupId) {
      await fetchApi(`/startups/${startupId}`, {
        method: 'DELETE',
      }, TEST_TOKEN_OWNER);
      console.log('Cleanup: Deleted Startup ID:', startupId);
    }
  });

  it('should add startup to favorites', async () => {
    const { response, data } = await fetchApi('/favorites', {
      method: 'POST',
      body: JSON.stringify({ startupId }),
    }, TEST_TOKEN_INVESTOR);

    expect(response.status).toBe(200);
    expect((data as any).message).toBe('Startup added to favorites');
  });

  it('should fail to add duplicate favorite', async () => {
    const { response, data } = await fetchApi('/favorites', {
      method: 'POST',
      body: JSON.stringify({ startupId }),
    }, TEST_TOKEN_INVESTOR);

    expect(response.status).toBe(409);
    expect((data as any).error).toBe('Startup already in favorites');
  });

  it('should get user favorites', async () => {
    const { response, data } = await fetchApi('/favorites', {}, TEST_TOKEN_INVESTOR);

    expect(response.status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
    const favorites = data as any[];
    const favorite = favorites.find((f: any) => f.id === startupId);
    expect(favorite).toBeDefined();
    expect(favorite.name).toBeDefined();
  });

  it('should remove startup from favorites', async () => {
    const { response, data } = await fetchApi('/favorites', {
      method: 'DELETE',
      body: JSON.stringify({ startupId }),
    }, TEST_TOKEN_INVESTOR);

    expect(response.status).toBe(200);
    expect((data as any).message).toBe('Startup removed from favorites');
  });

  it('should fail to remove non-existent favorite', async () => {
    const { response, data } = await fetchApi('/favorites', {
      method: 'DELETE',
      body: JSON.stringify({ startupId }),
    }, TEST_TOKEN_INVESTOR);

    expect(response.status).toBe(404);
    expect((data as any).error).toBe('Favorite not found');
  });

  it('should fail to add non-existent startup to favorites', async () => {
    const { response, data } = await fetchApi('/favorites', {
      method: 'POST',
      body: JSON.stringify({ startupId: 999999 }),
    }, TEST_TOKEN_INVESTOR);

    expect(response.status).toBe(404);
    expect((data as any).error).toBe('Startup not found');
  });
});
