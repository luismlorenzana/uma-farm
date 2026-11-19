import './index.css'

import uiIndex from '@luismlorenzana/uma-art/ui/atlas.json'
import uiUrl from '@luismlorenzana/uma-art/ui/atlas.png?url'
import { AuthProvider, idToken } from '@luismlorenzana/uma-kit/auth'
import { ContentProvider } from '@luismlorenzana/uma-kit/content'
import { watchAppUpdates } from '@luismlorenzana/uma-kit/places'
import { configureKit, initAppearance, KitArtProvider, MotionRoot, type KitArt } from '@luismlorenzana/uma-kit/ui'
import { AlbumArtProvider } from '@luismlorenzana/uma-kit/album'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router'
import { registerSW } from 'virtual:pwa-register'
import { setTokenProvider } from './api/client'
import { FIREBASE } from './app/firebase-config'
import { router } from './app/router'
import { CONTENT } from './content/client'
import { ALBUM_ART } from './master/album-art'

// uma-kit, as uma-rpg wires it: this app's device keys, the phone's appearance, uma-art for the bars and the map,
// the kit's sign-in, the update prompt (a new build waits for Restart), and the album's and work screens' art: outfit art
// from master data, item icons from uma-art.
configureKit({ storagePrefix: 'farm.' })
initAppearance()
watchAppUpdates(registerSW)
setTokenProvider(() => idToken(FIREBASE))

const ART: KitArt = {
  ui: { url: uiUrl, index: uiIndex },
}

const root = document.getElementById('root')
if (!root) throw new Error('missing #root')

createRoot(root).render(
  <StrictMode>
    <MotionRoot>
      <KitArtProvider art={ART}>
        <AuthProvider config={FIREBASE}>
          <ContentProvider client={CONTENT}>
            <AlbumArtProvider art={ALBUM_ART}>
              <RouterProvider router={router} />
            </AlbumArtProvider>
          </ContentProvider>
        </AuthProvider>
      </KitArtProvider>
    </MotionRoot>
  </StrictMode>,
)
