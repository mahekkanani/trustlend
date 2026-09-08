// Contract addresses sourced from environment variables
// Copy .env.example to .env and fill in deployed addresses

export const CONTRACT_ADDRESSES = {
  lendingPool: import.meta.env.VITE_LENDING_POOL_ADDRESS,
  reputationScore: import.meta.env.VITE_REPUTATION_SCORE_ADDRESS,
  mockDai: import.meta.env.VITE_MOCK_DAI_ADDRESS,
}

/** Check if all required addresses are configured */
export function addressesConfigured() {
  return (
    CONTRACT_ADDRESSES.lendingPool &&
    CONTRACT_ADDRESSES.reputationScore &&
    CONTRACT_ADDRESSES.mockDai
  )
}

// Collateral tier thresholds — mirrors solidity constants
export const TIERS = [
  { minScore: 0,  maxScore: 24,  label: 'NEW',         collateral: 150, color: '#8C9BAB' },
  { minScore: 25, maxScore: 49,  label: 'BASIC',        collateral: 130, color: '#5B8DEF' },
  { minScore: 50, maxScore: 74,  label: 'TRUSTED',      collateral: 115, color: '#8B5CF6' },
  { minScore: 75, maxScore: 100, label: 'ESTABLISHED',  collateral: 90,  color: '#C9A84C' },
]

export function getTierForScore(score) {
  return TIERS.find(t => score >= t.minScore && score <= t.maxScore) ?? TIERS[0]
}

export const LOAN_DURATION_DAYS = 7
export const SCORE_INCREMENT = 25
export const MAX_SCORE = 100
