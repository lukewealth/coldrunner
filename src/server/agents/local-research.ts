import { Agent, AgentContext, AgentResult } from './types';
import { BusinessLead, WorkflowLog } from '../types';

export interface ResearchQuery {
  question: string;
  context?: string;
  maxIterations?: number;
  model?: string;
}

export interface ResearchStep {
  iteration: number;
  action: 'search' | 'analyze' | 'synthesize' | 'done';
  query?: string;
  findings?: string[];
  reasoning?: string;
}

export interface ResearchResult {
  answer: string;
  sources: { title: string; url: string; snippet: string }[];
  steps: ResearchStep[];
  model: string;
  confidence: number;
  followUpSuggestions: string[];
}

export class LocalResearchAgent implements Agent {
  type = 'local-research' as const;
  name = 'Local Research Agent';
  description = 'Recursively researches questions using local LLM (Ollama) + SearXNG web search. No cloud API keys needed.';

  async execute(context: AgentContext): Promise<AgentResult> {
    const query = context.criteria.aiPromptQuery || context.criteria.category;
    const maxIterations = 3;

    context.onLog({
      agent: this.name,
      level: 'info',
      message: `Starting local research for: "${query}"`,
    });

    try {
      const { pluginRegistry } = await import('../plugins');
      const searxng = pluginRegistry.get('searxng');
      const ollama = pluginRegistry.get('ollama');

      const steps: ResearchStep[] = [];
      const allFindings: string[] = [];
      const allSources: { title: string; url: string; snippet: string }[] = [];

      for (let i = 0; i < maxIterations; i++) {
        context.onLog({
          agent: this.name,
          level: 'info',
          message: `Research iteration ${i + 1}/${maxIterations}`,
        });

        let searchQuery = query;
        if (i > 0) {
          const refinePrompt = `Based on these findings so far:\n${allFindings.join('\n')}\n\nGenerate a more specific search query to deepen research on: ${query}. Return ONLY the search query, nothing else.`;

          if (ollama) {
            const refineResult = await ollama.execute({
              model: 'llama3',
              prompt: refinePrompt,
              numPredict: 100,
            });
            if (refineResult.success && refineResult.data?.response) {
              searchQuery = refineResult.data.response.trim().replace(/^["']|["']$/g, '');
            }
          }
        }

        steps.push({ iteration: i + 1, action: 'search', query: searchQuery });

        if (searxng) {
          const searchResult = await searxng.execute({
            query: searchQuery,
            categories: ['general', 'science', 'news'],
            language: 'en',
            pageno: 1,
          });

          if (searchResult.success && searchResult.data?.results) {
            const results = searchResult.data.results.slice(0, 5);
            const findings = results.map((r: any) => `${r.title}: ${r.content}`);
            allFindings.push(...findings);

            for (const r of results) {
              allSources.push({ title: r.title, url: r.url, snippet: r.content });
            }

            steps[i].findings = findings;
            context.onLog({
              agent: this.name,
              level: 'success',
              message: `Found ${results.length} results for "${searchQuery}"`,
            });
          } else {
            context.onLog({
              agent: this.name,
              level: 'warning',
              message: `SearXNG returned no results for "${searchQuery}"`,
            });
          }
        } else {
          context.onLog({
            agent: this.name,
            level: 'warning',
            message: 'SearXNG plugin not available, skipping web search',
          });
        }
      }

      let answer = '';
      let followUpSuggestions: string[] = [];

      if (ollama && allFindings.length > 0) {
        const synthesizePrompt = `You are a research assistant. Based on the following findings from web searches, provide a comprehensive answer to the question.

Question: ${query}

Findings:
${allFindings.map((f, i) => `${i + 1}. ${f}`).join('\n')}

Provide:
1. A clear, detailed answer (3-5 paragraphs)
2. 3 follow-up questions for deeper research

Format your response as JSON:
{"answer": "...", "followUpSuggestions": ["...", "...", "..."]}`;

        const synthesizeResult = await ollama.execute({
          model: 'llama3',
          prompt: synthesizePrompt,
          temperature: 0.3,
          numPredict: 2000,
        });

        steps.push({ iteration: maxIterations + 1, action: 'synthesize', reasoning: 'Synthesized findings into answer' });

        if (synthesizeResult.success && synthesizeResult.data?.response) {
          try {
            const parsed = JSON.parse(synthesizeResult.data.response);
            answer = parsed.answer || synthesizeResult.data.response;
            followUpSuggestions = parsed.followUpSuggestions || [];
          } catch {
            answer = synthesizeResult.data.response;
          }
        }

        context.onLog({
          agent: this.name,
          level: 'success',
          message: `Research complete. Generated answer from ${allFindings.length} findings.`,
        });
      } else {
        answer = `Research completed with ${allFindings.length} findings from web search. Ollama is not available for answer synthesis. Review the sources below for detailed information.`;
        context.onLog({
          agent: this.name,
          level: 'warning',
          message: 'Ollama not available — returning raw findings without synthesis',
        });
      }

      steps.push({ iteration: maxIterations + 2, action: 'done' });

      const researchResult: ResearchResult = {
        answer,
        sources: allSources,
        steps,
        model: ollama ? 'llama3 (local)' : 'no-llm',
        confidence: allFindings.length > 5 ? 80 : 60,
        followUpSuggestions,
      };

      return {
        success: true,
        data: researchResult,
        itemsProcessed: allSources.length,
      };
    } catch (err: any) {
      context.onLog({
        agent: this.name,
        level: 'error',
        message: `Research failed: ${err.message}`,
      });
      return {
        success: false,
        error: err.message,
        itemsProcessed: 0,
      };
    }
  }
}
