# F56 — The private story's delivery and the go-live with the wipe

**uma-farm · Claude · M · Needs: F46–F54, F40 (the private pack holds every cast Uma's bible and arrival scene), and
the owner's one-line yes for the bucket and its grant (below) · Unblocks: M5 revised (F27 on save v5) · Milestone: the
romance core**

> **The owner's yes comes first for the cloud (CLAUDE.md).** Creating `gs://uma-farm-content` and granting
> `farm-api-runtime` `roles/storage.objectViewer` on it are a new cloud resource and an IAM change no earlier packet
> lists, so they need the owner's one-line yes, with the cost table in decision 1, **before** `infra/bootstrap.sh`'s new
> step runs. The local parts (the release script, the route, the loader) need no yes and go first. The line to ask:
>
> "F56 needs one private, versioned bucket, `gs://uma-farm-content` (us-central1), readable only by farm-api's runtime
> account, to ship the story pack: all inside the free tier, $0 a month (the table is in F56). Yes?"

## Why

The romance core is built and dark on the stand-in. The owner's story is private (RS15, D41): it names real characters,
so it never goes in git or uma-art. This packet ships it the way uma-rpg's and uma-quest's packs ship: a private
versioned bucket, farm-api's `PrivatePackModule` behind the owner guard, a publish script, and the web's loader cached
by hash. Then it turns the romance core on: the switch goes, save v4 ships, the owner's v3 is backed up and wiped on
first open, and the owner's phone check closes the milestone.

## Context (read first)

- [romance-spec.md](../../design/romance-spec.md): **RM58–RM60** whole (the pack's files, its additions, the dark
  build, the delivery and its cost table), **RM10** (the wipe, the backup, the rescue, nobody edits production by hand,
  the owner's phone check read-only), RM61 (character art later, in the pack's art folder), RM66 and RM67.
- [decisions.md](../../decisions.md): **D41** (delivery waits for the packet that first plays authored story), D40 (the
  bucket first asked, then withdrawn), D9 (the version-bump backups), **D29** and **D38** (F17's dark launch and F24's
  go-live: the model for this one), D44, D46, D47, and the D-decisions F46–F55 logged.
- [F40-story-authoring.md](F40-story-authoring.md): the pack's files and layout in the ignored `content/story/`.
- Infrastructure: [infra/bootstrap.sh](../../../infra/bootstrap.sh) (idempotent steps; step 2's runtime grants),
  [docs/technical/infrastructure.md](../../technical/infrastructure.md) (the pieces, isolation, re-run and rollback,
  costs, production saves), `.github/workflows/deploy.yml` (the env vars it passes to Cloud Run), CLAUDE.md's scoped
  gcloud (`CLOUDSDK_ACTIVE_CONFIG_NAME=default CLOUDSDK_CORE_PROJECT=uma-rpg`, never `gcloud config set`).
- The models, read only:
  - uma-rpg's `app.module.ts` at `30a322a` (`git -C ~/workspace/uma-rpg show 30a322a:apps/api/src/app.module.ts`):
    `PrivatePackModule.forRoot({ route: 'content', bucket, dir, allow })`;
  - uma-rpg's `scripts/enemies/release.mjs` and `publish.sh` at `30a322a` (hash-named files first, then the index;
    scoped gcloud; cache headers);
  - uma-quest's `infra/bootstrap.sh` (its versioned `uma-quest-content` bucket) and its `app.module.ts` (`PACK_ALLOW`).
- The packages: uma-server 0.2.0's `@luismlorenzana/uma-server/content` (`PrivatePackModule`, `PackAllow`: an exact
  string is an index revalidated on every read, a pattern allows hash-named files cached for good); uma-kit 0.19.0's
  `createContentClient` (`pack(path, file?)`: with a `{ path, bytes, sha256 }` envelope it verifies and keeps the bytes
  in Cache Storage; it reads only `${base}/content/<path>`).
- Code: `apps/api/src/app.module.ts`, `apps/web/src/content/client.ts`, F46's `story/pack.ts` and loader seam,
  `app/romance.ts`, `.env.romance`, `.env.development`, `package.json`'s `build`, `scripts/check-size.mjs`,
  `save/save.ts` (`SAVE_VERSION`), `save/game.ts`, the web tests on v3, `tools/story-sandbox/` (it reads the domain's
  validator in place with Node's type stripping).

## Decisions made

### From the spec

- **RM58, the private pack:** a private bucket `gs://uma-farm-content` (`us-central1`, uniform access, public access
  prevented, versioned, labelled `app=farm`); farm-api's `PrivatePackModule` behind the owner guard serving an
  allowlist, the index `story.json` and hash-named files (`story/<name>.<hash8>.json`), `STORY_BUCKET` in production and
  `STORY_DIR` (the ignored `content/story-release/`) locally; the web fetches the index at boot, then each file by hash,
  cached immutably; **the save keys ids only and never stores text.** The pack holds `cast.json`, `ties.json`,
  `umas/<characterId>.json`, `routes/<characterId>.json`, `pairs/<a>-<b>.json` and the additions (an `arrival` event per
  route, `chats`, `wishes`, `keepsake`, `wedding.places`, `household.json`, `birthday` where master data lacks one).
- **RM59:** built dark on the stand-in; locally `STORY_DIR` can point at a build of the private `content/story/`, so the
  owner's real routes play on the dev server before any cloud; production turns on with this packet, which ships the
  pack and the wipe together.
- **RM60, the delivery:** create the bucket and grant `farm-api-runtime` `roles/storage.objectViewer` on it (an
  idempotent `infra/bootstrap.sh` step); a `pnpm story:publish` script that validates `content/story/` with the
  domain's validator, writes the hashed release and uploads it with the scoped gcloud; the API module and route with
  tests; the web loader and cache; then **the go-live**: the flag on, save v4 and the wipe, and the owner's phone check.
  Creating a bucket and changing IAM need the owner's yes in one line.
- **RM10 at go-live:** the server's version-bump backup copies the stored v3 to `saveBackups/{uid}-v3` on the first v4
  write; a v3 upload over a stored v4 is refused into `saveRescues`; the live v3 build stops at a newer save with the
  update prompt; nobody edits production by hand; the owner's phone check confirms the backup and the fresh farm,
  read-only.

### Decided here (the spec left these open)

1. **The cost table** (RM60's), for the owner's yes:

   | Resource | Use | Free tier (always free) | Expected | Cost |
   |---|---|---|---|---|
   | Cloud Storage, `gs://uma-farm-content`, Standard, `us-central1` | The story pack, all versions | 5 GB-months | About 3 MB a version (140,000 words of JSON), under 50 MB with history | **$0** |
   | Class A operations (writes) | Publishing a version | 5,000 a month | About 100 a publish | **$0** |
   | Class B operations (reads) | farm-api reading files | 50,000 a month | A few hundred (hash-named files cache forever) | **$0** |
   | Egress | To Cloud Run, same region | Free in-region | — | **$0** |
   | Cloud Run `farm-api` | One more route | 2 million requests a month | A few a day | **$0** |
   | IAM | One binding on the bucket | Free | — | **$0** |

   The 5 GB-months are shared with the other US-region buckets on the same billing account (uma-rpg's and uma-quest's
   packs, tens of MB); the total stays far under. A lifecycle rule (decision 6) keeps the history small.
2. **The route is `/api/content/…`, not `/api/story/…`.** uma-kit's content client reads private packs only at
   `${base}/content/<path>`, as uma-rpg's and uma-quest's do, and the kit isn't forked; RM58 named the pack, and its
   files keep RM58's names under that route: **`/api/content/story.json`** and
   **`/api/content/story/<name>.<hash8>.json`**. `PrivatePackModule.forRoot({ route: 'content', bucket:
   process.env.STORY_BUCKET, dir: resolve(cwd, process.env.STORY_DIR ?? '../../content/story-release'), allow:
   STORY_ALLOW })` with `STORY_ALLOW = ['story.json', /story\/[a-z0-9]+(-[a-z0-9]+)*\.[a-f0-9]{8}\.json/]`. Character
   art's pattern (RM61) joins the allowlist with that art, later.
3. **`pnpm story:release`** (`scripts/story/release.mjs`): reads the ignored `content/story/`, validates every file with
   the domain's validator (read in place as the sandbox does), and **refuses** a pack where anything fails or a cast Uma
   lacks her bible or her arrival scene; routes, pairs and the household file may be partial (F46's partial mode: an
   unscripted event is listed, and the game says "Her story is still being written"). It writes `content/story-release/`
   laid out as the bucket: each file minified as `story/<name>.<hash8>.json` (`cast`, `ties`, `uma-<id>`, `route-<id>`,
   `pair-<a>-<b>`, `household`; the hash the first 8 hex of its SHA-256) and the index `story.json`:
   `{ version: 1, builtAt, files: { [name]: { path, bytes, sha256 } }, scripted: { [characterId]: eventId[] } }`, so
   Ready (F47) knows what's scripted without loading every route. The same inputs give the same files. Its tests run on
   the stand-in pack in git (`scripts/story/release.test.mjs`, in `pnpm test`).
4. **`pnpm story:publish`** (`scripts/story/publish.sh`): runs the release, then uploads the hash-named files first
   (`gcloud storage rsync`, `private, max-age=31536000, immutable`, `application/json`), then `story.json` (`private,
   no-cache`), to `gs://${STORY_BUCKET:-uma-farm-content}`, with `CLOUDSDK_ACTIVE_CONFIG_NAME=default` and
   `CLOUDSDK_CORE_PROJECT=uma-rpg` exported, never changing the account. Old hash-named files stay, so an app holding an
   older index still reads it. AGENTS.md's commands table gains both.
5. **The web's loader** (F46's seam): `CONTENT.pack('story.json')` at boot (the index, always fresh), then each file
   through `CONTENT.pack(path, { path, bytes, sha256 })`, which uma-kit verifies and keeps in Cache Storage by hash.
   **That's RM58's "cached immutably", in the kit's Cache Storage rather than IndexedDB:** the kit's cache is already
   content-addressed and verified, so nothing is forked or duplicated. The last good index is kept on the device, so an
   offline boot plays the last version; routes, pairs and the household file load on demand. A pack that can't load (no
   index, a hash mismatch) gives the boot gate's **Try again**. **The stand-in pack is a dev fallback only:** with
   `import.meta.env.DEV` and a 404 for `story.json` (no `content/story-release/`), the dev server plays the stand-in;
   the production build never contains it.
6. **The infrastructure step** (`infra/bootstrap.sh`, after step 8, idempotent like the rest): describe, else create
   `gs://uma-farm-content` (`--location=us-central1 --uniform-bucket-level-access --public-access-prevention`); update
   it `--versioning --update-labels=app=farm` with a lifecycle rule deleting a noncurrent version once 10 newer ones
   exist; bind `farm-api-runtime` `roles/storage.objectViewer` on the bucket only; print `STORY_BUCKET=uma-farm-content`
   with the other variables. The repository variable `STORY_BUCKET` is set (`gh variable set`), and
   `.github/workflows/deploy.yml` passes `STORY_BUCKET` to Cloud Run beside `MASTER_BUCKET` (this packet is the task that
   allows touching `infra/` and the workflow, AGENTS.md).
7. **The isolation check** (IN21's way): the bucket's IAM policy names `farm-api-runtime` as its only service account,
   and the Policy Troubleshooter refuses `rpg-api-runtime` and `quest-api-runtime` on it; a signed-out read of
   `/api/content/story.json` through the site is 401, the owner's signed read 200, an unlisted path 404.
   [infrastructure.md](../../technical/infrastructure.md) gains the bucket's row (the "Private content: None (IN16)" row
   changes), the runtime account's new grant, the isolation cells, re-run and rollback (unbind, then delete the bucket
   and its versions), and the cost line.
8. **The go-live**, in one commit after the pack is published (F24's pattern):
   - `VITE_FARM_ROMANCE`, `romanceOn()`, `.env.romance` and its `!` line, `dist-romance/`, the second build and size
     check go; `.env.development` keeps only what else it held;
   - the M4-only screens and their tests go: the start's sheet, the Gate's visitor, v3's affinity controls, the old
     roster page and bar, End the day's old sheet; v3's play that v4 doesn't use goes from `@farm/domain` (`start.ts`,
     the Gate and `recruitFor` in `visitors.ts`, `giftTaste`, CS34's ten levels where only v3 read them), while
     `CHAT_LINES` stays as the fallback; **v1–v3's parse and `freshV4` stay** (the API reads the owner's stored v3, and
     stale uploads are refused, as F24 kept v2's);
   - the store holds v4 only; **`SAVE_VERSION` and `NEWEST_SAVE_VERSION` are 4**; every web test runs on v4;
   - the manual's "romance build; live from F56" notes go; [roster.md](../../game/roster.md)'s M4 parts are rewritten or
     retired; the README's index and [architecture.md](../../game/architecture.md) say what plays; hearts.md gains "The
     story pack".
   From then, any change to the save's shape is v5 (M5's F27 first).
9. **The order:** (a) the release script, the route and the loader, merged while still dark (production unaffected: with
   no bucket and no folder in the container, the route answers 404); (b) the owner's yes, asked in one line with the
   table; (c) `infra/bootstrap.sh`'s step, scoped, then the repository variable; (d) `pnpm story:publish` of the owner's
   pack and the isolation and read checks (decision 7); (e) the go-live commit, its deploy watched; (f) the owner's phone
   check; (g) the production read.
10. **The owner's first open is tested** before the deploy (F24's p): a v3 from the server is wiped into v4 with `uid`,
    `createdAt` and `updatedAt` unchanged and uploaded unstamped; the API backs the v3 up to `saveBackups/{uid}-v3`
    before storing the v4; the name is the first stamp; an old build's v3 upload over the v4 is refused with a 409 and
    kept in `saveRescues`; a dirty device v3 is kept as a safety copy first; the deployed M4 build at its last commit
    stops at a v4 with the update prompt. **Carried from F46 (D51):** the M4 build refuses a v4 safely (it throws
    `NEWER_SAVE_WORDS` in `save/game.ts`'s `playable` and writes nothing), but the boot gate shows the kit's generic "The
    game couldn't open on this phone" instead of those words and the update prompt (F17(e)). Make the gate show
    `NEWER_SAVE_WORDS` with the kit's update prompt in the last M4 commit before the go-live, so a cached M4 PWA that
    meets the owner's new v4 says why and updates.
11. **The production read** (read only, the scoped gcloud): `saves/{uid}` is v4; `saveBackups/{uid}-v3` holds the old
    v3; the v4's `account.uid` and `createdAt` equal the backup's; its `updatedAt` equals the backup's until the name is
    entered, then the name's time; `saveRescues` holds nothing new (or only an old build's refused v3, as designed). A
    stale or wrong date: stop and ask.
12. **What the pack must hold at go-live:** every cast Uma's bible (27 beats) and arrival scene (the release refuses
    less); routes may be partial; a missing pair conversation gives the heart's line; a missing household file leaves
    household scenes waiting and house lines on the templates. Waves of routes ship as new pack versions with no code
    change.
13. **F55's art:** if its release is out and nothing has pinned it, this packet pins it and drops the stand-ins (F24's
    rule); if it isn't out, the stand-ins ship and the first packet after its release pins it. The spec lists F55 among
    F56's needs; the handoff row doesn't, and nothing in the go-live depends on art, so it isn't a blocker.

## Do

1. **The release and publish scripts** (decisions 3, 4) with their tests on the stand-in pack.
2. **The route** (decision 2) with tests (an allowlisted file served, another refused, the guard), and `STORY_DIR`
   working locally on a release of the owner's private `content/story/`.
3. **The loader** (decision 5): the index, verified files, the last index offline, the dev fallback.
4. Merge 1–3 dark (decision 9a); **ask the owner's yes** in one line with the table (decision 1).
5. **After the yes:** the bootstrap step and the variable (decision 6), scoped; publish; the checks (decision 7);
   [infrastructure.md](../../technical/infrastructure.md).
6. **The go-live** (decisions 8, 10), the manual with it, then the deploy, watched.
7. **The owner's phone check** (one line, below), then the production read (decision 11).

## Done when

- `pnpm lint`, `pnpm test` and `pnpm build` pass; **the one size check** is ≤ 180 KB gzip (the number in the pull
  request); the private-content guard passes, `git grep` finds no character name, and `rg -l "VITE_FARM_ROMANCE|romanceOn"
  apps packages` finds nothing.
- `pnpm docs:update` leaves every live page unchanged.
- Tests: the release is deterministic, hashes and names its files, writes `scripted`, refuses a missing bible or arrival
  scene and passes partial routes; the route serves the index and a hashed file and refuses anything else; the loader
  verifies, reuses the cache, boots offline on the last index and refuses a mismatch; decision 10's first-open tests.
- Locally at 390×844 (and 375×667): with `STORY_DIR` on a release of the owner's private pack, a new account names the
  farmer and meets the owner's priority three in the opening; their arrival scenes, a chat, a gift and an event play
  from the real pack; a dev v3 save wipes once. Screenshots stay local.
- Production: the bucket exists with the owner's yes, labelled, versioned, its only reader `farm-api-runtime`; the pack
  is published; signed-out 401, signed 200, unlisted 404; the go-live deploy passes and health shows the commit; the
  owner's phone check passes (the owner's word, in the D-decision); decision 11's read holds.

**The phone check, in one line:** "The romance core is live: open https://uma-farm.web.app on your phone (tap Restart if
it offers the update), name your farmer, meet your three, plant the carrots, chat with one and give her a gift, and end
the day."

## Deliver

Two pull requests, each on a branch for the main session to merge and deploy (`git status` and the private-content
guard first): `feat/f56-story-delivery` (the scripts, the route and the loader, dark; `feat: the story pack's delivery,
dark (F56)`), then, after the cloud steps, `feat/f56-go-live` (`feat: the romance core goes live; save v4 and the wipe
(F56)`). The cloud steps between them run in the session that asked for the yes, with the scoped gcloud. In the go-live
branch: delete this packet, mark its queue row Done and add a Done row in [the handoff](../README.md) (the pull requests,
the bucket, the release's version, the phone check's result), update the handoff's status line and the owner's steps,
and log the packet's D-decision in [decisions.md](../../decisions.md) (fetch `main` first for the number), naming
decisions 1–13, the owner's yes and its date. The main session merges each, watches the deploys
(`gh run watch <id> -R luismlorenzana/uma-farm --exit-status`) and adds the runs' links.

## Rules that hold (every romance-core packet)

- **No original-game content in git:** no outfit or character names, no character or outfit id tied to a name, nothing
  that quotes or paraphrases the private story, in code, tests, docs, commits or pull request bodies. The private pack
  lives only in the ignored `content/story/` and `content/story-release/` and the private bucket; tests use the stand-in
  pack (9000001–9000003), other invented ids and `@luismlorenzana/uma-data/testing`. Run `git status`, `pnpm test` after
  staging (the private-content guard reads the git index) and `git grep` for names before committing.
- **Never make anything public:** the bucket is private with public access prevented, its files served only behind the
  owner guard; no signed or public URL to it.
- **RS2, RS3 and RS4 hold in every line and screen:** every Uma is an adult; romance is tender and non-explicit, with a
  fade before anything more; the farmer is never gendered and never drawn, lines say "you", and `{farmer}` is the only
  placeholder.
- **The save:** v4 ships here and is frozen; any change after this packet is v5, and M5 takes v5–v8 (RM65).
  `account.updatedAt` moves only on a player's change; no server writes into a save; nobody edits production by hand.
- **The cloud:** never change the active gcloud account and never run `gcloud config set`; scope every command with
  `CLOUDSDK_ACTIVE_CONFIG_NAME=default CLOUDSDK_CORE_PROJECT=uma-rpg`; never touch uma-rpg's or uma-quest's pieces; never
  type credentials into a sign-in page.
- **Main JS ≤ 180 KB gzip** (one build after the go-live): the pack loads after start; the loader's code is measured in
  the pull request.
- **`uma-work` and `uma-kit` aren't forked:** the pack uses the kit's content client as it is; anything it lacks is a
  "Both apps" request to uma-platform, sent by the main session and pinned when released.
- **The manual changes in the same commit as each rule;** live blocks through `pnpm docs:update`.
- **Portrait 390×844 first** (check 375×667), 44 pt targets, safe areas; player-facing text short.
- **Production saves:** never move `save.account.updatedAt`, never write into a save from a server, and a stale server
  date means stop and ask.

## Left to the worker

The scripts' layout and messages; where the last good index lives on the device; the lifecycle rule's exact form; the
boot gate's words while the pack loads; how the go-live commit splits the deletions if it reads better as two commits in
one pull request.
