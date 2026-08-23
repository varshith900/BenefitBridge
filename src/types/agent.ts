export type AgentStatus = 'IDLE' | 'PLANNING' | 'EXECUTING' | 'WAITING_FOR_USER' | 'COMPLETED' | 'ERROR';

export interface ToolCall {
  name: string;
  args: Record<string, any>;
  result?: any;
}

export interface AgentStep {
  id: string;
  description: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  toolCalls: ToolCall[];
  observation?: string;
}

export interface AgentPlan {
  steps: AgentStep[];
}

export interface AgentRun {
  id: string;
  uid: string;
  goal: string;
  status: AgentStatus;
  plan: AgentPlan | null;
  currentStepIndex: number;
  toolsUsed: string[];
  observations: string[];
  decisions: string[];
  pendingUserAction: string | null;
  nextAction: string | null;
  createdAt: number;
  updatedAt: number;
}

export interface AgentAction {
  id: string;
  timestamp: number;
  type: 'THOUGHT' | 'TOOL_CALL' | 'MESSAGE' | 'PLAN_UPDATE' | 'STEP_UPDATE' | 'ERROR';
  content: string;
  toolCall?: ToolCall;
}

export interface AgentSession {
  uid: string;
  sessionId: string;
  status: AgentStatus;
  currentRunId: string | null;
  history: AgentAction[];
  createdAt: number;
  updatedAt: number;
}
