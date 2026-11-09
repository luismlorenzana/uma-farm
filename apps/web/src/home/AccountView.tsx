// Account (uma-kit's AccountPage): who is signed in, the save's sync, its safety copies, the appearance, the build and
// sign-out, master data's release (Home's row until F5), and the notification switch (F6). In the loop's build the
// Notifications card says they're off (F18 decision 12): with days as turns, nothing finishes while the app is closed.
import { useAuth } from '@luismlorenzana/uma-kit/auth'
import { AccountPage } from '@luismlorenzana/uma-kit/places'
import { Button, Panel } from '@luismlorenzana/uma-kit/ui'
import { useEffect, useState } from 'react'
import { APP_BUILD_ID } from '../app/build'
import { loopOn } from '../app/loop'
import { NotificationsCard } from '../push/NotificationsCard'
import { useMaster } from '../master/master'
import { safetyCopies, type SafetyCopy } from '../save/db'
import { restoreSafetyCopy, seeReplaced, useGame } from '../save/game'
import { dateWords } from '../shell/SyncWarning'
import { syncWords } from './sync-words'

const REASON: Readonly<Record<SafetyCopy['reason'], string>> = { replaced: 'Replaced by a newer save', restore: 'Before a restore', unreadable: 'Couldn’t be read' }

/** The loop's Notifications card (decision 12): off, since days are turns; the server's push is untouched. */
function NotificationsOff() {
  return (
    <Panel className="p-3" aria-label="Notifications">
      <h2 className="text-[14px] font-semibold">Notifications</h2>
      <p className="text-[12px] text-ink-soft">Off: days are turns</p>
    </Panel>
  )
}

function SafetyCopies() {
  const uid = useGame((s) => s.uid)
  const [copies, setCopies] = useState<SafetyCopy[]>([])
  useEffect(() => {
    if (uid) void safetyCopies(uid).then(setCopies)
  }, [uid])
  if (copies.length === 0) return null
  return (
    <Panel label="Safety copies">
      {copies.map((copy) => (
        <div key={copy.id} className="flex min-h-11 items-center justify-between gap-3 py-2">
          <span>{REASON[copy.reason]} · {dateWords(copy.at)}</span>
          <Button size="sm" variant="secondary" onClick={() => {
            if (copy.id === undefined || !uid) return
            void restoreSafetyCopy(copy.id).then(() => safetyCopies(uid)).then(setCopies)
          }}>Restore</Button>
        </div>
      ))}
    </Panel>
  )
}

export function AccountView() {
  const auth = useAuth()
  const state = useGame()
  const master = useMaster()
  const release = master.status === 'ready' ? master.view.manifest.version : master.status === 'error' ? (master.offline ? 'Offline' : 'Unavailable') : 'Loading…'
  useEffect(() => seeReplaced(), [])
  return (
    <AccountPage
      info={[
        { label: 'Signed in', value: auth.user?.email ?? auth.user?.name ?? 'Local' },
        { label: 'Save', value: syncWords(state) },
        { label: 'Last synced', value: state.lastSyncedAt ? dateWords(state.lastSyncedAt) : '—' },
        { label: 'Build', value: APP_BUILD_ID },
        { label: 'Master data', value: release },
      ]}
      notifications={loopOn() ? <NotificationsOff /> : <NotificationsCard />}
      sections={<SafetyCopies />}
      onSignOut={auth.authRequired ? () => auth.signOut() : undefined}
    />
  )
}
