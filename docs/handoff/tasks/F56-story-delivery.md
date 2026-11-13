# F56 — Go live: one build, the story pack published, the wipe

**uma-farm · Claude · M · Needs: F61–F65 · Unblocks: the workshops ([the roadmap's Phase 2](../../roadmap.md#phase-2-the-whole-farm))
· [Roadmap](../../roadmap.md#phase-1-live-with-the-storys-frame): Phase 1, step 1.6**

> **Where it stands.** The delivery is built and merged dark:
> - the release and publish scripts (`pnpm story:release`, `pnpm story:publish`);
> - the `/api/content/story…` route;
> - the loader: the index, verified files, the last index offline;
> - the newer-save words in the deployed build.
>
> The owner said yes on 2026-11-11 to the bucket and its one binding. `infra/bootstrap.sh`'s step 9 created
> `gs://uma-farm-content` and bound `farm-api-runtime` to it, the repository variable `STORY_BUCKET` is set, and
> [infrastructure.md](../../technical/infrastructure.md) has the bucket, the grant and the isolation checks.
>
> **What changed with the roadmap:**
> - the go-live no longer waits for a finished story: it comes after F61–F65, with whatever pack exists, or none;
> - placeholders (F62) play the rest, and every later pack is published the same way, adding what it has;
> - F61 lets `pnpm story:release` publish any pack, so the old rule that every cast Uma needs her bible and arrival
>   scene is gone.
>
> **What's left:**
> 1. the publish of the latest pack, if there is one;
> 2. the signed, unlisted reads;
> 3. the go-live: the romance switch removed, one build, v4 shipped with the owner's v3 backed up first;
> 4. the owner's phone check;
> 5. the production read.
>
> **Ask the owner in one line before the wipe ships.**

## Why

The romance is built and dark on the stand-in. The owner's story is private (F40's RS15): it names real characters, so
it never goes in git or uma-art. This packet ships it the way uma-rpg's and uma-quest's packs ship: a private versioned
bucket, farm-api's `PrivatePackModule` behind the owner guard, a publish script, and the web's loader cached by hash.
Then it turns the romance on: the switch goes, save v4 ships, the owner's v3 is backed up and wiped on first open, and
the owner's phone check closes the step.

## Context (read first)

- [The game mechanics](../../game-mechanics.md):
  - [the cast and the story pack](../../game-mechanics.md#the-cast-and-the-story-pack): the pack's files, the pack at
    runtime, and [how the app gets the pack](../../game-mechanics.md#how-the-app-gets-the-pack);
  - [Part 3's opening note](../../game-mechanics.md#part-3--hearts-the-cast-and-the-romance): the wipe to v4 and the
    cast replacing the drawn roster;
  - [save versions](../../game-mechanics.md#save-versions) and
    [a newer save on an older build](../../game-mechanics.md#a-newer-save-on-an-older-build): the wipe, the backup, the
    rescue, the update prompt.
- [F40-story-authoring.md](F40-story-authoring.md): the pack's files and layout in the ignored `content/story/`.
- Infrastructure: [infra/bootstrap.sh](../../../infra/bootstrap.sh) (idempotent steps; step 2's runtime grants; step 9,
  the bucket), [docs/technical/infrastructure.md](../../technical/infrastructure.md) (the pieces, isolation, re-run and
  rollback, costs, production saves, the version-bump backups in `saveBackups`), `.github/workflows/deploy.yml` (the env
  vars it passes to Cloud Run), CLAUDE.md's scoped gcloud (`CLOUDSDK_ACTIVE_CONFIG_NAME=default
  CLOUDSDK_CORE_PROJECT=uma-rpg`, never `gcloud config set`).
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
- Code: `apps/api/src/app.module.ts`, `apps/api/src/story/story-pack.ts`, `apps/web/src/content/client.ts`, the web's
  `story/load.ts` and `story/delivery.ts`, the domain's `story/pack.ts` and `story/release.ts`, `scripts/story/`,
  `app/romance.ts`, `.env.romance`, `.env.development`, `package.json`'s `build`, `scripts/check-size.mjs`,
  `save/save.ts` (`SAVE_VERSION`), `save/game.ts`, the web tests on v3, `tools/story-sandbox/` (it reads the domain's
  validator in place with Node's type stripping).

## Decisions made

### From the game's rules

- **The private pack:** a private bucket `gs://uma-farm-content` (`us-central1`, uniform access, public access
  prevented, versioned, labelled `app=farm`); farm-api's `PrivatePackModule` behind the owner guard serving an
  allowlist, the index `story.json` and hash-named files (`story/<name>.<hash8>.json`), `STORY_BUCKET` in production and
  `STORY_DIR` (the ignored `content/story-release/`) locally; the web fetches the index at boot, then each file by hash,
  cached immutably; **the save keys ids only and never stores text.** The pack holds `cast.json`, `ties.json`,
  `umas/<characterId>.json`, `routes/<characterId>.json`, `pairs/<a>-<b>.json` and the romance's additions (an `arrival`
  event per route, `chats`, `wishes`, `keepsake`, `wedding.places`, `household.json`, `birthday` where master data lacks
  one).
- **Built dark:** on the stand-in; locally `STORY_DIR` can point at a build of the private `content/story/`, so the
  owner's real routes play on the dev server before any cloud; production turns on with this packet, which ships the
  pack and the wipe together.
- **The delivery:** create the bucket and grant `farm-api-runtime` `roles/storage.objectViewer` on it (an idempotent
  `infra/bootstrap.sh` step); a `pnpm story:publish` script that validates `content/story/` with the domain's validator,
  writes the hashed release and uploads it with the scoped gcloud; the API module and route with tests; the web loader
  and cache; then **the go-live**: the flag on, save v4 and the wipe, and the owner's phone check. Creating a bucket and
  changing IAM need the owner's yes in one line (given).
- **The save at go-live:** the server's version-bump backup copies the stored v3 to `saveBackups/{uid}-v3` on the first
  v4 write; a v3 upload over a stored v4 is refused into `saveRescues`; the live v3 build stops at a newer save with the
  update prompt; nobody edits production by hand; the owner's phone check confirms the backup and the fresh farm,
  read-only.

### Decided here

1. **The cost table,** to which the owner said yes on 2026-11-11:

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
   `${base}/content/<path>`, as uma-rpg's and uma-quest's do, and the kit isn't forked; the pack's files keep their
   names under that route: **`/api/content/story.json`** and **`/api/content/story/<name>.<hash8>.json`**.
   `PrivatePackModule.forRoot({ route: 'content', bucket: process.env.STORY_BUCKET, dir: resolve(cwd,
   process.env.STORY_DIR ?? '../../content/story-release'), allow: STORY_ALLOW })` with `STORY_ALLOW = ['story.json',
   /story\/[a-z0-9]+(-[a-z0-9]+)*\.[a-f0-9]{8}\.json/]`. Character art (later, private in the pack) joins the allowlist
   with its own pattern, with that art.
3. **`pnpm story:release`** (`scripts/story/release.mjs`): reads the ignored `content/story/`, validates every file with
   the domain's validator (read in place as the sandbox does), and **refuses** a pack where anything fails or a cast Uma
   lacks her bible or her arrival scene; routes, pairs and the household file may be partial (the game's partial mode:
   an unscripted event is listed, and the game says "Her story is still being written"). It writes
   `content/story-release/` laid out as the bucket: each file minified as `story/<name>.<hash8>.json` (`cast`, `ties`,
   `uma-<id>`, `route-<id>`, `pair-<a>-<b>`, `household`; the hash the first 8 hex of its SHA-256) and the index
   `story.json`:
   `{ version: 1, builtAt, files: { [name]: { path, bytes, sha256 } }, scripted: { [characterId]: eventId[] } }`, so
   Ready knows what's scripted without loading every route. As built, the index also holds `release` (8 hex of the
   SHA-256 of the files' names and hashes: the release's id, the same for the same files) and `pairs` (each pair's bond
   levels). The same inputs give the same files. Its tests run on the stand-in pack in git
   (`scripts/story/release.test.mjs`, in `pnpm test`).
4. **`pnpm story:publish`** (`scripts/story/publish.sh`): runs the release, then uploads the hash-named files first
   (`gcloud storage rsync`, `private, max-age=31536000, immutable`, `application/json`), then `story.json` (`private,
   no-cache`), to `gs://${STORY_BUCKET:-uma-farm-content}`, with `CLOUDSDK_ACTIVE_CONFIG_NAME=default` and
   `CLOUDSDK_CORE_PROJECT=uma-rpg` exported, never changing the account. Old hash-named files stay, so an app holding an
   older index still reads it. It prints the release's id, and takes `--dry-run`. AGENTS.md's commands table has both.
5. **The web's loader:** `CONTENT.pack('story.json')` at boot (the index, always fresh), then each file through
   `CONTENT.pack(path, { path, bytes, sha256 })`, which uma-kit verifies and keeps in Cache Storage by hash. **That's
   the pack's "cached immutably", in the kit's Cache Storage rather than IndexedDB:** the kit's cache is already
   content-addressed and verified, so nothing is forked or duplicated. The last good index is kept on the device, so an
   offline boot plays the last version. The cast, the ties, the bibles and the household load at boot; routes and pairs
   load on demand, and offline a route not yet cached plays the stand-in arrival or closes the event. A pack that can't
   load (no index, a hash mismatch) gives the boot gate's **Try again**. **The stand-in pack is a dev fallback only:**
   with `import.meta.env.DEV` and a 404 for `story.json` (no `content/story-release/`), the dev server plays the
   stand-in; the production build never contains it.
6. **The infrastructure step** (`infra/bootstrap.sh`'s step 9, idempotent like the rest): describe, else create
   `gs://uma-farm-content` (`--location=us-central1 --uniform-bucket-level-access --public-access-prevention`); update
   it `--versioning --update-labels=app=farm` with a lifecycle rule deleting a noncurrent version once 10 newer ones
   exist; bind `farm-api-runtime` `roles/storage.objectViewer` on the bucket only; print `STORY_BUCKET=uma-farm-content`
   with the other variables. The repository variable `STORY_BUCKET` is set (`gh variable set`), and
   `.github/workflows/deploy.yml` passes `STORY_BUCKET` to Cloud Run beside `MASTER_BUCKET` (this packet is the task
   that allows touching `infra/` and the workflow, AGENTS.md). Done.
7. **The isolation check,** the way infrastructure.md checks every piece: the bucket's IAM policy names
   `farm-api-runtime` as its only service account, and the Policy Troubleshooter refuses `rpg-api-runtime` and
   `quest-api-runtime` on it; a signed-out read of `/api/content/story.json` through the site is 401, the owner's signed
   read 200, an unlisted path 404. [infrastructure.md](../../technical/infrastructure.md) has the bucket's row, the
   runtime account's grant, the isolation cells, re-run and rollback (unbind, then delete the bucket and its versions),
   and the cost line; the signed 200 and the unlisted 404 join it once the pack is published.
8. **The go-live**, in one commit after the pack is published:
   - `VITE_FARM_ROMANCE`, `romanceOn()`, `.env.romance` and its `!` line, `dist-romance/`, the second build and size
     check go; `.env.development` keeps only what else it held. **`VITE_FARM_STORY` stays:** it's Vitest's stand-in,
     never in a production build;
   - the v3-only screens and their tests go: the start's sheet, the Gate's visitor, v3's affinity controls, the old
     roster page and bar, End the day's old sheet; v3's play that v4 doesn't use goes from `@farm/domain` (`start.ts`,
     the Gate and `recruitFor` in `visitors.ts`, `giftTaste`, the Dorm's ten v3 levels where only v3 read them), while
     `CHAT_LINES` stays as the fallback; **v1–v3's parse and `freshV4` stay** (the API reads the owner's stored v3, and
     stale uploads are refused, as v2's parse stayed when v3 shipped);
   - the store holds v4 only; **`SAVE_VERSION` and `NEWEST_SAVE_VERSION` are 4**; every web test runs on v4;
   - [the game mechanics](../../game-mechanics.md) say what plays: its "romance build" and "on a v4 save" notes become
     the rules, and its v3-only parts are rewritten or retired; [architecture.md](../../technical/architecture.md) says
     what plays too.

   From then, any change to the save's shape is v5 (the workshops first).
9. **The order:** (a) the release script, the route and the loader, merged while still dark (production unaffected:
   with no pack in the bucket and no folder in the container, the route answers 404); (b) the owner's yes, asked in one
   line with the table; (c) `infra/bootstrap.sh`'s step, scoped, then the repository variable; (d) `pnpm story:publish`
   of the owner's pack and the isolation and read checks (decision 7); (e) the go-live commit, its deploy watched;
   (f) the owner's phone check; (g) the production read. **(a)–(c) are done.**
10. **The owner's first open is tested** before the deploy: a v3 from the server is wiped into v4 with `uid`,
    `createdAt` and `updatedAt` unchanged and uploaded unstamped; the API backs the v3 up to `saveBackups/{uid}-v3`
    before storing the v4; the name is the first stamp; an old build's v3 upload over the v4 is refused with a 409 and
    kept in `saveRescues`; a dirty device v3 is kept as a safety copy first; the deployed v3 build at its last commit
    stops at a v4 with the update prompt. **The deployed build already shows the words:** at a v4 it throws
    `NEWER_SAVE_WORDS` in `save/game.ts`'s `playable`, writes nothing, and the boot gate shows those words beside the
    kit's update prompt, so a cached v3 PWA that meets the owner's new v4 says why and updates.
11. **The production read** (read only, the scoped gcloud): `saves/{uid}` is v4; `saveBackups/{uid}-v3` holds the old
    v3; the v4's `account.uid` and `createdAt` equal the backup's; its `updatedAt` equals the backup's until the name is
    entered, then the name's time; `saveRescues` holds nothing new (or only an old build's refused v3, as designed). A
    stale or wrong date: stop and ask.
12. **What the pack must hold at go-live:** every cast Uma's bible (27 beats) and arrival scene (the release refuses
    less); routes may be partial; a missing pair conversation gives the heart's line; a missing household file leaves
    household scenes waiting and house lines on the templates. Waves of routes ship as new pack versions with no code
    change.
13. **The romance's pixel art** (uma-art 2.26.0) is already pinned, and nothing in the go-live depends on art.

## Do

1. **The release and publish scripts** (decisions 3, 4) with their tests on the stand-in pack. Done.
2. **The route** (decision 2) with tests (an allowlisted file served, another refused, the guard), and `STORY_DIR`
   working locally on a release of the owner's private `content/story/`. Done.
3. **The loader** (decision 5): the index, verified files, the last index offline, the dev fallback. Done.
4. Merge 1–3 dark (decision 9a); **ask the owner's yes** in one line with the table (decision 1). Done.
5. **After the yes:** the bootstrap step and the variable (decision 6), scoped (done); then, with the pack in place,
   publish, the checks (decision 7) and [infrastructure.md](../../technical/infrastructure.md).
6. **The go-live** (decisions 8, 10), the game mechanics with it, then the deploy, watched.
7. **The owner's phone check** (one line, below), then the production read (decision 11).

## Done when

- `pnpm lint`, `pnpm test` and `pnpm build` pass; **the one size check** is ≤ 180 KB gzip (the number in the pull
  request); the private-content guard passes, `git grep` finds no character name, and
  `rg -l "VITE_FARM_ROMANCE|romanceOn" apps packages` finds nothing.
- `pnpm docs:update` leaves every live table unchanged.
- Tests: the release is deterministic, hashes and names its files, writes `scripted`, refuses a missing bible or arrival
  scene and passes partial routes; the route serves the index and a hashed file and refuses anything else; the loader
  verifies, reuses the cache, boots offline on the last index and refuses a mismatch; decision 10's first-open tests.
- Locally at 390×844 (and 375×667): with `STORY_DIR` on a release of the owner's private pack, a new account names the
  farmer and meets the owner's priority three in the opening; their arrival scenes, a chat, a gift and an event play
  from the real pack; a dev v3 save wipes once. Screenshots stay local.
- Production: the bucket exists with the owner's yes, labelled, versioned, its only reader `farm-api-runtime`; the pack
  is published; signed-out 401, signed 200, unlisted 404; the go-live deploy passes and health shows the commit; the
  owner's phone check passes (the owner's word, in the pull request); decision 11's read holds.

**The phone check, in one line:** "The romance is live: open https://uma-farm.web.app on your phone (tap Restart if it
offers the update), name your farmer, meet your three, plant the carrots, chat with one and give her a gift, and end the
day."

## Deliver

The dark part is merged. The go-live is one pull request on a branch for the main session to merge and deploy
(`git status` and the private-content guard first): `feat/f56-go-live` (`feat: the romance goes live; save v4 and the
wipe (F56)`). The publish and the checks before it run in the main session, with the scoped gcloud. In the go-live
branch:
- delete this packet, take its rows out of [the handoff](../README.md), and update the handoff's status and the owner's
  steps;
- take step 1.2 out of [the roadmap](../../roadmap.md#phase-1-one-game-not-three);
- say in the commit and the pull request the release's id, the owner's yes and its date, the phone check's result, and
  decisions 1–13.

The main session merges, watches the deploy (`gh run watch <id> -R luismlorenzana/uma-farm --exit-status`) and adds the
run's link to the pull request.

## Rules that hold (every romance packet)

- **No original-game content in git:** no outfit or character names, no character or outfit id tied to a name, nothing
  that quotes or paraphrases the private story, in code, tests, docs, commits or pull request bodies. The private pack
  lives only in the ignored `content/story/` and `content/story-release/` and the private bucket; tests use the stand-in
  pack (9000001–9000003), other invented ids and `@luismlorenzana/uma-data/testing`. Run `git status`, `pnpm test` after
  staging (the private-content guard reads the git index) and `git grep` for names before committing.
- **Never make anything public:** the bucket is private with public access prevented, its files served only behind the
  owner guard; no signed or public URL to it.
- **F40's RS2, RS3 and RS4 hold in every line and screen:** every Uma is an adult; romance is tender and non-explicit,
  with a fade before anything more; the farmer is never gendered and never drawn, lines say "you", and `{farmer}` is the
  only placeholder.
- **The save:** v4 ships here and is frozen; any change after this packet is v5 or later, one version per release that
  changes the save, each with a tested migration and a backup. `account.updatedAt` moves only on a player's change; no
  server writes into a save; nobody edits production by hand.
- **The cloud:** never change the active gcloud account and never run `gcloud config set`; scope every command with
  `CLOUDSDK_ACTIVE_CONFIG_NAME=default CLOUDSDK_CORE_PROJECT=uma-rpg`; never touch uma-rpg's or uma-quest's pieces;
  never type credentials into a sign-in page.
- **Main JS ≤ 180 KB gzip** (one build after the go-live): the pack loads after start; the loader's code is measured in
  the pull request.
- **`uma-work` and `uma-kit` aren't forked:** the pack uses the kit's content client as it is; anything it lacks is a
  "Both apps" request to uma-platform, sent by the main session and pinned when released.
- **[The game mechanics](../../game-mechanics.md) change in the same commit as each rule;** their live tables through
  `pnpm docs:update`.
- **Portrait 390×844 first** (check 375×667), 44 pt targets, safe areas; player-facing text short.
- **Production saves:** never move `save.account.updatedAt`, never write into a save from a server, and a stale server
  date means stop and ask.

## Left to the worker

How the go-live commit splits the deletions, if it reads better as two commits in one pull request.
