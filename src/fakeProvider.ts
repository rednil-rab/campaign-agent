import type { Provider } from './types.js';

export const fakeProvider: Provider = {
  async recap(context) {
    return `Fake recap for ${context.campaign.name}. No AI model was called.`;
  },
};
