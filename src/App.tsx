import type { ReactElement } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'

import { AppShell } from '@/components/layout/AppShell'
import { Page } from '@/components/layout/PageHeader'
import { Toaster } from '@/components/ui/Toaster'
import { LoadingPanel } from '@/components/ui/states'
import { Dashboard } from '@/routes/Dashboard'
import { MeetingDetail } from '@/routes/MeetingDetail'
import { NewGoal } from '@/routes/NewGoal'
import { NotFound } from '@/routes/NotFound'
import { SignIn } from '@/routes/SignIn'
import { FilesTab } from '@/routes/goal/FilesTab'
import { GoalLayout } from '@/routes/goal/GoalLayout'
import { GoalTab } from '@/routes/goal/GoalTab'
import { MeetingsTab } from '@/routes/goal/MeetingsTab'
import { OverviewTab } from '@/routes/goal/OverviewTab'
import { PeopleTab } from '@/routes/goal/PeopleTab'
import { PlanTab } from '@/routes/goal/PlanTab'
import { RisksTab } from '@/routes/goal/RisksTab'
import { WorkBoardTab } from '@/routes/goal/WorkBoardTab'
import { ToastProvider } from '@/state/ToastProvider'
import { WorkspaceProvider } from '@/state/WorkspaceProvider'
import { useWorkspace } from '@/state/workspace'

/** Sends anyone without a session back to the entry screen. */
function RequireSession({ children }: { children: ReactElement }) {
  const { status, session } = useWorkspace()
  const location = useLocation()

  if (status === 'loading') {
    return (
      <Page>
        <LoadingPanel label="Opening GoalTrail" />
      </Page>
    )
  }

  if (!session) {
    return <Navigate to="/" replace state={{ from: location.pathname }} />
  }

  return children
}

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <WorkspaceProvider>
          <Routes>
            <Route path="/" element={<SignIn />} />
            <Route
              element={
                <RequireSession>
                  <AppShell />
                </RequireSession>
              }
            >
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/goals/new" element={<NewGoal />} />
              <Route path="/goals/:goalId" element={<GoalLayout />}>
                <Route index element={<OverviewTab />} />
                <Route path="goal" element={<GoalTab />} />
                <Route path="plan" element={<PlanTab />} />
                <Route path="work" element={<WorkBoardTab />} />
                <Route path="people" element={<PeopleTab />} />
                <Route path="meetings" element={<MeetingsTab />} />
                <Route path="risks" element={<RisksTab />} />
                <Route path="files" element={<FilesTab />} />
              </Route>
              <Route path="/meetings/:meetingId" element={<MeetingDetail />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
          <Toaster />
        </WorkspaceProvider>
      </ToastProvider>
    </BrowserRouter>
  )
}
