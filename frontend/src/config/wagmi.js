import { http, createConfig } from 'wagmi'
import { mainnet, sepolia, hardhat, anvil } from 'wagmi/chains'
import { injected, metaMask } from 'wagmi/connectors'

// Determine target chain from env
const chainId = parseInt(import.meta.env.VITE_CHAIN_ID || '31337')
const rpcUrl = import.meta.env.VITE_RPC_URL   // may be empty string or undefined

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

// If VITE_RPC_URL is set and non-empty, use it explicitly.
// Otherwise pass http() with no argument so wagmi/viem uses the chain's
// built-in public RPC list (e.g. rpc.sepolia.org for Sepolia).
// Passing http('') or http('http://127.0.0.1:8545') when targeting Sepolia
// would route all reads to a localhost Anvil node that cannot serve them.
const transport = rpcUrl ? http(rpcUrl) : http()

export const wagmiConfig = createConfig({
  chains: [targetChain],
  connectors: [
    injected(),
    metaMask(),
  ],
  transports: {
    [targetChain.id]: transport,
  },
})

export { targetChain }
