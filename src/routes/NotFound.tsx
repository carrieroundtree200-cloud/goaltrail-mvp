import { Compass } from 'lucide-react'

import { Page } from '@/components/layout/PageHeader'
import { ButtonLink } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/states'

export function NotFound() {
  return (
    <Page>
      <div className="card mx-auto max-w-lg">
        <EmptyState
          icon={Compass}
          title="That page does not exist"
          description="The link may be out of date, or the goal it pointed to has been removed."
          action={<ButtonLink to="/dashboard">Back to the dashboard</ButtonLink>}
        />
      </div>
    </Page>
  )
}
