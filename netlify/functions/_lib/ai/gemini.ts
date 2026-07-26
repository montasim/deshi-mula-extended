import {
  AiProviderAdapter,
  GenerateInput,
  GenerateOutput,
  ProviderError,
} from './provider';

interface GeminiResponse {
  candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  usageMetadata?: {
    promptTokenCount?: number;
    candidatesTokenCount?: number;
  };
  error?: { message?: string };
}

export class GeminiAdapter implements AiProviderAdapter {
  readonly id = 'gemini';

  configured(): boolean {
    return Boolean(process.env.GEMINI_API_KEY);
  }

  async generate(input: GenerateInput): Promise<GenerateOutput> {
    const key = process.env.GEMINI_API_KEY;
    const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
    if (!key) throw new ProviderError(this.id, null, 'Gemini is not configured');

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: input.system }] },
          contents: [{ role: 'user', parts: [{ text: input.prompt }] }],
          generationConfig: {
            temperature: input.temperature ?? 0.2,
            maxOutputTokens: input.maxTokens ?? 900,
          },
        }),
        signal: AbortSignal.timeout(20_000),
      },
    );
    const body = (await response.json()) as GeminiResponse;
    if (!response.ok) {
      throw new ProviderError(
        this.id,
        response.status,
        body.error?.message || 'Gemini request failed',
      );
    }
    const text =
      body.candidates?.[0]?.content?.parts
        ?.map((part) => part.text || '')
        .join('')
        .trim() || '';
    if (!text) throw new ProviderError(this.id, response.status, 'Empty response');
    return {
      provider: this.id,
      model,
      text,
      inputTokens: body.usageMetadata?.promptTokenCount ?? null,
      outputTokens: body.usageMetadata?.candidatesTokenCount ?? null,
    };
  }
}
