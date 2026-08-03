import { pluginRegistry } from '../plugins';
import { channelManager } from './channels';
import { cache } from './cache';
import { config } from '../config';

export interface DiagnosticResult {
  name: string;
  description: string;
  status: 'ok' | 'warn' | 'off' | 'error';
  message: string;
  tier: 0 | 1 | 2;
  activeBackend?: string;
  availableBackends?: string[];
  latencyMs?: number;
}

export interface DiagnosticReport {
  timestamp: string;
  summary: {
    total: number;
    ok: number;
    warn: number;
    off: number;
    error: number;
  };
  channels: Record<string, DiagnosticResult>;
  plugins: Record<string, DiagnosticResult>;
  system: {
    cache: {
      enabled: boolean;
      stats: {
        totalEntries: number;
        validEntries: number;
        expiredEntries: number;
      };
    };
    config: {
      retryEnabled: boolean;
      maxRetries: number;
      cacheTtlMs: number;
    };
  };
}

export class DoctorService {
  async diagnose(): Promise<DiagnosticReport> {
    const channels = await this.diagnoseChannels();
    const plugins = await this.diagnosePlugins();
    const system = this.diagnoseSystem();

    const allResults = [...Object.values(channels), ...Object.values(plugins)];

    return {
      timestamp: new Date().toISOString(),
      summary: {
        total: allResults.length,
        ok: allResults.filter((r) => r.status === 'ok').length,
        warn: allResults.filter((r) => r.status === 'warn').length,
        off: allResults.filter((r) => r.status === 'off').length,
        error: allResults.filter((r) => r.status === 'error').length,
      },
      channels,
      plugins,
      system,
    };
  }

  private async diagnoseChannels(): Promise<Record<string, DiagnosticResult>> {
    const results: Record<string, DiagnosticResult> = {};
    const diagnostics = await channelManager.diagnose();

    for (const [channelName, backends] of Object.entries(diagnostics)) {
      const channel = channelManager.getChannel(channelName);
      if (!channel) continue;

      const activeBackend = await channelManager.getActiveBackend(channelName);
      const okBackend = backends.find((b) => b.status === 'ok');

      results[channelName] = {
        name: channel.name,
        description: channel.description,
        status: okBackend ? 'ok' : backends.some((b) => b.status === 'warn') ? 'warn' : 'off',
        message: okBackend
          ? okBackend.message
          : backends.length > 0
            ? backends.map((b) => `${b.name}: ${b.message}`).join('; ')
            : 'No backends configured',
        tier: channel.tier,
        activeBackend: activeBackend || undefined,
        availableBackends: backends.map((b) => b.name),
        latencyMs: okBackend?.latencyMs,
      };
    }

    return results;
  }

  private async diagnosePlugins(): Promise<Record<string, DiagnosticResult>> {
    const results: Record<string, DiagnosticResult> = {};
    const health = await pluginRegistry.healthCheck();

    for (const [name, isHealthy] of Object.entries(health)) {
      const plugin = pluginRegistry.get(name);
      if (!plugin) continue;

      const hasApiKey = this.pluginHasApiKey(name);

      results[name] = {
        name: plugin.name,
        description: plugin.description,
        status: isHealthy ? (hasApiKey ? 'ok' : 'warn') : 'off',
        message: isHealthy
          ? hasApiKey
            ? 'Plugin initialized and API key configured'
            : 'Plugin initialized but using simulated data (no API key)'
          : 'Plugin failed to initialize',
        tier: hasApiKey ? 0 : 1,
      };
    }

    return results;
  }

  private diagnoseSystem() {
    const cacheStats = cache.getStats();

    return {
      cache: {
        enabled: config.cache.enabled,
        stats: {
          totalEntries: cacheStats.totalEntries,
          validEntries: cacheStats.validEntries,
          expiredEntries: cacheStats.expiredEntries,
        },
      },
      config: {
        retryEnabled: config.retry.maxAttempts > 1,
        maxRetries: config.retry.maxAttempts,
        cacheTtlMs: config.cache.defaultTtlMs,
      },
    };
  }

  private pluginHasApiKey(pluginName: string): boolean {
    const keyMap: Record<string, string> = {
      'google-places': config.apiKeys.googlePlaces,
      'firecrawl': config.apiKeys.firecrawl,
      'hunter': config.apiKeys.hunter,
      'apollo': config.apiKeys.apollo,
      'pagespeed': config.apiKeys.pagespeed,
    };

    const key = keyMap[pluginName];
    return !!key && key !== '' && !key.startsWith('MY_');
  }

  formatReport(report: DiagnosticReport): string {
    const lines: string[] = [];

    lines.push('ColdRunners System Health');
    lines.push('='.repeat(50));
    lines.push('');
    lines.push(`Status: ${report.summary.ok}/${report.summary.total} healthy`);
    lines.push('');

    const tier0 = Object.values({ ...report.channels, ...report.plugins }).filter((r) => r.tier === 0);
    const tier1 = Object.values({ ...report.channels, ...report.plugins }).filter((r) => r.tier === 1);
    const tier2 = Object.values({ ...report.channels, ...report.plugins }).filter((r) => r.tier === 2);

    if (tier0.length > 0) {
      lines.push('Core Services (zero-config):');
      for (const r of tier0) {
        const icon = r.status === 'ok' ? '[OK]' : r.status === 'warn' ? '[!!]' : '[XX]';
        const backend = r.activeBackend ? ` (${r.activeBackend})` : '';
        lines.push(`  ${icon} ${r.name}: ${r.message}${backend}`);
      }
      lines.push('');
    }

    if (tier1.length > 0) {
      const active = tier1.filter((r) => r.status === 'ok');
      if (active.length > 0) {
        lines.push('Optional Services (configured):');
        for (const r of active) {
          lines.push(`  [OK] ${r.name}: ${r.message}`);
        }
        lines.push('');
      }

      const inactive = tier1.filter((r) => r.status !== 'ok');
      if (inactive.length > 0) {
        lines.push(`Optional Services (not configured): ${inactive.length}`);
        lines.push(`  ${inactive.map((r) => r.name).join(', ')}`);
        lines.push('');
      }
    }

    if (tier2.length > 0) {
      const active = tier2.filter((r) => r.status === 'ok');
      if (active.length > 0) {
        lines.push('Advanced Services:');
        for (const r of active) {
          lines.push(`  [OK] ${r.name}: ${r.message}`);
        }
        lines.push('');
      }
    }

    lines.push('System Configuration:');
    lines.push(`  Cache: ${report.system.cache.enabled ? 'enabled' : 'disabled'} (${report.system.cache.stats.validEntries} entries)`);
    lines.push(`  Retry: ${report.system.config.retryEnabled ? `${report.system.config.maxRetries} attempts` : 'disabled'}`);
    lines.push(`  Cache TTL: ${Math.round(report.system.config.cacheTtlMs / 1000 / 60)} minutes`);

    return lines.join('\n');
  }
}

export const doctorService = new DoctorService();
