# F119 · Playable HD-2D fields and travel camera

## Player flow

```text
Painted Farm map  →  HD-2D Farm section  →  Playable HD-2D Plot 1–8
                                            ├─ Tile · clear, till, plant, water, harvest
                                            └─ Row · crop plan, crew, and water
Painted Town map  →  District  →  Modeled room  →  Existing conversation player
```

The default cleared-plot route is the playable 3D scene. It renders all 40 cells from the selected
plot's saved soil, water, crop, growth stage and grade. Keep the numbered row tabs, plot paging,
unlocked-plot navigation and action sheets in the field route. Unsupported or lost WebGL falls back
to the existing Grid. The Grid option is also available in the toolbar. Plot clearing, deep links,
crew work, action costs and save compatibility use the existing domain and command handlers.

## Camera reference and Farm calibration

Acquire describes a fixed camera while traveling and tries to keep the destinations a player wants
on one screen. Events and battles use a separate camera treatment. The developers also describe
characters as 2D art set in predominantly 3D environments and use lighting to separate them.
[Square Enix and Acquire interview](https://www.unrealengine.com/developer-interviews/octopath-traveler-ii-builds-a-bigger-bolder-world-in-its-stunning-hd-2d-style?lang=en)

In the publisher's town screenshot (Steam screenshot 2, counting from 0), measured at 600 × 337,
the lead traveler is about 38 px tall (11% of image height) and their feet sit near y=214 (64%
of image height). The storefront baseline stays almost level across the middle of the frame,
and paving and façades recede with depth. In the camp shot (screenshot 3), the foreground
traveler is about 44 px tall (13%) and their feet are near y=236 (70%). Those are approximate
screen measurements of the published frames. [Official screenshots](https://store.steampowered.com/app/1971650/OCTOPATH_TRAVELER_II/)

The official Field Commands clip shows two town sprites about 35–38 px tall with their feet
near y=205 in a 600 × 338 sample at 1–2 seconds. At 4 seconds, the battle cut has a lower view
and feet near y=275. This is why the Farm travel view keeps the exploration framing through
movement and uses the existing separate dialogue engine for conversation.
[Square Enix Field Commands clip](https://www.jp.square-enix.com/octopathtraveler2/assets/mp4/system01.mp4)

The official Guild clip provides the indoor comparison. In the 600 × 338 samples around
1.5 and 2.5 seconds, the room's front-right floor edge moves from x≈540 to x≈423 as the
party walks, about 20% of the screen width. Its front floor edge stays within a few pixels
of y=262 and level throughout the pan. In the second sample the room spans about 322 px
(54% of frame width), and the foreground sprites stand about 36–44 px tall (11–13%).
The preceding entry shot places the floor edge near y=213. The room follows travel on both
screen axes with a stable bearing. Our room view uses that same movement principle, with
stronger relative zoom because the iPhone also reserves space for room actions.
[Square Enix Guild clip](https://www.jp.square-enix.com/octopathtraveler2/assets/mp4/system08.mp4)

| Camera property | Uma Farm target |
| --- | --- |
| Bearing | Zero yaw, straight horizontal lanes, locked orientation while moving |
| Elevation | A shared 41° starting point for Farm exploration and rooms |
| Perspective | 30° vertical FOV in the field, 29° indoors |
| Plot framing | Fit the 8 × 5 working surface, raised crops and the left row tabs to the available viewport |
| Room framing | Close view at 1.36× the fitting scale, with Whole room and Entrance controls |
| Follow | Ease camera translation toward the walking point, with motion reduction and no yaw change |
| Interactions | Keep scene dialogue on its own screen with the existing portraits and background art |

The camera settings are our tuning values. The measured on-screen ratios guide composition,
while the phone layout gives the room actor a larger share of its smaller scene area. Use the
published travel footage to check lead/lag, room edges and space ahead of the player.
[Square Enix travel and field footage](https://www.jp.square-enix.com/octopathtraveler2/system/)

## Implementation sequence

1. **Playable fields.** Reuse the farm renderer and get the camera working in the actual field
   route. Project the cell boundaries for the interaction layer. Use the existing tile and row
   controls, including crop grade, farmhands, clear conditions and actions left. Test all eight
   plot routes, plus a new farm and an unopened plot.
2. **Travel camera and rooms.** Keep orientation consistent across Farm, Town rooms and field
   views. Use the existing floor raycast and collision-aware walk path. Verify close framing,
   moving the walking point, recentering, and selecting an Uma across smaller and larger rooms.
3. **Field art and crew.** Build on the crop icons pinned to the 3D plants and use the farm's own assets for per-species growth
   stages and test dense mature orchards for occlusion. Add working Umas from the existing
   day-and-plot job receipts and walking sprite release. Prefer a small number of actors at
   real job locations that leave crop targets clear. Use the area's existing presence roster
   and dialogue route for interaction.
4. **Barn and Coop animals.** Prepare original species sheets for chicken, duck, cow, goat,
   sheep, alpaca and cashmere goat. Author front, back and side idle/walk frames, a consistent
   foot anchor and one in-world scale per species. Keep a visual separation between poultry,
   small livestock and large livestock. Place animals from the saved roster inside their
   assigned building and exterior pen. Keep feeding, care and collection in the ranch rules.
   Check all eight animals per building and retain feed and produce-ready indicators.
5. **People filters.** Add four compact categories at the top of Hearts in People. Married
   is the spouse stage. Romance includes partners and engagements. Hands tracks roster
   membership on the farm crew. Met includes non-farmhand acquaintances and friends before
   romance. Keep Ready, Friends and In town available under More filters and preserve their
   query links.

## Exit checks

- At 844 × 390 and 667 × 375, enter plots from the Farm section, try the first and last plot,
  select near and far tiles and each row tab, then use the action panel to change the save.
- Play clear → till → plant → water → harvest, including an orchard, exact grades and an
  existing save with a farm crew. Compare the saved result against the same actions in Grid.
- Verify plot paging, locked plots, legacy tile links, Grid, a WebGL failure and context loss.
- Walk and open a character in a small home, a shop, a large production room and each ranch room.
  Test camera orientation and framing in both zooms. Check that an unavailable character sprite
  uses the existing portrait presentation.
- Check People with a fresh file and a mixed 50-Uma save. Toggle each filter twice and check
  legacy Ready links and existing relationship order.
- Keep original assets and verification captures private. Run Farm type checking, tests and
  production build. Review both phone layouts locally and verify the deployed release.
