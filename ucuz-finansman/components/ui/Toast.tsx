'use client'

import { useState, useCallback, useEffect } from 'react'
import { CheckCircle2, AlertCircle, XCircle, X, Info } from 'lucide-react'
import { cn } from '@/lib/utils'

type ToastType = 'success' | 'error' | 'info' | 'warning'

interface Toast {
  id: string
  type: ToastType
  message: string
}

const toastIcons = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertCircle,
  info: Info,
}

const toastStyles = {
  success: 'bg-success-50 border-success-200 text-success-800',
  error:   'bg-red-50 border-red-200 text-red-800',
  warning: 'bg-amber-50 border-amber-200 text-amber-800',
  info:    'bg-primary-50 border-primary-200 text-primary-800',
}

let listeners: ((toast: Toast) => void)[] = []

export function showToast(message: string, type: ToastType = 'info') {
  const toast: Toast = { id: Date.now().toString(), type, message }
  listeners.forEach(fn => fn(toast))
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = useCallback((toast: Toast) => {
    setToasts(prev => [...prev, toast])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== toast.id))
    }, 4000)
  }, [])

  useEffect(() => {
    listeners.push(addToast)
    return () => { listeners = listeners.filter(fn => fn !== addToast) }
  }, [addToast])

  const remove = (id: string) => setToasts(prev => prev.filter(t => t.id !== id))

  return (
    <div className="fixed bottom-4 right-4 z-[200] flex flex-col gap-2 max-w-sm">
      {toasts.map(toast => {
        const Icon = toastIcons[toast.type]
        return (
          <div
            key={toast.id}
            className={cn(
              'flex items-start gap-3 px-4 py-3 rounded-xl border shadow-card-md text-sm font-medium',
              'animate-in slide-in-from-right-4 fade-in',
              toastStyles[toast.type]
            )}
          >
            <Icon className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span className="flex-1">{toast.message}</span>
            <button onClick={() => remove(toast.id)} className="opacity-60 hover:opacity-100 transition-opacity">
              <X className="w-4 h-4" />
            </button>
          </div>
        )
      })}
    </div>
  )
}
