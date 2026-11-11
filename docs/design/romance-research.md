# Romance research: turn every heart into a visible level-up

> **Research for F40 and F41 (D42), 2026-11-10.** How farm and life sims with romance, and the game-like bond systems of RPGs, dating sims and gacha games, show, gate and reward relationships; what uma-farm should keep, and which genre limits to remove. Its recommendations (a)–(d) are proposals for the romance spec (F41): its numbers replace CS45's and should be checked with a pacing simulator first.

uma-farm should run each Uma's route as two visible ten-level ladders. Every heart is a short, playable event the player starts from a menu, every choice shows its gain on the button before the tap, and every level hands over a named perk that changes the farm. That combination is what makes Persona's confidants, Fire Emblem's supports, Uma Musume's bond gauge and the My Time games' tiers feel like progression. The farm-sim mainstream (Harvest Moon, Stardew Valley, Coral Island before its 2024 overhaul) still hides its numbers and spends its friction on making players hunt for scenes. Almost every limitation players complain about exists for one of two reasons: to create scarcity in a real-time world, or to enforce monogamy. That covers hidden points, decay, triggers that need the right place, hour and weather, permanently missable scenes, dice-roll confessions, silent proposal rejections, gold-sink gates, jealousy punishments and the one-spouse cap. Neither reason applies to a turn-based game with parallel routes. The evidence for removing them points one way: players petition for visible meters, download value-revealing and multi-spouse mods in large numbers, and developers keep patching toward transparency. None of the major farm sims studied lets the player marry more than one partner (players name only small indies such as Pumpkin Days as exceptions), so a marry-everyone finale is close to new ground. Its known failure modes come from otome "true routes" (unclear unlock rules, a finale weaker than the routes) and from static married life, which Stardew's creator agreed is one of that game's weakest parts. The recommended design keeps one deliberate scarcity, one evening activity (a hangout or a date) per day, and puts the content budget other games spend on rivals and jealousy into post-marriage life. The main risk is volume: about 520 events and 400 perks across 20 routes. That is only feasible if perks are templates keyed to each Uma's work line, and if a three-route pilot proves the event format first.

## Numbers on screen and a perk per level make bonds feel like play

The Harvest Moon lineage built its romance on a number the player never sees. The Friends of Mineral Town remake stores up to **65,535 love points** and shows them only as seven heart colours in 10,000-point bands. A daily chat is worth +200 and a most-loved gift +800 ([fogu: SoS FoMT](https://fogu.com/sos3/marriage/index.html)). Stardew Valley draws hearts but hides the **250 points** behind each one ([StardewHub](https://stardewhub.com/en/guides/stardew-valley-dating-mechanics-guide)). Animal Crossing: New Horizons hides its 0–255 friendship scale so completely that players petitioned Nintendo for an optional meter ([Nookipedia](https://nookipedia.com/wiki/Friendship); [Change.org](https://www.change.org/p/nintendo-add-a-visible-friendship-level-meter-to-animal-crossing-new-horizons)). The cost of hiding shows up in what players install instead. Stardew's Lookup Anything, which displays live values, has about **845,000 CurseForge downloads** ([CurseForge](https://www.curseforge.com/stardewvalley/mods/lookup-anything)), and a gift-taste helper has been carried through three successive mods since 2016 ([Nexus Mods: Gift Taste Helper](https://www.nexusmods.com/stardewvalley/mods/229)).

RPGs went the other way and published the arithmetic. Baldur's Gate 3 shows approval as a number during dialogue and as a notification outside it. It moves in steps of ±1, ±5 and ±10, across named tiers up to Exceptional at 81–100 ([bg3.wiki](https://bg3.wiki/wiki/Approval)). Fire Emblem: Three Houses gives every activity a fixed integer:

| Activity | Support points |
|---|---|
| Tea, by how well it went | +5 to +30 |
| A shared meal | Up to +30 |
| A liked gift | +20 |
| Fighting side by side | +2 to +6 |
| Watching a support conversation | +20 to +80 |

Those points count toward cumulative ranks from C at 101 to S at 1,001. Each rank buys a Linked Attack bonus, from +1 Atk/+5 Hit/+5 Avoid at C up to +5/+15/+15 at S ([Fire Emblem Wiki](https://fireemblemwiki.org/wiki/Support)).

The My Time games bring the same logic into a life sim. Portia names numeric tiers twice over, from Friend (or Boyfriend/Girlfriend) at 400 to BFF (or Soulmate) at 1,000 ([Portia Wiki archive](https://mytimeatportia-archive.fandom.com/wiki/Relationships)). Sandrock gives each character a perk at set tiers. One companion adds +5 attack and +100 HP, a shopkeeper cuts prices and upgrade materials, and another adds +2 relationship points to every commission ([Gamepressure](https://www.gamepressure.com/my-time-at-sandrock/relationships-and-interactions/z1feb4); [TheGamer](https://www.thegamer.com/my-time-at-sandrock-friend-friendships-levels-perks/)). Rune Factory ties bonds to its own loop. In RF4, friends join the party at level 3 and stay with you all day from level 7 ([Rune Factory Wiki](https://therunefactory.fandom.com/wiki/Relationships_%28RF4%29)). Guardians of Azuma's producer says that the more you fight beside companions, the higher their bond and the more skills they learn ([Gematsu](https://www.gematsu.com/2025/03/rune-factory-guardians-of-azuma-interview-with-producer-hisashi-fujii-setting-village-building-romance-and-more)).

Persona shows how "visible" should feel moment to moment, without printing every threshold. Confidant answers pay 1–3 points, shown as music notes. Sparkles over the confidant's head tell you whether the next hangout will be a rank-up ([Push Square](https://www.pushsquare.com/guides/persona-5-royal-confidants-guide-where-to-find-all-confidants-and-how-to-rank-up-fast)). Every rank unlocks something you will use. A party member goes from Baton Pass at rank 1 to a Persona evolution at rank 10 ([RPG Site: Ann](https://www.rpgsite.net/feature/9381-persona-5-ann-lovers-confidant-choices-romance-guide)). Others give discounts, bonus EXP, or chores done for you, which frees a time slot ([RPG Site: P5R confidants](https://rpgsite.net/feature/5479-persona-5-confidant-guide-conversation-choices-answers-romance-options-gifts-skill-unlocks)). Persona 3 Reload multiplies points ×1.51 when you carry a Persona of the matching arcana ([RPG Site: P3R](https://www.rpgsite.net/guide/15436-persona-3-reload-social-link-guide-complete-s-link-walkthrough-unlocks-answers)), a cheap systemic "bring the right thing" bonus. Giant Bomb's reading is that social links exist mainly to boost combat indirectly ([Giant Bomb](https://www.giantbomb.com/social-link/92-2254/)). The relationship is a progression system that feeds the main loop.

Uma Musume, the owner's source game, already teaches its audience this grammar. A support card's bond gauge gains +7 per training and +5 per skill hint ([Deltia's Gaming](https://deltiasgaming.com/?p=279880)). At **80** it turns orange and unlocks Friendship Training, a large stat boost shown as a rainbow glow ([Deltia's Gaming](https://deltiasgaming.com/?p=285549)). Many SSR cards gate their unique effects on bond ≥ 80 ([GameTora](https://gametora.com/umamusume/supports)). Guides list each event choice's exact effects, such as +15 Wit and +5 bond ([Game8](https://game8.co/games/Umamusume-Pretty-Derby/archives/536168)). The research didn't confirm whether the game client shows those effects before the tap; players look them up in guides.

The strongest systems end each ladder on a scarce capstone. Azur Lane's Ring of Promise, available at 100 affinity, raises the cap to 200 and adds **+9% to base stats**, or +12% at exactly 200, with extra rings at 600 gems ([Azur Lane Wiki: Oath](https://blhx.fandom.com/wiki/Oath)). Fate/Grand Order gives each Servant a unique Craft Essence at Bond 10 ([FGO Wiki](https://fategrandorder.fandom.com/wiki/Eric_Bloodaxe)), and Genshin Impact a character namecard at Friendship 10 ([Screen Rant](https://screenrant.com/genshin-impact-max-friendship-level-rewards-companionship-exp/)).

The failures sit at both extremes. Fantasy Life i keeps most rewards, such as outfits, for maximum affinity, which leaves the middle levels empty ([Sportskeeda](https://www.sportskeeda.com/esports/how-improve-affinity-fantasy-life-the-girl-who-steals-time)). Dragon Age: The Veilguard pays companion skill points per relationship level ([PC Gamer](https://www.pcgamer.com/games/rpg/in-dragon-age-the-veilguard-your-companions-earn-skill-points-as-you-rank-up-their-relationship-level)), yet PC Gamer's critic found companions who barely disagree with the player, a meter so free of friction that it felt automatic ([PC Gamer](https://pcgamer.com/games/dragon-age/the-veilguard-is-the-first-dragon-age-game-where-my-companions-dont-care-enough-about-anything-to-argue-with-me)). At the other end, Persona 3's link reversals made relationships feel like a chore ([Collider](https://collider.com/persona-games-relationship-guide/)), and FGO's bond grind past level 10 sits on TV Tropes' page of disliked FGO mechanics ([TV Tropes](https://tvtropes.org/pmwiki/pmwiki.php/ScrappyMechanic/FateGrandOrder)). Nikke shows a middle path: a wrong Advise answer still pays 50 bond points, against 100 for the right one ([Prydwen](https://prydwen.gg/nikke/guides/bond-ranks)). The lesson for uma-farm is that friction should come from **graded gains**: a choice earns more or less, never less than nothing. It shouldn't come from losses, decay or locks.

| Game | Cost per heart or level | Daily chat | Best ordinary gift | Gift limit | Decay |
|---|---|---|---|---|---|
| Story of Seasons: FoMT remake | 10,000 LP per colour, 7 colours | +200 | +800, ×5 on birthdays | First gift each day counts in full | 10% chance of −200 on a day you don't talk |
| Pioneers of Olive Town | 4,000 rising to 10,000 | +300 | +1,200 | One a day; no gift ever subtracts | None noted |
| Stardew Valley 1.6 | 250 | +20 | +80, ×8 birthday, ×1.5 iridium | One a day, two a week | −2 a day as a friend, −10 dating, −20 as a spouse |
| Fields of Mistria 1.0 | 80 rising to 355 (1,755 total) | +7 | +20, +40 on a birthday | One a day | None |
| Coral Island 1.3 | 300 rising to 750 (5,250 total) | +35 | +140, ×5 on birthdays | Two a week | None |
| Roots of Pacha | Flowers | +20 | +80, ×4 on birthdays | Not given | −5 a day, never more than two flowers below your maximum |
| uma-farm today (CS45) | 100 flat | +15 | +60 | One a day | None |

Sources for the table: [fogu: FoMT](https://fogu.com/sos3/marriage/index.html), [fogu: PoOT](https://fogu.com/sos4/marriage/index.html), [GameRant](https://gamerant.com/stardew-valley-friendship-point-system-guide/) and [Stardew Wiki: Gifts](https://stardewvalleywiki.com/Gifts), [Fields of Mistria Wiki](https://fieldsofmistria.wiki.gg/wiki/Relationships), [Coral Island Steam guide](https://steamcommunity.com/sharedfiles/filedetails/?id=3810587966), [Roots of Pacha Wiki](https://rootsofpacha.wiki.gg/wiki/Union).

Two readings follow from the table. First, the newer games (Pioneers of Olive Town, Mistria, Coral Island) all raise the cost per heart as you climb, so early hearts arrive quickly and late ones slowly. Second, pace is the number developers most often get wrong. Coral Island cut relationship gain by **30%** in 1.3 ([Stairway Games](https://blog.stairwaygames.com/post/coral-island-1-3-update-available-now)) and by a further **20%** in a hotfix a month later ([Steam news](https://steamcommunity.com/app/1158160/allnews/)). That argues for simulating uma-farm's pace before release rather than after. Many of the figures above come from fan wikis, some read through search summaries because the wikis refused automated fetches. They are reliable as orders of magnitude, not to the last point.

Shared activities are where the RPG side beats the farm-sim side. Three Houses grades tea from +5 to +30. Fire Emblem: Engage pays +3 for recreation together and +5 for an arena bout ([Fire Emblem Wiki](https://fireemblemwiki.org/wiki/Support)). Portia's rock-paper-scissors and Sandrock's card game Critters pay a few points per round, a few rounds a day; a Critters win is +5, a tie +3, a loss still +1 ([Gamepressure](https://www.gamepressure.com/my-time-at-sandrock/relationships-and-interactions/z1feb4)). Farm sims mostly treat dates as appointments with penalties instead. Rune Factory 5 lowers friendship if you arrive late or don't show ([RPG Site: RF5](https://www.rpgsite.net/feature/12555-rune-factory-5-marriage-candidates-confessing-dating-and-proposing)). Sun Haven removes a date for good if you are more than an hour late ([Sun Haven Wiki](https://sunhaven.wiki.gg/wiki/Romance)). The exceptions point the right way: Stardew's movie theater pays +200 for a loved film ([Stardew Wiki: Movie Theater](https://stardewvalleywiki.com/Movie_Theater)), Trio of Towns' lunch together pays **10,000 FP with a candidate, a full heart** ([fogu: Trio](https://fogu.com/sos2/basics/friendship.html)), and Mistria unlocks new date types with "Date Inspiration" items ([Fields of Mistria Wiki](https://fieldsofmistria.wiki.gg/wiki/Relationships)). A date that is a scored activity with a big payout feels like play. A date that is a timed appointment feels like a chore.

## Heart events hide behind place, hour and weather, where players get lost

Most farm sims space their scripted scenes about every two hearts:

| Game | When heart events play |
|---|---|
| Friends of Mineral Town remake | At set love-point thresholds. A good answer is worth about +3,000 and a poor one −2,000, and a late event isn't lost ([fogu: FoMT](https://fogu.com/sos3/marriage/index.html)) |
| A Wonderful Life remake | At 0, 2, 4, 6 and 8 hearts, in order, at most one per candidate per day; weather can delay them ([fogu: AWL](https://fogu.com/sos5/marriage/index.html)) |
| Fields of Mistria | At 2, 4, 6, 8 and 10. The 8-heart event is a fork between Dating and Best Friends ([Fields of Mistria Wiki](https://fieldsofmistria.wiki.gg/wiki/Relationships)) |
| Coral Island | At levels that vary by candidate (one has nine events from 1 to 10), plus eight pre-marriage and two post-marriage hangouts each ([Coral Island Steam guide](https://steamcommunity.com/sharedfiles/filedetails/?id=3810587966)) |

uma-farm's plan of an event at every heart, about 23 per Uma, is denser than any of these. It is closer to Persona's rank-up-per-rank structure, so any friction in how events trigger would multiply.

That friction is real, because farm-sim triggers stack conditions. Stardew's Abigail 6-heart event fires only if you enter Town between 9pm and midnight while it isn't raining. Her 14-heart spouse event runs in three parts on different days, and the last needs a sunny day and a Chocolate Cake in your inventory ([Steam heart event guide](https://steamcommunity.com/sharedfiles/filedetails/?id=1646388632)). In the Friends of Mineral Town remake, the scene that introduces the confession flower triggers only when you leave the farmhouse between 9:00 and 17:00 on a sunny day that isn't a Sunday or Tuesday. Events that cross outdoor areas require walking, not riding ([fogu: FoMT](https://fogu.com/sos3/marriage/index.html)). Coral Island locks each tier until specific scenes are seen; "extra gifts cannot push past a locked tier." Its standard troubleshooting advice is to re-check weather, time and season ([Coral Island Steam guide](https://steamcommunity.com/sharedfiles/filedetails/?id=3810587966)). Community cheat sheets exist just to list every Story of Seasons dating event ([r/storyofseasons mirror](https://lr.us.psf.lt/r/storyofseasons/comments/14wp9ve/cheat_sheet_to_viewing_all_dating_some_events_in)).

Stardew's events mostly wait until their conditions are met ([Steam discussion](https://steamcommunity.com/app/413150/discussions/0/4699034745344190617)), but a handful are lost for good. Sam's 3-heart event must happen before Winter of year 1, Clint's 6-heart event won't appear after Emily's 8- or 10-heart event, Penny's 4-heart event is blocked if you buy a community upgrade first, and **the wrong answer in Leah's 2-heart event erases her 8-heart event** ([Stardew Forums](https://forums.stardewvalley.net/goto/post?id=67176); [Punished Backlog](https://punishedbacklog.com/stardew-valley-heart-events-guide/)). There is no built-in replay ([Stardew Forums](https://forums.stardewvalley.net/goto/post?id=219297)). Sun Haven's missed dates can't be redone, even with its Memory Loss Potion ([Sun Haven Wiki](https://sunhaven.wiki.gg/wiki/Romance)).

Twenty parallel routes turn a small risk into a near-certainty. As an illustration: if each of a playthrough's roughly 460 pre-wedding events had just a **1% chance** of being lost, a player would lose about four of them, and the chance of losing none would be about 1%. If any of those events gates a wedding, the finale locks. No source measures how often players actually miss events with or without indicators, so the 1% figure is a thought experiment, not data.

Gates that don't explain themselves are the second failure. The Friends of Mineral Town remake rejects the Blue Feather proposal without saying which requirement is missing; the usual cause is a missed heart event ([fogu: FoMT](https://fogu.com/sos3/marriage/index.html)). Rune Factory 4 and 5 roll the odds on a confession, and guides tell players to save first and reload on failure ([RPG Site: RF5](https://www.rpgsite.net/feature/12555-rune-factory-5-marriage-candidates-confessing-dating-and-proposing); [Guide Strats](https://guidestrats.com/rf4-confession-guide/)). One community guide is titled "how to RNG your way to love" ([Steam guide](https://steamcommunity.com/sharedfiles/filedetails/?id=2911562727)). In My Time at Sandrock a confession is reported to succeed 30% of the time at Friend, rising to 70% at the top tier, so a refusal is always possible ([GameSpot](https://www.gamespot.com/articles/my-time-at-sandrock-romance-characters-guide/1100-6518882/)). Randomness at a commitment moment doesn't create tension. It creates save-scumming.

The fixes developers have shipped all point to the same end state: the game says an event is ready, says what it needs, and waits. Coral Island's November 2024 update put **icons on an NPC in the relationship screen when a heart event is available**, a tap that shows how to trigger it, and tracking of heart events in the HUD ([Stairway Games](https://blog.stairwaygames.com/post/november-2024-development-update)). Its 1.3 update added invitations from the NPCs themselves: after a conversation at 2+ hearts there is a base 50% chance of an invite, and declining costs nothing ([Stairway Games](https://blog.stairwaygames.com/post/coral-island-1-3-update-available-now)). Fields of Mistria announces each event with a letter in the mailbox or a note on the request board ([Fields of Mistria Wiki](https://fieldsofmistria.wiki.gg/wiki/Priestess/Heart_Events)); holding the ring re-triggers the proposal events until you propose, and a missed proposal moment simply moves to the next day ([fieldsofmistria.wiki](https://fieldsofmistria.wiki/romance/marriage-and-family/)). Fire Emblem: Three Houses marks every unit with a support conversation waiting with a speech bubble ([HyperX](https://blog.hyperx.com/article/8149/how-to-view-support-conversations-in-fire-emblem-three-houses)), and Rune Factory 5 allows only one romance sub-event to be active at a time, a pacing valve that stops players racing a single candidate ([RPG Site: RF5](https://www.rpgsite.net/feature/12555-rune-factory-5-marriage-candidates-confessing-dating-and-proposing)). A turn-based farm can finish the job. With no clock there is no hour to be in the right place. The event becomes an offer the player takes on their own turn.

## Date many, marry one survives on punishments that players mod away

The genre's commitment recipe is maximum affection, plus every scripted event seen, plus a bought token, plus a gold sink:

| Game | What a proposal costs |
|---|---|
| Friends of Mineral Town remake | Two house upgrades, a 10,000G Large Bed and a 1,000G Blue Feather, one per playthrough ([fogu: FoMT](https://fogu.com/sos3/marriage/index.html)) |
| Stardew Valley | A Bouquet at 8 hearts, then a 5,000g Mermaid's Pendant from a seller who appears only on rainy days ([Stardew Wiki: Mermaid's Pendant](https://stardewvalleywiki.com/Mermaid's_Pendant)) |
| Coral Island | A 1,500c Locket at 8 hearts, then a 5,000c Diamond Ring and a level-3 farmhouse ([Coral Island Steam guide](https://steamcommunity.com/sharedfiles/filedetails/?id=3810587966)) |
| My Time at Sandrock | An engagement ring sold only on the 20th and 21st of each month ([GameSpot](https://www.gamespot.com/articles/my-time-at-sandrock-romance-characters-guide/1100-6518882/)) |

Crafted rings are where the genre is heading. Rune Factory 5's Engagement Ring takes 1 Ore and 1 Gemstone, though it still asks for a 30,000G double bed ([RPG Site: RF5](https://www.rpgsite.net/feature/12555-rune-factory-5-marriage-candidates-confessing-dating-and-proposing)). Fields of Mistria mails the ring recipe the morning after 10 hearts, and you forge the ring yourself ([fieldsofmistria.wiki](https://fieldsofmistria.wiki/romance/marriage-and-family/)). uma-farm's forged ring already matches the best practice. The gold sinks and calendar-bound sellers are the part to drop.

The friendship-then-romance split that uma-farm plans also has precedents. In Trio of Towns a pendant extends a partner's cap from 5 to 10 hearts ([fogu: Trio](https://fogu.com/sos2/basics/friendship.html)), and in Pioneers of Olive Town hearts 7–9 open only once you're going steady ([fogu: PoOT](https://fogu.com/sos4/marriage/index.html)). Sun Haven runs a three-cap ladder of **10 hearts as friends, 15 while dating and 20 once married** ([Sun Haven Wiki](https://sunhaven.wiki.gg/wiki/Romance)). In Roots of Pacha the character asks you to date at 6 flowers; declining costs nothing, and you can start dating later ([Roots of Pacha Wiki](https://rootsofpacha.wiki.gg/wiki/Union)). Fields of Mistria tags the romantic option with a pink heart, so choosing romance is an explicit, labelled act ([Siliconera](https://www.siliconera.com/fields-of-mistria-celine-friendship-or-romance-event-shared/)).

Where games allow several partners at once, they mostly police the overlap:

| Game | What triggers it | What happens |
|---|---|---|
| Stardew Valley | A Bouquet, 10 hearts and the 10-heart event with every bachelor or every bachelorette | One group confrontation and about a week of cold shoulder; sources conflict on any further loss ([Stardew Wiki](https://stardewvalleywiki.com/Special:MobileDiff/72951...147224)) |
| Stardew Valley, married | A gift to a candidate you dated who is the same gender as your spouse | A 20–40% chance of −30 with the spouse ([Stardew Wiki: Marriage](https://stardewvalleywiki.com/Marriage)) |
| Coral Island 1.3 | Seeing four dateables' 10-heart events | Once per save: affected partners drop to 8 hearts, 9–10 lock, and you get 7 days of cold shoulder; can be switched off ([Steam, developer reply](https://steamcommunity.com/app/1158160/discussions/0/564785824624946001/)) |
| My Time at Portia | Being caught on a date with someone else | −50 with your date, −30 with whoever caught you ([Portia Wiki archive](https://mytimeatportia-archive.fandom.com/wiki/Dating)) |
| Fields of Mistria | Marrying one partner | Breakup letters from the others, and a cheating scene if you keep pursuing them ([Pocket Tactics](https://www.pockettactics.com/fields-of-mistria/polyamory)) |
| Persona 5 Royal | Several girlfriends on Valentine's Day | A group confrontation scene ([TheGamer](https://www.thegamer.com/persona-5-royal-cut-valentines-day-harem-scene-bad-ending/)) |
| Palia, Sun Haven, Pioneers of Olive Town | Nothing | None ([Palia Wiki](https://palia.wiki.gg/wiki/Romance); [Sun Haven Wiki](https://sunhaven.wiki.gg/wiki/Romance); [fogu: PoOT](https://fogu.com/sos4/marriage/index.html)) |

No Harvest Moon, Story of Seasons or Rune Factory title found in this research offers more than one spouse. A GameFAQs thread asking for a harem ending got a flat "no" ([GameFAQs](https://gamefaqs.gamespot.com/boards/734977-story-of-seasons/71757473)), and players arguing for polyamory in Mistria's forums could cite only small indies such as Verdant Skies and Pumpkin Days as precedents ([Steam](https://steamcommunity.com/app/2142790/discussions/0/4520010433855558605/)). The demand shows up in mods and threads instead. Stardew's Free Love, which allows several spouses, has **33,280 endorsements** ([Nexus Mods](https://www.nexusmods.com/stardewvalley/mods/10021)); its 1.6 successor, Polyamory Sweet, gives every spouse a private room and lets all of them attend the wedding ([XMODhub](https://www.xmodhub.com/en/game-mods/stardew-valley-mods/polyamorysweet)); and an earlier Polygamy mod made one spouse the "primary" each day while the rest roamed the farm ([PCGamesN](https://pcgamesn.com/stardew-valley/stardew-valley-polygamy-mod)). Fields of Mistria grew a multi-spouse mod after its marriage feature launched ([Nexus Mods](https://www.nexusmods.com/fieldsofmistria/mods/1301)), and its Steam "Polyamory!" thread ran to **316 comments**, split between players asking to marry several and players who see dating as a commitment ([Steam](https://steamcommunity.com/app/2142790/discussions/0/4520010433855558605/)). Separate Stardew mods exist only to replace spouse jealousy lines with lines about trust, or to switch jealousy off ([Nexus Mods](https://www.nexusmods.com/stardewvalley/mods/18848?tab=posts)). Coral Island's developers explain the supply side. They declined divorce and breakups because those systems "get messy fast and can introduce a lot of bugs", and pointed players to separate save slots ([Steam news](https://steamcommunity.com/app/1158160/allnews/)). The commercial exception is a gacha game. Azur Lane sells unlimited oath rings at 600 gems and gifts wedding furniture once you have oathed several ships ([Azur Lane Wiki: Oath](https://blhx.fandom.com/wiki/Oath)), which is a ready precedent for milestone rewards on the way to a marry-everyone finale.

The permissive designs show how to remove jealousy without making the world feel unaware of it. Palia states that having several love interests is "common and accepted" ([Palia Wiki](https://palia.wiki.gg/wiki/Romance)). Roots of Pacha lets the player choose whether they're okay with dating others, and after the Union it offers a "remain faithful" choice with no negative effect on other relationships ([Roots of Pacha Wiki](https://rootsofpacha.wiki.gg/wiki/Union)). The sharpest lesson is a scene Persona 5 Royal cut. Dataminers found a version of Valentine's Day in which the girlfriends are understanding and bring chocolates together, and TheGamer found it unsettling because the characters acted out of character ([TheGamer](https://www.thegamer.com/persona-5-royal-cut-valentines-day-harem-scene-bad-ending/)). The scene isn't the problem. The characters had been written as monogamous for the whole game, so the openness came out of nowhere. Each Uma's route has to establish the farm's open household early, in her own voice, not just at the finale.

Otome games show how an "everything cleared" finale fails. Hatoful Boyfriend's hidden route opens only after every other route has an ending ([CheatCC](https://www.cheatcc.com/?p=80180)); Dead Wishes' twelve-route requirement struck a reviewer as daunting ([itch.io](https://itch.io/post/15595080)); and Mistonia's Hope's truth route struck one reviewer as "just sort of boring" ([Otome Kitten](https://otomekitten.com/2025/11/05/mistonias-hope-the-lost-delight-review-nintendo-switch/)). The three failure modes are an unclear gate, a gate so long it feels like work, and a payoff weaker than the routes. A farm sim avoids the worst of these structurally, because routes progress side by side instead of replaying a common route twenty times. The other two remain design work: a visible checklist and a finale in which every spouse matters.

## Weddings end the romance in most farm sims, and twenty idle spouses would multiply the problem

Married life is the genre's most-cited gap, and the creator of its reference game agrees. ConcernedApe accepted in a 2016 thread that married life is one of Stardew's weakest parts, citing the workload of giving every spouse a distinct personality after marriage. That comes from a search summary of a Reddit mirror, so treat the wording as paraphrase ([r/StardewValley mirror](https://redlib.ssps.io/r/StardewValley/comments/4a7j5y/ouch/d0y59mz/?context=3)). The player accounts agree. A Stardew spouse who started out helping with chores ended up repeating the same morning lines until it became "very repetitive" ([Steam](https://steamcommunity.com/app/413150/discussions/0/357284131804961357)), and a Fae Farm thread concluded that "the romance dies" after the wedding ([Steam](https://steamcommunity.com/app/2230110/discussions/0/4763207146663462636/)). Friends of Mineral Town remake spouses never help on the farm or give discounts ([fogu: FoMT](https://fogu.com/sos3/marriage/index.html)), and the original Grand Bazaar spouse "stands around at home" ([fogu: Grand Bazaar](https://fogu.com/hm9/events/getting-married.php)). Mods fill the gap: "Please Remember My Marriage" writes post-marriage dialogue for each villager ([Twinfinite](https://twinfinite.net/guides/best-new-stardew-valley-mods-of-july-2021/2/)), and "Fourteen Heart Events for All" unlocks spouse-only scenes without marriage ([Nexus Mods](https://www.nexusmods.com/stardewvalley/mods/14212)).

Recent games answer the same way: a third ladder after the wedding, plus small daily acts. Stardew gives a spouse a 14-heart meter ([Stardew Wiki: Friendship](https://stardewvalleywiki.com/Friendship)). Coral Island opens **hearts 11–15 only after marriage**, with two post-marriage hangouts per candidate ([Coral Island Steam guide](https://steamcommunity.com/sharedfiles/filedetails/?id=3810587966)), and its 1.3 update added anniversaries that grant a 2× Heart Points buff and spouses who ask for attention when neglected ([Stairway Games](https://blog.stairwaygames.com/post/coral-island-1-3-update-available-now)). Sun Haven raises the cap from 15 to 20 at marriage and gives an NPC-specific wedding ring with its own stats ([Sun Haven Wiki](https://sunhaven.wiki.gg/wiki/Romance)). Fields of Mistria spouses may help on the farm, cook or leave gifts on random mornings, and each takes a room ([fieldsofmistria.wiki](https://fieldsofmistria.wiki/romance/marriage-and-family/)). The anti-pattern is the old Harvest Moon anniversary quiz. On a special day the spouse asks what day it is: the right answer is worth +3,000 and the wrong one −2,000 ([fogu: FoMT](https://fogu.com/sos3/marriage/index.html)). It's a pass/fail test, not a relationship.

Twenty spouses raise three problems no single-spouse game has had to solve. The first is space: mod authors learned that each spouse needs her own room, after a Sun Haven multi-marriage mod overwrote the previous spouse's room with each new one ([Nexus Mods](https://www.nexusmods.com/sunhaven/mods/45)). The second is attention: twenty morning greetings is noise, which is why the Stardew Polygamy mod picked one primary spouse per day ([PCGamesN](https://pcgamesn.com/stardew-valley/stardew-valley-polygamy-mod)). The third is purpose. In uma-farm the Umas are also the workforce, so marriage can change the farm's economy in a way a Stardew spouse never did. That turns post-marriage perks (output on her line, chores, breakfast buffs) into the farm's endgame rather than decoration. Fire Emblem shows the same move in combat, where S-rank pairs fight better ([Fire Emblem Wiki](https://fireemblemwiki.org/wiki/Support)).

## The best screens answer "what next" before the player asks

The baseline relationship screen is a list with one row per character. Stardew's Social tab shows each villager's hearts, two weekly gift checkboxes, and a circle when you can still talk to them that day ([Stardew Wiki: Gifts](https://stardewvalleywiki.com/Gifts)). Version 1.6 added a Gift Log: tap a name and it records the gifts you have given and the tastes you have learned, including ones heard from friends and family ([Stardew Wiki: Social tab](https://stardewvalleywiki.com/Social_tab)). What it never shows is when or where the next heart event fires, so players read each villager's wiki page for trigger conditions ([Punished Backlog](https://punishedbacklog.com/stardew-valley-heart-events-guide/)). Coral Island's overhaul added the missing pieces (icons, tap-for-trigger details, HUD tracking), and guides now tell players to "check the Relationship UI if progress stalls" ([Casual Game Guides](https://casualgameguides.com/walkthroughs/coral-island/romance-and-marriage-guide)).

Colour carries the stage cheaply. Grand Bazaar gives marriage candidates hearts that change colour as they fill, while ordinary villagers' stay peach, so colour alone tells you who is romanceable ([StratsWiki](https://stratswiki.com/sos-gb/game-mechanics/heart-levels/)). Pioneers of Olive Town colours a flower by event stage ([Ranch Story Wiki](https://wiki.ranchstory.farm/index.php/Friendship,_Dating_%26_Marriage_%28Story_of_Seasons:_Pioneers_of_Olive_Town%29)).

What farm sims lack, gacha and RPG screens have: a list of what each level unlocks. Guides frame Persona's confidants rank by rank as skill unlocks ([RPG Site](https://rpgsite.net/feature/5479-persona-5-confidant-guide-conversation-choices-answers-romance-options-gifts-skill-unlocks)). Blue Archive gives each relationship rank a stat bonus, a Relationship Story and a Live2D lobby scene ([Blue Archive Wiki](https://bluearchive.fandom.com/wiki/Affection)). Love and Deepspace levels unlock texts, phone calls, video calls, emoji packs and stat boosts ([LootBar](https://lootbar.gg/blog/en/guide-to-raise-character-affinity-in-love-and-deepspace.html)).

Event playback that plays rather than reads has five recognizable traits:

| Trait | Example |
|---|---|
| A visible score per choice | Persona's notes. Persona 5 Royal even treats the best answer as a reward: one confidant's rank-10 skill marks the highest-scoring replies in later scenes ([Prima Games](https://primagames.com/gaming/persona-5-royal-confidant-guide-fortune-chihaya-mifune)) |
| Labelled stakes | Mistria's pink romantic option ([Siliconera](https://www.siliconera.com/fields-of-mistria-celine-friendship-or-romance-event-shared/)); Uma Musume's risk ladder, where lower options carry a higher chance of failure ([GameWith](https://gamewith.net/uma-musume/70104)) |
| Events as a map you can revisit | Genshin's Hangouts are a branching flowchart: replay from any choice without paying again, and each of six endings is captured as a photograph with a reward ([Prima Games](https://primagames.com/gaming/genshin-impact-hangout-events-guide-endings-rewards/2)) |
| Content through phone-native systems | Blue Archive opens a chat thread with short reply choices before each Relationship Story ([Blue Archive Wiki](https://bluearchive.fandom.com/wiki/Affection)); Love and Deepspace delivers affinity through texts and calls, with a first-person viewpoint ([LootBar](https://lootbar.gg/blog/en/guide-to-raise-character-affinity-in-love-and-deepspace.html); [App Store](https://apps.apple.com/gb/app/id6443467666?l=en-gb)) |
| Replay | Coral Island's Tablet of Memories replays heart events ([Steam news](https://steamcommunity.com/app/1158160/allnews/)); Stardew has none ([Stardew Forums](https://forums.stardewvalley.net/goto/post?id=219297)) |

Hard, published numbers for portrait-phone dialogue are scarce, and what exists is developer convention, not research. A low-authority design reference caps a dialogue box at 3–4 lines ([VN design reference](https://claudeskills.info/skills/thedivergentai/gd-agentic-skills/genre-visual-novel/)). One developer rebuilt a visual novel's layout for portrait because people hold phones upright ([Red Seed Games](https://redseedgames.itch.io/dusk-point-reloaded-mikos-journey/devlog/884815/an-attempt-on-portrait-visual-novels-for-android)), and another creator's informal poll found that half or more of their players prefer to read on mobile ([koboldcard](https://koboldcard.itch.io/for-skin-and-scale/devlog/513409/gui-and-android-support)). The common tap scheme is that one tap finishes the text, the next advances and holding skips ([itch.io devlog](https://itch.io/devlog/545895/dialog-history.amp)), and auto mode needs its own visible indicator because, unlike skip, it is easy to miss ([itch.io](https://itch.io/blog/689356/polishing-your-release-the-little-features-that-could)). Stardew's mobile port shows a risk that turn-based playback avoids by design. Players reported taps during scripted walks blocking movement or leaving a character stuck in a cutscene ([Stardew Forums](https://forums.stardewvalley.net/threads/report-1-5-mobile-issues-here-updated-feb-20.14953/post-90135)).

The ungendered, never-drawn farmer moves the remaining risk entirely into text. Coral Island lets any player choose Mr., Ms. or Mx. and romance anyone ([Gamepur](https://vip-develop.gamepur.com/guides/all-characters-you-can-romance-in-coral-island)). Mistria offers they/them ([Fields of Mistria FAQ](https://fieldsofmistria.com/faq)), and its players still asked whether NPCs ever actually use the chosen pronouns ([Steam](https://steamcommunity.com/app/2142790/discussions/0/4432192283999902922)). uma-farm's authoring rule already bans gendered words for the farmer. The words most likely to slip through are the wedding's: bride, groom, husband and wife for the farmer's side.

## Conclusion

The genre's friction mostly comes from its real-time worlds. Schedules, opening hours, weather windows and the rule to walk instead of ride exist because those games need the player to be in a certain place at a certain time. Once a day is a turn with no clock, those constraints have no purpose left, and keeping them would only make players hunt for scenes. What is worth keeping is the Persona lesson: one scarce, meaningful decision per day, here whom to spend the evening with. Time slots, not hidden arithmetic, are what turn relationships into strategy. For the same reason, the right test for any proposed limit is whether it creates a choice the player enjoys making, or a task they look up in a wiki.

A marry-everyone finale also changes where the content budget goes. The writing other games spend on rivals, jealousy scenes, breakup letters and divorce systems goes instead to married life, the one area every reference game is criticized for. Because uma-farm's Umas are its workforce, each marriage can change the farm, which makes a twenty-spouse household the farm's endgame economy. None of the major farm sims studied has attempted that. The open question is volume, not mechanics. The three-route pilot already planned in uma-farm's F40 should test one thing first: whether a 150-word event with one playable beat lands in 60–120 seconds and feels like a level-up. Only then should the other seventeen routes be written to the format.

## Recommendations for uma-farm

The numbers below are starting values chosen from the precedents above. They replace CS45's flat 100 points a heart and its −20 disliked gift, and they should be confirmed with a pacing simulator in `@farm/domain` before release. Coral Island had to cut gain twice after launch.

### (a) What every authored heart event must specify

| Field | What the author writes | Rule |
|---|---|---|
| **Rung** | The ladder and level: Friendship 1–10, Confession, Romance 1–10, Proposal, Wedding, Spouse 1, 3 or 5 | One event per rung. Ladder order is the only sequence, and an Uma plays at most one of her events per day |
| **Ready when** | Her bar is full, plus at most one setup the player controls: she works a named place today, an item is in the Warehouse, her bond with a named Uma reaches a level, or a chapter is reached | Never an hour, weather or day of the week. A season or festival may change the scene's wording, never whether it plays. Any gate is shown on her profile ("Opens with Chapter 4") |
| **Place** | One farm place: the Fields, the Pond, the Kitchen, the Forge, the Mine, the Ranch, the festival ground | Prefer her favourite work line's place. The event plays on that place's map stage |
| **Together** | What the farmer and she do: one playable verb from the farm's own mechanics (cook, forge, fish, harvest, tend an animal, walk the map, run the track, choose a gift), 10–30 seconds | Graded Fine, Great or Perfect, and impossible to fail. The grade adds +0, +15 or +30 |
| **Beats** | 3–5 beats, 150 words at most. Her lines go in bubbles of 3 lines or fewer, and the farmer speaks only through choices | Lines auto-advance. No monologue for the farmer, and no gendered word for the farmer |
| **Choices** | 1–2 choice points, each with 2–3 options of 40 characters or fewer. Each option shows its gain before the tap: the best +30 and the others +10, or a gift taste it reveals, or the item it costs | No option scores below zero or removes a later event. Romantic options carry a heart tag. A choice may set a flag that changes later wording only |
| **Rewards** | +50 for completing it, the rung's perk from table (b3), one Memory (a snapshot and a caption), and optionally a recipe, letter or item | Everything is listed on the level-up card |
| **Next hint** | One line for her profile describing the next rung | Written by the author, shown until that rung plays |

Example, written for the format's stand-in Uma:

```
id: standin-f4                     rung: Friendship 4
ready: bar full, and she works the Pond today
place: the Pond, at the end of the day
together: fish, one cast, 15 s, graded; she coaches the timing
beats: 4, about 130 words
choice, after the cast:
  "Teach me your trick."        +30 friendship, reveals a liked gift
  "Beginner's luck."            +10 friendship
  "Let's cook it together."     +10 friendship, costs 1 Herb, alternate Memory
rewards: +50; perk F4 (her signature dish's recipe); Memory "First catch"
next hint: "Friendship 5: the Kitchen, with a fish she caught"
```

Per Uma this comes to 10 friendship events, the confession, 10 romance events, the proposal, the wedding and 3 spouse events: **26 events**. Across 20 Umas that is about **520 events** and 78,000 words. The perks are templates (b3), so per Uma only her signature perk, keepsake and dream are bespoke.

### (b) Game mechanics

**(b1) The ladders.** Heart *n* on either ladder costs **160 + 40n points**: 200, 240 and so on up to 560. That makes 3,800 a ladder, front-loaded so the first hearts arrive in two or three days, as in Mistria, Coral Island and Pioneers of Olive Town.

| Ladder | Levels | Cost | Events |
|---|---|---|---|
| Friendship | F1–F10 | 200 → 560 (3,800) | At every level; F10 is followed by her confession |
| Romance | R1–R10 | 200 → 560 (3,800) | At every level; R10 opens the proposal |
| Spouse | S1–S5 | 600 each (3,000) | The wedding opens S; events at S1, S3 and S5 |

**(b2) Points.**

| Act | Points | Limit |
|---|---|---|
| Chat (tap her) | +15 | Once a day per Uma |
| Gift | Loved +60, liked +30, neutral +10, disliked 0; ×(1 + 0.1 for each star above ★1) | One a day per Uma, no weekly cap; ×3 on her birthday |
| Praise (as CS45) | +20 | Once a day |
| She worked her favourite line today | +10 | Paid at end of day |
| A festival together | +50 | Each festival |
| Hangout (F2+) or date (R1+) | Fine +60, Great +100, Perfect +150; ×1.5 for her favourite kind | **One evening activity a day, across all Umas** |
| Heart event | +50, plus its choices (+10 to +30) and its activity grade (+0 to +30) | None |

Points go to her current ladder: friendship until the confession is accepted, romance after it, spouse after the wedding. **No decay, ever.** **Points past a waiting event are banked**, shown as "+120 banked", and pay out when the event plays, unlike Coral Island's hard lock. The evening is the only deliberate scarcity. Each turn has one evening, and leaving it empty costs nothing. An Uma may also invite the farmer in the morning summary ("fishing tonight?"), and declining costs nothing, as in Coral Island 1.3.

Computed from these values (confirm with the simulator):

| Milestone | Focused play | Typical play |
|---|---|---|
| First heart event | Day 2 | Day 3–4 |
| Her confession (F10) | About day 20 | About day 40–45 |
| First wedding | About day 40 (year 1, Winter) | About day 85 (year 2) |
| All 20 married | n/a | Year 4–5 (about days 190–240) |

**(b3) A perk on every level,** in three families: work (her output), time (chores done for you) and economy or collection. "Her line" is her favourite work line from her profile.

| Level | Friendship perk | Romance perk | Spouse perk |
|---|---|---|---|
| 1 | Her loved gift is shown; her chat set opens | Dates open (a walk at dusk, cook together); she gives you a nickname | On mornings she's home, the crew starts well fed |
| 2 | Hangouts open | Every 4th morning she leaves a ★3+ item from her line | Her morning item comes every 2nd morning |
| 3 | +10% items at her line | Date kind: fish at the Pond | Her dream event; +10% at her line for the whole crew |
| 4 | Her signature dish's recipe | Her pair bond with her closest friend among the Umas gains ×1.5 | Her night chores double |
| 5 | +5% rank points (CS45) | Another +10% at her line (+20% total) | Vow renewal; her keepsake upgrades |
| 6 | Night chore: one extra job on her line each night | Date kind: forge together | |
| 7 | All her tastes are shown, plus her closest friend's loved gift | A second night chore | |
| 8 | **In her element:** ×1.5 output at her line beside an Uma she has 3+ bond hearts with | Her ring's engraving (b7) | |
| 9 | Mentor: Umas working beside her gain +10% rank points | Date kind: run the track | |
| 10 | Her keepsake (a buff item), +10% rank points (CS45), her confession | The proposal | |

**(b4) Gifts.** One gift per Uma per day, with no weekly cap. With twenty Umas the real limit is goods, not a rule. Her loved gift shows at F1. Liked and disliked gifts show when first given, or all at F7. The gift picker shows each item's points for her before you give it, with "?" for untried goods. A disliked gift gives 0 and a line from her, never a loss (Pioneers of Olive Town). Quality stars multiply, as Stardew's iridium does.

**(b5) Nothing missable, nothing random.** Ready events wait forever. The confession is her event at F10: "Yes" opens romance, and "Not yet" keeps her a close friend, with an "Ask her" action on her profile to accept later. The proposal always succeeds once R10 has played and her ring exists. She can still say "not yet" in the writing of earlier romance scenes, at no cost. Memories replays every event and lets you pick any choice again, with no points for replays.

**(b6) Dates as activities.**

| Kind | As a hangout (friends) | As a date (partners) | Plays as |
|---|---|---|---|
| A walk at dusk | F2 | R1 | A map walk with two choices |
| Cook together | F2, once the Kitchen is built | R1 | The Kitchen; graded by the dish's stars |
| Fish at the Pond | F2, once the Pond is open | R3 | Fishing; graded by the catch |
| Forge together | n/a | R6 | The Forge's play; graded by tier |
| Run the track | n/a | R9 | A pacing tap game, her racing past told as memories |
| Festival evening | Festival days, from F2 | Festival days, from R1 | The festival's own game |

Each kind takes 30–60 seconds and can't be failed. Her favourite kind is in her profile and pays ×1.5.

**(b7) The ring.** Any CS25 ring works, forged on any day. At R8 her profile shows the engraving that makes a ring hers. Her marriage bonus at her line is +1% per ring grade (1–10), plus +0, +1, +3 or +5 for a Rough, Fine, Great or Masterwork play, up to **+15%**. Re-forge whenever you like and she keeps the best. There is one ring per Uma and no limit on rings, with no house, bed, gold or calendar gate.

**(b8) Wedding and married life.** The wedding is the next day by default, or on a day you pick within 7. The farmer makes three choices with visible effects: the place (one of three farm places), the reception dish (the whole crew is well fed the next day), and the vow line (cosmetic). Every current spouse and her closest friends among the Umas attend. At the wedding she moves into her own room and her ring bonus (b7) starts. Each morning, **three spouses are home**, by rotation, and each does her morning act; she is always home on her birthday and anniversary. Her anniversary each year is a 2× points day with her and brings a gift, as in Coral Island. Household scenes play at 5, 10 and 15 marriages.

**(b9) The finale.** The Hearts header always shows "Married n/20".

| Married | Reward |
|---|---|
| 1 | The household opens: a spouse wing and the home-today rotation |
| 5 | Household scene 1, a furniture set, +5% items crew-wide |
| 10 | Household scene 2; every 4th day has two evenings |
| 15 | Household scene 3, +5% more items crew-wide |
| 20 | **The finale:** a farm-wide celebration in which every spouse has her own moment and line. The game then continues, with a yearly Festival of Vows |

### (c) The relationship screen and event playback on a 390px phone

**The Hearts tab.** One 72pt row per Uma. Ready events sort first. Filter chips cover Ready, Friends, Partners and Married. A bar carries the stage colour: one colour for friendship, another for romance, gold for spouse.

```
┌──────────────────────────────────────────┐
│ Hearts                 Married 3/20  (i) │
│ [Ready 2] [Friends] [Partners] [Married] │
├──────────────────────────────────────────┤
│ (pic) Stand-in                  ● Ready  │
│       Partner · R4  ■■■■▣□□□□□           │  ▣ the heart filling
│       250 / 360 · chat done · gift –     │
├──────────────────────────────────────────┤
│ (pic) …                                  │
└──────────────────────────────────────────┘
```

**Her profile** opens as a sheet from the row, or from her sprite on the map.

```
┌──────────────────────────────────────────┐
│ ‹ Stand-in                       Partner │
│ F ■■■■■■■■■■ ◆ R ■■■■▣□□□□□ ◇ S □□□□□    │  the whole route on one track
│ ┌ Next: Romance 5 ─────────────────────┐ │
│ │ +10% more at the Pond (now +10%)     │ │
│ │ Event: the Pond · she works it today │ │
│ │ 250 / 360 █████████████░░░░░         │ │
│ └──────────────────────────────────────┘ │
│ Perks    F1–F10 done · R1–R4 done · R5   │
│ Gifts    Loved … +60 · Liked … +30       │
│ Memories 14 · replay any                 │
│ [ Chat +15 ]  [ Gift ]  [ Evening › ]    │  48pt, thumb zone
└──────────────────────────────────────────┘
```

**Event playback.** The place's map stage fills the top ~55%, with her sprite there and the farmer never drawn. Her bubble sits below it: 3 lines at most, about 36 characters a line at 16pt. Choices are full-width 48pt buttons in the bottom thumb zone, each showing its gain. Auto, skip-read and log sit top right, away from the tap area. While a scene plays, input is limited to advance, choose, auto, skip and log.

```
┌──────────────────────────────────────────┐
│ The Pond · Romance 5     auto  skip  log │
│                                          │
│      [ the Pond's map stage: her sprite, │
│        no farmer ]                       │
│                                          │
│ ┌──────────────────────────────────────┐ │
│ │ Stand-in: You cast like you mean it  │ │
│ │ now. Who taught you that?            │ │
│ └──────────────────────────────────────┘ │
│ ┌──────────────────────────────────────┐ │
│ │ [love] "You did."            +30     │ │
│ ├──────────────────────────────────────┤ │
│ │ "The fish, mostly."          +10     │ │
│ └──────────────────────────────────────┘ │
└──────────────────────────────────────────┘
```

**The level-up card** closes every event. The heart fills with a short sparkle and she says one line. Then come the perk card or cards, the Memory snapshot, and the next rung's cost, place and condition, with one Continue button. Confession, proposal and wedding get a stage-up screen that shows the bar recolouring (friendship to romance, romance to spouse) and everything the stage unlocks.

| Rule | Value |
|---|---|
| A heart event | 60–120 s: a place card, 3–5 beats, one 10–30 s activity, 1–2 choices, the level-up card |
| Confession, proposal, wedding | 3–5 min, with 2–3 activities or choices with visible effects |
| Ready signals | A "Ready" chip on her row, a badge on her map sprite, and one line in the morning summary ("Ready today: Stand-in, Romance 5, at the Pond"). There is no pop-up per event |
| Finding her | She is where you assigned her; the map and her row both say so |
| Gains | A "+N" floats from her portrait on every chat, gift, choice and activity, as Persona's notes do |
| Replay | Memories: an album per Uma; replay any event from any choice, with no points |

### (d) Genre limitations to remove, and the evidence for each

| Remove | Evidence | uma-farm's rule |
|---|---|---|
| **Hidden values** | FoMT's 65,535 points shown as 7 colours ([fogu](https://fogu.com/sos3/marriage/index.html)); Animal Crossing's meter petition ([Change.org](https://www.change.org/p/nintendo-add-a-visible-friendship-level-meter-to-animal-crossing-new-horizons)); Lookup Anything's ~845k downloads ([CurseForge](https://www.curseforge.com/stardewvalley/mods/lookup-anything)) | Points, next cost, next perk and next event, always on screen |
| **Decay** | Stardew −2/−10/−20 a day ([GameRant](https://gamerant.com/stardew-valley-friendship-point-system-guide/)); FoMT's 10% chance of −200 ([fogu](https://fogu.com/sos3/marriage/index.html)); Persona 3's reversals felt like upkeep ([Collider](https://collider.com/persona-games-relationship-guide/)) | None |
| **Place, hour and weather triggers** | Abigail's three-part, cake-carrying 14-heart event ([Steam guide](https://steamcommunity.com/sharedfiles/filedetails/?id=1646388632)); FoMT's sunny-weekday flower window ([fogu](https://fogu.com/sos3/marriage/index.html)); Coral Island's "check weather, time and season" ([Steam guide](https://steamcommunity.com/sharedfiles/filedetails/?id=3810587966)) | A full bar plus at most one setup the player controls; started from a menu |
| **Missable events** | Stardew's Sam, Clint, Penny and Leah losses ([Stardew Forums](https://forums.stardewvalley.net/goto/post?id=67176)); Sun Haven's missed dates, lost for good even with a Memory Loss Potion ([Sun Haven Wiki](https://sunhaven.wiki.gg/wiki/Romance)); no replay ([Stardew Forums](https://forums.stardewvalley.net/goto/post?id=219297)) | Events wait forever; Memories replays them |
| **Silent gates and hard heart locks** | FoMT's feather rejection without a reason ([fogu](https://fogu.com/sos3/marriage/index.html)); Coral Island's "extra gifts cannot push past a locked tier" ([Steam guide](https://steamcommunity.com/sharedfiles/filedetails/?id=3810587966)) | A requirement checklist on her profile; points bank |
| **Random confessions** | Save-before-confessing in RF4 and RF5 ([RPG Site](https://www.rpgsite.net/feature/12555-rune-factory-5-marriage-candidates-confessing-dating-and-proposing)); "RNG your way to love" ([Steam](https://steamcommunity.com/sharedfiles/filedetails/?id=2911562727)); Sandrock's 30–70% ([GameSpot](https://www.gamespot.com/articles/my-time-at-sandrock-romance-characters-guide/1100-6518882/)) | Deterministic: a full bar means yes |
| **Gold-sink and calendar gates on the proposal** | FoMT's two house upgrades and 10,000G bed ([fogu](https://fogu.com/sos3/marriage/index.html)); Stardew's rain-only 5,000g pendant ([Stardew Wiki](https://stardewvalleywiki.com/Mermaid's_Pendant)); Sandrock's ring sold only on the 20th–21st ([GameSpot](https://www.gamespot.com/articles/my-time-at-sandrock-romance-characters-guide/1100-6518882/)) | A ring forged at the farm on any day, re-forgeable, unlimited |
| **Weekly gift caps and memorized taste tables** | Stardew's and Coral Island's two gifts a week ([Stardew Wiki](https://stardewvalleywiki.com/Gifts); [Steam guide](https://steamcommunity.com/sharedfiles/filedetails/?id=3810587966)); the gift-taste helper rebuilt three times ([Nexus Mods](https://www.nexusmods.com/stardewvalley/mods/229)) | One a day per Uma, no weekly cap; the gift picker shows her points |
| **Jealousy and the one-spouse cap** | Stardew's group event ([Stardew Wiki](https://stardewvalleywiki.com/Special:MobileDiff/72951...147224)); Coral Island's opt-out Tavern scene ([Steam](https://steamcommunity.com/app/1158160/discussions/0/564785824624946001/)); Free Love's 33,280 endorsements ([Nexus Mods](https://www.nexusmods.com/stardewvalley/mods/10021)); Mistria's 316-comment poly thread ([Steam](https://steamcommunity.com/app/2142790/discussions/0/4520010433855558605/)) | No jealousy; marry all twenty; the open household is written into every route early |
| **Static married life** | ConcernedApe agreeing that married life is one of Stardew's weakest parts (paraphrased) ([r/StardewValley mirror](https://redlib.ssps.io/r/StardewValley/comments/4a7j5y/ouch/d0y59mz/?context=3)); Fae Farm's "the romance dies" ([Steam](https://steamcommunity.com/app/2230110/discussions/0/4763207146663462636/)); FoMT spouses who never help ([fogu](https://fogu.com/sos3/marriage/index.html)) | A spouse ladder S1–S5 with perks, events and anniversaries; the home-today rotation; household scenes |
| **Hunting characters across schedules** | NPC Map Locations among Stardew's most-downloaded mods ([GameRant](https://gamerant.com/stardew-valley-most-downloaded-mods/)); "kind of a pain" when schedules hide characters ([Punished Backlog](https://punishedbacklog.com/mechanics-heart-romance-games/)) | She is where you assigned her, and the map and list show it |
| **Answers that punish or lock content** | Leah's 2-heart answer erasing her 8-heart event ([Punished Backlog](https://punishedbacklog.com/stardew-valley-heart-events-guide/)); a Dragon Age rejection cost that made a player quit ([Punished Backlog](https://punishedbacklog.com/mechanics-heart-romance-games/)) | Choices only grade gains (+10 to +30) and change wording, never content |
