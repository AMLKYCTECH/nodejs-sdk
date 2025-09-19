/*
 Integration tests against real amlkyc.tech API.
 Set AMLKYC_API_KEY env var to run them, e.g.:
 AMLKYC_API_KEY="7500|V7Yz2LcScGI2HtfbGNc08e2huNI6XOv6ppR7tc7L" npm test
*/

const { AmlKycClient, ApiError } = require('../src');

const API_KEY = process.env.AMLKYC_API_KEY;

const maybeDescribe = API_KEY ? describe : describe.skip;

maybeDescribe('AMLKYC real API', () => {
  const client = new AmlKycClient({
    apiKey: API_KEY,
    authHeader: process.env.AMLKYC_AUTH_HEADER,
    authScheme: process.env.AMLKYC_AUTH_SCHEME,
  });

  test('getAllowedFiat returns array', async () => {
    const data = await client.getAllowedFiat();
    expect(Array.isArray(data)).toBe(true);
    if (data.length) {
      expect(data[0]).toHaveProperty('name');
    }
  }, 30000);

  test('getBalance returns success and props', async () => {
    const data = await client.getBalance();
    expect(data).toHaveProperty('success');
    expect(typeof data.success).toBe('boolean');
    if (data.success) {
      expect(data).toHaveProperty('balance');
      expect(data).toHaveProperty('investigations');
    }
  }, 30000);

  test('searchCrypto returns success flag and items', async () => {
    const data = await client.searchCrypto('TUebrU7t87ZBonfseZLah2RQ56L2ECaXPj');
    expect(data).toHaveProperty('success');
    expect(typeof data.success).toBe('boolean');
    expect(data).toHaveProperty('items');
  }, 30000);
});

// Basic behavior test when API key is absent — skip real calls to avoid rate limits
if (!API_KEY) {
  describe('SDK without API key (no network calls)', () => {
    test('constructs client without crashing', () => {
      const c = new AmlKycClient();
      expect(c).toBeDefined();
    });
  });
}
