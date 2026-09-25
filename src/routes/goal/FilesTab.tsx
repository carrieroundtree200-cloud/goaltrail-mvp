import { zodResolver } from '@hookform/resolvers/zod'
import { ExternalLink, FolderOpen, Info, Plus, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { fileKindMeta } from '@/components/domain/status'
import { Button } from '@/components/ui/Button'
import { Section } from '@/components/ui/Card'
import { Dialog } from '@/components/ui/Dialog'
import { Field, Input, Select } from '@/components/ui/Field'
import { EmptyState } from '@/components/ui/states'
import { formatDate } from '@/lib/dates'
import { useGoalView } from '@/routes/goal/context'
import { useWorkspace } from '@/state/workspace'
import type { FileKind } from '@/types'

const kinds: FileKind[] = ['doc', 'sheet', 'slides', 'pdf', 'dashboard', 'link']

const schema = z.object({
  name: z.string().trim().min(3, 'Name it so people know what they are opening.'),
  url: z.string().trim().url('Enter a full link, starting with https://'),
  kind: z.enum(['doc', 'sheet', 'slides', 'pdf', 'dashboard', 'link']),
  description: z.string().trim().min(6, 'One line on why this matters to the goal.'),
})

type FormValues = z.infer<typeof schema>

export function FilesTab() {
  const view = useGoalView()
  const { workspace, createFileLink, deleteFileLink } = useWorkspace()
  const [adding, setAdding] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  useEffect(() => {
    if (adding) reset({ name: '', url: '', kind: 'doc', description: '' })
  }, [adding, reset])

  const onSubmit = handleSubmit(async (values) => {
    await createFileLink({ goalId: view.goal.id, ...values })
    setAdding(false)
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold tracking-tight text-slate-900">Files</h2>
          <p className="mt-0.5 max-w-2xl text-sm text-slate-600">
            The documents, spreadsheets and dashboards this goal depends on, gathered in one place.
          </p>
        </div>
        <Button onClick={() => setAdding(true)}>
          <Plus aria-hidden="true" className="size-4" />
          Add a link
        </Button>
      </div>

      <div className="flex items-start gap-2.5 rounded-xl border border-slate-200 bg-white px-4 py-3">
        <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-slate-400" />
        <p className="text-sm text-slate-600">
          This prototype links to files rather than storing them. Uploads will come later — for now,
          paste a link to wherever the file already lives.
        </p>
      </div>

      <Section title="Linked files" description={`${view.files.length} linked.`} flush>
        {view.files.length === 0 ? (
          <EmptyState
            icon={FolderOpen}
            title="Nothing linked yet"
            description="Add the dashboard the metric comes from, or the document the plan is written in."
            action={<Button onClick={() => setAdding(true)}>Add a link</Button>}
          />
        ) : (
          <ul className="divide-hairline divide-y">
            {view.files.map((file) => {
              const meta = fileKindMeta[file.kind]
              const addedBy = workspace.people.find((person) => person.id === file.addedById)
              return (
                <li
                  key={file.id}
                  className="flex flex-wrap items-start justify-between gap-3 px-4 py-3 sm:px-5"
                >
                  <div className="flex min-w-0 gap-3">
                    <span className="mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                      <meta.icon aria-hidden="true" className="size-4" />
                    </span>
                    <div className="min-w-0">
                      <a
                        href={file.url}
                        target="_blank"
                        rel="noreferrer"
                        className="hover:text-accent-700 inline-flex items-center gap-1.5 text-sm font-medium text-slate-900"
                      >
                        {file.name}
                        <ExternalLink aria-hidden="true" className="size-3.5 text-slate-400" />
                      </a>
                      <p className="mt-0.5 text-sm text-slate-600">{file.description}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {meta.label} · added by {addedBy?.name ?? 'someone'} on{' '}
                        {formatDate(file.addedAt)}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => void deleteFileLink(file.id)}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-700"
                  >
                    <Trash2 aria-hidden="true" className="size-4" />
                    <span className="sr-only">Remove the link to {file.name}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </Section>

      <Dialog
        open={adding}
        onClose={() => setAdding(false)}
        title="Add a link"
        description="Point to a file that already lives somewhere else."
        footer={
          <>
            <Button variant="secondary" onClick={() => setAdding(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button form="file-form" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving…' : 'Add link'}
            </Button>
          </>
        }
      >
        <form id="file-form" onSubmit={onSubmit} className="space-y-4">
          <Field label="Name" htmlFor="file-name" required error={errors.name?.message}>
            <Input
              id="file-name"
              placeholder="Weekly on-time dashboard"
              invalid={Boolean(errors.name)}
              {...register('name')}
            />
          </Field>
          <Field label="Link" htmlFor="file-url" required error={errors.url?.message}>
            <Input
              id="file-url"
              type="url"
              placeholder="https://"
              invalid={Boolean(errors.url)}
              {...register('url')}
            />
          </Field>
          <Field label="Kind" htmlFor="file-kind" required>
            <Select id="file-kind" {...register('kind')}>
              {kinds.map((kind) => (
                <option key={kind} value={kind}>
                  {fileKindMeta[kind].label}
                </option>
              ))}
            </Select>
          </Field>
          <Field
            label="Why it matters"
            htmlFor="file-description"
            required
            error={errors.description?.message}
          >
            <Input
              id="file-description"
              placeholder="The number the goal is judged on. Refreshes every Monday."
              invalid={Boolean(errors.description)}
              {...register('description')}
            />
          </Field>
        </form>
      </Dialog>
    </div>
  )
}
