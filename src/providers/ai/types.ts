/**
 * AI module — reserved for future integration.
 * No runtime calls in Phase 0. Interfaces only.
 */

export type AiTask =
  | "chat_assistant"
  | "property_description"
  | "seo_meta"
  | "blog_draft"
  | "lead_scoring"
  | "property_recommendation"
  | "market_insights";

export interface AiGenerateRequest {
  task: AiTask;
  organizationId: string;
  prompt: string;
  context?: Record<string, unknown>;
}

export interface AiGenerateResult {
  task: AiTask;
  content: string;
  meta?: Record<string, unknown>;
}

export interface AiProvider {
  readonly name: string;
  generate(request: AiGenerateRequest): Promise<AiGenerateResult>;
}

/** Placeholder — wire OpenAI / Anthropic / custom later */
export class NullAiProvider implements AiProvider {
  readonly name = "null";

  async generate(request: AiGenerateRequest): Promise<AiGenerateResult> {
    return {
      task: request.task,
      content: "",
      meta: { enabled: false },
    };
  }
}
