import { randomUUID } from 'node:crypto';
import { ApiErrorBody } from '../../../src/contracts';

const headers = {
  'Access-Control-Allow-Headers': 'Authorization, Content-Type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Origin': '*',
  'Cache-Control': 'no-store',
  'Content-Type': 'application/json; charset=utf-8',
};

export const requestId = (): string => randomUUID();

export const json = (
  body: unknown,
  status = 200,
  extraHeaders: Record<string, string> = {},
): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...headers, ...extraHeaders },
  });

export const apiError = (
  code: string,
  message: string,
  status: number,
  id?: string,
): Response => {
  const body: ApiErrorBody = {
    error: { code, message, ...(id ? { requestId: id } : {}) },
  };
  return json(body, status);
};

export const preflight = (request: Request): Response | null =>
  request.method === 'OPTIONS' ? json({}, 204) : null;

export const methodNotAllowed = (): Response =>
  apiError('method_not_allowed', 'This method is not supported.', 405);

export const withErrors =
  (handler: (request: Request) => Promise<Response>) =>
  async (request: Request): Promise<Response> => {
    const early = preflight(request);
    if (early) return early;
    const id = requestId();
    try {
      return await handler(request);
    } catch (error) {
      console.error(`[${id}]`, error);
      return apiError(
        'internal_error',
        'The research service could not complete this request.',
        500,
        id,
      );
    }
  };

export const cleanSlug = (value: string | null): string | null => {
  if (!value) return null;
  const slug = value.trim().toLocaleLowerCase('en');
  return /^[a-z0-9][a-z0-9-]{0,119}$/.test(slug) ? slug : null;
};

export const regexLiteral = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
