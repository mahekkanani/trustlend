import { useReadContract } from 'wagmi'
import { LENDING_POOL_ABI } from '../contracts/abis'
import { CONTRACT_ADDRESSES } from '../config/contracts'

/**
 * Read the current ETH/USD price from the LendingPool oracle (Chainlink).
 * Returns price as a bigint normalized to 18 decimals (same as the contract).
 */
export function useEthPrice() {
  const { data: price, isLoading, isError, refetch, dataUpdatedAt } = useReadContract({
    address: CONTRACT_ADDRESSES.lendingPool,
    abi: LENDING_POOL_ABI,
    functionName: 'getEthPrice',
    query: {
      enabled: !!CONTRACT_ADDRESSES.lendingPool,
      refetchInterval: 30_000,   // poll every 30s
      staleTime: 25_000,
    },
  })

  return {
    price,                    // bigint, 18 decimals
    isLoading,
    isError,
    refetch,
    updatedAt: dataUpdatedAt, // ms timestamp of last successful fetch
  }
}
