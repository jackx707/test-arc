/**
 * AgentRegistry contract helpers.
 * Reads live on-chain data from the deployed ERC-8004 registry.
 */

import agentRegistryArtifact from '../../contracts/out/AgentRegistry.sol/AgentRegistry.json'
import { getUsdc, requireChain } from '@/onchain-facts'

// Arc Testnet chain ID
export const ARC_TESTNET_CHAIN_ID = 5042002

// Deployed AgentRegistry address on Arc Testnet
export const REGISTRY_ADDRESS =
  (import.meta.env.VITE_REGISTRY_ADDRESS as `0x${string}` | undefined) ??
  '0xdf02acb8e67354532d90d31ae74fa5274c7bfc38'

export const REGISTRY_ABI = agentRegistryArtifact.abi

export const USDC = getUsdc(ARC_TESTNET_CHAIN_ID)!
export const ARC_TESTNET = requireChain(ARC_TESTNET_CHAIN_ID)

/** ERC-8004 registration file structure (v1) */
export interface AgentRegistration {
  type: string
  name: string
  description: string
  image?: string
  services?: Array<{ name: string; endpoint: string; version?: string }>
  capabilities?: string[]
  x402?: { supported: boolean; price: string; token: string; chain: string }
}

/** Resolve an agentURI to a parsed AgentRegistration */
export async function resolveAgentURI(uri: string): Promise<AgentRegistration | null> {
  try {
    if (uri.startsWith('data:application/json;base64,')) {
      const b64 = uri.slice('data:application/json;base64,'.length)
      const json = atob(b64)
      return JSON.parse(json) as AgentRegistration
    }
    if (uri.startsWith('https://') || uri.startsWith('http://')) {
      const res = await fetch(uri)
      if (!res.ok) return null
      return (await res.json()) as AgentRegistration
    }
    return null
  } catch {
    return null
  }
}
