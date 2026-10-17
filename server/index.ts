/**
 * PriceBot — x402 Circle Gateway Nanopayments server
 *
 * POST /data  — returns BTC/ETH/USDC spot prices (mocked)
 *               Unpaid calls receive HTTP 402 with payment details.
 *               Paid calls with a valid Gateway payment header receive HTTP 200.
 *
 * Env vars:
 *   SELLER_ADDRESS  — EVM address that receives USDC payments
 *   PORT            — HTTP port (default 3001)
 */

import express from 'express'
import cors from 'cors'
import { createGatewayMiddleware } from '@circle-fin/x402-batching/server'

const app = express()
app.use(express.json())
app.use(cors())

// Seller address is required — fail fast if missing
const SELLER_ADDRESS = process.env.SELLER_ADDRESS
if (!SELLER_ADDRESS || !/^0x[a-fA-F0-9]{40}$/.test(SELLER_ADDRESS)) {
  console.error(
    '[PriceBot] SELLER_ADDRESS is missing or invalid. Set it in .env (e.g. SELLER_ADDRESS=0xYourAddress).'
  )
  process.exit(1)
}

// Circle Gateway Nanopayments middleware
const gateway = createGatewayMiddleware({
  sellerAddress: SELLER_ADDRESS as `0x${string}`,
})

// ---------------------------------------------------------------------------
// Mocked price data — in production, swap for a real price feed
// ---------------------------------------------------------------------------
function getMockPrices() {
  const base = { BTC: 68420, ETH: 3510, USDC: 1.0 }
  // ±0.5% jitter so the demo looks live
  const jitter = (v: number) => parseFloat((v * (1 + (Math.random() - 0.5) * 0.01)).toFixed(2))
  return {
    BTC: { usd: jitter(base.BTC), change24h: parseFloat(((Math.random() - 0.5) * 4).toFixed(2)) },
    ETH: { usd: jitter(base.ETH), change24h: parseFloat(((Math.random() - 0.5) * 5).toFixed(2)) },
    USDC: { usd: 1.0, change24h: 0.0 },
    updatedAt: new Date().toISOString(),
    source: 'PriceBot v1.0 — ERC-8004 agent on Arc Testnet',
  }
}

// ---------------------------------------------------------------------------
// Health check (free)
// ---------------------------------------------------------------------------
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', agent: 'PriceBot', version: '1.0.0' })
})

// ---------------------------------------------------------------------------
// Paid data endpoint  —  $0.01 USDC per call via Circle Gateway
// ---------------------------------------------------------------------------
app.post('/data', gateway.require('$0.01'), async (_req, res) => {
  res.json(getMockPrices())
})

// ---------------------------------------------------------------------------
// Unpaid probe (returns 402 headers for display in the UI)
// ---------------------------------------------------------------------------
app.get('/probe', gateway.require('$0.01'), (_req, res) => {
  // If payment was somehow provided for the GET, still return the price data
  res.json(getMockPrices())
})

const PORT = parseInt(process.env.PORT ?? '3001', 10)
app.listen(PORT, () => {
  console.log(`[PriceBot] Payment server listening on http://localhost:${PORT}`)
  console.log(`[PriceBot] Seller address: ${SELLER_ADDRESS}`)
  console.log(`[PriceBot] POST /data  — $0.01 USDC per call (Circle Gateway)`)
})
