Good — I have everything I need. Let me now look at the existing project structure before writing the plan. Good — the project is a clean Vite + React + wagmi scaffold, already targeting Arc Testnet. Here is the full plan:

---

## Implementation Plan: Onchain Data Agent (ERC-8004 + x402)

### Summary
A data API agent that registers its identity on Arc Testnet via an ERC-8004 registry contract, gates each call behind a Circle Gateway Nanopayment (x402), and surfaces its identity card plus a live "pay to call" demo in the browser.

### Architecture
- **Blockchain:** Arc Testnet — USDC is the gas token, sub-second finality, ideal for microtransaction-priced API calls.
- **Contracts:** Two Solidity contracts — `AgentRegistry.sol` (ERC-8004 registry: stores agent name, description, endpoint URL, capability tags, owner address) and `AgentRegistration.s.sol` deploy script to register the agent entry on deploy.
- **Payment server:** Express/Node.js (`server/index.ts`) with `@circle-fin/x402-batching` Gateway middleware. One paid endpoint: `POST /data` — returns a mocked price/data response. Returns HTTP 402 with `X-PAYMENT-REQUIRED` headers to unpaid callers.
- **Frontend:** React + Tailwind, Arc Dark mode (dense data / infra archetype). Two panels: agent identity card (reads live from the registry contract) and a pay-to-call demo (shows the 402 flow, then the paid response after a wallet-signed Gateway payment).
- **Wallet:** ConnectKit (already in project) + wagmi + Arc Testnet chain (already configured in `src/config.ts`).

### Files to Create / Modify

**Smart contracts**
1. `contracts/AgentRegistry.sol` — ERC-8004-style registry: maps agent ID → `{owner, name, description, endpointUrl, capabilities[]}`. Functions: `register`, `update`, `getAgent`.
2. `contracts/script/RegisterAgent.s.sol` — Foundry script that calls `register()` with the demo agent's metadata immediately after deploy.

**Payment server**
3. `server/index.ts` — Express server with Circle Gateway middleware on `POST /data`; returns mocked price data (BTC/ETH/USDC spot prices) when payment clears.
4. `server/package.json` — Server-only deps: `express`, `@circle-fin/x402-batching`, `@x402/core`, `@x402/evm`, `viem`, `cors`, `tsx`.
5. `server/.env.example` — `SELLER_ADDRESS`, `PORT` documented.

**Frontend**
6. `src/App.tsx` — Root layout: Arc Dark canvas, header with ConnectKit button, two-panel grid (identity card + pay-to-call panel).
7. `src/components/AgentCard.tsx` — Reads `getAgent()` from the deployed registry, renders name, description, endpoint URL, and capability chips.
8. `src/components/PayToCallPanel.tsx` — "Call Agent" button that: (1) shows the raw 402 from the server, (2) signs a Gateway payment via wagmi, (3) re-calls with the payment header, (4) displays the data response.
9. `src/components/ResponseDisplay.tsx` — Renders the paid API response (price table) and the payment receipt.
10. `src/lib/registry.ts` — Typed viem read helpers for `AgentRegistry` ABI + deployed address constant.
11. `src/main.tsx` — Add Web3Provider wrapper (wagmi + ConnectKit + QueryClient), already has Arc Testnet in config.

**Config / env**
12. `.env` (modify) — Add `VITE_REGISTRY_ADDRESS`, `VITE_SERVER_URL`, `VITE_AGENT_ID`.
13. `src/onchain-facts.ts` (read-only reference) — Chain/USDC address values read from here, not hardcoded.

### Build Sequence

1. **Write `AgentRegistry.sol`** — ERC-8004 registry with `register`, `update`, `getAgent`, and an `AgentRegistered` event. Balanced security review, fix any findings.
2. **Deploy registry to Arc Testnet** — Platform deployer (`deploy_contract`). Record contract address.
3. **Register the demo agent** — Call `register()` on the deployed contract via a cast/script call with the demo agent metadata (name: "PriceBot", description: "Spot price oracle", endpoint: the server URL, capabilities: `["prices","BTC","ETH","USDC"]`).
4. **Build the Express payment server** (`server/`) — Install deps, wire `createGatewayMiddleware`, implement `POST /data` handler returning mocked BTC/ETH/USDC prices.
5. **Build `src/lib/registry.ts`** — Typed read helpers using ABI + deployed address.
6. **Build frontend components** — `AgentCard`, `PayToCallPanel`, `ResponseDisplay` in Arc Dark style.
7. **Wire `src/App.tsx` and `src/main.tsx`** — Compose layout, add Web3Provider, connect env vars.
8. **Test end-to-end in browser** — Connect wallet, load identity card from chain, trigger 402 flow, confirm paid data response.

### Done When
- [ ] `AgentRegistry.sol` deployed on Arc Testnet; contract address recorded in `.env` and `contract-metadata/`.
- [ ] `getAgent()` returns the PriceBot metadata on-chain (name, endpoint URL, capabilities).
- [ ] `POST /data` without payment header returns HTTP 402 with `X-PAYMENT-REQUIRED`.
- [ ] `POST /data` with a valid Gateway payment header returns BTC/ETH/USDC price data (HTTP 200).
- [ ] Browser identity card shows live on-chain agent metadata (reads from registry contract).
- [ ] "Pay to Call" button in the browser walks through the 402 → sign → paid flow end-to-end.
- [ ] No private keys or API keys committed; all secrets in `.env` only.

---

## Ready to build?

Switch to **Build mode** and approve this plan — the build agent will write the contract, deploy it to Arc Testnet, stand up the Express payment server, and build the UI. You will need:
- A funded Arc Testnet wallet (grab test USDC from [faucet.circle.com](https://faucet.circle.com))
- A `SELLER_ADDRESS` (your EVM address to receive USDC payments) Plan saved to `arc-studio-plans/PLAN.md`.

A couple of things to have ready before you approve the build:

- **Seller address** — drop your EVM wallet address into `.env` as `SELLER_ADDRESS`. This is where USDC payments land when agents call your endpoint.
- **Test USDC** — grab some from [faucet.circle.com](https://faucet.circle.com) so your wallet can pay gas and sign the demo payment in the browser.

Switch to **Build mode** whenever you are ready and the build agent will take it from there.
