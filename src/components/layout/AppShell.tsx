import {
  LayoutDashboard,
  LogOut,
  Menu as MenuIcon,
  Plus,
  RefreshCw,
  Route as RouteIcon,
  X,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'

import { Avatar } from '@/components/ui/Avatar'
import { ButtonLink } from '@/components/ui/Button'
import { healthMeta } from '@/components/domain/status'
import { cn } from '@/lib/cn'
import { selectAllGoalViews } from '@/state/selectors'
import { useWorkspace } from '@/state/workspace'

function NavItem({
  to,
  icon: Icon,
  children,
  onNavigate,
  end,
}: {
  to: string
  icon: typeof LayoutDashboard
  children: React.ReactNode
  onNavigate: () => void
  end?: boolean
}) {
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
          isActive
            ? 'bg-accent-50 text-accent-800'
            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
        )
      }
    >
      <Icon aria-hidden="true" className="size-4 shrink-0" />
      <span className="truncate">{children}</span>
    </NavLink>
  )
}

export function AppShell() {
  const { workspace, currentUser, signOut, resetDemoData } = useWorkspace()
  const [menuOpen, setMenuOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname])

  const goalViews = selectAllGoalViews(workspace)
  const close = () => setMenuOpen(false)

  const sidebar = (
    <div className="flex h-full flex-col gap-6 p-4">
      <Link to="/dashboard" className="flex items-center gap-2 px-1" onClick={close}>
        <span className="bg-accent-700 inline-flex size-8 items-center justify-center rounded-lg text-white">
          <RouteIcon aria-hidden="true" className="size-4.5" />
        </span>
        <span className="text-base font-semibold tracking-tight text-slate-900">GoalTrail</span>
      </Link>

      <nav aria-label="Main" className="space-y-1">
        <NavItem to="/dashboard" icon={LayoutDashboard} onNavigate={close}>
          Dashboard
        </NavItem>
      </nav>

      <div className="min-h-0 flex-1">
        <h2 className="px-3 text-xs font-semibold tracking-wide text-slate-500 uppercase">
          Goals
        </h2>
        <ul className="scrollbar-slim mt-2 max-h-[40vh] space-y-0.5 overflow-y-auto lg:max-h-none">
          {goalViews.map((view) => {
            const meta = healthMeta[view.health.level]
            return (
              <li key={view.goal.id}>
                <NavLink
                  to={`/goals/${view.goal.id}`}
                  onClick={close}
                  className={({ isActive }) =>
                    cn(
                      'flex items-start gap-2 rounded-lg px-3 py-2 text-sm transition-colors',
                      isActive
                        ? 'bg-accent-50 text-accent-900 font-medium'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
                    )
                  }
                >
                  <meta.icon aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
                  <span className="line-clamp-2">
                    {view.goal.title}
                    <span className="sr-only"> — {meta.label}</span>
                  </span>
                </NavLink>
              </li>
            )
          })}
        </ul>
        <ButtonLink to="/goals/new" variant="secondary" size="sm" className="mt-3 w-full" onClick={close}>
          <Plus aria-hidden="true" className="size-4" />
          New goal
        </ButtonLink>
      </div>

      <div className="border-hairline space-y-2 border-t pt-4">
        <div className="flex items-center gap-2.5 px-1">
          <Avatar person={currentUser} size="sm" />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-slate-900">
              {currentUser?.name ?? 'Guest'}
            </p>
            <p className="truncate text-xs text-slate-500">{currentUser?.jobTitle ?? 'Demo mode'}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => void resetDemoData()}
          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 hover:text-slate-900"
        >
          <RefreshCw aria-hidden="true" className="size-4" />
          Reset demo data
        </button>
        <button
          type="button"
          onClick={async () => {
            await signOut()
            navigate('/')
          }}
          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 hover:text-slate-900"
        >
          <LogOut aria-hidden="true" className="size-4" />
          Sign out
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-dvh">
      <a
        href="#main"
        className="sr-only-focusable bg-accent-700 fixed top-3 left-3 z-70 rounded-lg px-3 py-2 text-sm font-medium text-white"
      >
        Skip to main content
      </a>

      <header className="border-hairline sticky top-0 z-40 flex items-center justify-between border-b bg-white/90 px-4 py-2.5 backdrop-blur lg:hidden">
        <Link to="/dashboard" className="flex items-center gap-2">
          <span className="bg-accent-700 inline-flex size-7 items-center justify-center rounded-lg text-white">
            <RouteIcon aria-hidden="true" className="size-4" />
          </span>
          <span className="font-semibold text-slate-900">GoalTrail</span>
        </Link>
        <button
          type="button"
          onClick={() => setMenuOpen((value) => !value)}
          aria-expanded={menuOpen}
          aria-controls="mobile-nav"
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
        >
          {menuOpen ? (
            <X aria-hidden="true" className="size-5" />
          ) : (
            <MenuIcon aria-hidden="true" className="size-5" />
          )}
          <span className="sr-only">{menuOpen ? 'Close menu' : 'Open menu'}</span>
        </button>
      </header>

      {menuOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close menu"
            className="absolute inset-0 bg-slate-900/40"
            onClick={close}
            tabIndex={-1}
          />
          <div
            id="mobile-nav"
            className="border-hairline relative h-full w-72 max-w-[85vw] overflow-y-auto border-r bg-white"
          >
            {sidebar}
          </div>
        </div>
      ) : null}

      <div className="lg:flex">
        <aside className="border-hairline sticky top-0 hidden h-dvh w-64 shrink-0 border-r bg-white lg:block">
          {sidebar}
        </aside>
        <main id="main" className="min-w-0 flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
