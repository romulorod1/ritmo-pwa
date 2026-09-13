import type { ReactNode } from 'react'

export type IconName =
  | 'today'
  | 'training'
  | 'progress'
  | 'settings'
  | 'clock'
  | 'check'
  | 'chevron-left'
  | 'chevron-right'
  | 'edit'
  | 'scale'
  | 'close'
  | 'plus'
  | 'download'
  | 'upload'
  | 'shield'
  | 'trash'

const paths: Record<IconName, ReactNode> = {
  today: <><path d="M5 3v3M19 3v3M4 9h16"/><rect x="3" y="5" width="18" height="16" rx="3"/><path d="m8 15 2.2 2.2L16 12"/></>,
  training: <><path d="M6 7v10M18 7v10M3 9v6M21 9v6M6 12h12"/></>,
  progress: <><path d="M4 19V5M4 19h17"/><path d="m7 15 4-4 3 2 5-6"/></>,
  settings: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.83 2.83-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1.1V21h-4v-.09A1.7 1.7 0 0 0 8.6 19.4a1.7 1.7 0 0 0-1.88.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.6-1H3v-4h.09A1.7 1.7 0 0 0 4.6 9a1.7 1.7 0 0 0-.34-1.88l-.06-.06 2.83-2.83.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-1.6V3h4v.09A1.7 1.7 0 0 0 15 4.6a1.7 1.7 0 0 0 1.88-.34l.06-.06 2.83 2.83-.06.06A1.7 1.7 0 0 0 19.4 9a1.7 1.7 0 0 0 1.6 1h.09v4H21a1.7 1.7 0 0 0-1.6 1Z"/></>,
  clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
  check: <path d="m5 12 4 4L19 6"/>,
  'chevron-left': <path d="m15 18-6-6 6-6"/>,
  'chevron-right': <path d="m9 18 6-6-6-6"/>,
  edit: <><path d="M4 20h4l11-11-4-4L4 16v4Z"/><path d="m13.5 6.5 4 4"/></>,
  scale: <><path d="M5 20h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2Z"/><path d="M8 9a4 4 0 0 1 8 0M12 9l2-2"/></>,
  close: <><path d="m6 6 12 12M18 6 6 18"/></>,
  plus: <><path d="M12 5v14M5 12h14"/></>,
  download: <><path d="M12 3v12M7 10l5 5 5-5"/><path d="M5 21h14"/></>,
  upload: <><path d="M12 16V4M7 9l5-5 5 5"/><path d="M5 21h14"/></>,
  shield: <><path d="M12 3 5 6v5c0 5 3 8 7 10 4-2 7-5 7-10V6l-7-3Z"/><path d="m9 12 2 2 4-4"/></>,
  trash: <><path d="M4 7h16M9 7V4h6v3M7 7l1 14h8l1-14M10 11v6M14 11v6"/></>,
}

export const Icon = ({ name, size = 22 }: { name: IconName; size?: number }) => (
  <svg
    aria-hidden="true"
    className="icon"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {paths[name]}
  </svg>
)
