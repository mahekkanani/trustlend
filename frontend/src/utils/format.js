import { formatEther, formatUnits } from 'viem'

/**
 * Format a wei bigint as "X.XXXX ETH"
 */
export function fmtEth(wei, decimals = 4) {
  if (wei == null) return '—'
  try {
    const val = parseFloat(formatEther(wei))
    return val.toFixed(decimals) + ' ETH'
  } catch {
    return '—'
  }
}

/**
 * Format a token amount (18 dec default) as "$X,XXX.XX"
 */
export function fmtUSD(amount, tokenDecimals = 18) {
  if (amount == null) return '—'
  try {
    const val = parseFloat(formatUnits(amount, tokenDecimals))
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(val)
  } catch {
    return '—'
  }
}

/**
 * Format a bigint ETH price (18 decimals) as a readable USD string
 */
export function fmtEthPrice(priceBigInt) {
  if (priceBigInt == null) return '—'
  try {
    const val = parseFloat(formatEther(priceBigInt))
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(val)
  } catch {
    return '—'
  }
}

/**
 * Shorten a wallet address: 0x1234...ABCD
 */
export function fmtAddress(address, chars = 4) {
  if (!address) return ''
  return `${address.slice(0, 2 + chars)}...${address.slice(-chars)}`
}

/**
 * Format a unix timestamp (seconds bigint) to human-readable date
 */
export function fmtTimestamp(ts) {
  if (!ts) return '—'
  const ms = Number(ts) * 1000
  return new Intl.DateTimeFormat('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(ms))
}

/**
 * Format remaining time as "Xd Xh Xm" countdown
 */
export function fmtCountdown(deadlineTs) {
  if (!deadlineTs) return null
  const now = Math.floor(Date.now() / 1000)
  const remaining = Number(deadlineTs) - now
  if (remaining <= 0) return { expired: true, label: 'EXPIRED' }

  const days = Math.floor(remaining / 86400)
  const hours = Math.floor((remaining % 86400) / 3600)
  const mins = Math.floor((remaining % 3600) / 60)

  return {
    expired: false,
    days,
    hours,
    mins,
    label: `${days}d ${String(hours).padStart(2, '0')}h ${String(mins).padStart(2, '0')}m`,
    totalSeconds: remaining,
  }
}

/**
 * Convert DAI token amount bigint to a plain number (18 decimals)
 */
export function daiToNumber(amount) {
  if (amount == null) return 0
  return parseFloat(formatUnits(amount, 18))
}

/**
 * Format large numbers with commas
 */
export function fmtNumber(n, decimals = 2) {
  if (n == null) return '—'
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(n)
}
