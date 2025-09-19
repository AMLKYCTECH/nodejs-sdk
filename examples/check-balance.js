const { AmlKycClient } = require('../src');

(async () => {
  try {
    const client = new AmlKycClient({
      apiKey: process.env.AMLKYC_API_KEY,
      authHeader: process.env.AMLKYC_AUTH_HEADER,
      authScheme: process.env.AMLKYC_AUTH_SCHEME,
    });
    const balance = await client.getBalance();
    console.log('Balance:', balance);
  } catch (e) {
    console.error('Error:', e);
    process.exitCode = 1;
  }
})();
