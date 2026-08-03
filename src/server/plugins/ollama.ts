import { BasePlugin } from './base';
import { PluginResult } from '../types';
import { config } from '../config';

export interface OllamaGenerateParams {
  model: string;
  prompt: string;
  system?: string;
  stream?: boolean;
  temperature?: number;
  topP?: number;
  numPredict?: number;
  stop?: string[];
}

export interface OllamaGenerateResponse {
  model: string;
  response: string;
  done: boolean;
  context?: number[];
  totalDuration?: number;
  loadDuration?: number;
  promptEvalCount?: number;
  promptEvalDuration?: number;
  evalCount?: number;
  evalDuration?: number;
}

export interface OllamaChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface OllamaChatParams {
  model: string;
  messages: OllamaChatMessage[];
  stream?: boolean;
  temperature?: number;
  topP?: number;
  numPredict?: number;
  stop?: string[];
}

export class OllamaPlugin extends BasePlugin {
  name = 'ollama';
  version = '1.0.0';
  description = 'Local LLM inference via Ollama for private AI reasoning without cloud API keys';

  private baseUrl: string;
  private available = false;
  private availableModels: string[] = [];

  constructor() {
    super();
    this.baseUrl = process.env.OLLAMA_URL || 'http://localhost:11434';
  }

  async initialize(): Promise<void> {
    await super.initialize();
    try {
      const res = await fetch(`${this.baseUrl}/api/tags`, {
        signal: AbortSignal.timeout(5000),
      });
      if (res.ok) {
        this.available = true;
        const data = await res.json();
        this.availableModels = (data.models || []).map((m: any) => m.name);
      }
    } catch {
      this.available = false;
    }
  }

  async healthCheck(): Promise<boolean> {
    if (!this.initialized) return false;
    try {
      const res = await fetch(`${this.baseUrl}/api/tags`, {
        signal: AbortSignal.timeout(3000),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  getAvailableModels(): string[] {
    return this.availableModels;
  }

  isAvailable(): boolean {
    return this.available;
  }

  async execute(params: any): Promise<PluginResult> {
    const { model, prompt, system, temperature, numPredict, stop } = params as OllamaGenerateParams;

    if (!prompt) {
      return {
        success: false,
        error: 'Prompt parameter is required',
        confidence: 0,
        source: this.name,
        timestamp: new Date(),
      };
    }

    if (!this.available) {
      return {
        success: false,
        error: 'Ollama is not available. Ensure Ollama is running locally.',
        confidence: 0,
        source: this.name,
        timestamp: new Date(),
        data: { fallback: 'Ollama unavailable' },
      };
    }

    const targetModel = model || 'llama3';

    try {
      const body: any = {
        model: targetModel,
        prompt,
        stream: false,
      };

      if (system) body.system = system;
      if (temperature !== undefined) body.options = { ...(body.options || {}), temperature };
      if (numPredict) body.options = { ...(body.options || {}), num_predict: numPredict };
      if (stop?.length) body.options = { ...(body.options || {}), stop };

      const res = await this.fetchWithRetry(
        `${this.baseUrl}/api/generate`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(120000),
        },
      );

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Ollama returned ${res.status}: ${errText}`);
      }

      const data: OllamaGenerateResponse = await res.json();

      return {
        success: true,
        data: {
          response: data.response,
          model: data.model,
          done: data.done,
          metrics: {
            totalDurationMs: data.totalDuration ? Math.round(data.totalDuration / 1e6) : undefined,
            promptTokens: data.promptEvalCount,
            responseTokens: data.evalCount,
          },
        },
        confidence: 85,
        source: this.name,
        timestamp: new Date(),
      };
    } catch (err: any) {
      return {
        success: false,
        error: `Ollama generation failed: ${err.message}`,
        confidence: 0,
        source: this.name,
        timestamp: new Date(),
      };
    }
  }

  async chat(params: OllamaChatParams): Promise<PluginResult> {
    if (!this.available) {
      return {
        success: false,
        error: 'Ollama unavailable',
        confidence: 0,
        source: this.name,
        timestamp: new Date(),
      };
    }

    try {
      const body: any = {
        model: params.model,
        messages: params.messages,
        stream: false,
      };

      if (params.temperature !== undefined) body.options = { temperature: params.temperature };
      if (params.numPredict) body.options = { ...(body.options || {}), num_predict: params.numPredict };
      if (params.stop?.length) body.options = { ...(body.options || {}), stop: params.stop };

      const res = await this.fetchWithRetry(
        `${this.baseUrl}/api/chat`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(120000),
        },
      );

      if (!res.ok) {
        throw new Error(`Ollama chat returned ${res.status}`);
      }

      const data = await res.json();
      const message = data.message?.content || '';

      return {
        success: true,
        data: { response: message, model: data.model, done: data.done },
        confidence: 85,
        source: this.name,
        timestamp: new Date(),
      };
    } catch (err: any) {
      return {
        success: false,
        error: `Ollama chat failed: ${err.message}`,
        confidence: 0,
        source: this.name,
        timestamp: new Date(),
      };
    }
  }

  async listModels(): Promise<PluginResult> {
    if (!this.available) {
      return {
        success: false,
        error: 'Ollama unavailable',
        confidence: 0,
        source: this.name,
        timestamp: new Date(),
      };
    }

    try {
      const res = await fetch(`${this.baseUrl}/api/tags`, {
        signal: AbortSignal.timeout(5000),
      });
      const data = await res.json();
      const models = (data.models || []).map((m: any) => ({
        name: m.name,
        size: m.size,
        digest: m.digest,
        modifiedAt: m.modified_at,
      }));

      return {
        success: true,
        data: { models, count: models.length },
        confidence: 95,
        source: this.name,
        timestamp: new Date(),
      };
    } catch (err: any) {
      return {
        success: false,
        error: `Failed to list models: ${err.message}`,
        confidence: 0,
        source: this.name,
        timestamp: new Date(),
      };
    }
  }
}
