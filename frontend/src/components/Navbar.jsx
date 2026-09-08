import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Shield } from 'lucide-react'
import WalletButton from './WalletButton'

const NAV_LINKS = [
  { label: 'Dashboard', to: '/dashboard' },
  { label: 'Borrow', to: '/dashboard#borrow' },
  { label: 'Passport', to: '/dashboard#passport' },
]

export default function Navbar() {
  const location = useLocation()

  return (
    <motion.nav
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="fixed top-0 left-0 right-0 z-50"
      style={{
        background: 'rgba(8,9,10,0.8)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div
            className="w-7 h-7 rounded-md flex items-center justify-center transition-all group-hover:scale-110"
            style={{
              background: 'linear-gradient(135deg, rgba(91,141,239,0.2), rgba(139,92,246,0.2))',
              border: '1px solid rgba(91,141,239,0.3)',
            }}
          >
            <Shield size={14} color="#5B8DEF" />
          </div>
          <span className="font-semibold text-sm tracking-[0.15em] text-text-primary uppercase">
            TrustLend
          </span>
        </Link>

        {/* Nav links — desktop only */}
        {location.pathname.startsWith('/dashboard') && (
          <div className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map(link => (
              <a
                key={link.label}
                href={link.to}
                className="px-4 py-2 text-xs font-medium tracking-wider uppercase rounded-lg transition-colors text-text-secondary hover:text-text-primary hover:bg-white/4"
              >
                {link.label}
              </a>
            ))}
          </div>
        )}

        <WalletButton />
      </div>
    </motion.nav>
  )
}
