# F105 · Farm Duo story sync

The owner's final Studio assignments cover the 50 playable Umas. Each has three reciprocal partners, for 75 unique
duos. Farm story release 21 holds the approved roster, five bond scenes per chosen duo, and one casual night exchange
for each. The content pass added 17 ties and 85 bond scenes and wrote eight night lines per duo. This packet covers
the remaining handoff between Studio, the Story Sandbox, and the game.

## Source of truth and responsibilities

| Surface | Responsibility |
|---|---|
| Uma Studio · Farm Duos | Review draft assignments, identify the current playable roster, check scene coverage, and show when a draft differs from the canonical story. |
| Farm story workspace | Own the assignments in `household.json` as `duos`. Own the bond entries in `ties.json`, the five scenes in `pairs/<a>-<b>.json`, and named nightly beats in `household.json` as `duoLines`. |
| Farm Story Sandbox | Use the Farm game reader to preview bond scenes and the four beats of each casual night exchange with both speakers. |
| `pnpm story:ship` | Validate the private story files and publish hash-named files before promoting the numbered index. The game consumes the promoted story release. |
| Uma Farm | Read the release, apply the player's explicit override when present, enforce unlocks and eligibility, render scenes, and keep existing bond progress and memories. |

Keep real roster identities, drafts, dialogue, releases and screenshots in ignored private content. Use synthetic
fixtures in Git. Reuse the game’s `pairKey`, `duoKey`, `checkHousehold`, and `releasedStoryPack` behavior when
validating or rendering. Preserve sister IDs as distinct participants. Use one sorted two-member entry per mutual
assignment, with at most three entries per cast member.

## 1. Authoring and release checks

- Give Farm Duos access to the exact launch roster from the game, plus any expansion explicitly enabled by the story.
  The story cast's order can change and includes characters outside the launch roster.
- Show which set is open and where a save will land. A review copy has its own revision and stays separate from the
  canonical story until applied. Apply an owner-approved set by checking the canonical file revision, validating
  the full assignments and keeping all other household fields and existing dialogue. A conflict keeps the draft
  available and identifies the current canonical revision.
- Show each selected pair's bond levels and which night beats are authored for each member. Link the bond file and
  the night preview from the same pair. Keep `With authored scenes` as a browsing filter. List gaps before shipping
  so an incomplete pair returns a usable explanation to the author.
- Add a content acceptance check to the private release workflow. For the launch roster expect 50 distinct IDs,
  75 unique pairs, three links per participant, a tie and levels 1–5 for every configured pair, and all four night
  beats for both speakers. Keep standard partial development packs usable. The launch check is for the approved
  release and must count all errors reported by the real reader.
- Use existing hashed delivery and release numbering. On production readback compare the roster and script counts
  against the validated input and check the relevant files by hash.

## 2. Apply the release to the game

- A missing `longGame.duos` field follows the current story defaults. An explicitly set list, including an empty
  list, is a personal override. Label the current source in the in-game editor. Add **Use story duos** to clear an
  override through the normal client save action with revision checks. Show the replacement count and preserve past
  scenes, accomplishments, progression and Greater Love points. Loading a release must never write a player's save
  from the server or silently replace personal choices.
- Keep **both spouses at True Love**, housing and presence checks, the birthday-alone rule, and the shared nightly
  visit cap in `planVisit`. Use the same effective roster for the Duo tab, duo evenings, profile summaries, offers
  and eligibility errors. Display **Partner locked** with the unmet requirement on the book's Relationship page.
- Keep authored bond scenes separate from True Love visits in their normal entry points. Existing saves with enough
  bond points can open new bond levels from the profile or morning; preserve levels already read and replay them
  from the Diary. Respect the normal tie seeding when the second Uma joins. For an existing roster use earned
  bond points and normal growth. Make newly available authored scenes discoverable at their existing milestones.
- Continue checking the story index at online boot and caching verified files by hash. Reloading the app online
  should apply one coherent release before offering its corresponding pair list and lines. Offline boot should
  use the last verified complete release. A retry after an unavailable file may use the prior complete release.

## 3. Resolve the visit's scenes and replays

- Every casual duo resolves `duoLines[duoKey(visit.who)][characterId]` for the two participants and renders them in
  visit order for sitting, bedside, farewell and morning. At each beat use the per-member authored text and emote,
  then the numbered individual pajamas script, then the current default where the authored data has a gap.
- On birthdays and anniversaries use the host's specific slot and the companion's pajamas slot. Casual duo
  dialogue must not replace the host’s special-night text or expressions. Keep the existing wardrobe thresholds
  and portrait fallbacks. A pair's scripts may be used in casual visits in either order. For special visits the
  first member remains the host, including on replay.
- Store and replay the existing visit receipt with explicit participants, host ordering, look slot and occasion.
  Library and Diary views should resolve the same released content, with a graceful fallback for memories of a
  custom pair whose current release has no duo dialogue. Replays must not spend a slot or add points, discoveries,
  story gifts, outfit unlocks, or credits again.
- Keep authored scenes behind the existing on-demand loading gates. The book’s first view can show partners and
  status without downloading dialogue or the full portrait gallery.

## Acceptance checks

| Case | Expected result |
|---|---|
| Story author exports a draft | Both directions match. A repeat, a fourth partner on either side, or a participant outside the selected scope is rejected. A stale draft does not replace newer canonical changes. |
| Approved launch content | All 75 configured pairs have five playable bond levels and both members' four night beats. Preserved bond files remain valid. Overnight dialogue and solo beats still use their own slots. |
| Fresh save and older save with no override | The same story defaults are available as soon as their respective unlocks hold. Older saves preserve any stored bond points, visited scenes and receipts. |
| Save with custom pairs or explicit empty list | Shows custom source. **Use story duos** adopts 75 through client persistence once, survives reload, and does not change existing history. |
| Locked partner, expedition, birthday-alone, exhausted fifth slot | No ineligible scene plays. Both eligible partners, including sister cast IDs, appear and speak in order. |
| Replay and home-screen sizes | Casual, special-night, and morning replay tests use both pair orders and existing art fallbacks at 844×390 and 667×375. No repeat reward or visit consumption. |
| Publish, reopen and rollback | Check the promoted index and hash readback. Online boot uses the promoted edition. Offline boot and rollback remain coherent, with any custom save choices intact. |

## Validation and delivery

Run the story release dry run and compare the new private release to the previously promoted index before publishing.
Exercise the domain scenarios with synthetic fixtures and the approved content via a private readback. Run
`pnpm lint`, `pnpm test:ci`, `pnpm build` and the repository size check for any code change. Check the Story Sandbox
and both landscape sizes manually. Land the runtime and authoring UI changes in their owning repositories through
the required CI. Update the mechanics and Story Pack descriptions with the completed behavior.
