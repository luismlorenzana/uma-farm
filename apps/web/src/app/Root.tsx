// Getting in (uma-kit's gates): splash → sign-in → boot → the app. The farm's boot opens the device save, else the
// server's, else starts a new account. A save from before v4 stops at the first-launch step, the start-over card, whose
// button starts the new farm. Nothing waits on the network once a device save exists.
//
// The whole app sits on uma-kit's landscape stage (`KitStage`, not turned): the frame is a row, and every sheet is a
// panel from the right edge. Held upright, the "Turn your phone sideways" card covers it (`Upright.tsx`).
import { useAuth } from '@luismlorenzana/uma-kit/auth'
import { BootGates, UpdateNotice } from '@luismlorenzana/uma-kit/places'
import { KitStage } from '@luismlorenzana/uma-kit/ui'
import { useCallback, useEffect, useState } from 'react'
import { Outlet } from 'react-router'
import { boot, NEWER_SAVE_WORDS, startSyncTriggers } from '../save/game'
import { signInEnabled } from './firebase-config'
import { StartOverCard } from './StartOverCard'
import { Upright } from './Upright'

/** A boot that stopped at a save this build can't play: one from a newer version of the farm. */
const isNewerSave = (error: unknown): boolean => error instanceof Error && error.message === NEWER_SAVE_WORDS

/** Asks the browser for the new build now, so the kit's update prompt (Update ready · Restart) comes up without waiting
 * for its own check. Nothing when no service worker is registered (the dev server, tests). */
function checkForUpdate(): void {
  void navigator.serviceWorker?.getRegistration().then((registration) => registration?.update()).catch(() => undefined)
}

export function Root() {
  const auth = useAuth()
  // The gate says why it stopped at a newer save, beside the update prompt,
  // instead of the kit's generic "couldn't open".
  const [newer, setNewer] = useState(false)
  useEffect(() => startSyncTriggers(), [])
  const bootFor = useCallback(async ({ uid }: { uid: string }): Promise<{ firstLaunch: boolean }> => {
    let result: { startOver: boolean }
    try {
      result = await boot(uid)
    } catch (error) {
      setNewer(isNewerSave(error))
      if (isNewerSave(error)) checkForUpdate()
      throw error
    }
    setNewer(false)
    // A save from before v4: the start-over card is the first-launch step.
    return { firstLaunch: result.startOver }
  }, [])
  // Never run a production build signed out: every API call would fail.
  if (import.meta.env.PROD && !signInEnabled)
    return <div className="fixed inset-0 flex items-center justify-center bg-page p-8 text-center text-ink-soft">This build is missing its sign-in configuration.</div>
  return (
    <>
      <div className="fixed inset-0" data-landscape>
        <KitStage layout="landscape">
          <UpdateNotice />
          <BootGates auth={auth} boot={bootFor} firstLaunch={(done) => <StartOverCard onDone={done} />}
            words={{ name: 'Uma Farm', tagline: 'Gather, process, make.', ...(newer ? { bootFailed: NEWER_SAVE_WORDS } : {}) }}>
            <Outlet />
          </BootGates>
        </KitStage>
      </div>
      <Upright />
    </>
  )
}
