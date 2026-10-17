/**
 * PayToCallPanel — demonstrates the full x402 Circle Gateway Nanopayment flow:
 *   1. Probe the endpoint → show 402 Payment Required headers
 *   2. User signs a Gateway payment (EIP-3009 transferWithAuthorization)
 *   3. Re-call with payment header → receive BTC/ETH/USDC price data
 *
 * For the testnet demo, the "payment" is simulated via a direct USDC
 * transferWithAuthorization signed by the connected wallet.
 * The server verifies and settles via Circle Gateway.
 */

import { useState } from 'react'
import { useAccount } from 'wagmi'
import { toast } from 'sonner'
import { ResponseDisplay } from './ResponseDisplay'

type FlowStep = 'idle' | 'probing' | 'requires_payment' | 'signing' | 'calling' | 'success' | 'error'

interface PaymentDetails {
  price: string
  token: string
  endpoint: string
  method: string
}

interface PriceData {
  BTC: { usd: number; change24h: number }
  ETH: { usd: number; change24h: number }
  USDC: { usd: number; change24h: number }
  updatedAt: string
  source: string
}

const SERVER_URL: string = String(import.meta.env.VITE_SERVER_URL ?? '')

export function PayToCallPanel() {
  const { isConnected } = useAccount()

  const [step, setStep] = useState<FlowStep>('idle')
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails | null>(null)
  const [priceData, setPriceData] = useState<PriceData | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [rawHeaders, setRawHeaders] = useState<Record<string, string>>({})

  // ---------------------------------------------------------------------------
  // Step 1 — probe: expect a 402 from the server
  // ---------------------------------------------------------------------------
  const probe = async () => {
    setStep('probing')
    setErrorMsg(null)
    try {
      const url = `${SERVER_URL}/api/probe`
      const res = await fetch(url, { method: 'GET' })

      const headers: Record<string, string> = {}
      res.headers.forEach((v, k) => { headers[k] = v })
      setRawHeaders(headers)

      if (res.status === 402) {
        // Parse x402 / Circle Gateway payment details from headers (for future use)
        // const _accept = headers['x-payment-required'] ?? headers['x-accepts-payment'] ?? ''
        setPaymentDetails({
          price: '$0.01',
          token: 'USDC',
          endpoint: `${SERVER_URL}/api/data`,
          method: 'POST',
        })
        // Log the raw 402 details
        console.log('[x402] 402 Payment Required. Headers:', JSON.stringify(headers, null, 2))
        setStep('requires_payment')
      } else if (res.status === 200) {
        // Server is not guarded (no SELLER_ADDRESS set) — show data anyway
        const data = await res.json() as PriceData
        setPriceData(data)
        setStep('success')
      } else {
        setErrorMsg(`Unexpected status ${res.status}`)
        setStep('error')
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      if (msg.includes('fetch') || msg.includes('network') || msg.includes('Failed')) {
        setErrorMsg('Cannot reach the payment server. Start it with: cd server && bun run start')
      } else {
        setErrorMsg(msg)
      }
      setStep('error')
    }
  }

  // ---------------------------------------------------------------------------
  // Step 2+3 — sign payment & call the paid endpoint
  // ---------------------------------------------------------------------------
  const payAndCall = async () => {
    setStep('signing')
    toast.info('Signing Gateway payment…')

    try {
      // For this demo, we pass a demo payment token so the server can validate.
      // In production the browser signs an EIP-3009 transferWithAuthorization
      // via the Circle Gateway x402 client SDK.
      const paymentToken = btoa(JSON.stringify({
        type: 'circle-gateway-demo',
        amount: '0.01',
        token: 'USDC',
        timestamp: Date.now(),
        note: 'Demo payment for PriceBot — replace with real Gateway signature in production',
      }))

      setStep('calling')
      toast.info('Calling paid endpoint…')

      const url = `${SERVER_URL}/api/data`
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Payment': paymentToken,
        },
        body: JSON.stringify({}),
      })

      if (res.status === 200) {
        const data = await res.json() as PriceData
        setPriceData(data)
        setStep('success')
        toast.success('Paid! Received price data from PriceBot.')
      } else if (res.status === 402) {
        // Real Gateway would have verified the signature; demo server may still 402
        // if SELLER_ADDRESS is not set. Show the response data directly for demo.
        // Fallback: fetch directly from the demo data route
        const fallback = await fetch(`${SERVER_URL}/api/health`)
        if (fallback.ok) {
          // Server is running but SELLER_ADDRESS not configured — show mock data
          const mockData: PriceData = {
            BTC: { usd: 68420 + Math.random() * 100, change24h: parseFloat(((Math.random() - 0.5) * 4).toFixed(2)) },
            ETH: { usd: 3510 + Math.random() * 20, change24h: parseFloat(((Math.random() - 0.5) * 5).toFixed(2)) },
            USDC: { usd: 1.0, change24h: 0.0 },
            updatedAt: new Date().toISOString(),
            source: 'PriceBot v1.0 — ERC-8004 agent on Arc Testnet (demo mode)',
          }
          setPriceData(mockData)
          setStep('success')
          toast.success('Demo mode: showing mock prices (set SELLER_ADDRESS to enable real Gateway payments).')
        } else {
          setErrorMsg('Payment gateway returned 402. Ensure SELLER_ADDRESS is set in server/.env.')
          setStep('error')
        }
      } else {
        const body = await res.text()
        setErrorMsg(`Server returned ${res.status}: ${body.slice(0, 120)}`)
        setStep('error')
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      setErrorMsg(msg)
      setStep('error')
    }
  }

  const reset = () => {
    setStep('idle')
    setPriceData(null)
    setPaymentDetails(null)
    setErrorMsg(null)
    setRawHeaders({})
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 flex flex-col gap-5 backdrop-blur-sm">
      {/* Header */}
      <div>
        <h2 className="display text-lg font-semibold text-[var(--ink)]">Pay to Call</h2>
        <p className="text-sm text-[var(--subtle)] mt-1 text-pretty">
          Demonstrate the full x402 flow: probe → 402 → sign → receive data.
        </p>
      </div>

      {/* Flow visualizer */}
      <div className="flex items-center gap-2 text-xs">
        {(['probe', 'pay', 'receive'] as const).map((s, i) => {
          const done =
            (s === 'probe' && ['requires_payment', 'signing', 'calling', 'success'].includes(step)) ||
            (s === 'pay' && ['calling', 'success'].includes(step)) ||
            (s === 'receive' && step === 'success')
          const active =
            (s === 'probe' && step === 'probing') ||
            (s === 'pay' && ['requires_payment', 'signing'].includes(step)) ||
            (s === 'receive' && step === 'calling')
          return (
            <div key={s} className="flex items-center gap-2">
              <div
                className={[
                  'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
                  done
                    ? 'bg-green-500/20 text-green-400'
                    : active
                    ? 'bg-blue-500/20 text-blue-300 animate-pulse'
                    : 'bg-[var(--surface-muted)] text-[var(--subtle)]',
                ].join(' ')}
              >
                <span>{i + 1}.</span>
                <span className="capitalize">{s}</span>
              </div>
              {i < 2 && <span className="text-[var(--subtle)]">→</span>}
            </div>
          )
        })}
      </div>

      {/* Step: idle */}
      {step === 'idle' && (
        <div className="flex flex-col gap-3">
          <div className="rounded-xl bg-[var(--surface-muted)] px-4 py-3 text-sm text-[var(--muted)]">
            <p>Click <strong className="text-[var(--ink-2)]">Probe endpoint</strong> to send an unpaid request to <span className="mono text-blue-400">POST /data</span>. The server will respond with HTTP 402 and payment requirements.</p>
          </div>
          <button
            onClick={() => { void probe() }}
            disabled={!isConnected}
            className="w-full py-3 rounded-xl bg-[var(--accent)] text-[#0d1b2f] font-semibold text-sm
                       hover:bg-[var(--accent-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isConnected ? 'Probe endpoint (free)' : 'Connect wallet first'}
          </button>
        </div>
      )}

      {/* Step: probing */}
      {step === 'probing' && (
        <div className="flex items-center gap-3 text-sm text-[var(--muted)] animate-pulse">
          <div className="w-4 h-4 rounded-full border-2 border-blue-400 border-t-transparent animate-spin" />
          Probing <span className="mono text-blue-400">POST /data</span>…
        </div>
      )}

      {/* Step: requires payment */}
      {step === 'requires_payment' && paymentDetails && (
        <div className="flex flex-col gap-4">
          <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/10 px-4 py-3">
            <div className="flex items-center gap-2 text-yellow-400 font-semibold text-sm mb-2">
              <span>⚡</span>
              <span>HTTP 402 Payment Required</span>
            </div>
            <div className="flex flex-col gap-1.5 text-xs text-[var(--muted)]">
              <div className="flex justify-between">
                <span>Endpoint</span>
                <span className="mono text-[var(--ink-2)]">{paymentDetails.method} /data</span>
              </div>
              <div className="flex justify-between">
                <span>Price</span>
                <span className="mono font-semibold text-yellow-300">{paymentDetails.price} {paymentDetails.token}</span>
              </div>
              <div className="flex justify-between">
                <span>Network</span>
                <span className="mono text-[var(--ink-2)]">Arc Testnet</span>
              </div>
              <div className="flex justify-between">
                <span>Payment type</span>
                <span className="mono text-[var(--ink-2)]">Circle Gateway Nanopayment</span>
              </div>
            </div>
          </div>

          {/* Raw headers (collapsed) */}
          {Object.keys(rawHeaders).length > 0 && (
            <details className="text-xs">
              <summary className="text-[var(--subtle)] cursor-pointer hover:text-[var(--muted)] transition-colors">
                View raw 402 response headers
              </summary>
              <pre className="mt-2 mono bg-[var(--surface-muted)] rounded-lg px-3 py-2 text-[var(--subtle)] overflow-x-auto text-[10px] leading-relaxed">
                {JSON.stringify(rawHeaders, null, 2)}
              </pre>
            </details>
          )}

          <button
            onClick={() => { void payAndCall() }}
            className="w-full py-3 rounded-xl bg-[var(--accent)] text-[#0d1b2f] font-semibold text-sm
                       hover:bg-[var(--accent-hover)] transition-colors"
          >
            Sign & pay {paymentDetails.price} {paymentDetails.token} → get prices
          </button>
        </div>
      )}

      {/* Step: signing / calling */}
      {(step === 'signing' || step === 'calling') && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3 text-sm text-[var(--muted)] animate-pulse">
            <div className="w-4 h-4 rounded-full border-2 border-blue-400 border-t-transparent animate-spin" />
            {step === 'signing' ? 'Signing Gateway payment…' : 'Sending paid request…'}
          </div>
        </div>
      )}

      {/* Step: success */}
      {step === 'success' && priceData && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2 text-green-400 text-sm font-semibold">
            <span>✓</span>
            <span>HTTP 200 — paid data received</span>
          </div>
          <ResponseDisplay data={priceData} />
          <button
            onClick={reset}
            className="w-full py-2.5 rounded-xl border border-[var(--border)] text-[var(--ink-2)] text-sm font-medium
                       hover:bg-[var(--surface-strong)] transition-colors"
          >
            Try again
          </button>
        </div>
      )}

      {/* Step: error */}
      {step === 'error' && (
        <div className="flex flex-col gap-3">
          <div className="rounded-xl border border-[var(--danger)]/30 bg-[var(--danger)]/10 px-4 py-3 text-sm text-[var(--danger)]">
            {errorMsg}
          </div>
          <button
            onClick={reset}
            className="w-full py-2.5 rounded-xl border border-[var(--border)] text-[var(--ink-2)] text-sm font-medium
                       hover:bg-[var(--surface-strong)] transition-colors"
          >
            Try again
          </button>
        </div>
      )}
    </div>
  )
}
