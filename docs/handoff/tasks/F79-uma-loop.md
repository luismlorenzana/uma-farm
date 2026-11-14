# F79 — The Uma loop

**uma-farm · Claude · L · Needs: F78 (F76 is in) · Unblocks: F80 · [Design](../../design/game-design.md#the-uma-loop) ·
[Roadmap](../../roadmap.md#the-rework-2026-11-14): step 6**

> From meeting to married life, in the owner's stages: acquaintance, friend, farmhand, sweetheart, proposal, wedding,
> wedding night, moving in, married life. Married life adds cooking meals and the night's companion, who greets you in
> the morning.

## Why

The owner's loop: "Meeting an Uma → building up a friendship → inviting an Uma to work in the Farm → building into the
romantic relationship → Proposal → Marriage → wedding night → Moving in together → Married life". And: "after married
life … cooking meals, and every night I would pickup one Uma to spend the night with and get greeted by in the morning".

## Decided

1. **The stages on today's ladders:**

   | Stage | Range |
   |---|---|
   | Acquaintance | Met, Friendship 0–2 |
   | Friend | Friendship 3 and up |
   | Farmhand | A friend you've invited to work (F80 sets her work) |
   | Sweetheart | After the confession, Romance 1 and up |
   | Engaged | After the proposal |
   | Married | After the wedding |

   Points, events, plays, perks, the ring and the wedding stay as built.
2. **What each stage opens:**
   - acquaintance: friend gifts;
   - friend: hangouts, and the invitation to work;
   - sweetheart: dates;
   - the evenings' kinds stay, sorted into hangouts and dates.

   F71's two new evenings join: **Dinner in town** (a date, from Romance 3) and **A night in** (a date, from Romance 6,
   and at home once married).
3. **The wedding night** is its own scene, the night of the wedding: tender, fading to morning, in the wedding night
   outfit. It's the story's `wedding-night` event, or the default's.
4. **Moving in:** after the wedding night she moves to the farm, to your home or a house built for her, as the
   homestead's houses work today.
5. **Married life:**
   - **cooking a meal** (1 action): breakfast or dinner for the household. A meal feeds the farm (farmhands well fed)
     and pleases whoever eats it;
   - **the night's companion:** at the day's end you choose one spouse to spend the night with (tender, never shown);
     in the morning she greets you, a short scene in pajamas through F75, from the story or the default;
   - her married life's events and the household's scenes stay as built.
6. **The occasion scenes the story wrote play on their occasion:** `dinner-in-town` and `a-night-in` as those evenings;
   `wedding-night` on the wedding night. The rest are in F82.

**Already in from F76:** the default story writes every piece this packet plays, read through one lookup per piece
(`packages/domain/src/story/placeholders.ts`): `talkStageOf` (the six stages, `farmhand` as a flag to set),
`eventOf(pack, id, 'moving-in' | 's2' | 's4' | 'dinner-in-town' | 'a-night-in' | eveningSceneId(kind, role), name)`,
`morningGreetingsOf` and `mealLinesOf`. The wedding night already plays after the wedding (`apps/web/src/loop/WeddingNight.tsx`).

## Do

1. The domain: the stages, what each opens, the wedding night, moving in, meals and the night's companion, with tests.
2. The web: her stage on her profile and menu; the evenings; the wedding night; the companion's choice at End the day;
   the morning greeting.
3. Update [the game mechanics](../../game-mechanics.md) and `docs/story-pack.md` (the occasion events played).

## Done when

- `pnpm lint`, `pnpm test` and `pnpm build` pass.
- An Uma can be taken from meeting to married life with the default story, through each stage. The night's companion
  greets you in the morning.

## Deliver

Branch `feat/f79-uma-loop` and a pull request; merge and deploy. In it:
- the packet deleted;
- the roadmap's step removed;
- [the handoff](../README.md) updated.

## Left to the worker

- the companion's choice's look;
- the meal's effect's size.
