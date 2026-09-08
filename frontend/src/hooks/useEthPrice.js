import { useState } from 'react'
import { useReadContract } from 'wagmi'
import { LENDING_POOL_ABI, CHAINLINK_FEED_ABI } from '../contracts/abis'
import { CONTRACT_ADDRESSES } from '../config/contracts'

// Mirror the Solidity constant: 24 hours in seconds
const MAX_PRICE_STALENESS_SECS = 86_400

/**
 * Read the current ETH/USD price from the LendingPool oracle (Chainlink).
 * Returns price as a bigint normalized to 18 decimals (same as the contract).
 *
 * Staleness is determined from the Chainlink feed's own on-chain updatedAt
 * timestamp (in seconds), not from wagmi's React-Query cache timestamp
 * (milliseconds). The feed address is read from LendingPool.priceFeed() so
 * it is never hardcoded in the frontend.
 */
export function useEthPrice() {
  const lendingPool = CONTRACT_ADDRESSES.lendingPool
  const [isRefetching, setIsRefetching] = useState(false)

  // Primary price read — LendingPool.getEthPrice() is the authoritative source.
  const {
    data: price,
    isLoading: priceLoading,
    isError: priceError,
    refetch: refetchPrice,
  } = useReadContract({
    address: lendingPool,
    abi: LENDING_POOL_ABI,
    functionName: 'getEthPrice',
    query: {
      enabled: !!lendingPool,
      refetchInterval: 30_000,
      staleTime: 25_000,
      // Retry up to 3 times on transient RPC failure so a single blip does not
      // lock the UI into the error state permanently.
      retry: 3,
      retryDelay: 2_000,
    },
  })

  // Read the deployed feed address from the contract itself — no hardcoding.
  const { data: feedAddress } = useReadContract({
    address: lendingPool,
    abi: LENDING_POOL_ABI,
    functionName: 'priceFeed',
    query: {
      enabled: !!lendingPool,
      // Feed address is immutable; cache it indefinitely.
      staleTime: Infinity,
      cacheTime: Infinity,
    },
  })

  // Read latestRoundData from the Chainlink feed to get the on-chain updatedAt.
  // Only enabled once we know the feed address.
  const {
    data: roundData,
    isLoading: feedLoading,
    refetch: refetchFeed,
  } = useReadContract({
    address: feedAddress,
    abi: CHAINLINK_FEED_ABI,
    functionName: 'latestRoundData',
    query: {
      enabled: !!feedAddress,
      refetchInterval: 30_000,
      staleTime: 25_000,
      retry: 3,
      retryDelay: 2_000,
    },
  })

  // roundData = [roundId, answer, startedAt, updatedAt, answeredInRound]
  // updatedAt is a uint256 in SECONDS (Unix timestamp) — convert via Number().
  const onChainUpdatedAtSecs = roundData ? Number(roundData[3]) : null

  // STALE = we have a valid on-chain timestamp that is genuinely old.
  // Do NOT conflate STALE with a network/RPC error.
  const nowSecs = Math.floor(Date.now() / 1000)
  const isStale =
    onChainUpdatedAtSecs !== null &&
    nowSecs - onChainUpdatedAtSecs > MAX_PRICE_STALENESS_SECS

  // isLoading is true only while the first price fetch is in flight.
  // feedLoading is excluded: the staleness indicator can arrive after the price.
  const isLoading = priceLoading

  // isError reflects only the price read failure (no price to display).
  const isError = priceError

  async function refetch() {
    if (isRefetching) return  // prevent duplicate concurrent refetch
    setIsRefetching(true)
    try {
      // Both refetch() calls return promises — await them in parallel.
      await Promise.all([
        refetchPrice(),
        refetchFeed ? refetchFeed() : Promise.resolve(),
      ])
    } finally {
      setIsRefetching(false)
    }
  }

  return {
    price,                    // bigint, 18 decimals
    isLoading,
    isError,                  // true = RPC/read failed, no price available
    isStale,                  // true = on-chain updatedAt is genuinely > 24h old
    onChainUpdatedAtSecs,     // seconds, from latestRoundData
    isRefetching,             // true = manual refetch in progress
    refetch,
  }
}
