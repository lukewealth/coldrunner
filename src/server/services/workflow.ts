import { BusinessLead, SearchCriteria, WorkflowLog, WorkflowState } from '../types';
import { masterPlanner } from '../agents';
import { database } from './database';
import fs from 'fs';
import path from 'path';

const PERSIST_DIR = './data';
const PERSIST_FILE = path.join(PERSIST_DIR, 'workflow-state.json');

export class WorkflowEngine {
  private activeWorkflows: Map<string, WorkflowState> = new Map();
  private cancelledWorkflows: Set<string> = new Set();
  private workflowCriteria: Map<string, SearchCriteria> = new Map();
  private workflowPartialLeads: Map<string, BusinessLead[]> = new Map();

  async startWorkflow(criteria: SearchCriteria): Promise<{ workflowId: string; leads: BusinessLead[]; logs: WorkflowLog[] }> {
    const workflowId = `wf-${Date.now()}`;
    const logs: WorkflowLog[] = [];

    const state: WorkflowState = {
      id: workflowId,
      status: 'running',
      currentStep: 0,
      totalSteps: 6,
      tasks: [],
      results: [],
      startedAt: new Date(),
      progress: 0,
      logs,
    };

    this.activeWorkflows.set(workflowId, state);
    this.workflowCriteria.set(workflowId, criteria);
    this.persistState();

    const onLog = (log: Omit<WorkflowLog, 'id' | 'timestamp'>) => {
      const fullLog: WorkflowLog = {
        ...log,
        id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        timestamp: new Date(),
      };
      logs.push(fullLog);
      state.logs = logs;
      this.persistState();
    };

    try {
      const onProgress = (step: number, totalSteps: number, partialLeads: BusinessLead[]) => {
        state.currentStep = step;
        state.totalSteps = totalSteps;
        state.progress = Math.round((step / totalSteps) * 100);
        state.results = partialLeads;
        this.workflowPartialLeads.set(workflowId, partialLeads);
        this.persistState();
      };

      const leads = await masterPlanner.execute(criteria, onLog, onProgress);

      state.results = leads;
      state.status = 'completed';
      state.completedAt = new Date();
      state.progress = 100;
      this.persistState();

      database.saveLeads(leads);
      database.saveWorkflow(criteria, leads, logs);
      database.addSearchHistory(criteria, leads.length);

      return { workflowId, leads, logs };
    } catch (err: any) {
      state.status = 'failed';
      state.completedAt = new Date();
      this.persistState();
      onLog({ agent: 'Workflow Engine', level: 'error', message: `Workflow failed: ${err.message}` });
      throw err;
    }
  }

  getWorkflowStatus(workflowId: string): WorkflowState | undefined {
    return this.activeWorkflows.get(workflowId);
  }

  getActiveWorkflows(): WorkflowState[] {
    return Array.from(this.activeWorkflows.values());
  }

  cancelWorkflow(workflowId: string): boolean {
    const wf = this.activeWorkflows.get(workflowId);
    if (wf && wf.status === 'running') {
      wf.status = 'failed';
      wf.completedAt = new Date();
      this.cancelledWorkflows.add(workflowId);
      wf.logs.push({
        id: `log-${Date.now()}`,
        timestamp: new Date(),
        agent: 'Workflow Engine',
        level: 'warning',
        message: 'Workflow cancelled by user',
      });
      this.persistState();
      return true;
    }
    return false;
  }

  isCancelled(workflowId: string): boolean {
    return this.cancelledWorkflows.has(workflowId);
  }

  getResumeData(): { workflowId: string; criteria: SearchCriteria; step: number; leads: BusinessLead[] } | null {
    try {
      const filePath = path.resolve(PERSIST_FILE);
      if (!fs.existsSync(filePath)) return null;

      const raw = fs.readFileSync(filePath, 'utf-8');
      const data = JSON.parse(raw);

      if (!data.lastWorkflow || data.lastWorkflow.status !== 'failed') return null;

      return {
        workflowId: data.lastWorkflow.id,
        criteria: data.lastWorkflow.criteria,
        step: data.lastWorkflow.currentStep,
        leads: data.lastWorkflow.partialLeads || [],
      };
    } catch {
      return null;
    }
  }

  private persistState(): void {
    try {
      const dir = path.resolve(PERSIST_DIR);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      const workflows = Array.from(this.activeWorkflows.values());
      const last = workflows[workflows.length - 1];

      const data = {
        persistedAt: new Date().toISOString(),
        activeCount: workflows.filter((w) => w.status === 'running').length,
        lastWorkflow: last
          ? {
              id: last.id,
              status: last.status,
              currentStep: last.currentStep,
              totalSteps: last.totalSteps,
              progress: last.progress,
              criteria: this.workflowCriteria.get(last.id) || null,
              partialLeads: this.workflowPartialLeads.get(last.id) || last.results || [],
              logCount: last.logs.length,
              startedAt: last.startedAt,
              completedAt: last.completedAt,
            }
          : null,
      };

      fs.writeFileSync(path.resolve(PERSIST_FILE), JSON.stringify(data, null, 2), 'utf-8');
    } catch {
      // Persistence failure is non-fatal
    }
  }
}

export const workflowEngine = new WorkflowEngine();
