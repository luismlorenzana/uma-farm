# F76 — The default Uma

**uma-farm · Claude · L · Needs: F75 · Unblocks: F79 · [Design](../../design/game-design.md#the-default-uma) ·
[Roadmap](../../roadmap.md#the-rework-2026-11-14): step 3**

> Every Uma plays her whole story from day one. Where her art or her story isn't written yet, the game gives her a blank
> bust and profile and a complete default story. Each piece is replaced the moment hers lands.

## Why

The owner: "As Story packs and Character Art are going to take quite a while to land, I want you to author 'blank'
profile and bust assets for any Uma that does not have them authored", and "a default Uma full story content … so it
can be fully wired into the game. Once Art Packets and Story packets land the default packets get fully replaced."

## Decided

1. **The blank bust,** drawn in code by Claude:
   - a soft silhouette of an Uma (her ears, hair and shoulders) tinted by each outfit's colours;
   - a simple face for each of the 22 expressions, placed as F75 places a face;
   - drawn in the farm's web code (SVG), so it's small, crisp and needs no release.
2. **The blank profile:** her master-data name and face where they exist; else the silhouette, and her letters.
3. **The default story,** written once for the game, warm and short:
   - **talks:** a set for each stage (acquaintance, friend, farmhand, sweetheart, engaged, married), in five versions by
     her temperament;
   - **gifts:** a reaction for loved, liked, neutral and disliked;
   - **hangouts and dates:** a scene for each kind;
   - **her events:**
     - meeting her;
     - friendship 1–10;
     - the confession;
     - romance 1–10;
     - the proposal;
     - the wedding;
     - **the wedding night** (tender, fading to morning);
     - moving in;
     - married life 1–5;
   - **occasions:** her birthday, the four festivals and New Year's;
   - **married life:** a set of morning greetings for the night's companion (F79), and lines for meals.

   Every line fills in her name, her favourite good and her line's work. Each event uses F75's emotes and the occasion's
   outfit.
4. **The protagonist is a man** (the owner, 2026-11-14). Default lines may say he, her husband, the groom. The pack's
   check that refused a gendered word for the farmer goes, here and in the Farm Story Sandbox.
5. **Replacement is per piece:** her own bust replaces the blank bust; her own lines, events or scenes replace the
   matching defaults; anything the pack lacks stays default. This builds on F63's placeholder module, which becomes the
   default story's home.
6. **No names in git:** the defaults name no one; `{name}` fills at run time.

## Do

1. The blank bust and profile (decisions 1–2).
2. The default story's content (decision 3), as data in `packages/domain/src/story/`, with a test that every stage,
   event and occasion has a default and reads cleanly through the story's own reader.
3. Lift the gendered-word check (decision 4).
4. Update [the game mechanics](../../game-mechanics.md) ("What plays without the story") and `docs/story-pack.md`.

## Done when

- `pnpm lint`, `pnpm test` and `pnpm build` pass, and the main JS stays ≤ 180 KB gzip.
- An Uma with no art and no story plays every stage from meeting to married life with the blank bust and the default
  story, and nothing is blank.
- The pilot's Umas show their own art and story where they exist.

## Deliver

Branch `feat/f76-default-uma` and a pull request; merge and deploy. In it:
- the packet deleted;
- the roadmap's step removed;
- [the handoff](../README.md) updated.

## Left to the worker

- the silhouette's style;
- the default lines and scenes themselves, within the owner's standing direction: adults, tender, never explicit.
