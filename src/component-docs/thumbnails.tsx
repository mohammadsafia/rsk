import type { ReactNode } from 'react';

import { Avatar, Badge, Button, CalendarEvent, Checkbox, Input, Progress, Skeleton, Spinner, Switch, Tabs, Tag } from '@components/ui';
import { Logo } from '@components/shared';

import { Inbox } from 'lucide-react';

// Tiny, static renders of the real components for the docs overview cards. No state, no portals (triggers only),
// and the card wraps them in an inert, aria-hidden stage.
const Field = ({ label, value }: { label: string; value?: string }) => (
  <div className="flex w-40 flex-col gap-1">
    <span className="text-fg-muted text-2xs">{label}</span>
    <Input size="sm" defaultValue={value} placeholder={label} readOnly />
  </div>
);

const Lines = () => (
  <div className="flex w-40 flex-col gap-1.5">
    <span className="bg-border h-1.5 w-3/4 rounded-full" />
    <span className="bg-border-subtle h-1.5 w-full rounded-full" />
    <span className="bg-border-subtle h-1.5 w-2/3 rounded-full" />
  </div>
);

export const THUMBNAILS: Partial<Record<string, () => ReactNode>> = {
  button: () => (
    <>
      <Button size="sm">Save</Button>
      <Button size="sm" variant="outline">
        Cancel
      </Button>
    </>
  ),
  inputs: () => <Field label="Patient name" value="Sara Haddad" />,
  'form-field': () => <Field label="Email" value="sara@clinic.jo" />,
  select: () => (
    <div className="border-border-strong bg-surface text-fg h-control-sm flex w-36 items-center justify-between rounded-md border px-2.5 text-xs">
      Cardiology <span className="text-fg-muted">▾</span>
    </div>
  ),
  tag: () => (
    <>
      <Tag tone="success">Active</Tag>
      <Tag tone="warning">Pending</Tag>
    </>
  ),
  badge: () => (
    <>
      <Badge variant="dot" tone="success">
        Paid
      </Badge>
      <Badge variant="soft" tone="accent">
        New
      </Badge>
    </>
  ),
  card: () => (
    <div className="bg-surface border-border w-40 rounded-md border p-2.5">
      <p className="text-fg text-xs font-semibold">Next patient</p>
      <p className="text-fg-muted text-2xs">Sara Haddad · 10:30</p>
    </div>
  ),
  tabs: () => (
    <Tabs defaultValue="week">
      <Tabs.List variant="contained">
        <Tabs.Trigger value="day">Day</Tabs.Trigger>
        <Tabs.Trigger value="week">Week</Tabs.Trigger>
      </Tabs.List>
    </Tabs>
  ),
  dialog: () => (
    <div className="bg-surface-raised shadow-overlay border-border w-40 rounded-md border p-2.5">
      <p className="text-fg text-xs font-semibold">Delete record?</p>
      <div className="mt-2 flex justify-end gap-1">
        <Button size="sm" variant="outline">
          No
        </Button>
        <Button size="sm" tone="danger">
          Delete
        </Button>
      </div>
    </div>
  ),
  'confirm-dialog': () => (
    <div className="bg-surface-raised shadow-overlay border-border w-40 rounded-md border p-2.5">
      <p className="text-fg text-xs font-semibold">Discard changes?</p>
      <Lines />
    </div>
  ),
  calendar: () => (
    <div className="text-2xs grid grid-cols-7 gap-1 text-center font-mono tabular-nums">
      {Array.from({ length: 14 }, (_, day) => (
        <span key={day} className={day === 9 ? 'bg-accent text-accent-fg rounded-sm' : 'text-fg-muted'}>
          {day + 1}
        </span>
      ))}
    </div>
  ),
  'calendar-grid': () => (
    <div className="flex w-40 flex-col gap-1">
      <CalendarEvent tone="info">09:00 · Check-up</CalendarEvent>
      <CalendarEvent tone="accent">10:30 · Consult</CalendarEvent>
    </div>
  ),
  'data-table': () => (
    <div className="border-border text-2xs w-44 overflow-hidden rounded-md border">
      {['INV-0142 · 1,240.50', 'INV-0143 · 87.00', 'INV-0144 · 310.00'].map((row, index) => (
        <div
          key={row}
          className={
            index === 1 ? 'bg-accent-subtle px-2 py-1 font-mono' : 'border-border-subtle border-t px-2 py-1 font-mono first:border-t-0'
          }
        >
          {row}
        </div>
      ))}
    </div>
  ),
  'empty-state': () => (
    <div className="text-fg-subtle flex flex-col items-center gap-1">
      <Inbox aria-hidden="true" className="size-6" />
      <span className="text-fg-muted text-2xs">Nothing here yet</span>
    </div>
  ),
  'page-header': () => (
    <div className="flex w-44 items-start justify-between">
      <div>
        <p className="text-fg text-sm font-semibold">Patients</p>
        <p className="text-fg-muted text-2xs">Amman clinic</p>
      </div>
      <Button size="sm">Add</Button>
    </div>
  ),
  'app-shell': () => (
    <div className="border-border flex h-16 w-44 overflow-hidden rounded-md border">
      <div className="bg-sidebar border-border-subtle w-10 border-e" />
      <div className="flex-1">
        <div className="border-border-subtle h-4 border-b" />
        <div className="p-1.5">
          <Lines />
        </div>
      </div>
    </div>
  ),
  logo: () => <Logo variant="lockup" size="md" />,
  spinner: () => <Spinner size="md" />,
  skeleton: () => (
    <div className="flex w-40 flex-col gap-1.5">
      <Skeleton size="sm" />
      <Skeleton size="sm" />
    </div>
  ),
  switch: () => <Switch defaultChecked aria-label="Reminders" />,
  checkbox: () => <Checkbox defaultChecked aria-label="Insured" />,
  progress: () => (
    <div className="w-40">
      <Progress value={64} aria-label="Intake" />
    </div>
  ),
  avatar: () => (
    <Avatar size="md">
      <Avatar.Image src="" alt="" />
      <Avatar.Fallback>SH</Avatar.Fallback>
    </Avatar>
  ),
};
