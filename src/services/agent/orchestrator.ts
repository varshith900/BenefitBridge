import { GoogleGenerativeAI } from '@google/generative-ai';
import { TOOLS, executeTool } from './tools';
import type { AgentSession, AgentAction, AgentRun } from '../../types/agent';
import { updateAgentSession, addAgentAction, createAgentRun } from '../agentMemory';

const SYSTEM_INSTRUCTION = `You are the BenefitBridge Autonomous Case Manager. You help Indian citizens find, track, apply, and renew government benefit schemes and scholarships.
Always execute real tools to fetch data before answering. Do NOT guess or hallucinate.
Available tools: get_user_profile, find_benefits, check_eligibility, check_documents, list_applications, create_application, record_external_submission, list_pending_tasks, check_deadlines, get_renewals, get_next_best_action.
Never fabricate reference numbers, deadlines, or approval statuses. Be concise, clear, helpful, and empathetic. Answer EXACTLY what the user asks based on the tool data.`;

export class AgentOrchestrator {
  private uid: string;
  private session: AgentSession;

  constructor(uid: string, session: AgentSession) {
    this.uid = uid;
    this.session = session;
  }

  public setSession(session: AgentSession) {
    this.session = session;
  }

  private async logAction(type: AgentAction['type'], content: string, toolCall?: AgentAction['toolCall']) {
    const action: AgentAction = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      type,
      content,
    };
    if (toolCall) {
      action.toolCall = toolCall;
    }
    
    await addAgentAction(this.uid, action, this.session.history);
    this.session.history.push(action);
  }

  async run(userInput: string): Promise<void> {
    try {
      await updateAgentSession(this.uid, { status: 'EXECUTING' });
      this.session.status = 'EXECUTING';
      await this.logAction('MESSAGE', userInput);

      let run: AgentRun;
      try {
        run = await createAgentRun(this.uid, userInput);
        await updateAgentSession(this.uid, { currentRunId: run.id });
      } catch (e) {
        console.warn('Run creation note:', e);
      }

      // Check if Gemini API is configured
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      
      if (!apiKey || !apiKey.startsWith('AIza')) {
        await this.logAction('ERROR', "AI Engine Offline: The API key provided in your `.env.local` file is invalid. Google AI Studio keys must start with 'AIza'. The current key is causing a '404 Model Not Found' error. Please get a free API key from aistudio.google.com and update your .env.local file.");
        await updateAgentSession(this.uid, { status: 'IDLE' });
        this.session.status = 'IDLE';
        return;
      }

      try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
          model: 'gemini-1.5-flash',
          tools: [{ functionDeclarations: TOOLS as any }],
        });

        const chat = model.startChat({
          systemInstruction: { role: 'system', parts: [{ text: SYSTEM_INSTRUCTION }] },
        });

        let prompt = `User query: "${userInput}". Use available tools to answer accurately based on real user data. Do not hallucinate.`;
        let result = await chat.sendMessage(prompt);
        let call = result.response.functionCalls()?.[0];
        let text = result.response.text();

        let iterations = 0;
        while (call && iterations < 5) {
          await this.logAction('TOOL_CALL', `Executing ${call.name}`, { name: call.name, args: call.args });
          const toolResult = await executeTool(call.name, call.args, this.uid);

          result = await chat.sendMessage([{
            functionResponse: {
              name: call.name,
              response: toolResult,
            },
          }]);

          call = result.response.functionCalls()?.[0];
          text = result.response.text();
          iterations++;
        }

        if (text) {
          await this.logAction('MESSAGE', text);
        } else {
          await this.logAction('ERROR', "I couldn't generate a clear response. Please try rephrasing your request.");
        }
      } catch (geminiError: any) {
        console.error("Gemini execution encountered an error:", geminiError);
        await this.logAction('ERROR', `AI Engine Error: ${geminiError.message || 'Invalid API Key or Quota Exceeded. Please check your Gemini configuration.'}`);
      }

      await updateAgentSession(this.uid, { status: 'IDLE' });
      this.session.status = 'IDLE';

    } catch (error: any) {
      console.error("Agent Loop Error:", error);
      await this.logAction('ERROR', `Error processing request: ${error.message || 'Please try again.'}`);
      await updateAgentSession(this.uid, { status: 'IDLE' });
      this.session.status = 'IDLE';
    }
  }
}
