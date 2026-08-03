import { BusinessLead, SearchCriteria, AgentTask, AgentStatus, WorkflowLog, AgentType } from '../types';

export interface AgentContext {
  taskId: string;
  criteria: SearchCriteria;
  leads: BusinessLead[];
  logs: WorkflowLog[];
  onLog: (log: Omit<WorkflowLog, 'id' | 'timestamp'>) => void;
}

export interface Agent {
  type: AgentType;
  name: string;
  description: string;
  execute(context: AgentContext): Promise<AgentResult>;
}

export interface AgentResult {
  success: boolean;
  leads?: BusinessLead[];
  data?: any;
  error?: string;
  itemsProcessed: number;
}

export interface AgentOrchestrator {
  runWorkflow(criteria: SearchCriteria, onLog?: (log: Omit<WorkflowLog, 'id' | 'timestamp'>) => void): Promise<BusinessLead[]>;
  getStatus(): AgentStatus[];
  cancelWorkflow(workflowId: string): void;
}
