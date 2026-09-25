import type { ReactNode } from 'react'

import { cn } from '@/lib/cn'

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn('card', className)}>{children}</div>
}

interface SectionProps {
  title: string
  description?: ReactNode
  action?: ReactNode
  /** Removes the body padding so tables and lists can sit flush. */
  flush?: boolean
  className?: string
  bodyClassName?: string
  children: ReactNode
}

export function Section({
  title,
  description,
  action,
  flush,
  className,
  bodyClassName,
  children,
}: SectionProps) {
  return (
    <section className={cn('card overflow-hidden', className)}>
      <header className="border-hairline flex flex-wrap items-start justify-between gap-3 border-b px-4 py-3 sm:px-5">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold tracking-tight text-slate-900">{title}</h2>
          {description ? <p className="mt-0.5 text-sm text-slate-500">{description}</p> : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </header>
      <div className={cn(flush ? '' : 'px-4 py-4 sm:px-5', bodyClassName)}>{children}</div>
    </section>
  )
}
