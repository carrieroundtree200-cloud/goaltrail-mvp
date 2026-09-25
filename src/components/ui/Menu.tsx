import { Check, type LucideIcon } from 'lucide-react'
import { useEffect, useId, useRef, useState, type ReactNode } from 'react'

import { cn } from '@/lib/cn'

export interface MenuItem {
  id: string
  label: string
  icon?: LucideIcon
  selected?: boolean
  disabled?: boolean
  onSelect: () => void
}

interface MenuProps {
  /** Accessible name for the trigger button. */
  label: string
  trigger: ReactNode
  items: MenuItem[]
  align?: 'start' | 'end'
  triggerClassName?: string
}

/** A small dropdown with roving keyboard focus, used for status changes. */
export function Menu({ label, trigger, items, align = 'end', triggerClassName }: MenuProps) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const menuId = useId()

  useEffect(() => {
    if (!open) return

    function onPointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false)
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false)
        containerRef.current?.querySelector('button')?.focus()
      }
    }

    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    listRef.current?.querySelector<HTMLElement>('[role="menuitemradio"]:not([disabled])')?.focus()
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  function moveFocus(from: HTMLElement, direction: 1 | -1) {
    const options = [...(listRef.current?.querySelectorAll<HTMLElement>('[role="menuitemradio"]') ?? [])]
    const index = options.indexOf(from)
    const next = options[(index + direction + options.length) % options.length]
    next?.focus()
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => setOpen((value) => !value)}
        className={cn(
          'inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50',
          triggerClassName,
        )}
      >
        {trigger}
        <span className="sr-only">{label}</span>
      </button>

      {open ? (
        <div
          id={menuId}
          ref={listRef}
          role="menu"
          aria-label={label}
          className={cn(
            'absolute z-30 mt-1 min-w-48 rounded-xl border border-slate-200 bg-white p-1 shadow-lg',
            align === 'end' ? 'right-0' : 'left-0',
          )}
        >
          {items.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.id}
                type="button"
                role="menuitemradio"
                aria-checked={Boolean(item.selected)}
                disabled={item.disabled}
                onClick={() => {
                  setOpen(false)
                  item.onSelect()
                }}
                onKeyDown={(event) => {
                  if (event.key === 'ArrowDown') {
                    event.preventDefault()
                    moveFocus(event.currentTarget, 1)
                  } else if (event.key === 'ArrowUp') {
                    event.preventDefault()
                    moveFocus(event.currentTarget, -1)
                  }
                }}
                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-sm text-slate-700 hover:bg-slate-100 disabled:opacity-50"
              >
                {Icon ? <Icon aria-hidden="true" className="size-4 shrink-0 text-slate-500" /> : null}
                <span className="flex-1">{item.label}</span>
                {item.selected ? (
                  <Check aria-hidden="true" className="text-accent-700 size-4" />
                ) : null}
              </button>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}
