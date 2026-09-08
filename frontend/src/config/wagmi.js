import { http, createConfig } from 'wagmi'
import { mainnet, sepolia, hardhat, anvil } from 'wagmi/chains'
import { injected, metaMask } from 'wagmi/connectors'

// Determine target chain from env
const chainId = parseInt(import.meta.env.VITE_CHAIN_ID || '31337')
const rpcUrl = import.meta.env.VITE_RPC_URL || 'http://127.0.0.1:8545'

// Map chain id to wagmi chain object
const CHAIN_MAP = {
  1: mainnet,
  11155111: sepolia,
  31337: anvil,
}

const targetChain = CHAIN_MAP[chainId] ?? {
  ...anvil,
  id: chainId,
  rpcUrls: { default: { http: [rpcUrl] } },
}

export const wagmiConfig = createConfig({
  chains: [targetChain],
  connectors: [
    injected(),
    metaMask(),
  ],
  transports: {
    [targetChain.id]: http(rpcUrl),
  },
})

export { targetChain }
