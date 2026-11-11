# F50 — The evening, invitations and the Tonight sheet

**uma-farm · Claude · M · Needs: F49 · Unblocks: F53 (with F51), F54 · Beside: F51 · Milestone: the romance core**

## Why

The day gains its one scarce choice (research b2, b6): one evening across all the Umas, a hangout with a friend or a date
with a partner, played as a short graded game that pays well, more in her favourite kind. A morning invitation can make
the choice for you, and End the day becomes **Tonight**, where the evening waits if it's still free and, once you're
married, where you'll sleep (F54). The night stays a cozy fade straight to morning.

## Context (read first)

- [romance-spec.md](../../design/romance-spec.md): **RM19–RM22** and **RM37** whole, with the Tonight mockup; RM13's
  evening and invitation rows; RM16 and RM17 (an evening ×1.5 on her birthday and anniversary); RM25 (the plays'
  evening lengths, built in F49); RM31's F2, R1, R3, R6 and R9 rows (the kinds a level opens); RM45's 10 married (two
  evenings every fourth day, two invitations); RM52's header (Evening ○/●); RM57's second line; RM65's rows for FC1, FC22
  and FC33; RM67's F50 row.
- [core-spec.md](../../design/core-spec.md): CS6 (End the day's line), CS7 (the night), CS8 (seeds).
- [decisions.md](../../decisions.md): D31 (6, 10: End the day's sheet and the Menu's switch), D42 (the ten date games),
  D43 (the cozy fade), D46, D47, and the D-decisions F46–F49 logged.
- The manual: [hearts.md](../../game/hearts.md), [days.md](../../game/days.md) (End the day, the night, the morning).
- Code: `loop/LoopSheets.tsx` (`EndDay`), `shell/Bars.tsx` (the raised tab), `loop/ask.ts` (the Menu's switch),
  `night/end-day.ts` (steps 7 and 9), `night/nudge.ts` (`daySetState`), `farm/calendar.ts` (`festivalOn`), F47's
  `addLove` and day factors, F49's `romance/plays/` (both lengths) and its play sheet, F48's profile and Hearts header.

## Decisions made

### From the spec

- **RM19, one evening a day,** across all Umas:
  - **Who:** a **hangout** with an Uma at Friendship 2 or more; a **date** from Romance 1; any spouse. She must be home.
  - **What:** one of the evening kinds, a play of **30–60 s**, graded **Fine, Great or Perfect** and never failed:
    **+60, +100 or +150, ×1.5 in her favourite kind**.
  - **When:** any time in the day, from her profile (**Evening ›**) or Tonight's row. Once played the Hearts header shows
    "Evening ●". An evening left empty costs nothing.
  - **More evenings:** **two on every fourth day** from 10 married (RM45), and a second, **festival night**, on each
    festival day (a walk at the festival ground with anyone at Friendship 2+).
- **RM20, morning invitations:** each morning **at most one Uma invites you** (two from 10 married): "Fishing tonight?"
  She's drawn by seed (`draw(uid, day, 'invite', n)`) from the Umas at Friendship 2+ who are home and whose favourite
  kind is open today, weighted to those you've spent the fewest recent evenings with. **Yes** makes her tonight's
  evening in her kind (×1.5) with **+20**; **Another day** costs nothing, and she may ask again.
- **RM21:** each Uma plays at most one of her events a day (F47, F49); an evening isn't an event.
- **RM22, End the day becomes "Tonight":** one sheet, then the night: (1) **Evening:** today's if unspent, "with … ·
  Walk ✓" or **Pick someone ›** (skippable); (2) **Sleep at** once married (F54); (3) CS6's line ("2 Umas idle · 3 to
  collect") and **End the day / Back**. The Menu's switch still skips the sheet when nothing waits. **The night is a
  cozy fade straight to morning:** nothing is shown between End the day and the morning.
- **RM37, the evening kinds,** D42's ten date games, opened by her ladder and by their game:

  | Kind | Hangout | Date | Plays as | Its game |
  |---|---|---|---|---|
  | Walk at dusk | F2 | R1 | Walk | Now |
  | Fishing at the Pond | F2 | R1 | Cast | Now |
  | A picnic | F2 | R1 | Pick | Now |
  | The market in town | F2 | R1 | Pick | Now |
  | Cooking together | F2 | R1 | The Kitchen's practice mode | M5 (F8) |
  | Crafting | — | R1 | Rhythm | Now |
  | Stargazing at the overlook | — | R3 | Pick | Now |
  | Dancing | — | R6 | Rhythm | Now |
  | A boat on the lake | — | R6 | Rhythm | Now |
  | A footrace | — | R9 | The track play | M6 (F32) |
  | Festival night | Festival days, F2 | Festival days, R1 | Walk at the festival ground | Now |

  **Her favourite kind** is the date game her route's beats use most (`together.date`), walk on a tie; it pays ×1.5 and
  is what her invitations ask for.
- **RM16, RM17:** an evening with her is ×1.5 on her birthday and ×1.5 on her anniversary, on top of her kind.

### Decided here (the spec left these open)

1. **RM37 is built here,** as the spec's F50 row has it; the handoff's F53 row lists "RM37–RM40", but the kinds are the
   evening's, and F53 keeps RM38–RM40.
2. **Who and which kinds:** a hangout from Friendship 2 (the confession's wait included), a date from Romance 1 (the
   proposal's and the wedding's waits included), every opened kind for a spouse; she's home (`dorm.home`, and F54's
   housed spouses). Cooking together waits for F8's practice mode and the footrace for F32's track play: until their
   packets they aren't offered (RM37), and a favourite kind that isn't offered still counts as hers.
3. **Her favourite kind** is computed from her bible (`together.kind === 'date'` beats, most used, walk on a tie or with
   none); the stand-in bible's beats give 9000001 one.
4. **The points:** Fine 60, Great 100, Perfect 150, × 1.5 in her favourite kind, × 1.5 on her birthday, × 1.5 on her
   anniversary (in place of the day's ×2, F47 decision 7), each once, multiplied, rounded half up; through `addLove`. The
   choice sheet shows each kind's three numbers for her today ("Perfect +225") before the tap.
5. **The slots:** `today.evenings` holds what's spent (`{ with, kind }`, F46's slot; refined in place if needed). One a
   day; **a second on days divisible by 4** from 10 married (the Gate's old every-fourth-day rule); **festival night**
   is its own slot on a festival day, and only its kind fills it. `marriedCount(save)` (spouses) is defined here for F50
   and F54 to read.
6. **Playing one:** pick her (from her profile, or Tonight's **Pick someone ›**: eligible Umas home, her favourite kind
   and an invitation shown on each row), then a kind, then F49's play at its evening length, then a card with the grade,
   the sum and her bar. `love.evening` becomes today; the evening's +20 is paid on the card when she invited you and you
   said yes (whatever kind you chose; the ×1.5 only in her kind).
7. **Invitations:** drawn at **step 9** into `today.invites` (cleared at step 7) with `answer: null`; the weight is
   `1 + min(14, days since her last evening, or since she arrived)`; two from 10 married, never the same Uma twice. The
   morning's Hearts section (RM57's second line, F48's order) shows "✉ ‹Name›: "Fishing tonight?"" with **Yes, tonight**
   and **Another day**; the question is one original template a kind ("Walk at dusk tonight?"). Yes sets `answer: 'yes'`
   and makes her Tonight's evening; Another day sets `'no'`. Her Hearts row shows ✉ while it stands unanswered or yes.
8. **Tonight** (the raised tab in the romance build): it opens whenever an evening slot is free and someone can spend it,
   or (F54) a house waits to be picked; otherwise F18's rule stands (all set, or the Menu's switch off, ends at once,
   else the one-line ask). Its Evening row is "with ‹Name› · Walk ✓" once spent, the invited Uma with **Play ›** after a
   yes, else **Pick someone ›**; **End the day** never waits on it. **The night is a fade:** the screen fades to the
   page's dusk colour and back up on the morning summary, with nothing shown between (reduced motion: a plain cut).
9. **The Hearts header** (F48's) gains "Evening ○" with a mark per slot today (○ free, ● spent), festival night's in the
   festival's colour.
10. **Original words:** each kind's name and invitation question, the card's lines, and Tonight's rows are original and
    short, in git.

## Do

1. **The kinds and eligibility** (decisions 1–3) in `romance/evening.ts`.
2. **Points and slots** (decisions 4, 5) with `marriedCount`.
3. **Invitations** (decision 7): step 9's draw, the answers, the ✉ chip.
4. **The screens** (decisions 6, 8, 9): **Evening ›** on her profile, the picker and the kinds sheet, the evening's play
   and card, Tonight in place of End the day's sheet in the romance build, the fade, the header's marks, the morning's
   invitation line.
5. **`LAZY_MODULES`** gains the evening's rules and screens.
6. **The manual:** [hearts.md](../../game/hearts.md)'s "The evening" section with live blocks (RM37's kinds, the
   points, the slots); [days.md](../../game/days.md) (Tonight in place of End the day's sheet on v4, step 9's
   invitations, the fade).

## Done when

- `pnpm lint`, `pnpm test` and `pnpm build` pass; both size checks ≤ 180 KB gzip (the numbers in the pull request); the
  private-content guard passes and `git grep` finds no character name.
- `pnpm docs:update` leaves every live page unchanged.
- Domain tests:
  - **who:** Friendship 1 can't, Friendship 2 a hangout, Romance 1 a date, a spouse; away can't;
  - **kinds:** by ladder (stargazing at R3, dance and boat at R6), cooking and the footrace not offered, festival night
    only on a festival day; her favourite kind by count, walk on a tie;
  - **points:** 60, 100, 150; ×1.5 her kind; her birthday and her anniversary each ×1.5 more, once each; whole;
  - **slots:** one a day, a second on days divisible by 4 from 10 married, festival night's own slot;
  - **invitations:** none for an Uma below F2, away or whose kind isn't open; one a morning (two from 10 married), never
    twice the same; the same save draws the same; the weight favours the least seen; Yes pays +20 with her evening,
    Another day nothing;
  - **Tonight's rule:** open with a free slot and someone to spend it, skipped as F18 had it otherwise.
- Web tests (flag on): an evening from her profile to its card; the invitation's Yes making her Tonight's evening; Tonight
  with a spent evening; End the day's fade to the morning.
- Locally at 390×844 (and 375×667), the dev server with the flag on: a dev save with 9000001 at Friendship 2: say Yes to
  her invitation, play the evening from Tonight (each open kind once over a few days), see the header's ●, end the day
  through the fade; on a festival day, a festival night beside the evening. `VITE_FARM_ROMANCE=0 pnpm web` plays M4.
- Production, after the merge's deploy: health shows the commit, and production still plays M4.

## Deliver

On a branch, `feat/f50-evening`, and a pull request for the main session to merge and deploy (`feat: the evening,
invitations and Tonight, dark (F50)`; `git status` and the private-content guard first). In the same branch: delete this
packet, mark its queue row Done and add a Done row in [the handoff](../README.md) with the pull request, and log the
packet's D-decision in [decisions.md](../../decisions.md) (fetch `main` first for the number), naming decisions 1–10 and
anything settled while building. The main session merges, watches the deploy and adds the run's link.

## Rules that hold (every romance-core packet)

- **No original-game content in git:** no outfit or character names, no character or outfit id tied to a name, nothing
  that quotes or paraphrases the private story, in code, tests, docs, commits or pull request bodies. Tests and the dark
  build use the stand-in pack (9000001–9000003), other invented ids and `@luismlorenzana/uma-data/testing`; names,
  titles, birthdays and art come from master data at runtime, story text from the private pack at runtime. Run
  `git status`, `pnpm test` after staging (the private-content guard reads the git index) and `git grep` for names
  before committing.
- **RS2, RS3 and RS4 hold in every line and screen:** every Uma is an adult; romance is tender and non-explicit, with a
  fade before anything more (the night is a fade with nothing shown); the farmer is never gendered and never drawn,
  lines say "you", and `{farmer}` is the only placeholder. Original lines the code writes follow the same rules.
- **The save:** v4 (F46) grows in place while the romance core is dark; each addition lands with parse tests (this
  packet fills `today.evenings`, `today.invites` and `love.evening`). F56 ships v4; any change after it is v5, and M5
  takes v5–v8. v3 and the M4 build stay as live until F56. `account.updatedAt` moves only on a player's change; no
  server writes into a save.
- **Dark until F56:** the romance plays only with `VITE_FARM_ROMANCE=1`; production deploys the M4 build. Inside
  `@farm/domain`, what the romance changes keys off the save's version, never the flag.
- **Main JS ≤ 180 KB gzip in both builds** (164.0 KB live, as CI measures it): every new screen, table and rule loads on
  demand (`LAZY_MODULES`); anything that must load at start is measured in the pull request.
- **`uma-work` and `uma-kit` aren't forked:** anything they lack is a "Both apps" request to uma-platform, sent by the
  main session and pinned when released.
- **Nights are seeded** (`draw(uid, day, what, n)`); every number the player earns shows on screen before or as it's
  earned (RM13).
- **The manual changes in the same commit as each rule,** marked "romance build; live from F56"; live blocks through
  `pnpm docs:update`.
- **Portrait 390×844 first** (check 375×667), 44 pt targets, safe areas; player-facing text short, rules behind a help
  button; reduced motion respected.
- **Production saves:** never move `save.account.updatedAt`, never write into a save from a server, and a stale server
  date means stop and ask.

## Left to the worker

The modules' layout; the kinds' and invitations' words (original, one a kind); the evening card's and the picker's
drawing; the fade's colour and length; how festival night's mark is tinted.
