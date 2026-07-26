import { afterEach, describe, expect, it, vi } from 'vitest';

describe('AI provider registry', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.GEMINI_API_KEY;
    delete process.env.GROQ_API_KEY;
    delete process.env.AI_PROVIDER_ORDER;
  });

  it('falls back from Gemini to Groq without changing the contract', async () => {
    process.env.GEMINI_API_KEY = 'gemini-test';
    process.env.GROQ_API_KEY = 'groq-test';
    process.env.AI_PROVIDER_ORDER = 'gemini,groq';
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ error: { message: 'quota' } }), {
            status: 429,
          }),
        )
        .mockResolvedValueOnce(
          new Response(
            JSON.stringify({
              choices: [{ message: { content: 'Cited answer [S1]' } }],
              usage: { prompt_tokens: 10, completion_tokens: 4 },
            }),
            { status: 200 },
          ),
        ),
    );
    const { generateWithFallback } = await import(
      '../netlify/functions/_lib/ai/registry'
    );
    const result = await generateWithFallback({
      system: 'Use evidence.',
      prompt: '[S1] evidence',
    });
    expect(result.output.provider).toBe('groq');
    expect(result.output.text).toContain('[S1]');
    expect(result.attempts).toEqual([
      { provider: 'gemini', ok: false, error: 'quota' },
      { provider: 'groq', ok: true },
    ]);
  });
});
