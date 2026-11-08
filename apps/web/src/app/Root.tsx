// Getting in (uma-kit's gates, uma-platform P56): splash → sign-in → boot → the app. The farm's boot opens the device save,
// else the server's, else starts a new account; it has no first-launch step. Nothing waits on the network once a device
// save exists.
import { useAuth } from '@luismlorenzana/uma-kit/auth'
import { BootGates, UpdateNotice } from '@luismlorenzana/uma-kit/places'
import { useEffect } from 'react'
import { Outlet } from 'react-router'
import { boot, startSyncTriggers } from '../save/game'
import { signInEnabled } from './firebase-config'

async function bootFor({ uid }: { uid: string }): Promise<{ firstLaunch: boolean }> {
  await boot(uid)
  return { firstLaunch: false }
}

export function Root() {
  const auth = useAuth()
  useEffect(() => startSyncTriggers(), [])
  // Never run a production build signed out: every API call would fail (uma-rpg D42).
  if (import.meta.env.PROD && !signInEnabled)
    return <div className="fixed inset-0 flex items-center justify-center bg-page p-8 text-center text-ink-soft">This build is missing its sign-in configuration.</div>
  return (
    <>
      <UpdateNotice />
      <BootGates auth={auth} boot={bootFor} words={{ name: 'Uma Farm', tagline: 'Gather, process, make.' }}>
        <Outlet />
      </BootGates>
    </>
  )
}
