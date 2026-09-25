import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react'

import { cn } from '@/lib/cn'
import { useToast, type ToastTone } from '@/state/toast'

const icons = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
}

const tones: Record<ToastTone, string> = {
  success: 'border-emerald-200 text-emerald-900',
  error: 'border-rose-200 text-rose-900',
  info: 'border-slate-200 text-slate-900',
}

export function Toaster() {
  const { toasts, dismiss } = useToast()
  if (toasts.length === 0) return null

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-4 z-60 flex flex-col items-center gap-2 px-4 sm:inset-x-auto sm:right-6 sm:items-end"
    >
      {toasts.map((toast) => {
        const Icon = icons[toast.tone]
        return (
          <div
            key={toast.id}
            className={cn(
              'pointer-events-auto flex w-full max-w-sm items-start gap-2.5 rounded-xl border bg-white px-3.5 py-2.5 shadow-lg',
              tones[toast.tone],
            )}
          >
            <Icon aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
            <p className="flex-1 text-sm">{toast.message}</p>
            <button
              type="button"
              onClick={() => dismiss(toast.id)}
              className="rounded p-0.5 text-slate-400 hover:text-slate-700"
            >
              <X aria-hidden="true" className="size-4" />
              <span className="sr-only">Dismiss</span>
            </button>
          </div>
        )
      })}
    </div>
  )
}
