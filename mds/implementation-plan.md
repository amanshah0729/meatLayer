# Implementation Plan: MeatLayer + 0G iNFT (Option A)

## Overview

| Component | Current | Target |
|-----------|---------|--------|
| Agent auth | `api_key` | NFT ownership (wallet + signature) |
| Agent config | Not stored | Encrypted blob in 0G Storage |
| Agent identity | Supabase `agents.id` | iNFT `tokenId` on 0G |
| Human list | None | Backend (Supabase) keyed by `tokenId` |

---

## Phase 1: Contract & Infrastructure ✅

### 1.1 iNFT Contract (0G)
- [x] Add `AgentINFT.sol` in `backend/contracts/`
  - ERC-721 with `mintAgent(to, storagePointer, blobHash)` → returns `tokenId`
  - `agentData[tokenId]` = `{ storagePointer, blobHash }`
  - `ownerOf(tokenId)` = agent control
- [x] Add 0G testnet to `backend/hardhat.config.ts` (RPC: `https://evmrpc-testnet.0g.ai`)
- [x] Add Ignition deploy module for `AgentINFT`
- [x] Deploy to 0G testnet: `0x3C29D937B1B9D6DaBaC8CE733595F1cBB0E0b3DF`

### 1.2 Dependencies
- [x] Add `@openzeppelin/contracts` for ERC721
- [ ] Add `@0glabs/0g-ts-sdk` (or equivalent 0G Storage client) when needed (Phase 3)
- [ ] Ensure `viem` available for contract calls and ownership checks (already in project)

### 1.3 Env var for 0G deploy
- `PRIVATE_KEY` — wallet private key for deploying and minting on 0G testnet

---

## Phase 2: Database (Supabase)

### 2.1 Schema changes
- [x] Extend `agents` table:
  - `token_id` (bigint, unique nullable) — iNFT tokenId
  - `owner_address` (text nullable) — current wallet
  - `storage_pointer` (text nullable) — 0G Storage CID
  - `blob_hash` (text nullable)
  - Keep `api_key` for legacy agents
- [x] New table `agent_human_interactions`:
  - `token_id` (bigint, PK)
  - `user_id` (int8, FK → users.id)
  - `first_interaction_at` (timestamptz)
  - Unique `(token_id, user_id)`

### 2.2 Migrations
- [x] Migration for new columns: `supabase/migrations/20250220000001_add_inft_agent_columns.sql`
- [x] Migration for `agent_human_interactions`: `supabase/migrations/20250220000002_create_agent_human_interactions.sql`
- [ ] Run migrations in Supabase SQL Editor (or via `supabase db push` if using CLI)

### Env vars for Phase 3 mint API
- `DEPLOYER_PRIVATE_KEY` or `MONAD_PRIVATE_KEY` — Same key used to deploy AgentINFT. Required for 0G Storage upload and mint. Add to `.env.local`.

---

## Phase 3: Client-Side (Create Agent + Mint) ✅

### 3.1 Encryption utility
- [x] Create `lib/agent-encryption.ts`:
  - `encryptConfig(config)` → `{ encryptedBlob, iv, key }` (AES-GCM)
  - `createDefaultConfig()`

### 3.2 0G Storage upload
- [x] Create `lib/og-storage.ts`:
  - `uploadTo0G(encryptedBlob)` → CID
  - Use 0G SDK

### 3.3 Mint flow
- [x] Create `app/api/agents/mint/route.ts`:
  - Accept `{ config, storagePointer, blobHash, ownerAddress }`
  - Call `AgentINFT.mint(ownerAddress, storagePointer, blobHash)`
  - Insert into `agents` with `token_id`, `owner_address`, `storage_pointer`, `blob_hash`, `balance: 0`
  - Return `{ tokenId, agentId }`

### 3.4 Frontend: Create Agent page
- [x] Create agent page at `/agents/create` with config form (persona, confidence_threshold)
- [ ] Flow: build config → encrypt → upload to 0G → connect wallet → mint → store key client-side

---

## Phase 4: Execution Flow (Human-Task API)

### 4.1 Ownership verification
- [ ] Create `lib/nft-ownership.ts`:
  - `verifyOwnership(tokenId, signerAddress)` — calls `ownerOf(tokenId)` on 0G

### 4.2 Human-task API changes
- [ ] Extend `POST /api/human-task` to support:
  - **Legacy:** `api_key` (unchanged)
  - **iNFT:** `{ token_id, wallet_address, signature, input_payload, importance_level, max_budget }`
  - Verify signature + `ownerOf(tokenId) === wallet_address`
  - Lookup `agent_id` from `agents` by `token_id`

### 4.3 Task completion → human list
- [ ] Update `POST /api/tasks/:id/complete`:
  - After completion, get `agent_id` and `assigned_to` from task
  - Get `token_id` from agents
  - Upsert `agent_human_interactions(token_id, user_id)`

---

## Phase 5: Funding & Balance

- [ ] Extend `POST /api/agents/deposit`:
  - Accept `{ token_id, wallet_address, signature, amount, tx_hash? }`
  - Verify NFT ownership
  - Update `agents.balance` for that `token_id`

---

## Phase 6: Frontend UX

### 6.1 Wallet (0G)
- [ ] Add 0G testnet to Wagmi config

### 6.2 Agent dashboard
- [ ] "My agents" — fetch owned tokens
- [ ] Create agent flow
- [ ] Trigger task — auth via token_id + signature

### 6.3 Transfer demo
- [ ] Transfer flow
- [ ] Demonstrate new owner can execute

---

## Phase 7: Config Updates (Preferences)

- [ ] Backend table `agent_preferences(token_id, preferences_json)` — Option A
- [ ] Or: re-upload blob with updated prefs (Phase 2+)

---

## Suggested Order

1. **Phase 1** — Contract + deploy
2. **Phase 2** — Schema + migrations
3. **Phase 3** — Mint flow
4. **Phase 4** — Human-task auth + human list on complete
5. **Phase 5** — Deposit for iNFT agents
6. **Phase 6** — Full UX
7. **Phase 7** — Preferences

---

## Files to Add/Modify

| File | Action |
|------|--------|
| `backend/contracts/AgentINFT.sol` | Add |
| `backend/ignition/modules/AgentINFT.ts` | Add |
| `backend/hardhat.config.ts` | Modify (0G network) |
| `lib/agent-encryption.ts` | Add |
| `lib/og-storage.ts` | Add |
| `lib/nft-ownership.ts` | Add |
| `app/api/agents/mint/route.ts` | Add |
| `app/api/human-task/route.ts` | Modify (dual auth) |
| `app/api/tasks/[id]/complete/route.ts` | Modify (human list) |
| `app/api/agents/deposit/route.ts` | Modify (iNFT deposit) |
| `app/agents/create/page.tsx` | Add |
| Supabase migrations | Add |
