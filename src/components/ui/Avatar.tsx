import { cn } from '@/lib/cn'
import { initialsFromName } from '@/lib/format'
import type { Person } from '@/types'

const sizes = {
  xs: 'size-6 text-[10px]',
  sm: 'size-8 text-xs',
  md: 'size-10 text-sm',
}

interface AvatarProps {
  person?: Pick<Person, 'name' | 'initials'>
  size?: keyof typeof sizes
  className?: string
}

export function Avatar({ person, size = 'sm', className }: AvatarProps) {
  const initials = person ? (person.initials ?? initialsFromName(person.name)) : '?'
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full bg-slate-200 font-semibold text-slate-700',
        sizes[size],
        className,
      )}
      title={person?.name}
    >
      <span aria-hidden="true">{initials}</span>
      <span className="sr-only">{person?.name ?? 'Unassigned'}</span>
    </span>
  )
}

export function AvatarGroup({
  people,
  max = 4,
}: {
  people: (Pick<Person, 'name' | 'initials'> | undefined)[]
  max?: number
}) {
  const shown = people.slice(0, max)
  const extra = people.length - shown.length
  return (
    <div className="flex items-center -space-x-1.5">
      {shown.map((person, index) => (
        <Avatar
          key={person?.name ?? index}
          person={person}
          size="xs"
          className="ring-2 ring-white"
        />
      ))}
      {extra > 0 ? (
        <span className="inline-flex size-6 items-center justify-center rounded-full bg-slate-100 text-[10px] font-semibold text-slate-600 ring-2 ring-white">
          +{extra}
        </span>
      ) : null}
    </div>
  )
}
