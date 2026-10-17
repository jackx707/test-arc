/**
 * AgentCard — displays a registered ERC-8004 agent's on-chain identity.
 * Reads live from the deployed AgentRegistry contract.
 */

import { useState, useEffect } from 'react'
import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { toast } from 'sonner'
import { REGISTRY_ADDRESS, REGISTRY_ABI, resolveAgentURI, type AgentRegistration } from '@/lib/registry'

const PRICE_BOT_AGENT_ID = BigInt(String(import.meta.env.VITE_AGENT_ID ?? '1'))

/** The ERC-8004 registration JSON that will be stored on-chain for PriceBot */
const PRICEBOT_AGENT_URI =
  'data:application/json;base64,eyJ0eXBlIjoiaHR0cHM6Ly9laXBzLmV0aGVyZXVtLm9yZy9FSVBTL2VpcC04MDA0I3JlZ2lzdHJhdGlvbi12MSIsIm5hbWUiOiJQcmljZUJvdCIsImRlc2NyaXB0aW9uIjoiU3BvdCBwcmljZSBvcmFjbGUgYWdlbnQuIFJldHVybnMgcmVhbC10aW1lIEJUQywgRVRIIGFuZCBVU0RDIHByaWNlcy4gUGF5IHBlciBjYWxsIHZpYSB4NDAyIENpcmNsZSBHYXRld2F5IE5hbm9wYXltZW50cyAoMC4wMSBVU0RDL2NhbGwpLiIsImltYWdlIjoiaHR0cHM6Ly9wbGFjZWhvbGQuY28vMjAweDIwMC8wZDExMTcvM2I4MmY2P3RleHQ9UEIiLCJzZXJ2aWNlcyI6W3sibmFtZSI6Ing0MDIiLCJlbmRwb2ludCI6Imh0dHBzOi8vaTEyczFobXhyZXo4eXdncDl3eDY5LnByZXZpZXcuc3R1ZGlvLmFyYy5pby9hcGkvZGF0YSIsInZlcnNpb24iOiIxLjAuMCJ9LHsibmFtZSI6IndlYiIsImVuZHBvaW50IjoiaHR0cHM6Ly9pMTJzMWhteHJlejh5d2dwOXd4NjkucHJldmlldy5zdHVkaW8uYXJjLmlvIn1dLCJjYXBhYmlsaXRpZXMiOlsicHJpY2VzIiwiQlRDIiwiRVRIIiwiVVNEQyIsIng0MDIiXSwieDQwMiI6eyJzdXBwb3J0ZWQiOnRydWUsInByaWNlIjoiMC4wMSIsInRva2VuIjoiVVNEQyIsImNoYWluIjoiQXJjIFRlc3RuZXQifX0='

interface AgentCardProps {
  onAgentRegistered?: () => void
}

export function AgentCard({ onAgentRegistered }: AgentCardProps) {
  const [registration, setRegistration] = useState<AgentRegistration | null>(null)
  const [resolving, setResolving] = useState(false)

  // Read totalAgents to know if PriceBot is registered yet
  const { data: totalAgents, refetch: refetchTotal } = useReadContract({
    address: REGISTRY_ADDRESS,
    abi: REGISTRY_ABI,
    functionName: 'totalAgents',
  })

  // Read PriceBot's agentURI (token 1)
  const {
    data: agentURI,
    error: agentURIError,
    refetch: refetchURI,
  } = useReadContract({
    address: REGISTRY_ADDRESS,
    abi: REGISTRY_ABI,
    functionName: 'agentURI',
    args: [PRICE_BOT_AGENT_ID],
    query: { enabled: typeof totalAgents === 'bigint' && totalAgents >= PRICE_BOT_AGENT_ID },
  })

  // Register call
  const { writeContract: registerAgent, data: registerHash, isPending: registering } = useWriteContract()
  const { isLoading: confirming, isSuccess: registered } = useWaitForTransactionReceipt({ hash: registerHash })

  // Resolve the URI to a registration object
  useEffect(() => {
    if (!agentURI || typeof agentURI !== 'string') return
    void (async () => {
      setResolving(true)
      try {
        const reg = await resolveAgentURI(agentURI)
        setRegistration(reg)
      } finally {
        setResolving(false)
      }
    })()
  }, [agentURI])

  // After registration confirms, refetch
  useEffect(() => {
    if (registered) {
      toast.success('PriceBot registered on Arc Testnet!')
      void refetchTotal()
      void refetchURI()
      onAgentRegistered?.()
    }
  }, [registered, refetchTotal, refetchURI, onAgentRegistered])

  const isRegistered = typeof totalAgents === 'bigint' && totalAgents >= PRICE_BOT_AGENT_ID
  const notFound = !!agentURIError

  const handleRegister = () => {
    registerAgent({
      address: REGISTRY_ADDRESS,
      abi: REGISTRY_ABI,
      functionName: 'register',
      args: [PRICEBOT_AGENT_URI],
    })
  }

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 flex flex-col gap-5 backdrop-blur-sm">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-300 font-bold text-sm font-mono">
            PB
          </div>
          <div>
            <h2 className="display text-lg font-semibold text-[var(--ink)] leading-tight">
              {registration?.name ?? 'PriceBot'}
            </h2>
            <p className="text-xs text-[var(--subtle)] mt-0.5">ERC-8004 Identity</p>
          </div>
        </div>

        {/* Status badge */}
        <span
          className={[
            'text-xs font-semibold px-2.5 py-1 rounded-full',
            isRegistered
              ? 'bg-green-500/15 text-green-400'
              : 'bg-yellow-500/15 text-yellow-400',
          ].join(' ')}
        >
          {isRegistered ? '● Registered' : '○ Not registered'}
        </span>
      </div>

      {/* Description */}
      <p className="text-sm text-[var(--muted)] leading-relaxed text-pretty">
        {registration?.description ??
          'Spot price oracle agent. Returns BTC, ETH and USDC prices. Pay per call via x402.'}
      </p>

      {/* Capabilities */}
      {(registration?.capabilities ?? ['prices', 'BTC', 'ETH', 'USDC', 'x402']).length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {(registration?.capabilities ?? ['prices', 'BTC', 'ETH', 'USDC', 'x402']).map((cap) => (
            <span
              key={cap}
              className="text-xs bg-[var(--surface-muted)] text-[var(--ink-2)] px-2 py-0.5 rounded-md font-mono"
            >
              {cap}
            </span>
          ))}
        </div>
      )}

      {/* Services */}
      {registration?.services && registration.services.length > 0 && (
        <div className="border-t border-[var(--border)] pt-4 flex flex-col gap-2">
          <p className="text-xs font-medium text-[var(--subtle)] uppercase tracking-widest">Services</p>
          {registration.services.map((svc) => (
            <div key={svc.name} className="flex items-center justify-between text-sm">
              <span className="text-[var(--ink-2)] font-medium">{svc.name}</span>
              <span className="mono text-xs text-[var(--subtle)] truncate max-w-[200px]">{svc.endpoint}</span>
            </div>
          ))}
        </div>
      )}

      {/* x402 payment info */}
      {registration?.x402 && (
        <div className="rounded-xl bg-blue-500/10 border border-blue-500/20 px-4 py-3 flex items-center justify-between">
          <div className="text-xs text-blue-300">
            <span className="font-semibold">x402</span> · Circle Gateway Nanopayments
          </div>
          <span className="mono text-sm font-bold text-blue-200">
            {registration.x402.price} {registration.x402.token}
          </span>
        </div>
      )}

      {/* On-chain identity */}
      <div className="border-t border-[var(--border)] pt-4 flex flex-col gap-2">
        <p className="text-xs font-medium text-[var(--subtle)] uppercase tracking-widest">On-chain</p>
        <div className="flex items-center justify-between text-xs">
          <span className="text-[var(--subtle)]">Registry</span>
          <a
            href={`https://explorer.testnet.arc.io/address/${REGISTRY_ADDRESS}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mono text-blue-400 hover:text-blue-300 transition-colors truncate max-w-[200px]"
          >
            {REGISTRY_ADDRESS.slice(0, 6)}…{REGISTRY_ADDRESS.slice(-4)}
          </a>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-[var(--subtle)]">Agent ID</span>
          <span className="mono text-[var(--ink-2)]">
            {isRegistered ? `#${PRICE_BOT_AGENT_ID.toString()}` : '—'}
          </span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-[var(--subtle)]">Total agents</span>
          <span className="mono text-[var(--ink-2)] tabular-nums">
            {totalAgents?.toString() ?? '…'}
          </span>
        </div>
      </div>

      {/* Register action (shown when not yet registered) */}
      {(!isRegistered || notFound) && !resolving && (
        <button
          onClick={handleRegister}
          disabled={registering || confirming}
          className="mt-1 w-full py-2.5 rounded-xl bg-[var(--accent)] text-[#0d1b2f] font-semibold text-sm
                     hover:bg-[var(--accent-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {registering ? 'Signing…' : confirming ? 'Confirming…' : 'Register PriceBot on Arc Testnet'}
        </button>
      )}
    </div>
  )
}
