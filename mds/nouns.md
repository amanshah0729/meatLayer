🥩 MeatLayer — Nouns Builder AI Delegate Extension
Objective

Extend MeatLayer by adding a DAO Governance Agent that participates in Nouns Builder governance.

The agent:

Reads DAO proposals

Evaluates them using an LLM

Votes automatically when confident

Defers to a human via MeatLayer when uncertain

This demonstrates:

Reduced governance friction

Human-in-the-loop AI governance

Direct integration with Nouns Builder smart contracts

This is NOT a new governance system.
This is an intelligent participation layer.

🧠 Concept

Most DAO members do not vote because proposals are complex.

We introduce:

AI Delegate Agents — ownable agents that analyze proposals and vote, escalating decisions to humans when confidence is low.

Core idea:

DAO Proposal
      ↓
AI Agent evaluates
      ↓
High confidence → Vote automatically
Low confidence → Request human review
🧱 Architecture Overview
Nouns Builder DAO
        ↓
Proposal Reader
        ↓
AI Agent (MeatLayer)
        ↓
Confidence Router
       / \
      /   \
 Auto Vote  Human Task (MeatLayer)
      ↓          ↓
 On-chain vote   Human decision
⚙️ System Components
1️⃣ Proposal Reader

Reads proposals from Nouns Builder contracts.

Required data:

proposalId

title

description

voting deadline

current vote counts

Implementation:

ethers.js read calls

no indexing required

2️⃣ Agent Evaluation

Agent sends proposal text to LLM.

Expected output:

{
  "decision": "FOR",
  "confidence": 0.82,
  "reasoning": "Treasury allocation aligns with DAO mission..."
}

Rules:

decision ∈ {FOR, AGAINST, ABSTAIN}

confidence ∈ [0,1]

3️⃣ Confidence Router

Config:

AUTO_VOTE_THRESHOLD = 0.75

Logic:

if confidence >= threshold:
    auto vote
else:
    create human review task
4️⃣ Human Escalation (Reuse MeatLayer)

Create task:

"Review DAO proposal #X and choose vote"

Human submits:

vote choice

optional reasoning

Result triggers vote execution.

5️⃣ Vote Execution

Agent executes vote using Builder DAO contract:

castVote(uint256 proposalId, uint8 support)

Where:

0 = AGAINST
1 = FOR
2 = ABSTAIN

This is the required meaningful on-chain action.

🌐 Frontend Requirements

Add new page:

/governance

Features:

Connect Wallet

Must connect to Builder DAO network (Sepolia/Base testnet).

View Proposals

Display:

Title

Summary

Time remaining

Current votes

Agent Analysis

Show:

AI reasoning

Confidence score

Recommended vote

Action State

Show one of:

✅ Auto voted

⏳ Awaiting human review

🧑 Human decision submitted

🔗 Required Nouns Builder Integration

Must directly interact with Builder contracts:

Read proposals

Submit votes

Use:

builder-template-app

as reference implementation.

No contract modification required.

🧪 Minimal Demo Flow

User opens governance page

Agent analyzes proposal

UI shows reasoning

Agent either:

votes automatically OR

creates MeatLayer human task

Vote transaction visible on explorer

📦 Deliverables

Required for submission:

Public GitHub repo

Open-source license (MIT)

Deployed web app (Vercel)

Demo video (2–3 minutes)

Slide deck

README must explain:

Human fallback concept

Governance improvement

Integration steps

🧠 Why This Matters

This improves:

DAO participation

Proposal comprehension

Decision latency

Governance accessibility

Agents act as delegates but humans remain final authority.

🚫 Out of Scope

Do NOT build:

New governance contracts

Token systems

Delegation marketplace

Analytics dashboards

DAO backend servers

Keep scope minimal.

🎯 Success Criteria

Judges must see:

✅ Direct Builder contract interaction
✅ Agent improves participation workflow
✅ Clear AI reasoning visible
✅ Human fallback demonstrated
✅ Working vote transaction

If these exist → submission qualifies strongly.

🏁 Implementation Order

Read proposals

LLM evaluation

Confidence routing

Auto vote execution

Human escalation

UI polish

Stop after this.

Core Principle

The agent is a governance participant, not a governance replacement.

AI accelerates decisions.
Humans retain control.

End of spec.