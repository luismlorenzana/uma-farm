// Account (uma-kit's AccountPage): who is signed in, the save's sync, its safety copies, the appearance, the build and
// sign-out, and master data's release. The Notifications card says they're off: with days as turns,
// nothing finishes while the app is closed; the server's push is untouched. It also holds **Your name**, the farmer's,
// under the name sheet's rule; a safety copy from before v4 lists as Kept, without a Restore, since restoring it would
// only start over again. It also holds the **Story** row: the story release the game plays, by its ship's number and
// date, or "No story yet". On a wide screen its panels sit in two columns (index.css).
import { cleanFarmerName, FARMER_PLACEHOLDER, farmerNameIssue, SAVE_VERSION, versionOf } from '@farm/domain'
import { useAuth } from '@luismlorenzana/uma-kit/auth'
import { AccountPage } from '@luismlorenzana/uma-kit/places'
import { Button, Panel } from '@luismlorenzana/uma-kit/ui'
import { useEffect, useState } from 'react'
import { APP_BUILD_ID } from '../app/build'
import { useMaster } from '../master/master'
import { safetyCopies, type SafetyCopy } from '../save/db'
import { useStory } from '../story/story'
import { restoreSafetyCopy, seeReplaced, useGame } from '../save/game'
import { dateWords } from '../shell/SyncWarning'
import { storyWords, syncWords } from './sync-words'

const REASON: Readonly<Record<SafetyCopy['reason'], string>> = {
  replaced: 'Replaced by a newer save', restore: 'Before a restore', unreadable: 'Couldn’t be read', wiped: 'Before the new farm',
}

/** The loop's Notifications card: off, since days are turns; the server's push is untouched. */
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
        <div key={copy.id} className="flex min-h-11 items-center justify-between gap-3 py-2" data-safety-copy={copy.reason}>
          <span>{REASON[copy.reason]} · {dateWords(copy.at)}</span>
          {versionOf(copy.save) < SAVE_VERSION ? <span className="text-[12px] text-ink-faint">Kept</span> : (
            <Button size="sm" variant="secondary" onClick={() => {
              if (copy.id === undefined || !uid) return
              void restoreSafetyCopy(copy.id).then(() => safetyCopies(uid)).then(setCopies)
            }}>Restore</Button>
          )}
        </div>
      ))}
    </Panel>
  )
}

/** **Your name**: the farmer's, renamed under the name sheet's rule, a player's change. */
function YourName() {
  const name = useGame((s) => s.save?.farmer.name ?? null)
  const [draft, setDraft] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  if (name === null) return null
  const value = draft ?? name
  const issue = farmerNameIssue(value)
  const same = cleanFarmerName(value) === name
  return (
    <Panel label="Your name">
      <form className="flex items-center gap-2 py-1" data-your-name onSubmit={(event) => {
        event.preventDefault()
        if (issue || same) return
        void import('../loop/actions').then((a) => a.nameTheFarmer(value)).then(() => { setDraft(null); setError(null) }, (err: unknown) => setError(err instanceof Error ? err.message : 'Try again.'))
      }}>
        <input value={value} onChange={(event) => setDraft(event.target.value)} placeholder={FARMER_PLACEHOLDER} aria-label="Your name" maxLength={40} autoComplete="off"
          className="min-h-11 min-w-0 flex-1 rounded-sm border border-hairline bg-panel px-3 text-[16px]" />
        <Button size="sm" type="submit" disabled={issue !== null || same}>Save</Button>
      </form>
      {(error ?? (draft !== null && !same ? issue : null)) && <p role="alert" className="pb-1 text-[12px] text-danger">{error ?? issue}</p>}
    </Panel>
  )
}

export function AccountView() {
  const auth = useAuth()
  const state = useGame()
  const master = useMaster()
  const story = useStory()
  const release = master.status === 'ready' ? master.view.manifest.version : master.status === 'error' ? (master.offline ? 'Offline' : 'Unavailable') : 'Loading…'
  useEffect(() => seeReplaced(), [])
  // The frame clips its page, so Account scrolls itself.
  return (
    <div className="@container absolute inset-0 overflow-y-auto overscroll-contain" data-page="account">
      <AccountPage
        info={[
          { label: 'Signed in', value: auth.user?.email ?? auth.user?.name ?? 'Local' },
          { label: 'Save', value: syncWords(state) },
          { label: 'Last synced', value: state.lastSyncedAt ? dateWords(state.lastSyncedAt) : '—' },
          { label: 'Build', value: APP_BUILD_ID },
          { label: 'Master data', value: release },
          { label: 'Story', value: storyWords(story) },
        ]}
        notifications={<NotificationsOff />}
        sections={<><YourName /><SafetyCopies /></>}
        onSignOut={auth.authRequired ? () => auth.signOut() : undefined}
      />
    </div>
  )
}
