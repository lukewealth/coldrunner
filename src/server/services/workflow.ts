import { BusinessLead, SearchCriteria, WorkflowLog, WorkflowState } from '../types';
import { masterPlanner } from '../agents';
import { database } from './database';

export class WorkflowEngine {
  private activeWorkflows: Map<string, WorkflowState> = new Map();

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

    const onLog = (log: Omit<WorkflowLog, 'id' | 'timestamp'>) => {
      const fullLog: WorkflowLog = {
        ...log,
        id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        timestamp: new Date(),
      };
      logs.push(fullLog);
      state.logs = logs;
    };

    try {
      const leads = await masterPlanner.execute(criteria, onLog);
      
      state.results = leads;
      state.status = 'completed';
      state.completedAt = new Date();
      state.progress = 100;

      database.saveLeads(leads);
      database.saveWorkflow(criteria, leads, logs);
      database.addSearchHistory(criteria, leads.length);

      return { workflowId, leads, logs };
    } catch (err: any) {
      state.status = 'failed';
      state.completedAt = new Date();
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
      wf.logs.push({
        id: `log-${Date.now()}`,
        timestamp: new Date(),
        agent: 'Workflow Engine',
        level: 'warning',
        message: 'Workflow cancelled by user',
      });
      return true;
    }
    return false;
  }
}

export const workflowEngine = new WorkflowEngine();
