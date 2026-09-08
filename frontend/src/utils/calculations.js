import { parseEther, formatEther } from 'viem'

// Pure bigint ceiling division: ⌈a / b⌉  (a, b > 0)
function divCeil(a, b) {
  return (a + b - 1n) / b
}

/**
 * Calculate the required ETH collateral for a DAI borrow.
 *
 * Mirrors the Solidity logic:
 *   requiredCollateralUSD = (borrowAmount * collateralPct) / 100
 *   requiredEth = requiredCollateralUSD / ethPrice
 *
 * SAFETY: both divisions round UP (ceiling) so the returned wei value is
 * always >= the contract's exact requirement.  The Solidity contract uses
 * floor division when computing required collateral, but checks
 *   msg.value >= requiredEth
 * so sending one extra wei never fails and is the correct rounding direction
 * for the caller.  Rounding down (the previous behaviour) produced values
 * that were a few wei short and caused "Insufficient collateral" reverts.
 *
 * @param {bigint} borrowAmountWei  – DAI to borrow (18 decimals)
 * @param {number} collateralPct    – e.g. 150, 130, 115, 90
 * @param {bigint} ethPriceWei      – ETH/USD price (18 decimals, from oracle)
 * @returns {bigint} required ETH in wei, rounded UP
 */
export function calcRequiredEth(borrowAmountWei, collateralPct, ethPriceWei) {
  if (!borrowAmountWei || !collateralPct || !ethPriceWei || ethPriceWei === 0n) {
    return 0n
  }
  // requiredUSD = ⌈borrow * pct / 100⌉   (18-decimal throughout)
  const requiredUSD = divCeil(borrowAmountWei * BigInt(collateralPct), 100n)
  // requiredEth  = ⌈requiredUSD * 1e18 / ethPrice⌉
  const requiredEth = divCeil(requiredUSD * (10n ** 18n), ethPriceWei)
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
