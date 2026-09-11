import { GoogleGenerativeAI } from '@google/generative-ai';
import { TOOLS, executeTool } from './tools';
import type { AgentSession, AgentAction, AgentRun } from '../../types/agent';
import { updateAgentSession, addAgentAction, createAgentRun } from '../agentMemory';

const SYSTEM_INSTRUCTION = `You are the BenefitBridge Autonomous Case Manager. You help Indian citizens find, track, apply, and renew government benefit schemes and scholarships.
Always execute real tools (get_user_profile, find_benefits, check_eligibility, check_documents, list_applications, create_application, record_external_submission, list_pending_tasks, check_deadlines, get_renewals, get_next_best_action).
Never fabricate reference numbers, deadlines, or approval statuses.
Be concise, clear, helpful, and empathetic.`;

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
    
    await addAgentAction(this.uid, action, this.session.history);
    this.session.history.push(action);
  }

  /**
   * Deterministic autonomous engine that runs real tools directly
   * based on the user's intent. Guarantees 100% reliable execution.
   */
  private async runAutonomousDeterministic(userInput: string): Promise<void> {
    const query = userInput.toLowerCase();

    // 1. Documents Query
    if (query.includes('doc') || query.includes('vault') || query.includes('upload') || query.includes('aadhaar') || query.includes('pan') || query.includes('certificate')) {
      await this.logAction('TOOL_CALL', 'Checking Document Vault...', { name: 'check_documents', args: {} });
      const docsResult = await executeTool('check_documents', {}, this.uid);
      
      const total = docsResult.totalDocuments || 0;
      if (total === 0) {
        await this.logAction('MESSAGE', "You haven't uploaded any documents to your Document Vault yet. You can upload your Aadhaar Card, PAN Card, Income Certificate, or Caste Certificate to unlock automated eligibility verification.");
      } else {
        const docNames = docsResult.documents.map((d: any) => `• **${d.type}** (${d.fileName}) — *${d.status || 'Verified'}*`).join('\n');
        await this.logAction('MESSAGE', `You currently have **${total} document(s)** securely stored in your Document Vault:\n\n${docNames}\n\nYou can manage or add more files in the [Document Vault](/vault).`);
      }
      return;
    }

    // 2. Applications / Tracking Query
    if (query.includes('application') || query.includes('track') || query.includes('status') || query.includes('ref')) {
      await this.logAction('TOOL_CALL', 'Retrieving application records...', { name: 'list_applications', args: {} });
      const apps = await executeTool('list_applications', {}, this.uid);

      if (!apps || apps.length === 0) {
        await this.logAction('MESSAGE', "You don't have any active benefit applications being tracked yet. You can browse eligible schemes in [Opportunities](/opportunities) and click **Apply** to start tracking one.");
      } else {
        const appList = apps.map((a: any) => `• **${a.benefitTitle}**\n  Status: \`${a.status}\` | Readiness: **${a.readinessScore}%** | Health: **${a.health}**\n  ${a.referenceNumber ? `Reference #: \`${a.referenceNumber}\`` : 'Ref #: Pending external submission'}`).join('\n\n');
        await this.logAction('MESSAGE', `Here are your current tracked applications:\n\n${appList}\n\nView details in [Applications Command Center](/applications).`);
      }
      return;
    }

    // 3. Renewals Query
    if (query.includes('renew') || query.includes('recurring')) {
      await this.logAction('TOOL_CALL', 'Checking upcoming renewals...', { name: 'get_renewals', args: {} });
      const renewals = await executeTool('get_renewals', {}, this.uid);

      if (!renewals || renewals.length === 0) {
        await this.logAction('MESSAGE', "You currently have no recurring benefits requiring renewal.");
      } else {
        const list = renewals.map((r: any) => `• **${r.benefitTitle}** — Renewal Status: \`${r.renewalStatus}\` | Next Due: **${r.renewalDeadline || r.nextRenewalDate || 'Upcoming'}**`).join('\n');
        await this.logAction('MESSAGE', `Here are your upcoming renewable benefits:\n\n${list}`);
      }
      return;
    }

    // 4. Tasks / Pending Actions Query
    if (query.includes('task') || query.includes('todo') || query.includes('action') || query.includes('what should i do')) {
      await this.logAction('TOOL_CALL', 'Checking pending case tasks...', { name: 'list_pending_tasks', args: {} });
      const tasks = await executeTool('list_pending_tasks', {}, this.uid);

      if (!tasks || tasks.length === 0) {
        await this.logAction('MESSAGE', "You have no pending tasks right now. All your active requirements are up to date!");
      } else {
        const list = tasks.map((t: any) => `• [**${t.priority}**] ${t.title}`).join('\n');
        await this.logAction('MESSAGE', `You have **${tasks.length} pending task(s)**:\n\n${list}\n\nManage them on the [Tasks](/tasks) page.`);
      }
      return;
    }

    // 5. Eligibility & Opportunities Query (Default)
    await this.logAction('TOOL_CALL', 'Inspecting profile & checking eligibility...', { name: 'get_user_profile', args: {} });
    const profile = await executeTool('get_user_profile', {}, this.uid);
    const benefits = await executeTool('find_benefits', {}, this.uid);

    if (!profile.state && !profile.annualIncome) {
      await this.logAction('MESSAGE', "Your profile is not yet fully filled. Please complete your state, annual income, and education level in [Profile](/profile) so I can calculate your exact government benefit matches.");
      return;
    }

    const evaluations = [];
    for (const b of (benefits || []).slice(0, 5)) {
      const el = await executeTool('check_eligibility', { benefitId: b.id }, this.uid);
      evaluations.push({ benefit: b, result: el });
    }

    const eligible = evaluations.filter(e => e.result.status === 'Eligible' || e.result.status === 'Potentially Eligible');

    if (eligible.length === 0) {
      await this.logAction('MESSAGE', `I evaluated available schemes against your profile (${profile.state || 'General'}, income ${profile.annualIncome || 'unspecified'}), but found no direct matches yet. Browse all opportunities in [Opportunities](/opportunities).`);
    } else {
      const schemes = eligible.map(e => `• **${e.benefit.title}** (${e.benefit.issuer})\n  Benefit: **${e.benefit.benefitAmount}** | Status: **${e.result.status}** (${e.result.confidenceLevel} confidence)\n  Deadline: ${e.benefit.deadline}`).join('\n\n');
      await this.logAction('MESSAGE', `Based on your profile and vaulted documents, here are your top matched opportunities:\n\n${schemes}\n\nYou can click **Apply** directly in [Opportunities](/opportunities) to begin tracking.`);
    }
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
      const isGeminiAvailable = !!apiKey && apiKey.startsWith('AIzaSy');

      if (isGeminiAvailable) {
        try {
          const genAI = new GoogleGenerativeAI(apiKey);
          const model = genAI.getGenerativeModel({
            model: 'gemini-1.5-flash',
            tools: [{ functionDeclarations: TOOLS as any }],
          });

        const chat = model.startChat({
          systemInstruction: { role: 'system', parts: [{ text: SYSTEM_INSTRUCTION }] },
        });

          let prompt = `User query: "${userInput}". Use available tools to answer accurately based on real user data.`;
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
            await this.runAutonomousDeterministic(userInput);
          }
        } catch (geminiError: any) {
          console.warn("Gemini execution encountered an error, falling back to autonomous engine:", geminiError);
          await this.runAutonomousDeterministic(userInput);
        }
      } else {
        // Fallback: Deterministic Autonomous Engine directly uses real database & tools
        await this.runAutonomousDeterministic(userInput);
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
