# F23 — The roster: the start's picks, the Dorm, visitors

**uma-farm · Claude · M · Needs: F21 · Unblocks: F24 · Milestone M4, the loop on today's map**

## Why

Umas join the farm over time (FC16): you start with three you pick, beds cap who lives on the farm, and visitors come to
the Gate and stay once you've won them over. Growing the roster is part of the progression. This packet builds the
start's six cards and three picks, the Dorm's levels and beds, visitors with chats and gifts, chapter recruits, and the
off-season with its swaps.

## Context (read first)

- [core-spec.md](../../design/core-spec.md): **CS2, CS34, CS35, CS36**, **CS45** (chats and gifts; praise and story
  beats are M6), CS27 and CS28 (the talents on the cards), CS33 (her favourite line), CS42 (the opening scene's
  "first hands", F24), CS53 (`roster`, `dorm`, `visitors`, `RosterUma.affinity`), CS55.
- [core-loop.md](../../design/core-loop.md): **FC16, FC19, FC26**, and "Notes from drawing the page" #11.
- [decisions.md](../../decisions.md): D24 #11 (beds cap 60 on the farm; the roster reaches 272), D27.
- The manual: [ranks.md](../../game/ranks.md) (F21's talents and the cards), [days.md](../../game/days.md) (the night).
- Code: F17's v3 (`roster`, `dorm` with `swaps`, `visitors`, `start.redraws`, `today`, `buildings.dorm`, `BEDS`,
  `spendGold`, `farmRankOf`, `draw`) and its temporary picks, which this packet removes; F18's `endDay` step 8, the map's
  Dorm and Gate, `/roster`; F21's `talentOf`, `favouriteActivity`, the album's cards; `apps/web/src/album/`,
  `master/album-art.tsx`; uma-kit's `UmaPicker` (`max`, `selectedIds`), `FaceTile`, `UmaBust`.

## Decisions made

### From the spec

- **The start (CS2):** the first boot shows **six candidates**, each a face card with her three day-1 talents
  (farming, foraging, fishing) and her favourite line. You **pick any three**. **One free redraw** replaces all six. The
  six are a seeded draw from the whole release, nudged so the sheet always holds **a C-or-better farmer, forager and
  fisher** (redrawing a card that would leave a gap). They become "your first hands" in chapter 1's scene (F24).
- **The Dorm (CS34):** beds cap who lives and works on the farm at once (D24 #11). Upgrades are bought at the Dorm and
  take effect the next morning.

  | Level | Beds | Costs | Farm Rank |
  |---|---|---|---|
  | 1 | 3 | — | — |
  | 2 | 5 | 1,000g | 1 |
  | 3 | 8 | 3,000g | 2 |
  | 4 | 12 | 8,000g | 3 |
  | 5 | 16 | 15,000g | 4 |
  | 6 | 22 | 28,000g | 5 |
  | 7 | 30 | 50,000g | 6 |
  | 8 | 40 | 85,000g | 7 |
  | 9 | 50 | 130,000g | 8 |
  | 10 | 60 | 200,000g | 9 |
- **How visitors come and join (CS35):**

  | Way | Who | When she joins |
  |---|---|---|
  | The Gate | While a bed is free and no visitor waits, a visitor stops by **every fourth morning** (days 4, 8, 12 …), a seeded draw from outfits not yet met | When your **affinity reaches 2 hearts** (200 points). She waits **6 days**, then leaves (she may come again) |
  | Chapters | Each chapter's end brings one, **drawn for the farm's weakest open activity** | At once |
  | Festivals, requests, expeditions | M5 and M6 | — |

  A recruit with no free bed joins **on her off-season**.
- **The off-season (CS36):** the roster can grow past the beds. Umas beyond them are away, keeping their ranks, bonds
  and affinity, earning nothing. At the Dorm, **swap** an idle Uma home for one away; she arrives the next morning.
  Swaps are free and unlimited. Every outfit on the release can join in the end.
- **Affinity (CS45),** 0–10 hearts, 100 points each:

  | Act | Points | Limit |
  |---|---|---|
  | Chat (tap her) | +15 | Once a day |
  | Gift | Loved +60, liked +30, neutral +10, disliked −20 | One a day |
  | Praise | +20 | M6 (F34) |

  **What she loves:** the dish kind of her best talent (dishes come in M5). **Likes:** goods of her favourite line.
  **Dislikes:** feed and raw stone (miners excepted). **2 hearts:** a visitor asks to stay. 5 hearts +5% rank points,
  10 hearts +10% (F21 reads it). Story beats at 2, 4, 6, 8 and 10 hearts are M6.
- **The roster's cards (FC19):** her ranks and talents (F21), your affinity with her, her favourite line; bonds in M6.

### Decided here (the spec left these open)

1. **The six:** `draw(uid, 0, 'start:<redraws>', n)` over the release's outfits not on the roster. A card that would
   leave the sheet without a C-or-better farmer (Stamina), forager (Speed) or fisher (Wit) is replaced by the next draw
   that fills the gap. The redraw sets `start.redraws` to 1 and draws again.
2. **Picks pending** whenever the roster holds fewer than 3: a new account picks three; a migrated save with *k* Umas
   picks 3 − *k* from the same sheet. Picking is the first tap of the game (before chapter 1's scene, F24). F17's
   temporary picks go.
3. **The Dorm's levels:** buying sets `buildings.dorm` (bought, gold spent now); the night's step 8 raises `dorm.level`
   to it, so the beds come the next morning (F17's decision 5). Swaps go in `dorm.swaps` and apply in the same step.
4. **Who may be swapped out:** an Uma home with no running job, not tending (F20's `isBusy`). Who's home is `dorm.home`;
   everyone else on the roster is away. Only work and tending need her home; chats and gifts reach every Uma on the
   roster and every visitor.
5. **Visitors, at step 8:** a waiting visitor whose 6 days are up leaves (`leaves` = her first day + 6); then, on the
   night before a day divisible by 4, if a bed is free (home plus arriving below the beds in effect) and no Gate visitor
   waits, one arrives, drawn from outfits **not on the roster and not waiting**, so one who left may come again.
6. **She joins the moment her affinity reaches 200** (a chat or a gift that crosses it): a short card, "She'd like to
   stay", and she's on the roster with `joined` today and her affinity kept. If no bed is free by then, she joins away.
7. **Affinity never falls a heart:** CS45 lists a disliked gift at −20 yet says "affinity never falls". A disliked gift
   takes up to 20 points but never below the hearts she's reached; nothing ever decays.
8. **Likes by favourite line:** Wood, the forest's six families (raw and refined); Fish, fish and fillets; Vegetables,
   crops and their refined forms; Metal, ores and ingots; Stone, stones and crystals, raw and refined. Dislikes: feed
   (M5) and raw stones, unless her favourite is mining. Everything else is neutral. A gift takes one item from the
   Warehouse, the player choosing its stars.
9. **Chats and gifts once a day** are tracked in `today.chats` and `today.gifts` (F17's decision 4), cleared at step 7.
   A chat shows one short line from a small set by her temperament (F21), five lines each, original text with her name
   filled in at runtime; M6's conversations replace them.
10. **The chapter recruit:** `recruitFor(save, release, 'weakest')` picks the open activity (in M4 farming, foraging or
    fishing) whose best rank on the roster is lowest, then whose best talent is lowest, and draws an outfit not on the
    roster with C or better in it. F24 calls it for chapter 1's reward.
11. **The screens:**
    - the start's sheet: six cards in two columns, each a face, name (master data), three talent letters and her
      favourite line's mark; **Pick 3** and **Redraw (1 left)**;
    - the Dorm's page (the Dorm on the map): beds used of beds, **Upgrade · 1,000g** with its Farm Rank, home and away
      lists, **Swap** (pick one home, one away), "Arrives tomorrow" on pending swaps;
    - the Gate (on the map): the visitor waiting, her days left, her hearts, **Chat** and **Gift**;
    - `/roster`: the album of everyone on the roster, home or away, with F21's talents and ranks, her hearts, and
      **Chat** and **Gift** on her card.
    The summary's "new today" lists a visitor at the Gate, one leaving, one joining, and a swap arriving.

### Rules that hold (every M4 packet)

- No original-game content in git: names, titles and art come from master data at runtime only; tests use
  `@luismlorenzana/uma-data/testing` fixtures or invented ids. Run `git status` and the private-content guard before
  committing.
- Main JS ≤ 180 KB gzip, in both builds while M4 is dark (F17).
- The farm runs on today's map, uma-kit's Phaser Hub, until M7.
- Portrait 390×844 first (check 375×667), 44 pt targets, safe areas.
- Player-facing text is short; explanations go behind a help button.
- `uma-work` and `uma-kit/work` aren't forked: anything they lack is a uma-platform request, pinned when released.
- Every save change is a new version with its migration and tests, and `account.updatedAt` never moves in a migration.
  v3 is unreleased until F24, so an M4 packet may extend v3 in place, with parse tests; from F24 on, a change is v4.
- The copied uma-rpg code stays copied, never imported.
- The manual (`docs/game/`) changes in the same commit as each rule.

### Left to the worker

The sheets' drawing; the chat lines' wording (short, original, no names in git); whether the start's sheet reuses
uma-kit's `UmaPicker` with `max: 3` or draws its own six cards.

## Do

1. **The rules** in `@farm/domain`: the six and the redraw, `pick`, `buyDorm`, `swap`, visitors at step 8 (arrive,
   leave), `chat`, `gift` with likes and dislikes, joining at 200, `recruitFor`, each with tests.
2. **Who may work** is who's home: F18's env `isWorker` and the job picker read `dorm.home`.
3. **The screens** (decision 11), and removing F17's temporary picks.
4. **The manual:** a new [docs/game/roster.md](../../game/roster.md) with live blocks (the Dorm's levels, the ways in,
   affinity's acts, likes by line) and hand-written rules ("built in F23, live from F24"); its row in
   [the manual's index](../../game/README.md).

## Done when

- `pnpm lint`, `pnpm test` and `pnpm build` pass; both size checks are ≤ 180 KB gzip; the private-content guard passes.
- Domain tests, on invented outfits with chosen stats:
  - the six always hold a C-or-better farmer, forager and fisher, the same six for the same account, and the redraw
    works once;
  - a migrated save with two Umas picks one;
  - Dorm level 2 is refused without 1,000g, bought at once, and its beds come the next morning;
  - a visitor arrives on the morning of day 4 when a bed is free, not when none is or one waits, and leaves after 6
    days;
  - a chat counts once a day; a liked gift is +30, a disliked one never drops a heart; she joins at 200 points, away if
    no bed is free;
  - a swap arrives the next morning, and a working Uma can't be swapped out;
  - the chapter recruit is drawn for the weakest open activity.
- `pnpm docs:update` leaves `roster.md` unchanged.
- Locally (loop build) at 390×844: a new account picks three from six after one redraw; buy Dorm level 2 and see the
  beds the next morning; on day 4 a visitor waits at the Gate; chat and gift each day until she stays; swap an Uma away
  and back.
- Production: the deploy passes, health shows the commit, and https://uma-farm.web.app plays the Wilds as before.

## Deliver

Commit to `main` (`feat: the roster, the Dorm and visitors (F23)`, `git status` first), push, and watch the run
(`gh run watch <id> -R luismlorenzana/uma-farm --exit-status`); fix forward if it fails. Delete this packet, add a Done
row in [the handoff](../README.md) with the run's link, and log the packet's D-decision in
[decisions.md](../../decisions.md) (fetch `main` first for the number), naming decisions 1–11.
