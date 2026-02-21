# Nouns Builder — Deploy Your Own DAO (Hackathon Setup)

## Goal
Deploy a personal Nouns Builder DAO so we control:

- Governor contract address
- Proposal lifecycle
- Voting tests for AI agent

This is easier than integrating with an existing DAO.

---

## Option A — Create a DAO on nouns.build (fastest)

1. Go to **[nouns.build](https://nouns.build)** and connect a wallet.
2. Create a new DAO (e.g. “Test DAO” on the chain you want — **Base** or **Base Sepolia** for testnet).
3. After deployment, open your DAO page → **Contracts** (or **Settings** / **Contract addresses**).
4. Copy the **Governor** contract address.
5. In MeatLayer `.env.local` set:
   ```bash
   NEXT_PUBLIC_NOUNS_GOVERNOR_ADDRESS=0x...   # paste Governor address
   ```
6. If the DAO is on **Base** (chain 8453) or **Base Sepolia** (84532), our governance API uses Base Sepolia by default. If you deployed on **Base mainnet**, we need to point the API at Base mainnet (see “Chain” below).

---

## Option B — Use the Builder template app

Template repo: **[BuilderOSS/builder-template-app](https://github.com/BuilderOSS/builder-template-app)**.

### Step 1 — Clone and install

```bash
git clone https://github.com/BuilderOSS/builder-template-app
cd builder-template-app
pnpm install
```

### Step 2 — Configure for an existing DAO

The template **does not deploy** a new DAO; it’s a front end for an existing one. You need a DAO token address (from [nouns.build](https://nouns.build) or another deployment).

```bash
cp sample.env .env.local
```

Edit `.env.local`:

- `NEXT_PUBLIC_NETWORK_TYPE` — `"mainnet"` or `"testnet"`
- `NEXT_PUBLIC_CHAIN_ID` — e.g. `"8453"` (Base), `"84532"` (Base Sepolia), `"1"` (Ethereum)
- `NEXT_PUBLIC_DAO_TOKEN_ADDRESS` — your DAO’s **token** contract address (from the DAO’s contract list on nouns.build)
- `PINATA_API_KEY` — for IPFS (proposals/images)
- `NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID` — WalletConnect project ID

### Step 3 — Fetch DAO config (includes Governor)

```bash
pnpm fetch-dao
```

This pulls contract addresses from the chain and writes them into `src/config/`. Open the generated config (e.g. under `src/config/`) and find the **Governor** address.

### Step 4 — Use that Governor in MeatLayer

Copy the Governor address into MeatLayer:

```bash
# In monad_blitz/.env.local
NEXT_PUBLIC_NOUNS_GOVERNOR_ADDRESS=0x...   # from builder-template-app config
```

### Step 5 — Run the template (optional)

```bash
pnpm dev
```

Use the template site to create proposals and vote; use MeatLayer to run the “Run governance demo” flow against the same Governor.

---

## Chain and RPC

Our governance API currently uses **Base Sepolia** in code:

- **File:** `app/api/governance/latest/route.ts`
- **Used:** `baseSepolia` from `viem/chains` and default public RPC.

If your DAO is on **Base mainnet** (8453) or **Ethereum** (1), change that route to use the correct chain (e.g. `base` or `mainnet` from `viem/chains`) so reads hit the right network.

---

## Where the Governor is used in MeatLayer

| What | Where |
|------|--------|
| Governor address | `.env.local` → `NEXT_PUBLIC_NOUNS_GOVERNOR_ADDRESS` |
| Reading proposals | `app/api/governance/latest/route.ts` (read-only) |
| ABI for reads | `lib/governor-abi.ts` (`proposalCount`, `proposals(proposalId)`) |

If your Governor uses different function names or return shapes (e.g. OpenZeppelin Governor with `proposalSnapshot` / `proposalDeadline`), update `lib/governor-abi.ts` to match.

---

## Quick checklist

1. Create or pick a Nouns Builder DAO (nouns.build or existing deployment).
2. Get the **Governor** contract address (DAO Contracts tab or template’s `pnpm fetch-dao` config).
3. Set `NEXT_PUBLIC_NOUNS_GOVERNOR_ADDRESS` in `monad_blitz/.env.local`.
4. If the DAO is not on Base Sepolia, change the chain in `app/api/governance/latest/route.ts`.
5. Run “Run governance demo” on the Agents page; task should appear with the proposal and AI analysis.
