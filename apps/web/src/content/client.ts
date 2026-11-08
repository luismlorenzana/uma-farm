// One signed-in content client for uma-platform's master data release, through the API's proxy (`/api/master`).
import { idToken } from '@luismlorenzana/uma-kit/auth'
import { createContentClient } from '@luismlorenzana/uma-kit/content'
import { FIREBASE } from '../app/firebase-config'

export const CONTENT = createContentClient({ token: () => idToken(FIREBASE), cacheName: 'farm-master' })
