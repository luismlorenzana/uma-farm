# F95 — Farm days, and home after the wedding

**uma-farm · Claude · L · Needs: — · [The Uma loop](../../game-mechanics.md#the-uma-loop), [farmhands](../../game-mechanics.md#farmhands)**

> Nobody lives on the farm until she marries you. A friend you invite to work (the Farmhand stage, the third of six)
> comes to the farm on the days her life in town leaves free. There you can talk with her, give her a gift and spend her
> evening; she works overnight and eats her two meals on the farm. On her town days she's at her place in town. Only a
> spouse moves in, into a room in a house. The Dorm is retired.

## Why

The owner (2026-11-17), after finding an Uma living in the Dorm at Friendship 0 on their farm:

- "Umas only can work at the farm on Stage 3."
- "Umas only move onto the farm in a dedicated House in a room after Marriage."
- "While Umas are Working at the farm, they consume upkeep by having to buy/eat meals from the farm, and they can also be
  talked at the farm, on their working days, they are otherwise found on their native location in town."
- "Maybe the working schedule for an Uma is complimentary to their town schedule."
- "They could potentially work on event days, but they should never be blocked from participating on them."

Today, Invite to the farm (F78) moves anyone you've met into a free Dorm bed at once, free, at Friendship 0. A farmhand
is on the farm every day after her part-time job, and costs 10g a night wherever she lives.

## Read first

- [The game mechanics](../../game-mechanics.md):
  - [the roster](../../game-mechanics.md#the-roster) and [living in town, and swaps](../../game-mechanics.md#living-in-town-and-swaps);
  - [who's where](../../game-mechanics.md#whos-where) and [farmhands](../../game-mechanics.md#farmhands) ([her day](../../game-mechanics.md#her-day));
  - [upkeep and loans](../../game-mechanics.md#upkeep-and-loans) and [food](../../game-mechanics.md#food);
  - [the Uma loop](../../game-mechanics.md#the-uma-loop) and [the homestead](../../game-mechanics.md#the-homestead) (moving in, rooms, "Needs a room");
  - [meeting her](../../game-mechanics.md#meeting-her) and [her profile](../../game-mechanics.md#her-profile);
  - the simulations: the Uma loop's ("Two homes"), [a route to marriage](../../game-mechanics.md#a-route-to-marriage),
    [the pacing](../../game-mechanics.md#the-pacing), and [the farm at scale](../../game-mechanics.md#the-farm-at-scale-10-20-and-50-umas).
- Code (domain):
  - `save/v4.ts`: `atHome`, `onFarm`, `farmHome`, `housed`, `leaving`;
  - `farm/dorm.ts`; `romance/meeting.ts` (`inviteToFarm`, `inviteBlock`);
  - `town/town.ts`: `scheduleOf`, `whereOn`, `onFarmToday`, `townDay`, `whereYouMeet`;
  - `farm/farmhands.ts`, `farm/food.ts` (who eats), `farm/economy.ts` (`upkeepOf`);
  - `romance/homestead.ts` (a spouse waiting for a room, the night's step that gives her one);
  - `night/end-day.ts` (the night's steps), `save/parse-loop.ts` and `save/parse-v4.ts`.
- Code (web):
  - `loop/HeartProfile.tsx` (`InviteCard`), `loop/DormPage.tsx`, `loop/farm-map.ts`, `app/router.tsx`;
  - `town/MayorSheet.tsx`, `book/BookPage.tsx`, and the work board;
  - `loop/money-words.ts`, `loop/summary-words.ts`, `loop/schedule-words.ts`, `loop/roster-view.ts`, `loop/RosterAlbum.tsx`.
- **Never read the story's text.** Work from field names and ids, and write tests from `@luismlorenzana/uma-data/testing`
  and the invented stand-in pack.

## Decided

1. **Work starts at the Farmhand stage, as now.** It's the third of the owner's six stages, reached from Friend
   (Friendship 3) by the invitation to work: one action, once. Nobody else works the farm. Check that nothing lets an Uma
   who isn't a farmhand work, and remove anything that does.
2. **Living on the farm means a spouse in her room.** The wedding's room rules stand: a room at once while one is free,
   else "Needs a room", and she moves in the morning one frees. A wedding never waits.
   - A spouse waiting for a room **lives in town**, not in a Dorm bed. She keeps her town schedule, and her farm days if
     she's a farmhand.
   - Moving in plays as now when she takes the room.
3. **The Dorm is retired:** Invite to the farm, its beds and levels, swaps, its page, its tile on the farm map, its
   upkeep (5g a bed past three), its Farm Rank offers and its morning lines.
   - The save keeps `dorm` in its shape (v5 grows in place).
   - Loading clears `dorm.home` and `dorm.swaps`. Everyone in the Dorm lives in town from then, keeping her ladders, ranks,
     farmhand flag, perks, gallery and everything else.
   - `dorm.level` is kept, and nothing reads it.
   - Loading never stamps the save: `account.updatedAt` doesn't move.
   - The owner's farm has one Uma in the Dorm (Friendship 0, not a farmhand) and the Dorm at level 1, with nothing bought.
4. **A farmhand's farm days fit around her town schedule:**
   - **Her town days** are the days `whereOn` puts her out in town by her routine, her job or the default schedule (her
     favourite spot every third day).
   - **Every other day is a farm day,** including a day her schedule has her at her `home` in town, or at home off the map.
   - **A season her schedule leaves without a farm day:** her farm days that season are the default schedule's other
     days (8 of 12), so every farmhand works.
   - **A spouse in her room** is on the farm every day, as now.
5. **On a farm day she's on the farm by day:**
   - She's in front of you there (`whereYouMeet` says the farm) for a talk, a gift, Praise and her evening, and off the
     town's map.
   - The town's People list and her profile say "On the farm today". Her profile's **Where to find her** lists the
     season's farm days and town days.
   - That night she works her board's tasks, and she eats two meals: the pantry first, then takeout at 15g a meal for
     what it's short.
6. **On a town day she's at her place in town,** by her schedule. She isn't on the farm, doesn't work, doesn't eat on
   the farm and costs nothing. The work board says she's in town ("In town today · back Spring 5").
7. **Her upkeep is her meals.** The farmhands' flat 10g a night goes. A spouse living on the farm keeps her 10g as a
   resident, as well as her meals.
8. **Event days never block her.** A farm day on a festival, or on any other occasion, is still a farm day, and where she
   is never gates an occasion: every occasion she has plays from the calendar as now (`romance/occasions.ts` reads no
   place). Add a test: a farmhand on a farm day that's a festival plays her festival scene.
9. **"Home" now means a spouse in her room.** So the morning's invitations are the spouses', and a farmhand's evening is
   wherever you meet her: on the farm on a farm day, in town on a town day.
10. **Her part-time job is her town days.**
    - The farmhand's day reads "on the farm on her farm days", not "after her part-time job".
    - The morning still reports what she did.
    - Settled in, the spouse's +2, well fed and half pace are unchanged.

## Do

1. **Domain:**
   - `atHome`, `onFarm` and `farmHome` cover spouses in rooms only.
   - Retire the Dorm's rules: swaps, levels, `joinRoster`, the night's Dorm step, `inviteToFarm` and `inviteBlock`.
   - Parsing clears `dorm.home` and `dorm.swaps`.
   - Add one function for her farm days. `onFarmToday(save, pack, id, day)` uses it, and so do `townDay` and
     `whereYouMeet`.
   - The night's work and who eats read the farm day being settled.
   - Upkeep drops the Dorm's beds and the farmhands' 10g.
   - A spouse waiting for a room lives in town and takes a room the morning one frees.
2. **Web:**
   - Remove Invite to the farm. Her profile's card keeps **Where to find her** and says she moves to the farm after your
     wedding.
   - Remove the Dorm page, its map tile and its route, and the Dorm's words in the Book, the mayor's sheet, the morning
     and the money lines.
   - The work board shows each farmhand's farm days, and "In town today" on a town day.
3. **Simulations:**
   - The Uma loop's two homes become one: she lives in town, and works her farm days as a farmhand.
   - Re-run a route to marriage, the pacing and the farm at scale with farm days, and write their new numbers into the
     docs.
4. **Docs:**
   - [The game mechanics](../../game-mechanics.md): the roster, meeting her, who's where, farmhands, upkeep, food, the
     Uma loop, the homestead and her profile, with the Dorm's sections retired.
   - Its live tables and every page, regenerated with `pnpm docs:update`.
   - The roadmap's rows: Farmhands, Upkeep and loans, the Uma loop, the town.
   - [The handoff](../README.md).

## Done when

- `pnpm lint`, `pnpm test` and `pnpm build` pass, and the simulations pass with their new numbers in the docs.
- **The save:** a test loads a v5 save that has an Uma in the Dorm and a swap. She lives in town, `account.updatedAt` is
  unchanged, and nothing else in the save changed.
- **The rules,** each with a test:
  - a farmhand on a farm day is on the farm (in front of you, off the town's map), works and eats;
  - on a town day she's in town, and doesn't work or eat on the farm;
  - a spouse in her room is on the farm every day;
  - a spouse waiting for a room lives in town, and moves in the morning one frees;
  - a festival's occasion plays on her farm day;
  - upkeep counts no Dorm beds and no farmhand 10g.
- **A local run:** on the dev farm, a farmhand's profile shows her farm days, and the town shows her on a town day.
- **The owner's phone look:**
  - the Uma who lived in the Dorm shows **Lives in town** on her profile, with Where to find her;
  - the Dorm is gone from the farm map.

## Deliver

Branch `f95-farm-days` and a pull request. Claude merges it after review. Every rule change goes into
[the game mechanics](../../game-mechanics.md) in the same change. Delete this packet and take its step off the roadmap.
