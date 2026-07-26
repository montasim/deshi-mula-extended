import { GeminiAdapter } from './gemini';
import { GroqAdapter } from './groq';
import {
  AiProviderAdapter,
  GenerateInput,
  GenerateOutput,
} from './provider';

const adapters: Record<string, AiProviderAdapter> = {
  gemini: new GeminiAdapter(),
  groq: new GroqAdapter(),
};

export interface ProviderAttempt {
  provider: string;
  ok: boolean;
  error?: string;
}

export class ProviderChainError extends Error {
  constructor(readonly attempts: ProviderAttempt[]) {
    super(
      `No AI provider completed the request: ${attempts
        .map((attempt) => `${attempt.provider}: ${attempt.error}`)
        .join('; ')}`,
    );
  }
}

export const generateWithFallback = async (
  input: GenerateInput,
): Promise<{ output: GenerateOutput; attempts: ProviderAttempt[] }> => {
  const order = (process.env.AI_PROVIDER_ORDER || 'gemini,groq')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
  const attempts: ProviderAttempt[] = [];
  for (const id of order) {
    const adapter = adapters[id];
    if (!adapter || !adapter.configured()) {
      attempts.push({ provider: id, ok: false, error: 'not configured' });
      continue;
    }
    try {
      const output = await adapter.generate(input);
      attempts.push({ provider: id, ok: true });
      return { output, attempts };
    } catch (error) {
      attempts.push({
        provider: id,
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
  throw new ProviderChainError(attempts);
};
