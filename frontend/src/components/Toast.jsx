import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react'

const ICONS = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
}

const COLORS = {
  success: { border: 'rgba(52,211,153,0.3)', bg: 'rgba(52,211,153,0.08)', icon: '#34D399' },
  error: { border: 'rgba(248,113,113,0.3)', bg: 'rgba(248,113,113,0.08)', icon: '#F87171' },
  warning: { border: 'rgba(251,191,36,0.3)', bg: 'rgba(251,191,36,0.08)', icon: '#FBBF24' },
  info: { border: 'rgba(91,141,239,0.3)', bg: 'rgba(91,141,239,0.08)', icon: '#5B8DEF' },
}

export function ToastContainer({ toasts, onDismiss }) {
  return (
    <div className="fixed top-20 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full">
      <AnimatePresence>
        {toasts.map(toast => (
          <Toast key={toast.id} toast={toast} onDismiss={onDismiss} />
        ))}
      </AnimatePresence>
    </div>
  )
}

function Toast({ toast, onDismiss }) {
  const { id, type = 'info', title, message, duration = 5000 } = toast
  const timerRef = useRef(null)
  const Icon = ICONS[type]
  const colors = COLORS[type]

  useEffect(() => {
    if (duration > 0) {
      timerRef.current = setTimeout(() => onDismiss(id), duration)
    }
    return () => clearTimeout(timerRef.current)
  }, [id, duration, onDismiss])

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 60, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 60, scale: 0.9 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className="relative rounded-xl overflow-hidden"
      style={{
        background: '#0e1012',
        border: `1px solid ${colors.border}`,
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
      }}
    >
      <div className="absolute inset-0 pointer-events-none" style={{ background: colors.bg }} />
      <div className="relative flex items-start gap-3 p-4">
        <Icon size={18} style={{ color: colors.icon, flexShrink: 0, marginTop: 1 }} />
        <div className="flex-1 min-w-0">
          {title && (
            <div className="font-medium text-sm text-text-primary mb-0.5">{title}</div>
          )}
          {message && (
            <div className="text-xs text-text-secondary leading-relaxed">{message}</div>
          )}
        </div>
        <button
          onClick={() => onDismiss(id)}
          className="text-text-muted hover:text-text-secondary transition-colors flex-shrink-0"
        >
          <X size={14} />
        </button>
      </div>
    </motion.div>
  )
}

/** Hook for managing toasts */
import { useState, useCallback } from 'react'

let _toastId = 0

export function useToast() {
  const [toasts, setToasts] = useState([])

  const toast = useCallback((opts) => {
    const id = ++_toastId
    setToasts(prev => [...prev, { id, ...opts }])
    return id
  }, [])

  const dismiss = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  return { toasts, toast, dismiss }
}
