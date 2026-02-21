import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface TaskAnalysis {
  worker_instructions: string;
  expected_response_type: string; // e.g. "yes_no", "text", "multiple_choice", "numeric", "json"
}

/**
 * Analyze an incoming task with OpenAI. Takes the raw input_payload
 * and returns: clear worker instructions, difficulty estimate, and response type.
 */
export async function analyzeTask(
  inputPayload: Record<string, unknown>
): Promise<TaskAnalysis> {
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `You are a task routing engine for a human-in-the-loop platform. AI agents submit tasks they need humans to complete. Your job is to analyze the task and produce structured metadata.

Return JSON with exactly these fields:
- worker_instructions: Clear, concise instructions a human worker should follow to complete this task. Be specific about what to look at and what to respond with.
- expected_response_type: One of: "yes_no", "text", "multiple_choice", "numeric", "json"`,
      },
      {
        role: "user",
        content: `Analyze this task:\n${JSON.stringify(inputPayload, null, 2)}`,
      },
    ],
  });

  const content = response.choices[0].message.content;
  if (!content) {
    throw new Error("No response from OpenAI");
  }

  return JSON.parse(content) as TaskAnalysis;
}

export interface ProposalAnalysis {
  decision: "FOR" | "AGAINST" | "ABSTAIN";
  confidence: number;
  reasoning: string;
}

/**
 * Analyze a DAO proposal and return a vote recommendation with confidence.
 * Used for governance demo: when confidence is low, we send to MeatLayer.
 */
export async function analyzeProposal(proposalSummary: {
  title?: string;
  description?: string;
  proposalId?: string;
  forVotes?: string;
  againstVotes?: string;
  abstainVotes?: string;
  [key: string]: unknown;
}): Promise<ProposalAnalysis> {
  const { title, description, ...rest } = proposalSummary;
  const proposalText = [title, description].filter(Boolean).join("\n\n");
  const userContent = proposalText
    ? `Analyze this DAO proposal:\n\n${proposalText}\n\nCurrent votes: for ${rest.forVotes ?? "0"}, against ${rest.againstVotes ?? "0"}, abstain ${rest.abstainVotes ?? "0"}.`
    : `Analyze this DAO proposal:\n${JSON.stringify(proposalSummary, null, 2)}`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `You are a DAO governance analyst. Given a proposal summary, output JSON with:
- decision: One of "FOR", "AGAINST", "ABSTAIN"
- confidence: Number between 0 and 1 (how confident you are in this recommendation)
- reasoning: Short explanation for your recommendation and confidence level`,
      },
      { role: "user", content: userContent },
    ],
  });

  const content = response.choices[0].message.content;
  if (!content) {
    throw new Error("No response from OpenAI");
  }

  const parsed = JSON.parse(content) as ProposalAnalysis;
  if (!["FOR", "AGAINST", "ABSTAIN"].includes(parsed.decision)) {
    parsed.decision = "ABSTAIN";
  }
  parsed.confidence = Math.max(0, Math.min(1, Number(parsed.confidence) || 0));
  return parsed;
}
