# F67 — Meeting her

**uma-farm · Claude · M · Needs: F65, F66 · Unblocks: F68 · [Roadmap](../../roadmap.md#phase-1-one-game-built-around-the-umas):
Phase 1, step 1.7**

> A character's story begins when her trigger is met. From then on everything the romance has is hers. The story's
> welcome list comes to you in the first days.

## Why

The owner wants a proper way for new characters to join: you choose who to talk to, and a character's full story and
mechanics start once you've met her in a certain way. The top characters, the welcome list, should get there sooner, by
welcoming you to town.

## Decided

1. **Her trigger:**
   - the pack may give each character one trigger from a menu:
     - talk with her on *n* different days;
     - give her a gift she likes;
     - talk with her at a certain spot, in a season, or on a festival;
     - reach a Farm Rank, or have a certain place built;
     - after another character's event;
   - with none given, the trigger is **talk with her on three different days**;
   - the welcome list's characters meet theirs on the first talk.
2. **When it's met:**
   - her meeting scene plays: the pack's, or the placeholder;
   - she's **met**, and from then on she has the whole romance: her chapters (F68), ladders, heart events, perks,
     evenings, the proposal, the wedding and married life;
   - she shows on the Hearts tab.
3. **Where she lives:**
   - **a bed free:** a met character moves into the Dorm and can work on the farm;
   - **no bed free:** she stays in town as a friend, and "Invite to the farm" on her profile brings her when one frees;
   - a spouse moves into her house as before.
4. **The welcome list comes to you:**
   - from day 1, one a morning, in the list's order, the next one visits the farm as a visitor at the Gate;
   - talking to her there meets her trigger;
   - day 1's visitor is the farm's first helper, and replaces F65's stopgap.
5. **The old arrivals retire:**
   - the fixed arrival kinds (the opening, chapters, festivals, Dorm beds, after an event) go;
   - the ones that still make sense become trigger kinds in decision 1's menu;
   - the Dorm's levels bring beds only.
6. **Many met at once:** there's no cap on how many characters you've met. The Dorm's beds cap only who lives on the
   farm.
7. **The save (v4, growing in place):** per character, whether she's met, and the day; trigger progress lives in the
   town's talk fields (F66).

## Do

1. The domain: triggers, meeting, the welcome list's visits and the bed rule, replacing `arrivalsTonight`,
   `nextArrivals` and `chapterArrival`'s jobs, with tests.
2. The web: the meeting scene from the town, the Gate's welcome visitor, "Invite to the farm" on her profile, and the
   met characters on Hearts.
3. The mechanics document's arrivals section becomes "meeting her".

## Done when

- `pnpm lint`, `pnpm test` and `pnpm build` pass.
- With no pack, and with a pack of five welcomers and forty characters:
  - day 1's visitor is met on the first talk and starts working;
  - a town character is met after three days' talks;
  - a met character with no bed waits in town, and moves in when invited after a bed frees;
  - her events play, written or as placeholders.

## From the story (2026-11-13)

The pack now has:
- `welcome`: five characters, one a morning. Each one's arrival scene is written as her visit to the Gate on her
  morning (the first to the fifth), and nods at the mornings before it.
- `meet` for eleven of the other fifteen: festivals, a place built, a Farm Rank, a season, two days' talks, and two
  "after another character's meeting" (`<id>:arrival`).
- Its other four have no `meet`, so they use the default.

**Asked (small):** the story sandbox shows a welcome-list character's trigger as "Talk with her on 3 different days
(the default)". Decision 1 says she meets on the first talk, so it should say so.

## Deliver

Branch `feat/f67-meeting-her` and a pull request; merge and deploy. In it:
- the packet deleted;
- the roadmap's step removed;
- [the handoff](../README.md) updated;
- [the game mechanics](../../game-mechanics.md) updated.

## Left to the worker

- the trigger menu's spelling in the pack (F61's `docs/story-pack.md` lists it);
- the Gate visitor's words;
- the invite button's look.
