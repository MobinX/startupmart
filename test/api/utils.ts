export const BASE_URL = 'https://startupmart.mobin.workers.dev/api';

export const TEST_TOKEN_OWNER = 'TEST_TOKEN_OWNER';
export const TEST_TOKEN_INVESTOR = 'TEST_TOKEN_INVESTOR';

export function generateRandomStartup() {
  const timestamp = Date.now();
  return {
    startup: {
      name: `Test Startup ${timestamp}`,
      industry: 'SaaS',
      yearFounded: 2020,
      description: 'A test startup description',
      websiteLink: `https://startup${timestamp}.com`,
      founderBackground: 'Serial Entrepreneur',
      teamSize: 5,
      sellEquity: true,
      sellBusiness: false,
      reasonForSelling: 'Expansion',
      desiredBuyerProfile: 'Strategic Investor',
      askingPrice: 1000000,
    },
    financials: {
      monthlyRevenue: { '2023-01': 10000, '2023-02': 12000 },
      annualRevenue: { '2022': 100000 },
      monthlyProfitLoss: 2000,
      grossMargin: 80,
      operationalExpense: 5000,
      cashRunway: 12,
      fundingRaised: 500000,
      valuationExpectation: 5000000,
    },
    traction: {
      totalCustomers: 100,
      monthlyActiveCustomers: 80,
      customerGrowthYoy: 20,
      customerRetentionRate: 90,
      churnRate: 5,
      majorClients: 'Client A, Client B',
      completedOrders: 500,
    },
    salesMarketing: {
      salesChannels: 'Direct, Partner',
      cac: 500,
      ltv: 5000,
      marketingPlatforms: 'Google, LinkedIn',
      conversionRate: 3,
    },
    operational: {
      supplyChainModel: 'Digital',
      cogs: 1000,
      averageDeliveryTime: 'Instant',
      inventoryData: 'N/A',
    },
    legal: {
      tradeLicenseNumber: `LIC-${timestamp}`,
      taxId: `TAX-${timestamp}`,
      verifiedPhone: '+1234567890',
      verifiedEmail: `contact@startup${timestamp}.com`,
      ownershipDocumentsLink: 'https://doc.link',
      ndaFinancialsLink: 'https://nda.link',
    },
    assets: {
      domainOwnership: 'Owned',
      patentsOrCopyrights: 'None',
      sourceCodeLink: 'https://github.com/repo',
      softwareInfrastructure: 'AWS',
      socialMediaHandles: '@startup',
    },
    contacts: {
      contactEmail: `contact@startup${timestamp}.com`,
      contactPhone: '+1234567890',
    },
  };
}

export async function fetchApi(path: string, options: RequestInit = {}, token?: string) {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers as any,
  };

  if (token) {
    (headers as any)['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));
  
  console.log(`[${options.method || 'GET'}] ${path} - Status: ${response.status}`);
  if (!response.ok) {
    console.log('Error Response:', JSON.stringify(data, null, 2));
  }

  return { response, data };
}
