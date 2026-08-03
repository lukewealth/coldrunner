const BROWSER_USE_API_URL = process.env.BROWSER_USE_API_URL?.trim() || 'https://api.browser-use.com/api/v2';
const BROWSER_USE_API_KEY = process.env.BROWSER_USE_API_KEY?.trim() || '';

export interface BrowserUseTask {
  id: string;
  sessionId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'stopped';
  task: string;
  output?: string;
  outputFiles?: Array<{ id: string; name: string; url: string }>;
  steps?: BrowserUseStep[];
  createdAt: string;
  updatedAt: string;
  error?: string;
}

export interface BrowserUseStep {
  id: string;
  action: string;
  result?: string;
  screenshot?: string;
  timestamp: string;
}

export interface BrowserUseSession {
  id: string;
  status: 'active' | 'stopped';
  liveUrl?: string;
  createdAt: string;
  profile?: string;
  proxy?: string;
}

export interface CreateTaskOptions {
  task: string;
  sessionId?: string;
  model?: string;
  maxSteps?: number;
  timeout?: number;
}

export interface CreateSessionOptions {
  profile?: string;
  proxy?: {
    country?: string;
    username?: string;
    password?: string;
  };
}

async function browserUseRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T | null> {
  if (!BROWSER_USE_API_KEY) {
    console.warn('[BrowserUse] API key not configured');
    return null;
  }

  try {
    const res = await fetch(`${BROWSER_USE_API_URL}${endpoint}`, {
      ...options,
      headers: {
        'X-Browser-Use-API-Key': BROWSER_USE_API_KEY,
        'Content-Type': 'application/json',
        ...options.headers,
      },
      signal: AbortSignal.timeout(options.signal ? undefined : 60000),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error(`[BrowserUse] ${endpoint} returned ${res.status}: ${errorText}`);
      return null;
    }

    return await res.json() as T;
  } catch (err: any) {
    console.error(`[BrowserUse] ${endpoint} error:`, err.message);
    return null;
  }
}

export async function createTask(options: CreateTaskOptions): Promise<BrowserUseTask | null> {
  const { task, sessionId, model = 'bu-2-0', maxSteps = 50, timeout = 300 } = options;

  const body: any = {
    task,
    model,
    max_steps: maxSteps,
    timeout_seconds: timeout,
  };

  if (sessionId) {
    body.session_id = sessionId;
  }

  return await browserUseRequest<BrowserUseTask>('/tasks', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function getTask(taskId: string): Promise<BrowserUseTask | null> {
  return await browserUseRequest<BrowserUseTask>(`/tasks/${taskId}`);
}

export async function listTasks(page = 1, limit = 10): Promise<{ tasks: BrowserUseTask[]; total: number } | null> {
  return await browserUseRequest<{ tasks: BrowserUseTask[]; total: number }>(
    `/tasks?page=${page}&limit=${limit}`
  );
}

export async function stopTask(taskId: string): Promise<BrowserUseTask | null> {
  return await browserUseRequest<BrowserUseTask>(`/tasks/${taskId}`, {
    method: 'PATCH',
    body: JSON.stringify({ status: 'stopped' }),
  });
}

export async function getTaskLogs(taskId: string): Promise<string | null> {
  if (!BROWSER_USE_API_KEY) return null;

  try {
    const res = await fetch(`${BROWSER_USE_API_URL}/tasks/${taskId}/logs`, {
      headers: {
        'X-Browser-Use-API-Key': BROWSER_USE_API_KEY,
      },
      signal: AbortSignal.timeout(30000),
    });

    if (!res.ok) return null;
    return await res.text();
  } catch (err: any) {
    console.error(`[BrowserUse] getTaskLogs error:`, err.message);
    return null;
  }
}

export async function createSession(options: CreateSessionOptions = {}): Promise<BrowserUseSession | null> {
  const body: any = {};

  if (options.profile) {
    body.profile = options.profile;
  }

  if (options.proxy) {
    body.proxy = options.proxy;
  }

  return await browserUseRequest<BrowserUseSession>('/sessions', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function getSession(sessionId: string): Promise<BrowserUseSession | null> {
  return await browserUseRequest<BrowserUseSession>(`/sessions/${sessionId}`);
}

export async function listSessions(page = 1, limit = 10): Promise<{ sessions: BrowserUseSession[]; total: number } | null> {
  return await browserUseRequest<{ sessions: BrowserUseSession[]; total: number }>(
    `/sessions?page=${page}&limit=${limit}`
  );
}

export async function stopSession(sessionId: string): Promise<BrowserUseSession | null> {
  return await browserUseRequest<BrowserUseSession>(`/sessions/${sessionId}`, {
    method: 'PATCH',
    body: JSON.stringify({ status: 'stopped' }),
  });
}

export async function getAccountBalance(): Promise<{ balance: number; plan: string } | null> {
  return await browserUseRequest<{ balance: number; plan: string }>('/billing/account');
}

export async function waitForTaskCompletion(
  taskId: string,
  pollInterval = 2000,
  maxWaitTime = 300000
): Promise<BrowserUseTask | null> {
  const startTime = Date.now();

  while (Date.now() - startTime < maxWaitTime) {
    const task = await getTask(taskId);

    if (!task) {
      await new Promise((resolve) => setTimeout(resolve, pollInterval));
      continue;
    }

    if (task.status === 'completed' || task.status === 'failed' || task.status === 'stopped') {
      return task;
    }

    await new Promise((resolve) => setTimeout(resolve, pollInterval));
  }

  return await getTask(taskId);
}

export function isBrowserUseAvailable(): boolean {
  return !!BROWSER_USE_API_KEY;
}

export async function runBrowserTask(task: string, options?: Partial<CreateTaskOptions>): Promise<BrowserUseTask | null> {
  const created = await createTask({ task, ...options });
  if (!created) return null;

  return await waitForTaskCompletion(created.id);
}
