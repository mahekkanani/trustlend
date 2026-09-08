import { parseEther, formatEther } from 'viem'

/**
 * Calculate the required ETH collateral for a DAI borrow.
 *
 * Mirrors the solidity logic:
 *   requiredCollateralUSD = (borrowAmount * collateralPct) / 100
 *   requiredEth = requiredCollateralUSD / ethPrice
 *
 * @param {bigint} borrowAmountWei  - DAI to borrow (18 decimals)
 * @param {number} collateralPct    - e.g. 150, 130, 115, 90
 * @param {bigint} ethPriceWei      - ETH/USD price (18 decimals, from oracle)
 * @returns {bigint} required ETH in wei
 */
export function calcRequiredEth(borrowAmountWei, collateralPct, ethPriceWei) {
  if (!borrowAmountWei || !collateralPct || !ethPriceWei || ethPriceWei === 0n) {
    return 0n
  }
  // requiredUSD = borrow * pct / 100   (all 18-decimal)
  const requiredUSD = (borrowAmountWei * BigInt(collateralPct)) / 100n
  // requiredEth = requiredUSD * 1e18 / ethPrice
  const requiredEth = (requiredUSD * BigInt(1e18)) / ethPriceWei
  return requiredEth
}

/**
 * Calculate current health ratio of a loan.
 * health = collateralValueUSD / requiredCollateralUSD
 * > 1 = healthy, < 1 = liquidatable
 */
export function calcHealthRatio(collateralEth, borrowedDai, collateralPct, ethPriceWei) {
  if (!collateralEth || !borrowedDai || !ethPriceWei || ethPriceWei === 0n) return null
  const collateralUSD = (collateralEth * ethPriceWei) / BigInt(1e18)
  const requiredUSD = (borrowedDai * BigInt(collateralPct)) / 100n
  if (requiredUSD === 0n) return null
  // Return as a float
  return Number(collateralUSD * 1000n / requiredUSD) / 1000
}

/**
 * Get loan health status label from ratio
 */
export function getLoanStatus(healthRatio, isOverdue) {
  if (isOverdue) return { label: 'OVERDUE', color: '#F87171', severity: 'critical' }
  if (healthRatio == null) return { label: 'UNKNOWN', color: '#8C9BAB', severity: 'none' }
  if (healthRatio < 1.0) return { label: 'AT RISK', color: '#F87171', severity: 'critical' }
  if (healthRatio < 1.1) return { label: 'AT RISK', color: '#FBBF24', severity: 'warning' }
  if (healthRatio < 1.2) return { label: 'MONITOR', color: '#FBBF24', severity: 'caution' }
  return { label: 'HEALTHY', color: '#34D399', severity: 'good' }
}

/**
 * DAI amount in human-readable form (no decimals for display)
 */
export function parseDaiInput(input) {
  const n = parseFloat(input)
  if (isNaN(n) || n <= 0) return null
  try {
    return parseEther(String(n))
  } catch {
    return null
  }
}

/**
 * Percentage of score progress toward max (100)
 */
export function scoreProgress(score) {
  return Math.min(100, Math.max(0, Number(score)))
}
