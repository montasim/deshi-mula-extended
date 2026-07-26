import {
  AiProviderAdapter,
  GenerateInput,
  GenerateOutput,
  ProviderError,
} from './provider';

interface GroqResponse {
  choices?: Array<{ message?: { content?: string } }>;
  usage?: { prompt_tokens?: number; completion_tokens?: number };
  error?: { message?: string };
}

export class GroqAdapter implements AiProviderAdapter {
  readonly id = 'groq';

  configured(): boolean {
    return Boolean(process.env.GROQ_API_KEY);
  }

  async generate(input: GenerateInput): Promise<GenerateOutput> {
    const key = process.env.GROQ_API_KEY;
    const model = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
    if (!key) throw new ProviderError(this.id, null, 'Groq is not configured');

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: input.system },
          { role: 'user', content: input.prompt },
        ],
        temperature: input.temperature ?? 0.2,
        max_tokens: input.maxTokens ?? 900,
      }),
      signal: AbortSignal.timeout(20_000),
    });
    const body = (await response.json()) as GroqResponse;
    if (!response.ok) {
      throw new ProviderError(
        this.id,
        response.status,
        body.error?.message || 'Groq request failed',
      );
    }
    const text = body.choices?.[0]?.message?.content?.trim() || '';
    if (!text) throw new ProviderError(this.id, response.status, 'Empty response');
    return {
      provider: this.id,
      model,
      text,
      inputTokens: body.usage?.prompt_tokens ?? null,
      outputTokens: body.usage?.completion_tokens ?? null,
    };
  }
}
