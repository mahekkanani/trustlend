import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAccount, useDisconnect, useChainId, useConnect } from 'wagmi'
import { Shield, ChevronDown, Copy, LogOut, Wifi, WifiOff } from 'lucide-react'
import { fmtAddress } from '../utils/format'

export default function WalletButton() {
  const { address, isConnected } = useAccount()
  const { disconnect } = useDisconnect()
  const { connect, connectors } = useConnect()
  const chainId = useChainId()
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  const expectedChainId = parseInt(import.meta.env.VITE_CHAIN_ID || '31337')
  const wrongNetwork = isConnected && chainId !== expectedChainId

  function copyAddress() {
    if (!address) return
    navigator.clipboard.writeText(address)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  function handleConnect() {
    // Try to connect with the first available connector (usually MetaMask/injected)
    const connector = connectors[0]
    if (connector) {
      connect({ connector })
    }
  }

  if (!isConnected) {
    return (
      <motion.button
        onClick={handleConnect}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="relative px-5 py-2.5 rounded-lg font-medium text-sm tracking-wide overflow-hidden group"
        style={{
          background: 'linear-gradient(135deg, rgba(91,141,239,0.15) 0%, rgba(139,92,246,0.10) 100%)',
          border: '1px solid rgba(91,141,239,0.3)',
          color: '#5B8DEF',
        }}
      >
        <span className="relative z-10 flex items-center gap-2">
          <Shield size={14} />
          CONNECT WALLET
        </span>
        <motion.div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ background: 'linear-gradient(135deg, rgba(91,141,239,0.25) 0%, rgba(139,92,246,0.15) 100%)' }}
        />
      </motion.button>
    )
  }

  if (wrongNetwork) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
        style={{
          background: 'rgba(248,113,113,0.08)',
          border: '1px solid rgba(248,113,113,0.2)',
          color: '#F87171',
        }}
      >
        <WifiOff size={14} />
        <span>WRONG NETWORK</span>
      </motion.div>
    )
  }

  return (
    <div className="relative">
      <motion.button
        onClick={() => setOpen(!open)}
        whileHover={{ scale: 1.01 }}
        className="flex items-center gap-2.5 px-4 py-2.5 rounded-lg text-sm font-medium"
        style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.1)',
          color: '#F0F4F8',
        }}
      >
        {/* Connected indicator */}
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-60" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400" />
        </span>
        <span className="font-mono text-xs">{fmtAddress(address)}</span>
        <ChevronDown size={14} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </motion.button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.96 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 mt-2 w-64 rounded-xl overflow-hidden z-20"
              style={{
                background: '#0e1012',
                border: '1px solid rgba(255,255,255,0.08)',
                boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
              }}
            >
              {/* Address row */}
              <div className="px-4 py-3 border-b border-white/5">
                <div className="text-xs text-text-secondary uppercase tracking-wider mb-1">Connected</div>
                <div className="font-mono text-sm text-text-primary break-all">{address}</div>
              </div>

              {/* Actions */}
              <button
                onClick={copyAddress}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-white/4 transition-colors text-text-secondary hover:text-text-primary"
              >
                <Copy size={14} />
                {copied ? 'Copied!' : 'Copy Address'}
              </button>
              <button
                onClick={() => { disconnect(); setOpen(false) }}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-white/4 transition-colors"
                style={{ color: '#F87171' }}
              >
                <LogOut size={14} />
                Disconnect
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
