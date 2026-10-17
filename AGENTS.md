# PriceBot — ERC-8004 Onchain Agent + x402

> Built with Arc Studio — money-powered apps in minutes

## What This App Does

PriceBot is an ERC-8004 agent deployed on Arc Testnet. Its identity (name, endpoint, capabilities) is stored on-chain as an ERC-721 NFT in the `AgentRegistry` contract. Each API call costs $0.01 USDC via x402 Circle Gateway Nanopayments. The frontend shows the live on-chain identity card and a pay-to-call demo.

## Tech Stack

- Frontend: React 18, Vite, TypeScript, Tailwind CSS (Arc Dark mode)
- Web3: wagmi v2, viem v2, ConnectKit
- Contracts: Solidity 0.8.28 + Foundry. Sources in `contracts/`, build with `bun run contracts:build`
- Payment server: Express + `@circle-fin/x402-batching` (Circle Gateway Nanopayments)
- Wallet: injected (MetaMask, etc.)
- Chain: Arc Testnet (Chain ID: 5042002)
- Token: USDC (Address: 0x3600000000000000000000000000000000000000, Arc Testnet)
- Toasts: Sonner

## Deployed Contracts

| Contract | Network | Address | Explorer |
|---|---|---|---|
| AgentRegistry | Arc Testnet | `0xdf02acb8e67354532d90d31ae74fa5274c7bfc38` | [View](https://explorer.testnet.arc.io/address/0xdf02acb8e67354532d90d31ae74fa5274c7bfc38) |

## Agent Identity

- **Agent name:** PriceBot
- **Agent ID:** 1 (minted by connecting wallet and clicking "Register PriceBot")
- **agentURI:** `data:application/json;base64,...` (ERC-8004 registration JSON — fully on-chain)
- **Capabilities:** prices, BTC, ETH, USDC, x402
- **Endpoint:** `POST /data` — $0.01 USDC per call

## Key Files

- `src/App.tsx` — main app layout (Arc Dark)
- `src/components/AgentCard.tsx` — reads live ERC-8004 identity from on-chain registry
- `src/components/PayToCallPanel.tsx` — x402 pay-to-call flow demo
- `src/components/ResponseDisplay.tsx` — price data display
- `src/lib/registry.ts` — typed viem read helpers for AgentRegistry
- `contracts/AgentRegistry.sol` — ERC-8004 identity registry (ERC-721 + URIStorage)
- `contracts/script/RegisterAgent.s.sol` — Foundry script to register PriceBot
- `server/index.ts` — Express payment server with Circle Gateway middleware

## Running Locally

```bash
# Frontend (already running in dev)
bun run dev

# Payment server (requires your EVM address as SELLER_ADDRESS)
cd server
bun install
SELLER_ADDRESS=0xYourAddress PORT=3001 bun run start
```

## To Register PriceBot On-Chain

1. Connect your wallet (MetaMask, etc.) in the browser preview
2. Click "Register PriceBot on Arc Testnet" in the Agent Identity card
3. Sign the transaction — costs Arc Testnet USDC for gas
4. Get test USDC from the "Get test USDC" button in the Arc Studio sidebar

## To Enable Real Gateway Payments

1. Set `SELLER_ADDRESS=0xYourEVMAddress` when starting the server
2. Callers pay $0.01 USDC per call via Circle Gateway Nanopayments (x402)
3. The `@circle-fin/x402-batching` middleware handles verification + settlement

## ERC-8004 Notes

ERC-8004 (Trustless Agents) is a Draft standard. This implementation follows the Identity Registry spec:
- Each agent is an ERC-721 token (NFT) in the registry
- The `agentURI` (= `tokenURI`) resolves to an ERC-8004 registration JSON file
- The registration file contains: type, name, description, services[], capabilities[], x402 metadata
- Only the token owner can update the agent's URI via `setAgentURI()`
- Transfer ownership with standard ERC-721 `transferFrom()`
