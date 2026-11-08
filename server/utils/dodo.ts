import DodoPayments from 'dodopayments';

// A Dodo key works against one mode only, so the key decides the mode.
// Anything that is not clearly a live key stays in test mode.
export function dodoEnvironment(apiKey: string): 'live_mode' | 'test_mode' {
  return apiKey.startsWith('dodo_live_') ? 'live_mode' : 'test_mode';
}

export function createDodoClient(apiKey: string): DodoPayments {
  return new DodoPayments({
    bearerToken: apiKey,
    environment: dodoEnvironment(apiKey),
  });
}
