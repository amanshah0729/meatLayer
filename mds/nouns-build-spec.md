# Nouns Builder — Run Demo (Create Agent Flow)

**Goal:** One **Run demo** button on the create-agent flow (Agents page). It: (1) calls the governance contract and reads a proposal, (2) uses AI to analyze it, (3) sends to MeatLayer with that analysis and the message that the agent is **not confident enough** so a human should review. No new pages.

---

## Flow

1. User is on **Agents** page (create flow or after creating an agent).
2. User clicks **Run demo**.
3. **Backend / client:**  
   - Call governance contract (via `GET /api/governance/latest` or equivalent) → get latest proposal (id, vote counts, title/description if available).  
   - Send proposal text to **AI** → get analysis: reasoning + confidence (and optionally FOR/AGAINST/ABSTAIN).  
   - **Send to MeatLayer:** `POST /api/human-task` with `input_payload` that includes:
     - The proposal (id, votes, etc.),
     - The **AI analysis** (reasoning, confidence),
     - Clear framing: **“Agent is not confident enough; here’s the analysis — please review and decide.”**
4. A task shows up in the Workers dashboard: human sees the proposal + AI analysis and can complete the task (e.g. choose vote or approve).

So: **governance contract → AI analysis → MeatLayer (because not confident enough).**

---

## What you build

| Piece | What |
|-------|------|
| **Governance read** | One route (e.g. `GET /api/governance/latest`) that reads the Builder Governor and returns the latest proposal. |
| **AI analysis** | One function (e.g. in `lib/ai.ts`): takes proposal text/summary, returns `{ reasoning, confidence, decision? }`. One API route (e.g. `POST /api/governance/analyze`) or fold into a single “run demo” route. |
| **Run demo** | One route (e.g. `POST /api/governance/run-demo`) that: fetches latest proposal → calls AI analysis → creates human-task via existing logic (or calls `POST /api/human-task` internally) with payload = proposal + analysis + “not confident enough, please review.” Or: client calls governance API → analyze API → human-task API in sequence. |
| **Button** | One button on the **Agents** page (create flow): **“Run demo”**. On click: run the flow above. Must use the **current agent** (the one just created or selected) for the human-task (api_key or token_id + wallet). |
| **No** | New screens, proposal list UI, vote UI, or extra governance pages. |

---

## Env

- **`NEXT_PUBLIC_NOUNS_GOVERNOR_ADDRESS`** — Address of the Nouns Builder Governor contract (e.g. on Base Sepolia). If unset, `GET /api/governance/latest` returns 503 and Run demo will fail.

## Files

- **New:** `app/api/governance/latest/route.ts` — read Governor, return latest proposal.
- **New (or extend):** `lib/ai.ts` — e.g. `analyzeProposal(proposalSummary)` → `{ reasoning, confidence }`.
- **New:** `app/api/governance/run-demo/route.ts` (or client-side sequence) — get proposal → analyze → POST human-task with proposal + analysis + “not confident” framing. Needs agent auth (e.g. body: `api_key` or `token_id` + `wallet_address`).
- **Edit:** `app/agents/page.tsx` — add **“Run demo”** button (e.g. in create flow or next to “My agents”). On click: call run-demo API (or governance latest → analyze → human-task) using the selected/new agent.

---

## Demo script

1. “I set up the agent with access to read the Builder DAO governance contract.”
2. “When I hit **Run demo**, the agent fetches the latest proposal, uses AI to analyze it, and because it’s not confident enough it sends the analysis to MeatLayer for human review.”
3. Click **Run demo**. Task appears in Workers with the proposal + AI analysis and “not confident enough — please review.”
4. “That’s the use case: governance → AI analysis → human-in-the-loop when the agent isn’t confident.”

So: **Run demo** on create agent → governance contract → AI analysis → MeatLayer with “not confident enough.” Correct.

---

## Does this spec make sense for this project and for this prize?

**For this project (MeatLayer):** Yes. MeatLayer’s job is human-in-the-loop when the agent isn’t sure. The flow is: agent reads Builder DAO → AI analyzes → agent is “not confident enough” → sends to MeatLayer with analysis. That’s exactly the “defer to human via MeatLayer when uncertain” from the original brief. No new product; you’re reusing existing agents, human-task API, and dashboard.

**For the prize (Nouns Builder AI Delegate):** Mostly yes; one criterion is partly uncovered.

| Prize criterion | Spec |
|-----------------|------|
| Direct Builder contract interaction | Yes — you read proposals from the Governor in `GET /api/governance/latest`. |
| Agent improves participation workflow | Yes — agent fetches proposal, analyzes, escalates to human. |
| Clear AI reasoning visible | Yes — reasoning (and confidence) go into the MeatLayer task; human sees them in the Workers dashboard. |
| Human fallback demonstrated | Yes — “not confident enough” → task to MeatLayer. |
| **Working vote transaction** | Not in current spec — you don’t call `castVote` on-chain. Judges may expect to see a vote tx on an explorer. |

So the spec is right for the project and hits 4 of 5 prize bullets. To fully match the prize, add the smallest possible vote step: e.g. when the human completes the governance task, they (or a “Submit vote” action) call the Governor’s `castVote(proposalId, support)` from the frontend so one vote transaction is visible. That can be a single button on the task completion flow or a link from the dashboard (“Submit vote on-chain”) that triggers `castVote` with the human’s choice — no new pages, just one write to the Builder contract so the “working vote transaction” box is checked.
