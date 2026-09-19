import { GoogleGenerativeAI } from '@google/generative-ai';
import { TOOLS, executeTool } from './tools';
import type { AgentSession, AgentAction, AgentRun } from '../../types/agent';
import { updateAgentSession, addAgentAction, createAgentRun } from '../agentMemory';

const SYSTEM_INSTRUCTION = `You are the BenefitBridge Autonomous Case Manager. You help Indian citizens find, track, apply, and renew government benefit schemes and scholarships.
Always execute real tools to fetch data before answering. Do NOT guess or hallucinate.
Available tools: get_user_profile, find_benefits, check_eligibility, check_documents, list_applications, create_application, record_external_submission, list_pending_tasks, check_deadlines, get_renewals, get_next_best_action.
Never fabricate reference numbers, deadlines, or approval statuses. Be concise, clear, helpful, and empathetic. Answer EXACTLY what the user asks based on the tool data.
CRITICAL: NEVER output raw JSON, tool response objects, or code blocks in your final message. Always translate the tool data into natural, human-readable conversational text.`;

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

  private async logAction(type: AgentAction['type'], content: string, toolCall?: AgentAction['toolCall'], role?: 'USER' | 'AGENT') {
    const action: AgentAction = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      type,
      content,
    };
    if (role) {
      action.role = role;
    }
    if (toolCall) {
      action.toolCall = toolCall;
    }
    
    // Clean up any stray undefined properties just in case
    const cleanAction = JSON.parse(JSON.stringify(action));
    
    await addAgentAction(this.uid, cleanAction, this.session.history);
    this.session.history.push(cleanAction);
  }

  async run(userInput: string): Promise<void> {
    try {
      await updateAgentSession(this.uid, { status: 'EXECUTING' });
      this.session.status = 'EXECUTING';
      await this.logAction('MESSAGE', userInput, undefined, 'USER');

      let run: AgentRun;
      try {
        run = await createAgentRun(this.uid, userInput);
        await updateAgentSession(this.uid, { currentRunId: run.id });
      } catch (e) {
        console.warn('Run creation note:', e);
      }

      // Check if Gemini API is configured
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      
      if (!apiKey || apiKey.length < 10) {
        await this.logAction('ERROR', "AI Engine Offline: Please provide a valid Gemini API Key in your `.env.local` file.");
        await updateAgentSession(this.uid, { status: 'IDLE' });
        this.session.status = 'IDLE';
        return;
      }

      try {
        // Dynamically find a supported model to avoid 404s on experimental keys
        const modelsRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        const modelsData = await modelsRes.json();
        const availableModels = modelsData.models
          ?.filter((m: any) => m.supportedGenerationMethods.includes('generateContent'))
          ?.map((m: any) => m.name.replace('models/', '')) || ['gemini-1.5-flash'];
        
        let selectedModel = 'gemini-1.5-flash';
        if (!availableModels.includes(selectedModel) && availableModels.length > 0) {
          // If standard flash isn't available (e.g. internal keys), use the first valid model
          selectedModel = availableModels[0];
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
          model: selectedModel,
          tools: [{ functionDeclarations: TOOLS as any }],
        });

        const chat = model.startChat({
          systemInstruction: { role: 'system', parts: [{ text: SYSTEM_INSTRUCTION }] },
        });

        let prompt = `User query: "${userInput}". Use available tools to answer accurately based on real user data. Do not hallucinate.`;
        let result = await chat.sendMessage(prompt);
        let calls = result.response.functionCalls();
        let text = result.response.text();

        let iterations = 0;
        while (calls && calls.length > 0 && iterations < 15) {
          const functionResponses = await Promise.all(
            calls.map(async (call) => {
              await this.logAction('TOOL_CALL', `Executing ${call.name}`, { name: call.name, args: call.args });
              let toolResult;
              try {
                toolResult = await executeTool(call.name, call.args, this.uid);
              } catch (toolErr: any) {
                console.error(`Tool ${call.name} failed:`, toolErr);
                toolResult = { error: toolErr.message || 'Tool execution failed' };
              }

              // Gemini requires the response to be a JSON Object (Protobuf Struct), not an Array or Primitive
              const safeResponse = (typeof toolResult === 'object' && toolResult !== null && !Array.isArray(toolResult))
                ? toolResult
                : { result: toolResult };

              return {
                functionResponse: {
                  name: call.name,
                  response: safeResponse,
                },
              };
            })
          );

          result = await chat.sendMessage(functionResponses);
          calls = result.response.functionCalls();
          text = result.response.text();
          iterations++;
        }

        if (text) {
          // Fallback regex to strip any hallucinated JSON blocks the model might leak
          let cleanText = text.replace(/\{"check_eligibility_response"\s*:\s*\{.*?\}\}/gs, '');
          cleanText = cleanText.replace(/\{"result"\s*:\s*\[.*?\]\}/gs, '');
          cleanText = cleanText.replace(/```json\s*.*?\s*```/gs, '');
          cleanText = cleanText.trim();
          
          await this.logAction('MESSAGE', cleanText || "I have analyzed your eligibility.", undefined, 'AGENT');
        } else {
          await this.logAction('ERROR', "I couldn't generate a clear response. Please try rephrasing your request.", undefined, 'AGENT');
        }
      } catch (geminiError: any) {
        let errorMessage = geminiError.message || 'Invalid API Key or Quota Exceeded. Please check your Gemini configuration.';
        if (apiKey) {
          errorMessage = errorMessage.replace(new RegExp(apiKey, 'g'), '[REDACTED_API_KEY]');
        }
        
        // Make rate limits friendly!
        if (errorMessage.includes('429') || errorMessage.toLowerCase().includes('quota')) {
          const delayMatch = errorMessage.match(/retryDelay.*?(\d+)s/);
          const waitTime = delayMatch ? delayMatch[1] + ' seconds' : 'a minute';
          await this.logAction('ERROR', `Google AI Rate Limit Reached! You are using the Free Tier, which allows a limited number of requests per minute. Please wait ${waitTime} before trying again.`);
        } else {
          await this.logAction('ERROR', `AI Engine Error: ${errorMessage}`);
        }
      }

      await updateAgentSession(this.uid, { status: 'IDLE' });
      this.session.status = 'IDLE';

    } catch (error: any) {
      console.error("Agent Loop Error:", error);
      
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      let errorMessage = error.message || 'Please try again.';
      if (apiKey) {
        errorMessage = errorMessage.replace(new RegExp(apiKey, 'g'), '[REDACTED_API_KEY]');
      }
      
      await this.logAction('ERROR', `Error processing request: ${errorMessage}`);
      await updateAgentSession(this.uid, { status: 'IDLE' });
      this.session.status = 'IDLE';
    }
  }
}
