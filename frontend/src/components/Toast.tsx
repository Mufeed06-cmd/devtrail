import React, { useEffect } from 'react'
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react'

export interface ToastMessage {
  id: string
  type: 'success' | 'error' | 'info'
  message: string
}

interface ToastProps {
  toast: ToastMessage | null
  onDismiss: () => void
}

export const Toast: React.FC<ToastProps> = ({ toast, onDismiss }) => {
  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => {
      onDismiss()
    }, 4500)
    return () => clearTimeout(timer)
  }, [toast, onDismiss])

  if (!toast) return null

  const isSuccess = toast.type === 'success'
  const isError = toast.type === 'error'

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 200,
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '12px 18px',
        borderRadius: '8px',
        background: isError
          ? '#2d1518'
          : isSuccess
          ? '#0e2b1e'
          : '#162238',
        border: `1px solid ${
          isError
            ? 'rgba(239, 68, 68, 0.4)'
            : isSuccess
            ? 'rgba(16, 185, 129, 0.4)'
            : 'rgba(59, 130, 246, 0.4)'
        }`,
        color: '#f8fafc',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.6)',
        fontSize: '13px',
        animation: 'modalIn 0.2s ease',
      }}
    >
      {isSuccess && <CheckCircle2 size={16} color="#34d399" />}
      {isError && <AlertCircle size={16} color="#f87171" />}
      {!isSuccess && !isError && <Info size={16} color="#60a5fa" />}

      <span style={{ maxWidth: '340px' }}>{toast.message}</span>

      <button
        type="button"
        onClick={onDismiss}
        style={{
          background: 'transparent',
          border: 'none',
          color: '#94a3b8',
          cursor: 'pointer',
          padding: '2px',
          marginLeft: '4px',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <X size={14} />
      </button>
    </div>
  )
}
