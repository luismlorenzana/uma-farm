# F12 — Umas at work on the stage: figures, walks, bubbles, the live-set cap

**uma-farm · Claude · M · Needs: F11 ✓ (D71), the kit pin (D73), and ST4 ✓ (uma-stage 0.4.0, P154, D76) · Unblocks: F13 and
F14 (the workshops' games on the stage), the owner's call to turn the stage on for everyone · Milestone M7, the HD-2D
farm**

> **One piece, checked back with the owner (D61).** F11 drew the farm. This packet puts the Umas on it: each one where
> the save says she is, walking when you move her, with a bubble when her work is Ready. It stays inside the opt-in
> preview (Account → "HD-2D farm (preview)").

## Why

FR9 and FR10 are the heart of the HD-2D farm: you put an Uma to work, and she walks there. F11 left the places, the
markers and the overlays ready, and uma-stage has figures, walkers on paths, standees and a cap on live sprite sets
(0.2.1, D65). What's missing is the farm's side, and one stage option: choosing which figures count for the fade, so
roofs don't sit faded at rest.

**Days are turns (D25).** FR9 was written for real-time work. On this farm, work is settled at night and Ready in the
morning. Read FR9's "timer" as the days left and "Ready" as the morning's Ready. Nothing moves while the app is closed.

## Context (read first)

- [hd2d-farm.md](../../design/hd2d-farm.md):
  - FR9 (the taps), FR10 (who walks and how), FR12 (standees), FR13 (memory and battery), FR14 (the counts stay right);
  - the revision note at its top.
- [kit-farm.md](../../design/kit-farm.md): KF2 (the layout), KF5 (the Umas show the work).
- [decisions.md](../../decisions.md): D25 (days are turns), D61, D65 and D69 (the stage), D68 (ST3), **D71 (F11's calls
  and seams)**, D73 (the kit pin).
- uma-stage's README in uma-platform: `BandStage`'s figures (`addFigure`, `removeFigure`, `placeFigure`,
  `setFigureSet`, `walkTo`), standees, `cap`, `headOf`, `project`, `fade` and `setFadeMarkers`.
- The farm's code:
  - `loop/farm-stage.ts` and `FarmStage.tsx`: `stage.current`, `wake(ms)`, `placeChips()`, `tapTarget`, `plotOfHit`,
    `fadeMarkers(open)`, `farmKit()`, `rememberCentre`, and `window.__farmStage` in dev;
  - `@farm/domain`'s `farm/stage.ts`: `farmDesign`, `farmPlots`, `plotAt`, `slotId(place, i)` (`<place>-1…4`, the Fields'
    `fields-a…d`), the `gate` marker at (4, 26), and `lot` markers;
  - `loop/actions.ts`: `collectJob(outfitId)`, `collectAt(place)`, `collectFarm()`;
  - `loop/summary-words.ts`: `umaSheet(id, version, view)`;
  - uma-kit's `workView` cards (who works where).
- Master data: `client.spriteSet` (a set, or `null` for most outfits today) and `outfit-faces`. In the romance build,
  roster ids are character ids, and `outfitFor(id)` gives the outfit.

## The stage request (uma-platform ST4), sent with this packet

F11's worker found five things the stage could do better (D71). **The first is needed here**, and the rest are small:

1. **A filter for which figures count for the fade**, beside `setFadeMarkers`: `setFadeFigures(ids | (figure) =>
   boolean)`. Today every figure counts, so an Uma standing at a slot behind a roof would keep that roof faded at rest,
   which breaks F11's "nothing faded at rest".
2. **Keep the camera on `setWorld`.** It resets to the top today, and the farm restores it after every rebuild.
3. **Keep walks across `setWorld`.** A rebuild (a crop growing, a harvest) re-places figures at their tiles and stops
   any walk. A walking figure should keep its walk when its path's tiles still stand.
4. **A settled signal, or a final draw on `stop()`.** The farm runs its own animation-frame watcher and calls `step(0)`,
   because saver's pacing can skip the resting frame.
5. **`farmProblems` and the stand-in farm atlas from a three-free entry,** so a game's domain can test its design
   without three.js.

**Done for ST4:** each option has a test; the farm-band sample shows a figure that doesn't count for the fade leaving
its roof whole; uma-quest is unchanged. The main session sends it to the uma-platform session with the owner's go, and
**F12 builds once it ships**. A contained portrait stage, F11's other note, isn't needed: F11 sized its own canvas.

**ST4 shipped as `@luismlorenzana/uma-stage` 0.4.0** (uma-platform P154, 2026-11-12; D76). All five are opt-in, and
with none used it runs as 0.3.0 did:
1. `stage.setFadeFigures(ids | (f) => boolean)`, with `f` = `{ id, tile, moving }`. Every figure counts until it's
   called; "only a Ready Uma counts" is `setFadeFigures((f) => ready.has(f.id))`.
2. `setWorld(design, kit, { keepCamera: true })`: the camera stays, held inside the new farm's range.
3. `setWorld(design, kit, { keepWalks: true })`: a walk goes on if her tile and every step left still stand
   (`pathStands`); any other walk resolves `false` and she stays on her tile (decision 3 walks her again from there).
4. `new BandStage(canvas, { …, onSettled })` fires once each time the stage comes to rest (camera, walks, fades and
   grade still), after that frame is drawn, and saver's pacer never skips it; `stage.atRest` answers on demand; and
   `stop({ draw: true })` draws, then stops. Idle breathing and blinks don't count as motion. Either replaces F11's
   animation-frame watcher and its `step(0)`.
5. `farmProblems`, `standInFarmAtlas` and `SAMPLE_FARM` come from `@luismlorenzana/uma-stage/formats` (no three.js, no
   DOM; ESM and CJS), and the main entry still has them.

It also fixes 0.3.0's fade, which never visibly faded a part that was opaque on its first frame (three.js had compiled
its shader to write alpha 1); 0.4.0 recompiles the part's materials when the fade turns on or off. uma-quest stays on
0.3.0. uma-platform ran this repo's lint and 1,040 tests on the packed package.

## Decisions made

### From the specs

- **FR10, as days are turns:**
  - **arriving:** an Uma you put to work walks from the Gate (or the Dorm's door, decision 2) along the paths to her
    slot, with `walk-*`;
  - **at work:** she stands at her slot, facing the place, with an emote now and then;
  - **Ready:** in the morning, a bubble rises over her;
  - **leaving:** when you recall her, or when you collect without a next job, she runs home with `run-*`.
- **FR12:** an Uma without a sprite set is a standee (her face on an upright card) and glides with a bob, so every
  outfit works.
- **FR13:** at most 8 live sets (`cap`), nearest the view's centre. Sets download on first sight and are cached by hash.
  Saver stays on.
- **FR14:** figures only show the save, never change it. A save that loads mid-job places her at her slot at once,
  without the walk. The morning places everyone at once too.
- **KF5:** places keep one look, and the Umas show the work.

### Decided here

1. **Who stands on the farm:**
   - every Uma with a job or a tended block, at her slot;
   - the Umas who are home and idle, standing in the yard on the Dorm's apron and the path in front of it, with a
     housed spouse (v4) on her house's apron;
   - nobody who's away.

   The figures follow `farmHome`, `workView` and the Fields' tenders, so the counts match the Hub's pips exactly.
2. **Where walks start and end:** a newly put-to-work Uma walks from her idle spot to her slot, or from the Gate if
   she wasn't on the farm (a visitor joining). A recalled Uma runs back to her idle spot. An Uma leaving the farm runs
   out of the Gate.
3. **What triggers a walk:** the farm compares the figures' places before and after each save change made in this
   session (a job started, recalled, collected), and walks only those who moved. Boot, the morning and a sync from
   another device place everyone at once. **After a rebuild, any walk ST4 can't keep is issued again from where she
   stands.**
4. **The bubble:** an uma-kit overlay at `headOf(id)`, updated each frame while she moves and on camera changes:
   - **Ready:** the work's item icon, or ♥ when her heart event is Ready on a v4 save (F48 decision 10);
   - nothing while she's working.
   A Ready Uma's figure counts for the fade (ST4's filter), so a bubble behind a roof shows through.
5. **Taps** (FR9, figures first):
   - **her bubble** collects her work (`collectJob`); the items rise toward the Warehouse, and she starts her queued job
     or runs home;
   - **her figure** opens her sheet (`umaSheet`: her profile on v4 in the romance build, her roster sheet on v3);
   - **anything else** works as F11's taps do.
6. **The pips stay** in the place chips until the owner's look says otherwise: the figures add to the Hub's signals and
   replace none of them, and the Collect all pill still collects everything.
7. **Sets:** an outfit's set comes from master data by outfit id (in the romance build, `outfitFor(id)`). A set that's
   `null` or still loading shows as her standee. The cap is 8, and the farm wakes the loop while any figure moves
   (F11's `wake`).
8. **The emote** while working is a gentle `nod` every 4–7 seconds per Uma, seeded by her id so they don't move in step.
   There's none with reduced motion.

## Do

1. **The figures' model** in the domain or the web view model: who stands where (decision 1), and the walk diff
   (decisions 2, 3). Test it against the Hub's counts.
2. **The stage side** in `FarmStage.tsx` and `farm-stage.ts`: figures, walks, standees, sets, the cap and the loop's
   wake (decisions 2, 3, 7, 8).
3. **The bubbles and taps** (decisions 4, 5), with the fade's figure filter (ST4).
4. **Pin** `@luismlorenzana/uma-stage` 0.4.0 exact (from 0.3.0), in the web app and the domain. Use `onSettled` (or
   `stop({ draw: true })`) in place of F11's watcher, `keepCamera` in place of restoring the camera, and the
   `/formats` entry wherever the domain or its tests need `farmProblems` or the stand-in atlas.
5. **The manual:** [days.md](../../game/days.md) (the farm's figures) and
   [architecture.md](../../game/architecture.md) (figures, sets, the cap).

## Done when

- `pnpm lint`, `pnpm test` and `pnpm build` pass, and the main JS is ≤ 180 KB gzip in both builds.
- With the switch off, Home is the Hub as before.
- With the switch on, locally at 390×844 and 375×667:
  - every working Uma stands at her slot, and the idle ones in the yard, matching the pips;
  - putting an Uma to work from a place's sheet walks her there;
  - recalling her runs her home;
  - after End the day, the morning places everyone at once with Ready bubbles;
  - tapping a bubble collects;
  - tapping her opens her sheet;
  - an Uma without a set is a standee;
  - at rest no roof is faded, and a Ready bubble behind a roof shows through.
- **The owner's phone look**, one line: "Open the HD-2D farm preview on your phone, put an Uma to work and watch her
  walk, end the day, and tap her bubble in the morning."

## Deliver

Branch `feat/f12-umas-at-work` and a pull request for the main session to merge and deploy. In the branch:
- delete this packet;
- mark its queue row Done and add a Done row in [the handoff](../README.md);
- log the D-decision in [decisions.md](../../decisions.md), fetching `main` first for the number.

## Rules that hold

- **The preview stays opt-in.** Turning the stage on for everyone is the owner's later call.
- **Rules and the save don't change** (FR14). No save version moves.
- **No original-game content in git:** no Uma art in tests or committed screenshots, and no names.
- **Don't fork uma-stage or uma-kit.**
- **Lean:** sets load on demand and are cached; the precache stays free of the preview (D73).
- **GitHub API budget:** never poll faster than every 30 s.

## Left to the worker

- the idle Umas' exact spots;
- the walk speed within uma-quest's field speed;
- the bubble's look within uma-kit;
- how the items rise toward the Warehouse;
- anything the stage's README leaves to the game.
