# F49 — Heart events: the event player, the five plays, choices, rewards, the cards, Memories, the confession

**uma-farm · Claude · L · Needs: F48 · Unblocks: F50 and F51 (side by side), then F53 · Milestone: the romance core**

## Why

A level is its event (RM11): nothing on her route moves until her heart events play. This packet builds them as the
owner asked, game-like and not "tap next": a place card and her bust, short lines, one small play the farmer and she do
together graded and never failed, choices whose gain shows on the button, a level-up card listing all it gave, Memories
to replay any of it, and her confession, with its "Not yet" that never costs anything.

## Context (read first)

- [romance-spec.md](../../design/romance-spec.md): **RM24** (F47 wrote its rule; this packet words it at playback),
  **RM25–RM29** whole, **RM30**'s confession, **RM54–RM56** whole, with their mockups; RM13's event row, RM21 (one of
  hers a day), RM28's Memory, RM61 and RM62 (art slots and fallbacks), RM65's FC26 row, RM67's F49 row.
- [hd2d-farm.md](../../design/hd2d-farm.md): FR21's minigame contract (a seed shown first, one thumb, timing from
  `pointerdown`, no inputs taken), FR22 (rules pure and tested before a scene draws them).
- [decisions.md](../../decisions.md): D38 (6, j: the scene player), D42 (7: `together`, `play`, tones, unlocks), D43
  (setups), D45, D46, D47, and the D-decisions F46, F47 and F48 logged.
- [F40-story-authoring.md](F40-story-authoring.md): the scene format (`Step`, `ChoiceOption`, `Play`, `Unlock`).
- The manual: [hearts.md](../../game/hearts.md), [goals.md](../../game/goals.md) (the scene player).
- Code: `story/authored.ts` (the format and validator), F46's `story/pack.ts` and the grown scene player
  (`loop/ScenePlayer.tsx`), F47's `romance/love.ts` (`readiness`, `advance`, `addLove`) and `lineGood`, F48's profile,
  Hearts rows and `romance/perks.ts`, `farm/places.ts` (`FARM_PLACES`' frames), `farm/calendar.ts` (seasons),
  `save/warehouse.ts` (`takeGoods`, `addGoods`); uma-kit's `UmaBust`, `Sheet`, `Button`; uma-art's `buildings` and
  (2.22.0 on) `emote` families.

## Decisions made

### From the spec

- **RM24 at playback (RM54):** Ready events start from her row's **● Ready**, her profile's Next card or the morning's
  line; a setup not met says what to do ("Assign her to the Pond, then come back"). Ready events wait forever and never
  fire on their own.
- **RM25, the five plays,** each a flat sheet over the map:

  | Play | You | Graded by | In an event | As an evening |
  |---|---|---|---|---|
  | **Cast** | Tap as a closing ring meets the mark; the line lands every time | Timing | 1 cast, 10–15 s | 3 casts, 40 s |
  | **Pick** | Tap the ripe ones (the stars, her favourites) among the rest as they show | Right picks | 1 round, 15 s | 3 rounds, 45 s |
  | **Rhythm** | Tap on her beat (a hoe, a brush, a step, an oar) | Timing | 8 beats, 12 s | 3 × 8 beats, 45 s |
  | **Walk** | Walk a route on today's farm map with her, two forks to choose | Her favourite turns found | 2 forks, 20 s | 4 forks, 50 s |
  | **Choose** | Pick one good from three for her (the gift picker, narrowed) | Her taste | 1 pick, 10 s | — |

  Each scores 0–100: **Fine below 60, Great 60–89, Perfect 90+.** An event adds **+0, +15 or +30**; an evening pays 60,
  100 or 150 (F50). **Never failed:** a missed tap still lands, as a Fine. FR21's contract where it fits; the HD-2D stage
  is M7's.
- **RM26, what plays as what:** `work: farming` Pick or Rhythm by the author; `work: foraging` Pick; `work: fishing`
  Cast; `work: mining` Rhythm (swing); `work: ranch` Rhythm (brush); `work: cooking` Rhythm with a pot (later the
  Kitchen's practice mode, F8); `work: serving` Rhythm with a tray (F35); `work: forging` Rhythm with an anvil (F36);
  `date: fishing` Cast; `date: walk` Walk; `date: boat` Rhythm (row); `date: picnic`, `market`, `stargazing` Pick;
  `date: dance`, `crafting` Rhythm; `date: cooking` and `date: footrace` (later their games); `gift` Choose; `help` and
  `talk` no play, the grade the best choice's. **The fallback** for an activity whose game isn't built: Rhythm with that
  activity's mark, the same grades. When the real game ships, the event plays it; Memories' replays use the best that
  exists.
- **RM27, choices:** 1–2 choice points of 2–3 options (≤ 40 characters). **Every option shows its gain on the button
  before the tap:** +30 for the best, +10 for the others, or the taste it reveals, or the item it costs ("· 1 Herb";
  greyed "Need 1 Herb" when you don't have it). **Romantic options carry a heart tag.** No option scores below zero,
  removes a later event or changes the route; a choice may set a flag that changes later wording only.
- **RM28, rewards and Memories:** every event pays **+50** on completion, its choices and its grade into the next bar;
  gives the rung's **perk**; saves one **Memory** (the place card, her bust and the event's caption, its `beat` line); an
  optional `unlock` (an item, a place or a perk line) is given too. The level-up card lists it all, then the next rung's
  cost, place and setup. Any event replays from any choice, with **no points**.
- **RM29, the event player:** a full-screen sheet on today's map: **the place card** fills the top ~45% (the place's Hub
  art from uma-art, tinted by season, with her **bust** from master data, uma-kit's `UmaBust`, and a small **emote mark**
  until expression art exists); **her bubble** below, at most 3 lines (about 36 characters a line at 16pt), one tap
  finishes the line, the next advances, a hold skips; **choices** full-width 48pt in the thumb zone, each with its gain;
  **the play** opens as a sheet in the middle and closes on its grade; **auto, skip and log** top right, away from the
  taps; while a scene plays, input is only advance, choose, play, auto, skip and log. A heart event is **60–120 s**: a
  place card, 3–5 beats, one play, 1–2 choices, the level-up card.
- **RM30, the confession:** **3–5 minutes**, with 2–3 plays or choices with visible effects and a **stage-up screen**.
  Ready the day after Friendship 10. Its last choice is **Yes** (romance opens) or **Not yet** (she stays a close
  friend, `love.friend`: her points keep banking, and **Ask her** on her profile plays the confession's last beat again
  any day). The author may write her saying "not yet" in an earlier scene's words, at no cost. Deterministic: she
  always confesses.
- **RM55, the cards:** **the level-up card** closes every event: the heart fills with a short sparkle and she says one
  line; then the sum (+50, the choice, the grade), the **perk**, the **Memory**, and the next rung's cost, place and
  setup, with one **Continue**. **The stage-up screen** closes the confession (here), the proposal and the wedding (F53):
  the track re-colours (coral → rose → gold) and lists everything the stage opens.
- **RM56, Memories:** an album per Uma, opened from her profile, and a Memories shelf in the Diary: one tile a rung,
  played ones with their caption, the next marked, the rest locked. A tap **replays from any choice**: the scene plays,
  every option is open, nothing pays.

### Decided here (the spec left these open)

1. **Playing an event is one rule, `playEvent(save, pack, id, outcome)`,** pure: given the options taken and the play's
   grade, it pays +50, the choices and the grade through F47's `addLove` (so an anniversary's ×2 applies), takes any
   option's goods, learns any revealed taste, sets flags, gives the unlock, calls `advance`, adds her to `today.events`
   and the rung to `memories[id]`. **The app commits it once, at the end, stamped**; an event left halfway pays nothing
   and stays Ready.
2. **The event's script loads on demand** (`routes/<id>` through F46's seam); the player waits for it and for master
   data, and Skip, auto and log work while it loads.
3. **The place card:** a farm place shows its map frame (`FARM_PLACES`' uma-art building) on a ground tinted by the
   season; each of the nine romance backdrops (`pond-night`, `overlook`, `orchard-bench`, `dorm-porch`, `harbour-wall`,
   `chapel-bell`, `town`, `hilltop-track`, `sea-pier`) borrows a building frame, listed in the manual, with its own
   tint. A `{ place }` step changes the card mid-scene; the header reads "The Pond · Romance 5".
4. **The emote mark is uma-art's `emote` bubble** (2.22.0), placed beside her bust: happy and laughing `music`, shy
   `sweat`, sad `ellipsis`, angry `anger`, surprised `exclaim`, thinking `question`, tender `heart`. **This packet pins
   the newest uma-art**; if that release also holds F25's part A or F55's pieces, it swaps their stand-ins too (F24's
   rule: the first packet built after a release pins it).
5. **The plays' rules are pure and tested first** (`romance/plays/`, FR22): each takes a seed (`draw(uid, day,
   'play:<id>:<rung>', n)`) and the taps' `pointerdown` times and returns a score 0–100; **both lengths are built here**
   (an event's and an evening's, RM25's table), so F50 only wires evenings. A play shows what to aim for first (the
   seed), takes one thumb, and takes nothing from the Warehouse. No tap at all is a Fine.
   - **Cast:** a ring closes on the mark; the tap's distance from the meeting scores it; three casts score their mean.
   - **Pick:** goods pop up on a 3×3 field for about a second each; her favourites (her loved and liked goods, starred)
     score, others don't; a wrong tap costs a little, never below 0.
   - **Rhythm:** her beat is shown first, then eight beats on the activity's mark; the mean timing error scores it.
   - **Walk:** a flat path drawn from today's farm places' frames (not the Hub itself); at each fork two turns toward two
     places; the turn toward her line's place (else a seeded one from the places her beats use) scores full, the other
     half: two forks give 50, 75 or 100 (Fine, Great, Perfect), four give 50–100 in eighths. Before the walk she says
     what she loves.
   - **Choose:** three goods, seeded, one of them loved or liked; loved scores 100, liked 75, anything else 40; the
     taste is learnt (`love.known`).
   - The worker sets each timing window so a careful tap is Perfect and a casual one usually Great, and records the
     windows in the manual.
6. **Which play an event plays:** its route's `play` step, by RM26 (`play.as` picks Pick or Rhythm for farming, default
   Pick); with no play step, its beat's `together`. **With no play** (`help`, `talk`), the grade is the best choice's:
   the best option taken is a Perfect, any other a Great. A footrace or cooking play before its game exists is Rhythm
   with the track's or the pot's mark.
7. **Choices:** the gains are F46's rule (the highest authored gain +30, the others +10, a tie at the top +30 each); an
   option with `romance` above 0 carries the heart tag; `gives` takes its goods (any stars, lowest first) and is greyed
   "Need 1 Herb" without them; `reveals` shows "· learns a like" and learns it; `then` plays after. A `when` step plays
   its steps only while its flag is set (`else` otherwise), so flags change wording only.
8. **Skip** jumps to the next choice or play, never past one; **auto** advances after a reading pause; **log** lists the
   lines so far. **A hold** on the bubble skips the same way.
9. **The level-up card:** she says her last line of the event; the sum reads "+50 event · +30 choice · +15 Great = +95
   toward Romance 6 (+40 banked)"; the perk is F48's words for the rung (F51 makes it act); the Memory is "‹caption›
   saved"; the next rung's cost, and its place and setup from the next beat's `hint`; what it opens (a date kind, a
   chat set, a perk). One **Continue**. Reduced motion keeps the sparkle still.
10. **The confession:** its last choice point carries `answer: 'yes'` and `answer: 'not-yet'`, one each (the
    validator's rule). Either way it pays like any event and counts as her event that day. **Yes** moves her to romance
    (`advance`) and shows the stage-up screen; **Not yet** sets `love.friend` and leaves her waiting. **Ask her** (her
    profile, while `friend`) plays that last choice point again, once a day, pays nothing and isn't her event; Yes there
    clears `friend` and shows the stage-up. Her points bank into romance meanwhile (F47).
11. **The stage-up screen** is one component: the track re-coloured, "Opens now" listing what the stage opens (from the
    perks' words and F50's kinds), **Continue**. F53 adds the proposal's and the wedding's.
12. **Memories:** her album (26 tiles in four filters, Friend, Romance, Wed, Spouse; her arrival scene replays from the
    album's header) and the Diary's shelf (each Uma's count, opening her album). A replay starts at the top or at any
    choice point picked from its list; every option is open, nothing is taken or paid, nothing is saved.
13. **The stand-in route exercises everything:** 9000001's 26 events cycle through Cast, Pick, Rhythm (farming and a
    fallback), Walk, Choose, `help` and `talk`, with a `gives`, a `reveals`, a flag and a `when`, and a confession with
    two plays and Yes/Not yet. Invented, original lines.
14. **Format additions** (beyond RM58's seven: RM26 and RM27 need them), with validator rules, tests and a line in F40's
    D47 note:
    - `play.as?: 'pick' | 'rhythm'` (farming only);
    - **at most one `play`** in a heart event, up to three in the confession, the proposal and the wedding; **1–2 choice
      points** in a heart event, up to three in those three;
    - `ChoiceOption.gives?: { good: string; count: 1–5 }` and `ChoiceOption.reveals?: string` (one of her gifts);
    - a step `{ when: string; then: Step[]; else?: Step[] }`;
    - the confession's last choice point's `answer`.
    The authored `friendship` and `romance` numbers keep ranking the options (decision 7); a play's own numbers are
    ignored, since the grade pays.

## Do

1. **The plays** (decision 5) as pure rules with tests, both lengths.
2. **`playEvent`** (decisions 1, 6, 7, 10) with tests at every stage.
3. **The format's additions** (decision 14) and the stand-in route (decision 13).
4. **The player** (decisions 2–4, 8): the place card, the bust and emote, the bubble, choices, the play sheet, auto,
   skip, log; the uma-art pin.
5. **The cards** (decisions 9, 11) and **the confession** with Ask her (decision 10).
6. **Memories** (decision 12): her album, the Diary's shelf, replays.
7. **Starting events:** her row's ● Ready, the Next card's **Play ›**, the morning's Ready line; a setup's words.
8. **`LAZY_MODULES`** gains the player, the plays, the cards and Memories.
9. **The manual:** [hearts.md](../../game/hearts.md)'s "Heart events", "The plays" (live blocks: RM25's table, RM26's
   map, the grades, the windows), "Choices and rewards", "The confession" and "Memories"; [goals.md](../../game/goals.md)
   (the scene player grown).

## Done when

- `pnpm lint`, `pnpm test` and `pnpm build` pass; both size checks ≤ 180 KB gzip (the numbers in the pull request); the
  private-content guard passes and `git grep` finds no character name.
- `pnpm docs:update` leaves every live page unchanged.
- Domain tests:
  - **the plays:** each one's score at its edges (59 Fine, 60 Great, 89 Great, 90 Perfect), a perfect run 100, no taps a
    Fine, the same seed and taps the same score, both lengths; Choose learns the taste; Walk's 50/75/100;
  - **RM26's map:** every `together` and `play.game` to its play, the fallbacks, `play.as`;
  - **choices:** +30 and +10 with ties, the heart tag, `gives` taken and refused without the goods, `reveals` learnt,
    `when` by flag;
  - **`playEvent`:** +50 + choices + grade into the next bar after the cost, `advance` at F1, F10 (to the confession),
    R1 and S1, `today.events`, `memories`, flags, an item unlock in the Warehouse, an anniversary's ×2; nothing saved
    for an event left halfway;
  - **the confession:** Yes to romance with the stage-up; Not yet to `friend` with points banking; Ask her once a day,
    paying nothing; an event arrival (F46's `event` kind) after the event it names;
  - **the validator:** each addition's rule, the stand-in route valid.
- Web tests (flag on): an event plays through its lines, a choice with its gain, a play to its grade and the level-up
  card; Skip stops at the choice; a replay pays nothing; Ask her.
- Locally at 390×844 (and 375×667), the dev server with the flag on: 9000001's Friendship 1 from her Ready row (her
  bust a lettered disc, an emote bubble beside it), each of the five plays across her events (a dev save stepping her
  points), a greyed "Need 1 Herb", the level-up card, the confession's Not yet then Ask her and Yes with the stage-up,
  her album replaying a Memory. `VITE_FARM_ROMANCE=0 pnpm web` plays M4.
- Production, after the merge's deploy: health shows the commit, and production still plays M4.

## Deliver

On a branch, `feat/f49-heart-events`, and a pull request for the main session to merge and deploy (`feat: heart
events, the plays and Memories, dark (F49)`; `git status` and the private-content guard first). In the same branch:
delete this packet, mark its queue row Done and add a Done row in [the handoff](../README.md) with the pull request, and
log the packet's D-decision in [decisions.md](../../decisions.md) (fetch `main` first for the number), naming decisions
1–14 and anything settled while building. The main session merges, watches the deploy and adds the run's link.

## Rules that hold (every romance-core packet)

- **No original-game content in git:** no outfit or character names, no character or outfit id tied to a name, nothing
  that quotes or paraphrases the private story, in code, tests, docs, commits or pull request bodies. Tests and the dark
  build use the stand-in pack (9000001–9000003), other invented ids and `@luismlorenzana/uma-data/testing`; names,
  titles, birthdays and art come from master data at runtime, story text from the private pack at runtime. Screenshots
  with master data's busts stay local. Run `git status`, `pnpm test` after staging (the private-content guard reads the
  git index) and `git grep` for names before committing.
- **RS2, RS3 and RS4 hold in every line and screen:** every Uma is an adult; romance is tender and non-explicit, with a
  fade before anything more; the farmer is never gendered and never drawn, lines say "you", and `{farmer}` is the only
  placeholder. Original lines the code writes (the stand-in route, button words) follow the same rules.
- **The save:** v4 (F46) grows in place while the romance core is dark; each addition lands with parse tests. F56 ships
  v4; any change after it is v5, and M5 takes v5–v8. v3 and the M4 build stay as live until F56. `account.updatedAt`
  moves only on a player's change; no server writes into a save.
- **Dark until F56:** the romance plays only with `VITE_FARM_ROMANCE=1`; production deploys the M4 build. Inside
  `@farm/domain`, what the romance changes keys off the save's version, never the flag.
- **Main JS ≤ 180 KB gzip in both builds** (164.0 KB live, as CI measures it): the player, the plays and Memories load on
  demand (`LAZY_MODULES`), and the `emote` atlas only with the player.
- **`uma-work` and `uma-kit` aren't forked:** anything they lack is a "Both apps" request to uma-platform, sent by the
  main session and pinned when released.
- **Each play is an original game in its genre,** never a recreation of a specific title; its rules are pure and tested
  in `@farm/domain` before any screen draws them (FR22).
- **Nights are seeded** (`draw(uid, day, what, n)`), and so are the plays; every number the player earns shows on
  screen before or as it's earned (RM13).
- **The manual changes in the same commit as each rule,** marked "romance build; live from F56"; live blocks through
  `pnpm docs:update`.
- **Portrait 390×844 first** (check 375×667), 44 pt targets and 48 pt choices, safe areas; player-facing text short,
  rules behind a help button; reduced motion respected.
- **Production saves:** never move `save.account.updatedAt`, never write into a save from a server, and a stale server
  date means stop and ask.

## Left to the worker

The modules' layout; each play's drawing and timing windows (within decision 5's bands); the backdrops' borrowed frames
and tints; the bubble's typography within RM29; the level-up card's motion; the stand-in route's lines.
