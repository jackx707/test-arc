/**
 * PriceBot — ERC-8004 Onchain Agent + x402 Nanopayments
 *
 * Two-panel layout (Arc Dark):
 *  Left:  AgentCard — live ERC-8004 identity from the registry contract
 *  Right: PayToCallPanel — x402 pay-per-call demo
 */

import { ConnectKitButton } from 'connectkit'
import { AgentCard } from './components/AgentCard'
import { PayToCallPanel } from './components/PayToCallPanel'
import { useAccount } from 'wagmi'

function Header() {
  const { isConnected, address } = useAccount()
  return (
    <header className="sticky top-0 z-20 border-b border-[var(--border)] backdrop-blur-md bg-[var(--bg)]/80">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {/* Logo mark */}
          <div className="w-7 h-7 rounded-lg bg-blue-500/20 flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <circle cx="7" cy="7" r="6" stroke="#93c5fd" strokeWidth="1.5" />
              <path d="M5 7h4M7 5v4" stroke="#93c5fd" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
          <div>
            <span className="display font-semibold text-sm text-[var(--ink)]">PriceBot</span>
            <span className="ml-2 text-[10px] font-medium text-[var(--subtle)] uppercase tracking-widest">
              ERC-8004 · x402
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isConnected && (
            <span className="hidden sm:block mono text-xs text-[var(--subtle)]">
              {address?.slice(0, 6)}…{address?.slice(-4)}
            </span>
          )}
          <ConnectKitButton />
        </div>
      </div>
    </header>
  )
}

function HeroSection() {
  return (
    <section className="max-w-5xl mx-auto px-4 pt-10 pb-6">
      <div className="flex items-start gap-4">
        <div className="flex-1">
          <h1 className="display text-3xl font-bold text-[var(--ink)] leading-tight tracking-tight text-balance">
            Onchain Agent Identity<br />+ Pay-Per-Call API
          </h1>
          <p className="mt-3 text-[var(--muted)] text-sm max-w-xl text-pretty leading-relaxed">
            PriceBot is registered as an <strong className="text-[var(--ink-2)]">ERC-8004</strong> agent on Arc Testnet.
            Its identity (name, endpoint, capabilities) lives on-chain as an ERC-721 NFT.
            Each API call costs <strong className="text-[var(--ink-2)]">$0.01 USDC</strong> via{' '}
            <strong className="text-[var(--ink-2)]">x402</strong> Circle Gateway Nanopayments.
          </p>

          {/* Badges */}
          <div className="mt-4 flex flex-wrap gap-2">
            {[
              { label: 'ERC-8004', color: 'blue' },
              { label: 'Arc Testnet', color: 'indigo' },
              { label: 'x402', color: 'purple' },
              { label: 'Circle Gateway', color: 'sky' },
              { label: 'USDC', color: 'green' },
            ].map(({ label, color }) => (
              <span
                key={label}
                className={`text-xs font-semibold px-2.5 py-1 rounded-full bg-${color}-500/15 text-${color}-300`}
              >
                {label}
              </span>
            ))}
          </div>
        </div>

        {/* Stats strip */}
        <div className="hidden md:flex flex-col gap-3 min-w-[140px] bg-[var(--surface)] rounded-xl border border-[var(--border)] px-4 py-3">
          <Stat label="Chain" value="Arc Testnet" />
          <Stat label="Price/call" value="$0.01 USDC" />
          <Stat label="Settlement" value="Circle Gateway" />
          <Stat label="Identity" value="ERC-8004" />
        </div>
      </div>
    </section>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-widest text-[var(--subtle)] font-medium">{label}</p>
      <p className="mono text-xs text-[var(--ink-2)] font-semibold mt-0.5 tabular-nums">{value}</p>
    </div>
  )
}

function HowItWorks() {
  const steps = [
    {
      n: '01',
      title: 'Register',
      desc: 'The agent mints an ERC-721 NFT on the AgentRegistry contract. The tokenURI is a base64 ERC-8004 JSON — name, endpoint, capabilities.',
    },
    {
      n: '02',
      title: 'Probe (402)',
      desc: 'Any caller hits POST /data. Without payment the server returns HTTP 402 with Circle Gateway payment requirements.',
    },
    {
      n: '03',
      title: 'Pay (x402)',
      desc: 'The caller signs a Gateway Nanopayment (EIP-3009 transferWithAuthorization). No gas. Instant. $0.01 USDC.',
    },
    {
      n: '04',
      title: 'Receive (200)',
      desc: 'The server verifies the payment, settles via Circle Gateway, and returns the BTC/ETH/USDC price data.',
    },
  ]
  return (
    <section className="max-w-5xl mx-auto px-4 pb-8">
      <h2 className="display text-base font-semibold text-[var(--subtle)] uppercase tracking-widest mb-4">
        How it works
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {steps.map((s) => (
          <div
            key={s.n}
            className="rounded-xl bg-[var(--surface)] border border-[var(--border)] px-4 py-4 flex flex-col gap-2"
          >
            <span className="mono text-xs text-blue-400 font-bold">{s.n}</span>
            <p className="display font-semibold text-sm text-[var(--ink)]">{s.title}</p>
            <p className="text-xs text-[var(--subtle)] leading-relaxed text-pretty">{s.desc}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

export default function App() {
  return (
    <div className="min-h-dvh" style={{ background: 'var(--bg-gradient)' }}>
      <Header />
      <main>
        <HeroSection />

        {/* Two-panel grid */}
        <section className="max-w-5xl mx-auto px-4 pb-8 grid grid-cols-1 md:grid-cols-2 gap-5">
          <AgentCard />
          <PayToCallPanel />
        </section>

        <HowItWorks />

        {/* Footer / AGENTS.md note */}
        <section className="max-w-5xl mx-auto px-4 pb-12">
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-5 py-4">
            <p className="text-xs font-semibold text-[var(--subtle)] uppercase tracking-widest mb-2">Developer notes</p>
            <ul className="text-xs text-[var(--muted)] space-y-1.5 list-disc list-inside leading-relaxed">
              <li>
                <strong className="text-[var(--ink-2)]">AgentRegistry</strong> deployed at{' '}
                <a
                  href="https://explorer.testnet.arc.io/address/0xdf02acb8e67354532d90d31ae74fa5274c7bfc38"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mono text-blue-400 hover:text-blue-300 transition-colors"
                >
                  0xdf02acb8e67354532d90d31ae74fa5274c7bfc38
                </a>
              </li>
              <li>
                Start the payment server: <span className="mono text-[var(--ink-2)]">cd server && bun install && SELLER_ADDRESS=0x… bun run start</span>
              </li>
              <li>
                To enable real Gateway payments set <span className="mono text-[var(--ink-2)]">SELLER_ADDRESS</span> in{' '}
                <span className="mono text-[var(--ink-2)]">server/</span> and restart the server.
              </li>
              <li>
                Register more agents: call{' '}
                <span className="mono text-[var(--ink-2)]">register(agentURI)</span> on the registry contract from any wallet.
              </li>
              <li>
                Get test USDC from the <strong className="text-[var(--ink-2)]">Get test USDC</strong> button in the Arc Studio sidebar.
              </li>
            </ul>
          </div>
        </section>
      </main>
    </div>
  )
}
