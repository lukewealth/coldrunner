import { Plugin, PluginResult } from '../types';
import { config } from '../config';

export abstract class BasePlugin implements Plugin {
  abstract name: string;
  abstract version: string;
  abstract description: string;
  protected initialized = false;

  async initialize(): Promise<void> {
    this.initialized = true;
  }

  abstract execute(params: any): Promise<PluginResult>;

  async healthCheck(): Promise<boolean> {
    return this.initialized;
  }

  protected validateApiKey(key: string | undefined, provider: string): void {
    if (!key || key === `MY_${provider}_API_KEY`) {
      throw new Error(`${provider} API key not configured. Set ${provider}_API_KEY in environment.`);
    }
  }
}
