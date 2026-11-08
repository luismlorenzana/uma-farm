# Architecture and technical setup

How uma-farm is built and run, as of F5: save v2, the Wilds' rules in the domain and their screens on the phone ([wilds.md](wilds.md)). Values come from the code and
[infrastructure.md](../technical/infrastructure.md), which holds every production value and is the place to change them.

## The pieces

```
 iPhone (Home Screen PWA)
   └─ apps/web  React 19 + Vite 7 + Tailwind 4 + Zustand + Dexie; uma-kit for the theme, shell, sign-in,
                content loading, the update prompt, the Hub map (Phaser, on demand), the album and the work
                screens (F5)
        │  /api/*  (Firebase Hosting rewrites to Cloud Run)
        ▼
   apps/api  NestJS 11 on Cloud Run `farm-api`, behind uma-server's owner guard
        ├─ saves ──────────► Firestore database `farm`: saves/{uid} (local: apps/api/.data/save.json)
        ├─ master data ────► gs://uma-platform-master-data (local: ../uma-platform/content/release)
        └─ the parcel ping ► /api/post/ping, checked by its own Google ID token (IN18)

   packages/domain  @farm/domain: the save and the Wilds' rules (copied from uma-rpg, F4); pure TypeScript, shared by web and API
```

**The rules of the codebase:**
- **The domain decides.** The web app runs the rules locally for instant play; the API parses every upload with the same
  code and refuses one it can't read.
- **The server never writes into a save** (FM10). It stores what the app sent, or refuses it and keeps it aside.
- **Nothing is imported from uma-rpg.** Its code is copied at a recorded commit (`30a322a`) and the farm owns it from
  then on (FM2).

## Web app

| Piece | Where | What |
|---|---|---|
| Entry | `src/main.tsx` | The kit's keys (`farm.`), appearance, uma-art's bar and map art, sign-in, content client, the album's outfit art and the work screens' item icons, and the router |
| Gates | `src/app/Root.tsx` | The kit's `BootGates`: splash → Google sign-in → boot → the app; the kit's **Update ready · Restart** |
| Pages | `src/app/router.tsx` | `/` the Wilds (`?peek=<place>` a quick look), `/wilds/<place>` a place's page, `/warehouse` and `/account`, inside the shell; `/wilds` and anything else go to `/`. The Wilds, the place pages and the Warehouse load on demand ([wilds.md](wilds.md)) |
| Shell | `src/shell/` | The kit's `AppFrame` unchanged (FM18): the account bar with the sync chip, the bottom bar (Wilds with its Ready count, Warehouse, Menu), the menu sheet (`?sheet=menu`: every place with its Ready count, the Warehouse, Account and the build id), and the sync warning |
| The Wilds | `src/wilds/` | The Hub map on uma-kit (`HubMap`), the quick looks, Collect all, the help, the Forge and the Post as placeholders, the Ready counts |
| Places | `src/places/` | A place's page on uma-kit/work (`work/`: the farm's provider, the slot rows, the job sheet, the What step) and the Warehouse (`warehouse/`) |
| Picker | `src/album/rows.ts` | Every outfit as a row of uma-kit's album: Craft Level, free or busy, and the Trade, rarity and aptitude facets |
| Items | `src/items/` | uma-art's item icons placed from the ids (`frames.ts`), and the items' words |
| Account | `src/home/AccountView.tsx` | The kit's Account page: appearance, sign-in, save state, last sync, build, master data's release, safety copies, sign out |
| Save | `src/save/` | The device save in Dexie, the store and its sync engine (below), the work actions (`edit`) and the trade words |
| Master data | `src/master/` | The release's manifest, characters, outfits and art through `/api/master`, cached by hash on the device; the roster (`farmRoster`) and the album's rows; the album art adapter |
| PWA | `vite.config.ts` | Portrait, standalone, the icons from `scripts/draw-icons.mjs`; Workbox precaches the app and keeps master data's files for good |

Main JS is 153 KB gzip against the 180 KB budget (FM20). Firebase, the Wilds' screens and the Hub map's Phaser scene
(`createHubGame`, 377 KB gzip) load on demand; `scripts/check-size.mjs`'s `LAZY_MODULES` refuses them in the initial JS.

## API

| Route | Guard | What |
|---|---|---|
| `GET /api/health` | Public | `{ ok, build }`: the deploy's commit |
| `GET /api/save` | Owner | The stored envelope `{ revision, save }`, or `{ revision: 0, save: null }` |
| `PUT /api/save` | Owner | `{ baseRevision, save }`: stored as `baseRevision + 1`, or 409 with what's stored |
| `GET /api/master/*` | Owner | uma-platform's release: channels, manifests and hash-named files (uma-server's proxy) |
| `POST /api/post/ping` | Its own token | `{ ok: true }` for a Google ID token on `POST_CALLERS` with the farm's audience |

## The save

### Save history

| Version | Packet | What changed |
|---|---|---|
| 1 | F3 | The account: `{ version: 1, account: { uid, createdAt, updatedAt } }` |
| 2 | F4 | The Wilds' world beside it: `umas` (each Uma's Craft Level, from her first job), `items` (the Warehouse), `work` (uma-work's rows) and `buildings` (always `{}`). v1 migrates with all four empty, `updatedAt` unchanged |

### The shape

```ts
interface SaveV2 {
  version: 2
  account: { uid: string; createdAt: string; updatedAt: string }
  umas: Record<string, { craft: { level: number; exp: number } }>  // by outfit id
  items: Record<string, number>                                     // the Warehouse: line and made items
  buildings: {}                                                     // places have no levels
  work: Record<string, WorkRow<FarmWorkRequest>>                    // uma-work's rows, by outfit id
}
```

The rules that change it, and every number they use, are in [loops.md](loops.md) and [materials.md](materials.md); the copy
from uma-rpg is listed file by file in [wilds-copy.md](../technical/wilds-copy.md).

`parseSave` reads every version the farm has written and returns the current one; a newer version than the app knows is
refused, and unknown keys are refused, so an old client can never half-write a newer save.

### Sync

Copied from uma-rpg (its D32, D45, D260):
- **Local first.** Every change writes the store and the device (Dexie `uma-farm`) at once, then syncs in the background
  1.5 s later, when the app comes back to the foreground, and when the network returns.
- **Revisions.** The server stores `{ revision, save }` in `saves/{uid}` and refuses a write whose base revision is stale,
  or whose version is older than what's stored (409 with what's stored).
- **The conflict rule.** When both sides changed, the save whose `account.updatedAt` is newer wins whole, and this
  device's on a tie. Only a player's change moves `updatedAt`.
- **Nothing is lost.** Before a newer save replaces unsynced changes, the device keeps a safety copy (the newest five,
  in Account, each with Restore). An upload the server refuses is kept in `saveRescues/{uid}`. When a newer save version
  first replaces a stored one, the stored document is copied to `saveBackups/{uid}-v{n}`.
- **A fresh device needs the server once.** With no device save, boot reads the server's; if it has none, a new account
  starts. Offline, boot stops and offers Retry, since a new save made offline could later outrank the real one.
- **The warning.** Ten minutes after a failed sync with changes waiting, every page says "Not backed up since …".

### The production-save rules

From uma-rpg's 2026-10-30 incident: never move `save.account.updatedAt` by hand; no server ever writes into a save; a stale
server date means stop and ask the owner.

## Build and deploy

Every push to `main` that touches code runs [deploy.yml](../../.github/workflows/deploy.yml): lint, tests (one package at
a time), build with the size check; then the API image to Cloud Run `farm-api`, the web to Hosting site `uma-farm`, and
the checks: health with the commit, `/api/save` 401 without a token, the ping 401, the shell `no-cache`, and uma-rpg's own
health. Docs-only pushes skip it.

## Local development

```bash
NODE_AUTH_TOKEN=$(gh auth token) pnpm install
pnpm api   # :8101, auth off (the local user), saves in apps/api/.data/save.json
pnpm web   # :5194, /api proxied to :8101
```

Master data comes from `../uma-platform/content/release` (set `MASTER_DIR` to point elsewhere). The preview pane starts both
from `.claude/launch.json`. To try the owner guard, run the built API with `ALLOWED_EMAIL` set and no `AUTH_MODE`.
