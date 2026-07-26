export interface GenerateInput {
  system: string;
  prompt: string;
  temperature?: number;
  maxTokens?: number;
}

export interface GenerateOutput {
  provider: string;
  model: string;
  text: string;
  inputTokens: number | null;
  outputTokens: number | null;
}

export interface AiProviderAdapter {
  readonly id: string;
  configured(): boolean;
  generate(input: GenerateInput): Promise<GenerateOutput>;
}

export class ProviderError extends Error {
  constructor(
    readonly provider: string,
    readonly status: number | null,
    message: string,
  ) {
    super(message);
  }
}
