# F57 — Both apps: the HD-2D stage as a shared package (`uma-stage`)

**uma-platform · a uma-platform Claude session ("Both apps", the change protocol) · L there, S here · Needs: nothing
(uma-quest's measured plays were waived, its D21) · Unblocks: F11 (the farm on the stage) · Milestone M7, the HD-2D
farm**

> **A "Both apps" request from uma-farm (2026-11-11, D63)** to uma-platform, under the
> [change protocol](https://github.com/luismlorenzana/uma-platform/blob/main/docs/change-protocol.md), modelled on
> uma-quest's [KL1 request](https://github.com/luismlorenzana/uma-quest/blob/main/docs/design/kl1-request.md).
> - **How it runs:** take it in a uma-platform session ("Take F57"). That session writes its own P-packet from this one
>   and builds it, and moves uma-quest onto the package as the protocol's step 3 says.
> - **The farm's side:** nothing here waits on the farm; F11 adopts the package when it ships.
> - **Filed in uma-platform (P140, `041526e`)** as ST1 (0.1.0, the move) and ST2 (0.2.0, the farm's openings). Its calls
>   for the move: the engine takes a built world, and uma-quest keeps its generator and rooms; the kit loader takes
>   atlases as inputs; the sprite loader takes the master-data client; the test room and the measurement upload stay in
>   uma-quest; three.js is pinned exact, with React, uma-kit and uma-data as peers. **The owner's step after 0.1.0:** grant
>   uma-stage's Actions access (Read) to uma-quest and uma-farm; the platform session asks when it's time.
> - **The owner's pace (D61):** one piece at a time, checked back with the owner. **Release 1** (the move) is one piece,
>   and **release 2** (the farm's openings) is another.

## Why

The farm is moving onto the HD-2D stage (M7, [hd2d-farm.md](../../design/hd2d-farm.md), accepted D21). Its engine is
uma-quest's: three.js, a world built from 2D kits, pixel sprites, and lights and fog. uma-platform's rule is **extract on
second use** (P11), and the farm is the second user, so the stage moves into uma-platform as a package both apps use. The
farm never imports uma-quest and never copies an engine (FR1, CLAUDE.md).

FR2 made the extraction wait for uma-quest's measured plays on the phone (HD5). **The owner waived those plays**
(uma-quest D21, 2026-11-08), and the engine has carried uma-quest's slice since. Nothing gates the extraction now.

## What uma-quest has (uma-quest `d4d1b79`, 2026-11-11)

| Part | Where | Size |
|---|---|---|
| **The stage:** the engine, the camera (orthographic, pitched 35°, pixel-snapped), frames and timing, input, the turn, the field controls, the stand-in, the test room | `apps/web/src/stage/` (`engine.ts`, `camera.ts`, `frames.ts`, `timing.ts`, `input.ts`, `turn.ts`, `TurnedStage.tsx`, `controls.tsx`, `useFieldInput.tsx`, `standIn.ts`, `TestRoom.tsx`) | About 1,400 lines |
| **The world builder:** geometry from a design, the kit loader, effects, walking, the stand-in kits | `apps/web/src/stage/world/` (`build.ts`, `geometry.ts`, `kits.ts`, `designs.ts`, `effects.ts`, `walk.ts`, `standInKit.ts`) | 688 lines |
| **The sprite player:** loading, caching, facing, tint, trail, blink, actors | `apps/web/src/sprites/` (`player.ts`, `loader.ts`, `cache.ts`, `facing.ts`, `tint.ts`, `trail.ts`, `blink.ts`, `actor.ts`, `standInSet.ts`; quest content in `batch1.ts`, `keySets.ts`, `keys.ts`, `fixture.ts`) | 839 lines |
| **The formats:** `parseKitAtlas`, `KIT_REQUIRED`, `kitMissing` (kinds `biome` and `town`); `parseRoomDesign`, `parseTownDesign` | `@quest/domain`'s `world/kit.ts` and `world/design.ts` | — |
| **three.js** | 0.187.0, pinned exact, lazy (P90) | The stage chunk was 154.7 KB gzip with three.js (FR4) |
| **The layout** | A turned landscape stage inside uma-kit 0.18.0's `KitStage` (P103) | — |

## What the farm needs

From [hd2d-farm.md](../../design/hd2d-farm.md) (FR3–FR14, accepted D21) and [kit-farm.md](../../design/kit-farm.md)
(KF1–KF14, F16):
- a **portrait, unturned** stage, 9 tiles across, that scrolls up and down;
- a farm **kit** and a farm **design**;
- **taps** on places, slots and Umas;
- Umas **walking** the farm's paths to their slots, and **standees** for outfits without a sprite set;
- a cap on live sprite sets;
- **the seasons as live light**.

## What we ask for

**Release 1, the move** (`@luismlorenzana/uma-stage` 0.1.0; nothing new, uma-quest unchanged):

1. **A package** in uma-platform's `packages/stage`, holding the stage, camera, frames and timing, input, the world
   builder and geometry, walking, the kit loader and the format parsers (`parseKitAtlas`, `kitMissing`,
   `parseRoomDesign`, `parseTownDesign`), the sprite player and its loader and cache, the lights, fog and effects,
   battery saver and the measurement recorder, and the stand-in kit and set.
   - **No quest content:** batch 1's sets, key sets and fixtures stay in uma-quest.
   - three.js stays pinned exact, and the package loads lazily, so a game's main bundle doesn't grow.
2. **uma-quest moves onto it** with nothing changed in how it plays: its checks and test room pass, and its stage chunk
   stays within a few KB of today's.
3. **A P-decision amending P90 and P14:**
   - three.js is the stage package's, for uma-quest and uma-farm;
   - Phaser stays for uma-kit's Hub until the farm leaves the Hub (FR4);
   - uma-rpg and uma-racer don't change.

**Release 2, the farm's openings** (0.2.0; opt-in, so uma-quest's scenes don't change):

4. **A portrait, unturned layout** beside the turned landscape one, read from `KitStage`'s `layout: 'portrait'` (FR3).
5. **The kit format, opened** (KF1, KF12):
   - a third kind, `farm`, with its `KIT_REQUIRED` list: wave 1's names from kit-farm.md §6, plus wave 2's once the farm
     draws a wave-2 place;
   - a **`set`** on `building-wall`, `window`, `door` and `roof` frames, picked by a design; variants within a set are
     still picked by the position hash;
   - **`door` frames 128 or 256 wide** (a two-column door);
   - **mounted pieces:** `sign`-role frames placed by the design at a level and a column on a front or a roof, beyond the
     town format's sign beside the door.
6. **A farm design format** (the town format opened up), `parseFarmDesign`:
   - a grid up to 9 × 48 tiles, with heights;
   - buildings `{ id, walls, roof, x, z, w, d, storeys, door, mounts[] }`;
   - props by name;
   - markers `place`, `slot`, `gate`, `path` and `lot`.

   The farm builds its design from its own rules (F11). The package only parses and builds it.
7. **A camera the game drives:** a vertical pan, where a flick glides and settles on a band, with no zoom and no sideways
   pan, pixel-snapped (FR6). uma-quest's follow camera stays as it is.
8. **Tap picking:** a tap answers with the marker, prop, building or sprite under it (FR9), in stage coordinates on
   either layout.
9. **Walkers:** move a sprite or a standee from one tile to another along walkable path tiles, by grid path-finding, at
   a walk or a run (FR10). uma-quest's townsfolk could use it too.
10. **Standees:** an upright card from a face image on a small base, lit and shadowed like a sprite, gliding with a bob
    and with no walk cycle (FR12). They're for outfits whose `client.spriteSet` is `null`.
11. **A cap on live sprite sets** (default 8), the sets nearest the camera's centre first, the rest as standees until a
    set frees up (FR13).
12. **A live grade:** a colour grade and light the game sets per scene, so the farm's four seasons are light, not tiles
    (KF10).
13. **Review:** the test room and a portrait sample (a stand-in farm band built from a stand-in `farm` kit), each viewed
    at phone width. uma-quest's checks pass and its test room is unchanged.

## Not asked

- **The farm's scene** (the layout, the taps' meanings, the sheets over the stage): F11 builds it on the package.
- **The farm kit's art:** F9 (ChatGPT) draws it to kit-farm.md.
- **Farm-work animations:** F15, a later request to the sprite pipeline, on the owner's go.
- **The minigames' scenes:** F8, F13 and F14 run on the stage later, with their own kits.
- **uma-kit's Hub:** it stays for uma-rpg and uma-racer, and for the farm until F11 replaces it.

## When

**Now: release 1, then release 2,** each one piece and checked back with the owner (D61). F11 needs release 2.

## Done when

- `@luismlorenzana/uma-stage` 0.1.0 and 0.2.0 are on GitHub Packages, with their tests.
- uma-quest pins 0.1.0, then 0.2.0, and plays as before. Its checks pass, and its test room and slice look the same at
  phone width.
- Release 2's openings (asks 4–12) each have a test, and the portrait sample builds a stand-in farm band with:
  - a building from sets;
  - a mounted piece;
  - a two-column door;
  - a tap that picks a slot;
  - a standee walking a path;
  - a second season's grade.
- uma-rpg and uma-racer are untouched.
- The P-decision amending P90 and P14 is logged.

## Deliver

In uma-platform: both releases, a P-decision for each, and the package's README (its parts, its options, the two layouts,
the formats).

Then, as the protocol's step 3 says:
- **uma-quest:** the platform session messages uma-quest's session with each version, or pins uma-quest itself if that
  session isn't running.
- **uma-farm:** the platform session messages this repo's main session with the version and what changed. That session:
  - adds a Done row in [the handoff](../README.md);
  - logs the D-decision;
  - deletes this packet once release 2 ships.

## Rules that hold

- **No forks:** the farm never copies or imports the stage (FR1). Behaviour only one game needs becomes an option, not a
  copy.
- **No original-game content** in the package: no Uma art in its tests or samples (stand-in sprites only), and no quest
  content.
- **Lean:** the stage loads on demand. uma-farm's main JS stays ≤ 180 KB gzip, and uma-quest's stays where it is.
- **One canvas engine alive at a time** (FR4): the game pauses the stage while a minigame plays.
