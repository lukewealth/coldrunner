/**
 * Minimal OpenAI-compatible client for FreeLLMAPI and other gateways.
 *
 * The API key is read only on the server. Do not import this module from
 * browser/client code or expose its configuration through a public endpoint.
 */
import { estimateTokens, recordLLMUsage } from '../services/llm-usage';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string | null;
  name?: string;
  tool_call_id?: string;
}

export interface ChatCompletionOptions {
  model?: string;
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  signal?: AbortSignal;
}

export interface ChatCompletionResult {
  id: string;
  model: string;
  content: string | null;
  finishReason: string | null;
  toolCalls: Array<{
    id: string;
    type: 'function';
    function: { name: string; arguments: string };
  }>;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
}

export interface AvailableModel {
  id: string;
  object?: string;
  ownedBy?: string;
}

export class LLMGatewayError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
    public readonly retryable = false,
  ) {
    super(message);
    this.name = 'LLMGatewayError';
  }
}

function getGatewayConfig() {
  const baseUrl = (process.env.LLM_BASE_URL || 'http://localhost:3001/v1')
    .trim()
    .replace(/\/+$/, '');
  const apiKey = process.env.LLM_API_KEY?.trim();

  if (!apiKey) {
    throw new LLMGatewayError('LLM_API_KEY is not configured');
  }

  let parsed: URL;
  try {
    parsed = new URL(baseUrl);
  } catch {
    throw new LLMGatewayError('LLM_BASE_URL must be a valid URL');
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new LLMGatewayError('LLM_BASE_URL must use HTTP or HTTPS');
  }

  const timeoutMs = Number(process.env.LLM_REQUEST_TIMEOUT_MS || 60000);
  if (!Number.isFinite(timeoutMs) || timeoutMs < 1000 || timeoutMs > 180000) {
    throw new LLMGatewayError('LLM_REQUEST_TIMEOUT_MS must be between 1000 and 180000');
  }

  return { baseUrl, apiKey, timeoutMs };
}

async function requestJson<T>(
  path: string,
  init: RequestInit = {},
  externalSignal?: AbortSignal,
): Promise<T> {
  const config = getGatewayConfig();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.timeoutMs);
  const abortFromCaller = () => controller.abort();

  if (externalSignal?.aborted) controller.abort();
  externalSignal?.addEventListener('abort', abortFromCaller, { once: true });

  try {
    const response = await fetch(`${config.baseUrl}${path}`, {
      ...init,
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        Accept: 'application/json',
        ...(init.body ? { 'Content-Type': 'application/json' } : {}),
        ...init.headers,
      },
    });

    if (!response.ok) {
      // Do not include arbitrary response bodies in errors/logs; they may
      // contain provider details or sensitive content.
      const retryable = response.status === 408 || response.status === 429 || response.status >= 500;
      throw new LLMGatewayError(
        `LLM gateway request failed (HTTP ${response.status})`,
        response.status,
        retryable,
      );
    }

    return await response.json() as T;
  } catch (error) {
    if (error instanceof LLMGatewayError) throw error;
    if (controller.signal.aborted) {
      throw new LLMGatewayError('LLM gateway request timed out or was cancelled', undefined, true);
    }
    throw new LLMGatewayError('Could not reach the configured LLM gateway', undefined, true);
  } finally {
    clearTimeout(timeout);
    externalSignal?.removeEventListener('abort', abortFromCaller);
  }
}

export async function listAvailableModels(): Promise<AvailableModel[]> {
  const response = await requestJson<{ data?: Array<{ id?: string; object?: string; owned_by?: string }> }>(
    '/models',
  );

  return (response.data || [])
    .filter((model): model is { id: string; object?: string; owned_by?: string } => typeof model.id === 'string')
    .map((model) => ({ id: model.id, object: model.object, ownedBy: model.owned_by }));
}

export async function createChatCompletion(
  options: ChatCompletionOptions,
): Promise<ChatCompletionResult> {
  if (!Array.isArray(options.messages) || options.messages.length === 0) {
    throw new LLMGatewayError('At least one chat message is required');
  }

  const model = options.model || process.env.LLM_DEFAULT_MODEL || 'auto';
  const body = {
    model,
    messages: options.messages,
    ...(options.temperature !== undefined ? { temperature: options.temperature } : {}),
    ...(options.maxTokens !== undefined ? { max_tokens: options.maxTokens } : {}),
  };

  const response = await requestJson<{
    id?: string;
    model?: string;
    choices?: Array<{
      message?: {
        content?: string | null;
        tool_calls?: Array<{
          id?: string;
          type?: string;
          function?: { name?: string; arguments?: string };
        }>;
      };
      finish_reason?: string | null;
    }>;
    usage?: {
      prompt_tokens?: number;
      completion_tokens?: number;
      total_tokens?: number;
    };
  }>('/chat/completions', {
    method: 'POST',
    body: JSON.stringify(body),
  }, options.signal);

  const choice = response.choices?.[0];
  if (!choice?.message) {
    throw new LLMGatewayError('LLM gateway returned no completion choice');
  }

  return {
    id: response.id || '',
    model: response.model || model,
    content: choice.message.content ?? null,
    finishReason: choice.finish_reason ?? null,
    toolCalls: (choice.message.tool_calls || [])
      .filter((call) => call.type === 'function' && call.function?.name)
      .map((call) => ({
        id: call.id || '',
        type: 'function' as const,
        function: {
          name: call.function!.name!,
          arguments: call.function!.arguments || '{}',
        },
      })),
    ...(response.usage ? {
      usage: {
        promptTokens: response.usage.prompt_tokens,
        completionTokens: response.usage.completion_tokens,
        totalTokens: response.usage.total_tokens,
      },
    } : {}),
  };
}
