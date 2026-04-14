import { describe, expect, it } from 'vitest';
import { extractEmailErrorMessage } from './emailError';

describe('extractEmailErrorMessage', () => {
  it('includes structured backend code and retry hint', () => {
    const error = {
      isAxiosError: true,
      response: {
        data: {
          detail: {
            code: 'PROVIDER_UNAVAILABLE',
            message: 'Provider timeout',
            retryable: true,
          },
        },
      },
    };

    const parsed = extractEmailErrorMessage(error);
    expect(parsed.title).toContain('[PROVIDER_UNAVAILABLE]');
    expect(parsed.description).toContain('Provider timeout');
    expect(parsed.description).toContain('This appears temporary');
  });

  it('falls back to generic error message', () => {
    const parsed = extractEmailErrorMessage(new Error('Network down'));
    expect(parsed.title).toBe('Failed to send email');
    expect(parsed.description).toContain('Network down');
  });
});
