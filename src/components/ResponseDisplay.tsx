/**
 * ResponseDisplay — renders the paid PriceBot API response.
 */

interface PriceData {
  BTC: { usd: number; change24h: number }
  ETH: { usd: number; change24h: number }
  USDC: { usd: number; change24h: number }
  updatedAt: string
  source: string
}

interface ResponseDisplayProps {
  data: PriceData
}

function PriceRow({ symbol, price, change }: { symbol: string; price: number; change: number }) {
  const up = change >= 0
  return (
    <div className="flex items-center justify-between py-3 border-b border-[var(--border)] last:border-0">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-[var(--surface-strong)] flex items-center justify-center text-xs font-bold mono text-[var(--ink-2)]">
          {symbol.slice(0, 1)}
        </div>
        <span className="font-semibold text-[var(--ink)] text-sm">{symbol}</span>
      </div>
      <div className="text-right">
        <div className="tabular-nums font-semibold text-[var(--ink)] text-sm">
          ${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
        <div className={['tabular-nums text-xs', up ? 'text-[var(--success)]' : 'text-[var(--danger)]'].join(' ')}>
          {up ? '+' : ''}{change.toFixed(2)}%
        </div>
      </div>
    </div>
  )
}

export function ResponseDisplay({ data }: ResponseDisplayProps) {
  return (
    <div className="flex flex-col gap-4">
      {/* Prices */}
      <div className="rounded-xl bg-[var(--surface-muted)] px-4">
        <PriceRow symbol="BTC" price={data.BTC.usd} change={data.BTC.change24h} />
        <PriceRow symbol="ETH" price={data.ETH.usd} change={data.ETH.change24h} />
        <PriceRow symbol="USDC" price={data.USDC.usd} change={data.USDC.change24h} />
      </div>

      {/* Metadata */}
      <div className="flex flex-col gap-1.5 text-xs text-[var(--subtle)]">
        <div className="flex justify-between">
          <span>Updated</span>
          <span className="mono">{new Date(data.updatedAt).toLocaleTimeString()}</span>
        </div>
        <div className="flex justify-between">
          <span>Source</span>
          <span className="mono text-right max-w-[220px] truncate">{data.source}</span>
        </div>
      </div>
    </div>
  )
}
