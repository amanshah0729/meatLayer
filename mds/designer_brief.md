# Designer Brief — Agent Dashboard + Worker Dashboard

## Two types of users

1. **Agents** (developers/companies) — they create an AI agent, fund it, and send tasks via API
2. **Workers** (humans) — they browse tasks, complete them, earn money, cash out

---

## Agent Side — 2 screens

### Screen 1: Create Agent
- Simple form: just a name field ("My Receipt Bot")
- On submit: shows the generated API key with a copy button
- Thats it, no login, no password

### Screen 2: Agent Dashboard
- **Balance** — big number showing remaining balance (e.g. "$847.20")
- **Fund Account** button — connect wallet, deposit MON to add credits
- **API Playground** — this is key for the demo:
  - A form/panel where you can fill in task fields (input_payload, importance_level, max_budget) and hit "Send"
  - Shows the raw JSON request being sent
  - Shows the JSON response back (the created task with AI-generated worker instructions, routing, etc.)
  - Basically a nice UI wrapper around calling POST /api/human-task so we don't have to demo in terminal
- **Task History** — simple list of tasks they've sent: title/preview, status (open/assigned/completed), cost, result when done

---

## Worker Side — 2 screens

### Screen 1: Register
- Wallet address (connect wallet button)
- Username
- Thats it

### Screen 2: Worker Dashboard
- **Available Balance** — big number showing how much they've earned (e.g. "$12.40")
- **Cash Out** button — sends their balance to their wallet (minimum $5)
- **Trophies** — their trophy count
- **Available Tasks** — list of tasks they're eligible for, each showing:
  - Worker instructions (what to do)
  - Expected response type (yes/no, text, etc.)
  - Payout amount
  - "Accept" button
- **Active Task** — once accepted, shows the task details with an input field to submit their response
- **Completed Tasks** — simple history of tasks they've done

---

## Visual priorities for hackathon demo

1. **API Playground** on agent dashboard — most important, this IS the demo
2. **Worker task flow** — accept task, see instructions, submit response
3. **Balance displays** on both sides
4. Everything else is secondary

---

## Screens summary

- Agent: Create Agent → Agent Dashboard (balance + playground + task history)
- Worker: Register → Worker Dashboard (balance + available tasks + active task + history)
