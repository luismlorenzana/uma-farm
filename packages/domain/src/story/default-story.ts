// The default story: what every Uma says and plays until her own story is written. Written once for the game, warm and
// short, adults only, tender and never explicit; the protagonist is a man (he may be her husband, the groom). It names
// no one: `{name}` is hers, `{farmer}` his, `{good}` her favourite good and `{work}` her line's work, filled at run time
// (`placeholders.ts` fills hers as it builds a scene; `{farmer}` fills as a line shows). In a scene, `@her` is her: the
// builder puts her id there. Her own story replaces each piece it writes (an event, a scene, her talks), and anything it
// leaves out stays this. Pure data; it loads with the story pack, lazily.
//
//   talks           six stages (acquaintance, friend, farmhand, sweetheart, engaged, married), five temperaments each
//   gift reactions  loved, liked, neutral, disliked (`{gift}` the good given)
//   her events      meeting her (at the Gate, or in town), Friendship 1–10, the confession, Romance 1–10, the proposal,
//                   the wedding, the wedding night, moving in, married life 1–5
//   occasions       her birthday, the five festivals, New Year's
//   evenings        a scene for each hangout and date kind, Dinner in town and A night in
//   married life    the night's companion's morning greetings, by temperament; lines for meals
import type { Temperament } from '../farm/talents'
import type { Activity } from '../farm/ranks'
import type { Taste } from '../romance/chats'
import { LIFE_EVENTS, OCCASIONS, type ChoiceOption, type Step, type StoryPlace, type Tone } from './authored'
import type { Expression, StoryOutfit } from './look'

/** Her, in a default scene: the builder puts her id here. */
export const HER = '@her'

/** The Uma loop's stages, as her talks follow them. */
export const TALK_STAGES = ['acquaintance', 'friend', 'farmhand', 'sweetheart', 'engaged', 'married'] as const
export type TalkStage = typeof TALK_STAGES[number]

/** A scene of the default story: its moment (the first line, and the Memory's caption), the outfit it calls for (else
 * the moment's), and its steps. */
export interface DefaultScene { readonly moment: string; readonly outfit?: StoryOutfit; readonly steps: readonly Step[] }

// --- How a scene is written ---------------------------------------------------------------------------------------------

const say = (line: string, emote?: Expression): Step => (emote ? { say: HER, line, emote } : { say: HER, line })
const narrate = (text: string): Step => ({ narrate: text })
type Gain = 'friendship' | 'romance' | null
const option = (text: string, tone: Tone, gain: Gain, points: number, then: readonly Step[]): ChoiceOption => ({
  text, tone, ...(gain === 'friendship' ? { friendship: points } : gain === 'romance' ? { romance: points } : {}), then: [...then],
})
/** A choice of two: the warmer pays +2 (the event's +30), the other +1 (+10); with no gain, wording only. */
const choose = (gain: Gain, warm: [string, ...Step[]], other: [string, ...Step[]], tone: Tone = 'playful'): Step => ({
  choice: [option(warm[0], 'warm', gain, 2, warm.slice(1) as Step[]), option(other[0], tone, gain, 1, other.slice(1) as Step[])],
})
/** A scene: its moment first, after its place. */
const scene = (moment: string, body: readonly Step[], extra: { outfit?: StoryOutfit; place?: StoryPlace } = {}): DefaultScene => ({
  moment, ...(extra.outfit ? { outfit: extra.outfit } : {}), steps: [...(extra.place ? [{ place: extra.place } as Step] : []), narrate(moment), ...body],
})

// --- Talks --------------------------------------------------------------------------------------------------------------

/** Her talks, by stage and temperament: one plays a day. */
export const DEFAULT_TALKS: Readonly<Record<TalkStage, Readonly<Record<Temperament, readonly string[]>>>> = {
  acquaintance: {
    breezy: [
      '{name} skids to a stop. “Oh, hi! You’re the one with the farm, right? {farmer}?”',
      '“I can’t sit still on a day like this. Want to walk a bit?”',
      '{name} grins. “Ask me anything. Quick, before I run off.”',
      '“I love {work}. Is that strange? It’s the best kind of busy.”',
    ],
    steady: [
      '{name} nods to you. “Good day, {farmer}. How are your fields?”',
      '“I like a slow morning. Tea, a long look at the sky, then work.”',
      '{name} smiles politely. “We haven’t talked much yet. I’d like to.”',
      '“I’ve always liked {work}. It doesn’t hurry, and neither do I.”',
    ],
    bold: [
      '{name} sizes you up. “So you’re the new farmer. Strong enough for it?”',
      '“If something heavy needs moving, call me.”',
      '{name} laughs. “Don’t look so serious. I don’t bite.”',
      '“I’m good at {work}. Very good. You’ll see.”',
    ],
    gritty: [
      '{name} brushes off her gloves. “Rough start on the farm? Every start is rough.”',
      '“Keep at it. That’s the whole secret.”',
      '{name} nods once. “You work hard. I noticed.”',
      '“Give me a day of {work} and I’ll give it everything.”',
    ],
    clever: [
      '{name} looks up from a notebook. “Ah, {farmer}. I was just reading about soil.”',
      '“The valley’s rain comes from the west. I keep a log.”',
      '{name} tilts her head. “You’re an interesting one. I haven’t worked you out yet.”',
      '“I could tell you all about {work}. Stop me if I go on too long.”',
    ],
  },
  friend: {
    breezy: [
      '{name} bumps your shoulder. “There you are! I’ve been looking all over.”',
      '“Race you to the fence? Loser carries the water.”',
      '“I saw {good} at the market and thought of you. Then I bought it for me.”',
      '{name} spins around. “Today feels lucky. Can you feel it?”',
    ],
    steady: [
      '{name} hands you a cup. “Tea. You look like you need it.”',
      '“You don’t have to talk. It’s nice just sitting here.”',
      '“Nothing makes my day like {good}. Except good company.”',
      '{name} smiles. “You’re a good friend, {farmer}. I mean that.”',
    ],
    bold: [
      '{name} claps you on the back. “Morning! Ready to work?”',
      '“Arm wrestle later? I’ll go easy on you. Maybe.”',
      '“Anyone gives you trouble in town, you send them to me.”',
      '{name} grins. “We make a good team. Don’t let it go to your head.”',
    ],
    gritty: [
      '{name} hands you a spare pair of gloves. “Yours were wearing through.”',
      '“I trained through worse weather than this. You’ll be fine.”',
      '“You kept going yesterday when anyone else would have stopped. I respect that.”',
      '{name} nods at the field. “We finish this together. Deal?”',
    ],
    clever: [
      '{name} shows you a sketch. “I drew a better layout for your fields. Thoughts?”',
      '“I timed your morning chores. You could save ten minutes. Want to know how?”',
      '“I’ve read everything there is about {good}. Ask me a question. Any question.”',
      '{name} smiles. “Talking with you is the best part of my day. Logically speaking.”',
    ],
  },
  farmhand: {
    breezy: [
      '{name} jogs up. “Done already! What’s next, boss?”',
      '“Working on your farm is the most fun I’ve had in ages.”',
      '{name} wipes her brow, laughing. “I was faster than yesterday. I counted.”',
      '“Same time tomorrow? I’ll be here before the sun.”',
    ],
    steady: [
      '{name} sets down her tools. “The morning’s work is done. Nice and even.”',
      '“I like working here. Everything has its place.”',
      '“Take a break, {farmer}. I’ve got this row.”',
      '{name} smiles. “I’m getting better at {work}. Slowly, but I am.”',
    ],
    bold: [
      '{name} drops a full crate at your feet. “Light work. Got anything heavier?”',
      '“I worked twice as hard as you asked. You’re welcome.”',
      '{name} flexes. “This farm’s lucky to have me. And you, I suppose.”',
      '“Tell me where you need me and stand back.”',
    ],
    gritty: [
      '{name} straightens up, muddy to the knees. “Done. It fought me, but it’s done.”',
      '“I’ll stay late tonight. The work isn’t finished, so neither am I.”',
      '“Every day I’m a little better at {work}. That’s all I ask.”',
      '{name} nods at the fields. “This place is worth the sweat.”',
    ],
    clever: [
      '{name} taps her clipboard. “I logged today’s yield. We’re up from last week.”',
      '“I’ve worked out a faster way to go about {work}. Let me show you.”',
      '“The farm runs like a good clock now. I like clocks.”',
      '{name} smiles. “Working here was the right call. I ran the numbers.”',
    ],
  },
  sweetheart: {
    breezy: [
      '{name} runs up and stops short, suddenly shy. “Hi. I missed you.”',
      '“I keep grinning for no reason. It’s your fault, you know.”',
      '{name} takes your hand and swings it. “Walk with me? Slowly, for once.”',
      '“My heart’s racing, and I haven’t even run today.”',
    ],
    steady: [
      '{name} smooths your collar. “There. Now you look ready for the day.”',
      '“I think about you when I’m busy with {work}. Every time.”',
      '{name} leans against you for a moment. “This. I like this.”',
      '“Come and find me this evening? I’ll make tea for two.”',
    ],
    bold: [
      '{name} kisses your cheek, quick and fierce. “Don’t make that face. You liked it.”',
      '“Anyone asks, I’m yours. I already told half the town.”',
      '{name} pulls you close. “Mine. Just so we’re clear.”',
      '“I’m not good at soft words. So I’ll just stand here, close.”',
    ],
    gritty: [
      '{name} looks away, cheeks red. “I don’t say this easily. I’m glad it’s you.”',
      '“I’d go through any storm for you. You know that, right?”',
      '{name} squeezes your hand hard. “Don’t let go yet.”',
      '“I used to only think about winning. Now I think about you.”',
    ],
    clever: [
      '{name} hides behind her notebook. “I wrote your name in the margins. Twice. Three times.”',
      '“I tried to work out why I like you so much. I gave up. Happily.”',
      '{name} leans close. “My heart beats faster when you’re here. I measured.”',
      '“Let’s do nothing at all tonight. Together. That’s my whole plan.”',
    ],
  },
  engaged: {
    breezy: [
      '{name} holds her hand up to the light. “I keep looking at the ring. It sparkles when I run.”',
      '“I want the wedding tomorrow. No, today. Is today too soon?”',
      '{name} twirls. “Engaged! I love that word.”',
      '“I told the whole track. Twice. They’re very happy for us.”',
    ],
    steady: [
      '{name} touches her ring. “I keep checking it’s still there. It always is.”',
      '“I’ve started a list for the wedding. A calm one. Mostly flowers.”',
      '{name} smiles softly. “Soon I’ll be your wife. I like how that sounds.”',
      '“No rush. We have the rest of our lives.”',
    ],
    bold: [
      '{name} shows her ring to anyone nearby. “See this? He asked. I said yes.”',
      '“I’ll carry you over the threshold if I have to. Don’t think I won’t.”',
      '“Our wedding is going to be loud. And huge. And perfect.”',
      '{name} grins. “My groom. Get used to hearing that.”',
    ],
    gritty: [
      '{name} turns the ring on her finger. “I made a promise. I keep those.”',
      '“I’ve never been so sure of anything. Not even a race.”',
      '“Whatever comes, we face it together. That’s what this ring means.”',
      '{name} nods to herself. “Soon. Very soon.”',
    ],
    clever: [
      '{name} spreads out papers. “I’ve planned the wedding three ways. You pick.”',
      '“I’ve counted the days until the wedding. I’ll tell you if you ask nicely.”',
      '{name} studies her ring. “By every measure, this is the best decision I’ve made.”',
      '“Husband. I’ve been practising the word. It fits you.”',
    ],
  },
  married: {
    breezy: [
      '{name} kisses you good morning. “Up, up! The day won’t wait.”',
      '“I raced home just to see you. Worth it.”',
      '{name} laughs. “I still can’t believe I get you every single day.”',
      '“Let’s take the long way home tonight, husband.”',
    ],
    steady: [
      '“Good morning. I made too much tea again.”',
      '{name} straightens your collar. “There. Now you’re ready.”',
      '“Home feels like home because you’re in it.”',
      '{name} hums as she works. “A good day of {work}, then supper with you. Perfect.”',
    ],
    bold: [
      '{name} hugs you from behind. “Caught you. My husband, all mine.”',
      '“I told the whole market we’re the best couple in the valley. Nobody argued.”',
      '“Eat a proper breakfast. I need you strong.”',
      '{name} grins. “Marrying you was the best decision of my life. Then {good}. Then you again.”',
    ],
    gritty: [
      '“Don’t work too hard. Come back to me in one piece.”',
      '{name} rests her head on your shoulder. “Tired. Happy. Both.”',
      '“Whatever the day brings, I’ll be here at the end of it.”',
      '{name} squeezes your hand. “Every hard day is easier with you.”',
    ],
    clever: [
      '{name} reads from her notes. “Another day married to you. Results: excellent.”',
      '“I worked out why our home feels so warm. It’s you. And the stove.”',
      '{name} smiles over her book. “Stay a while. You’re my favourite page.”',
      '“I’ve planned tomorrow already. Step one: wake up next to you.”',
    ],
  },
}

// --- Gift reactions -----------------------------------------------------------------------------------------------------

/** What she says to a gift, by her taste for it: `{gift}` is the good given. */
export const DEFAULT_GIFT_REACTIONS: Readonly<Record<Taste, readonly string[]>> = {
  loved: [
    '{name} lights up. “{gift}! You remembered. I love it.”',
    '“For me? {gift}? Oh, you’re wonderful, {farmer}.”',
    '{name} beams. “My favourite. How did you know?”',
  ],
  liked: [
    '{name} smiles. “{gift}? That’s lovely. Thank you.”',
    '“Oh, nice. I like this a lot.”',
    '{name} turns it over in her hands. “Thoughtful. Thank you, {farmer}.”',
  ],
  neutral: [
    '{name} nods. “Thank you. That’s kind of you.”',
    '“{gift}? Thank you. I’ll find a use for it.”',
    '“Oh, for me? Thank you.”',
  ],
  disliked: [
    '{name} thanks you, a little puzzled.',
    '“Oh. {gift}. That’s… thank you, really.”',
    '{name} smiles politely. “It’s the thought that counts.”',
  ],
}

// --- Her events ---------------------------------------------------------------------------------------------------------

/** Meeting her at the Gate (the welcome list's): her moment, her lines and your hello. */
const GATE_MEETING = scene('Someone new is waiting at the Gate.', [
  say('Hi! Is this the farm? I heard someone took the old place on.', 'happy'),
  say('I had to come and see for myself. It’s lovely. A little wild, but lovely.', 'surprised'),
  say('I’m good at {work}, if you ever need a hand.', 'determined'),
  choose('friendship', ['Welcome! We’re glad you came.', say('Then I’ll be around. A lot, probably.', 'laughing')],
    ['Hello! Come on in.', say('Don’t mind if I do.', 'happy')]),
], { place: 'gate' })

/** Meeting her in town: you introduce yourself. */
export const DEFAULT_TOWN_MEETING: DefaultScene = scene('You introduce yourself, and the time slips by.', [
  say('Oh! You’re the one who took on the farm up the road.', 'surprised'),
  say('Most days you’ll find me busy with {work}, when I’m not in town.', 'happy'),
  say('I’m glad we got talking, {farmer}. Tell me about your farm sometime?', 'tender'),
  choose('friendship', ['I’d like that. Come and see it.', say('I will. Don’t be surprised when I turn up.', 'laughing')],
    ['Only if you tell me about you.', say('Deal. But you go first.', 'teasing')]),
], { place: 'town' })

/** Her events by id: the route's rungs (her meeting at the Gate as `arrival`), then the wedding night, moving in and married
 * life 2 and 4 (the rungs are S1, S3 and S5), then her occasions. */
export const DEFAULT_EVENTS: Readonly<Record<string, DefaultScene>> = {
  arrival: GATE_MEETING,
  f1: scene('A quiet afternoon with her.', [
    say('It’s so quiet out here. I didn’t know I needed quiet.', 'thinking'),
    say('In town everything moves so fast. Here I can hear myself think.', 'tender'),
    choose('friendship', ['Stay as long as you like.', say('Careful. I might take you up on that.', 'happy')],
      ['It’s quiet until the chickens wake up.', say('Then I’ll enjoy it while it lasts.', 'laughing')]),
  ]),
  f2: scene('She shows you her favourite corner of the farm.', [
    say('Come here, look. From this spot you can see the whole valley.', 'happy'),
    say('I sit here after a day of {work}. It’s my secret. Well, ours now.', 'shy'),
    choose('friendship', ['Thank you for sharing it.', say('I knew you’d like it.', 'tender')],
      ['I’ll pretend I never saw it.', say('Too late. You’re sworn to secrecy.', 'teasing')]),
  ]),
  f3: scene('You share a snack on the fence rail.', [
    say('Want half? I always pack too much.', 'happy'),
    say('Mm. Nothing tastes better than food after real work.', 'laughing'),
    choose('friendship', ['Thanks. This is nice.', say('It is. Let’s make it a habit.', 'tender')],
      ['I’ll take the bigger half.', say('Hey! Fine. This once.', 'pouting')]),
  ]),
  f4: scene('She asks how the farm came to be yours.', [
    say('So how did you end up with this place, {farmer}?', 'thinking'),
    choose('friendship', ['It was a fresh start. I needed one.', say('So did I, when I stopped racing. I understand.', 'tender')],
      ['I lost a bet. Badly.', say('Liar! But I like that story better.', 'laughing')]),
  ]),
  f5: scene('You work side by side until the light turns gold.', [
    say('We got so much done. I lost track of time.', 'surprised'),
    say('Working next to you is easy. I like it.', 'happy'),
    choose('friendship', ['Same time tomorrow?', say('Same time tomorrow.', 'happy')],
      ['You only came for the snacks.', say('The snacks are a bonus.', 'teasing')]),
  ]),
  f6: scene('She laughs at a joke you didn’t mean to make.', [
    say('Wait, say that again. Oh, you meant it!', 'laughing'),
    say('Sorry, sorry. You just make me laugh, {farmer}.', 'embarrassed'),
    choose('friendship', ['I’ll take it. You have a nice laugh.', say('Now you’re making me blush.', 'flustered')],
      ['I meant it to be funny. Obviously.', say('Sure you did.', 'teasing')]),
  ]),
  f7: scene('A long walk home, talking the whole way.', [
    say('I can’t remember the last time I talked this much.', 'happy'),
    say('My old team would never believe it. I was the quiet one.', 'thinking'),
    choose('friendship', ['I like hearing you talk.', say('Then I won’t stop.', 'laughing')],
      ['You? Quiet? Never.', say('People change. You changed me a little.', 'shy')]),
  ]),
  f8: scene('She tells you something she hasn’t told anyone here.', [
    say('Can I tell you something? I miss racing. Some days, a lot.', 'sad'),
    say('But here, I’m starting to feel like I have something new to run toward.', 'tender'),
    choose('friendship', ['I’m glad you told me.', say('I’m glad it was you I told.', 'tender')],
      ['Then let’s find you a finish line here.', say('You always know what to say.', 'happy')], 'honest'),
  ]),
  f9: scene('You mend a broken gate together.', [
    say('Hold it steady… there!', 'determined'),
    say('Look at that. It swings like new.', 'happy'),
    choose('friendship', ['We make a good team.', say('The best on the farm.', 'smug')],
      ['I did most of it, right?', say('You held it. I did the rest.', 'teasing')]),
  ]),
  f10: scene('She waits for you at the end of the day.', [
    say('There you are. I waited. I hope that’s all right.', 'shy'),
    say('I wanted to give you something. A keepsake, for luck.', 'tender'),
    say('You’ve become someone important to me, {farmer}.', 'tender'),
    choose('friendship', ['You’re important to me too.', say('Then that’s settled.', 'happy')],
      ['I’ll keep it with me always.', say('Good. It’s meant to be kept close.', 'tender')], 'honest'),
  ]),
  confession: scene('She asks you to stay after everyone else has gone.', [
    say('Everyone’s gone home. I asked you to stay because…', 'flustered'),
    say('Because I like you, {farmer}. More than a friend.', 'shy'),
    say('Do you feel the same?', 'worried'),
    {
      choice: [
        { text: 'I do. I really do.', tone: 'warm', romance: 2, answer: 'yes', then: [say('Then let’s see where this goes.', 'tearful-joy')] },
        { text: 'Can we take it slowly?', tone: 'honest', friendship: 1, answer: 'not-yet', then: [say('Okay. I’ll be right here.', 'tender')] },
      ],
    },
  ]),
  r1: scene('Your first evening together, just the two of you.', [
    say('So this is what a date feels like. My heart won’t settle.', 'flustered'),
    say('I’m glad it’s you across from me.', 'shy'),
    choose('romance', ['I’ve wanted this for a long time.', say('Me too. Longer than I’d admit.', 'loving')],
      ['Relax. I’m nervous enough for both of us.', say('Somehow that helps.', 'laughing')]),
  ]),
  r2: scene('She holds your hand all the way home.', [
    say('Your hand’s warm. I’m not letting go.', 'tender'),
    say('Is it silly that this is my favourite part?', 'shy'),
    choose('romance', ['It’s mine too.', say('Then the long way home it is.', 'happy')],
      ['Let’s walk slower, then.', say('Slower. I like that.', 'dreamy')]),
  ]),
  r3: scene('A picnic for two, with far too much food.', [
    say('I made everything. Twice, in case the first lot went wrong.', 'embarrassed'),
    say('I wanted it to be perfect for you.', 'shy'),
    choose('romance', ['It is perfect.', say('Then eat up. All of it.', 'laughing')],
      ['We’ll be eating this for a week.', say('That’s the plan. More picnics.', 'teasing')]),
  ], { outfit: 'garden-party' }),
  r4: scene('She leans on your shoulder and watches the clouds.', [
    say('That one looks like a horse. A fast one.', 'happy'),
    say('I could stay like this all afternoon.', 'dreamy'),
    choose('romance', ['Then let’s.', say('Mm. Good.', 'loving')],
      ['That one looks like you, mid-race.', say('Then it’s winning.', 'smug')]),
  ]),
  r5: scene('You cook supper together and only burn a little.', [
    say('Is it supposed to smoke like that?', 'startled'),
    say('Don’t laugh! Okay, laugh. It’s still the best supper I’ve had.', 'laughing'),
    choose('romance', ['Because we made it together.', say('Exactly that.', 'loving')],
      ['Next time, I hold the spoon.', say('Next time, we order from town.', 'teasing')]),
  ]),
  r6: scene('A slow dance with no music at all.', [
    say('There’s no music.', 'shy'),
    say('I don’t care. Dance with me anyway?', 'tender'),
    choose('romance', ['Always.', say('Then lead. I’ll follow.', 'loving')],
      ['I’ll hum. Badly.', say('Perfect. Keep humming.', 'laughing')]),
  ]),
  r7: scene('She saves you the best seat by the fire.', [
    say('I kept this seat warm for you. Literally. I sat in it.', 'teasing'),
    say('Come here. There’s room for two if we squeeze.', 'tender'),
    choose('romance', ['Squeezing sounds nice.', say('It is nice.', 'loving')],
      ['You stole my seat, then.', say('And now I’m giving it back. With me in it.', 'smug')]),
  ]),
  r8: scene('You count the stars until you both lose track.', [
    say('Three hundred and… I lost count again.', 'laughing'),
    say('Let’s start over. I don’t want this night to end.', 'dreamy'),
    choose('romance', ['Then it doesn’t have to.', say('Promise?', 'loving')],
      ['You made up half of those.', say('Only a third.', 'teasing')]),
  ]),
  r9: scene('She talks about the years ahead, and you’re in all of them.', [
    say('I keep picturing it. The farm, the seasons, us.', 'dreamy'),
    say('Is that too much? It doesn’t feel like too much.', 'worried'),
    choose('romance', ['It’s not too much. I see it too.', say('Then it’s real.', 'tearful-joy')],
      ['Do the years ahead have snacks?', say('So many snacks.', 'laughing')]),
  ]),
  r10: scene('A quiet night when nothing needs saying.', [
    narrate('She rests her head on your shoulder, and the evening settles around you both.'),
    say('I love you, {farmer}.', 'loving'),
    choose('romance', ['I love you too.', say('I know. I just wanted to hear it.', 'tearful-joy')],
      ['I was hoping you’d say it first.', say('Now you have to say it back.', 'teasing')]),
  ]),
  proposal: scene('You find a quiet moment and hold out the ring.', [
    say('Is that… for me?', 'startled'),
    say('Yes. Of course, yes.', 'tearful-joy'),
    choose('romance', ['I love you.', say('I love you. I can’t stop smiling.', 'loving')],
      ['You had me worried for a second.', say('I was never going to say anything else.', 'laughing')]),
  ]),
  wedding: scene('The bell rings, and everyone you love is here.', [
    say('Look at everyone. They all came for us.', 'tearful-joy'),
    say('You look so handsome. My groom.', 'shy'),
    say('I’m ready. Are you?', 'tender'),
    {
      choice: [
        { text: 'Always.', tone: 'warm', romance: 2, then: [say('Then I’m yours. Always.', 'tearful-joy')] },
        { text: 'I promise to keep you laughing.', tone: 'playful', romance: 1, then: [say('Then I promise to laugh at every joke. Even the bad ones.', 'laughing')] },
        { text: 'I’ll be here, every day.', tone: 'honest', romance: 1, then: [say('Every day. I’ll hold you to it.', 'loving')] },
      ],
    },
    narrate('The bell rings again, and the whole valley cheers.'),
  ]),
  'wedding-night': scene('The guests have gone home. The house is quiet, and the lamps are low.', [
    say('It’s just us now.', 'shy'),
    say('I keep looking at you, and I can’t believe you’re my husband.', 'flustered'),
    say('Come here. Hold me a while?', 'tender'),
    choose(null, ['I’m not going anywhere.', say('Good. Neither am I.', 'loving')],
      ['For as long as you like.', say('Forever, then.', 'dreamy')]),
    narrate('She takes your hand, and the night closes softly around you both.'),
    { wait: 1200 },
    narrate('Morning comes gold through the curtains.'),
    say('Good morning, husband.', 'sleepy'),
    say('I could get used to waking up like this.', 'loving'),
  ], { outfit: 'wedding-night' }),
  'moving-in': scene('A cart of her things rolls up the lane to the farm.', [
    say('That’s the last box. I think.', 'happy'),
    say('It feels strange. Good strange. This is home now.', 'tender'),
    choose(null, ['Welcome home.', say('Welcome home to us both.', 'tearful-joy')],
      ['You brought a lot of boxes.', say('And I’m keeping every one.', 'laughing')]),
    say('I’ll be up early for {work}. Wake me if I oversleep?', 'happy'),
  ]),
  s1: scene('Your first morning at home together.', [
    say('Morning. You snore, did you know? Softly. It’s sweet.', 'teasing'),
    say('I made breakfast. Sit. Eat. I’m watching.', 'happy'),
    choose('romance', ['This is the life.', say('Our life.', 'loving')],
      ['I do not snore.', say('You do. I don’t mind.', 'laughing')]),
  ]),
  s2: scene('She brings lunch out to you at noon.', [
    say('You forgot to eat again. Honestly, husband.', 'pouting'),
    say('Sit with me a minute. The work will wait.', 'tender'),
    choose(null, ['Thank you, love.', say('Anytime. Every time.', 'happy')],
      ['I was just about to stop.', say('Sure you were.', 'teasing')]),
  ]),
  s3: scene('A lazy afternoon with nowhere to be.', [
    say('No chores, no plans. Just us and the sun.', 'dreamy'),
    say('I could fall asleep right here on your shoulder.', 'sleepy'),
    choose('romance', ['Then do.', say('Wake me for supper.', 'sleepy')],
      ['I’ll count to ten.', say('One… two…', 'sleepy')]),
  ]),
  s4: scene('Rain all day, and nowhere else to be.', [
    say('Listen to it. I love the rain when I’m inside with you.', 'tender'),
    say('Tell me a story. Any story.', 'happy'),
    choose(null, ['Once there was a farmer who met an Uma…', say('I know this one. It ends well.', 'loving')],
      ['Once there was a very loud rooster…', say('Not that one!', 'laughing')]),
  ]),
  s5: scene('You renew your vows on a quiet evening.', [
    say('Do you remember what you promised me?', 'thinking'),
    say('I remember every word. I’d say mine again, right now.', 'tender'),
    choose('romance', ['Then let’s say them again.', say('I do. Still. Always.', 'tearful-joy')],
      ['I promised to keep you laughing.', say('And you have. Every day.', 'laughing')]),
  ]),
  // Her occasions: they play on their day, at any stage, so they read for a friend and a wife alike.
  birthday: scene('{name} has a birthday today.', [
    say('You remembered my birthday!', 'surprised'),
    say('I didn’t want a fuss. But I’m glad you made one.', 'shy'),
    choose(null, ['Happy birthday.', say('Best one yet. Because you’re in it.', 'happy')],
      ['Make a wish.', say('Already did. Not telling.', 'teasing')]),
  ], { outfit: 'dinner' }),
  'new-year': scene('The first morning of the year, crisp and bright.', [
    say('Happy New Year, {farmer}!', 'happy'),
    say('I tied a wish to the tree in the square. Can you guess what it was?', 'teasing'),
    choose(null, ['A good year for {work}?', say('Close. A good year, with good people.', 'tender')],
      ['More {good}?', say('Ha! That too.', 'laughing')]),
  ], { outfit: 'kimono' }),
  'flower-show': scene('The square is full of flowers today.', [
    say('Look at all the colours! I want to see every stall.', 'happy'),
    say('This one smells like the meadow by the old track.', 'dreamy'),
    choose(null, ['It suits you.', say('The flower, or the meadow?', 'teasing')],
      ['Let’s see every stall, then.', say('Every single one. Come on!', 'laughing')]),
  ], { outfit: 'garden-party' }),
  'fishing-derby': scene('Lanterns hang over the water for the derby night.', [
    say('Did you catch anything? I caught a boot. Twice.', 'pouting'),
    say('Stay for the lanterns? They light them all at once.', 'tender'),
    choose(null, ['I wouldn’t miss it.', say('Look, there they go.', 'dreamy')],
      ['Only if you show me the boot.', say('It’s a very good boot.', 'laughing')]),
  ], { outfit: 'kimono' }),
  'cooking-contest': scene('The square smells of a hundred kitchens.', [
    say('Taste this! No, wait, taste this one first.', 'happy'),
    say('One more bite and you’ll have to roll me home.', 'laughing'),
    choose(null, ['I’d roll you home gladly.', say('My hero.', 'teasing')],
      ['Which one won?', say('Ours, obviously. We ate the most.', 'smug')]),
  ]),
  'animal-show': scene('Every animal in the valley is brushed and ribboned today.', [
    say('Look at that one’s ribbon! It’s bigger than its head.', 'laughing'),
    say('Next year, ours wins. I’ve decided.', 'determined'),
    choose(null, ['Next year, ours wins.', say('That’s the spirit.', 'happy')],
      ['Ours wins at being fluffy.', say('That counts. It should count.', 'pouting')]),
  ]),
  'harvest-cup': scene('The Harvest Cup: the whole valley turns out under the lanterns.', [
    say('Win or lose, this was a good year.', 'tender'),
    say('I’m glad I spent it here. With you.', 'shy'),
    choose(null, ['Here’s to the next one.', say('To the next one. And the one after.', 'happy')],
      ['We definitely won.', say('We definitely won.', 'laughing')]),
  ], { outfit: 'kimono' }),
}

/** Her occasions: they play on their day (the calendar's). */
export const DEFAULT_OCCASIONS = OCCASIONS
/** Her life's events past the route's rungs: the wedding night, moving in, and married life 2 and 4. */
export const DEFAULT_LIFE_EVENTS = LIFE_EVENTS

// --- Evenings -----------------------------------------------------------------------------------------------------------

/** A scene for each evening: `hangout-<kind>` for a friend, `date-<kind>` for a sweetheart or a spouse, and the two evenings
 * of their own (Dinner in town, A night in). Lines only: the evening's play is its game. */
export const DEFAULT_EVENINGS: Readonly<Record<string, DefaultScene>> = {
  'hangout-walk': scene('You walk the lanes as the light goes.', [say('I love this time of day. Everything slows down.', 'happy'), say('Same time next week?', 'tender')]),
  'hangout-fishing': scene('Two lines in the water, and the evening quiet.', [say('Shh. I think something’s biting.', 'determined'), say('Or it’s weed. It’s always weed.', 'laughing')]),
  'hangout-picnic': scene('A blanket on the grass, and a basket between you.', [say('I brought the good bread. Don’t tell anyone.', 'teasing'), say('This was a good idea. Mine, obviously.', 'smug')], { outfit: 'garden-party' }),
  'hangout-market': scene('The market’s last stalls are packing up.', [say('Quick, the sweet stall’s still open!', 'happy'), say('Half for you. Okay, a third.', 'teasing')]),
  'hangout-cooking': scene('Flour everywhere, and something nearly ready.', [say('A pinch more salt. No, a pinch. That’s a handful!', 'surprised'), say('It’s edible! We did it.', 'laughing')]),
  'hangout-festival': scene('Lanterns over the square, and music somewhere.', [say('Stay close or we’ll lose each other in the crowd.', 'happy'), say('That was fun. Let’s do the next one too.', 'tender')], { outfit: 'kimono' }),
  'date-walk': scene('A walk at dusk, just the two of you.', [say('Hold my hand? The path’s dark here.', 'shy'), say('It isn’t really. I just wanted to hold it.', 'loving')]),
  'date-fishing': scene('The Pond at dusk, the water like glass.', [say('I don’t even care if we catch anything.', 'tender'), say('This is the catch. You and me, here.', 'loving')]),
  'date-picnic': scene('A picnic for two in the long grass.', [say('I made your favourites. And mine. Mostly mine.', 'teasing'), say('Lie back. Look at the sky with me.', 'dreamy')], { outfit: 'garden-party' }),
  'date-market': scene('Arm in arm through the evening market.', [say('Everyone’s looking at us. Let them.', 'smug'), say('Buy me something silly. I’ll keep it forever.', 'happy')]),
  'date-cooking': scene('Supper for two, cooked together.', [say('You stir, I’ll taste. That’s fair.', 'teasing'), say('Perfect. Because you made it with me.', 'loving')]),
  'date-crafting': scene('Two pairs of hands, and something taking shape.', [say('Hold this still. Steady… steady…', 'determined'), say('We made this. Together. I’m keeping it.', 'tender')]),
  'date-stargazing': scene('The overlook, and more stars than you can count.', [say('Make a wish. Quick, before it’s gone!', 'surprised'), say('I didn’t need one. Mine already came true.', 'loving')]),
  'date-dance': scene('A dance under the lanterns.', [say('Don’t look at your feet. Look at me.', 'tender'), say('See? You’re a natural.', 'happy')]),
  'date-boat': scene('A boat on the lake, the oars resting.', [say('Let’s just drift a while.', 'dreamy'), say('If we tip over, I’m blaming you.', 'teasing')]),
  'date-footrace': scene('The hilltop track at sunset, and her old grin.', [say('Ready? I won’t go easy. I never do.', 'determined'), say('That was the most fun I’ve had in years.', 'laughing')]),
  'date-festival': scene('The festival night, glowing with lanterns.', [say('Walk with me? I want to see everything with you.', 'tender'), say('This is my favourite night of the season.', 'loving')], { outfit: 'kimono' }),
  'dinner-in-town': scene('Dinner in town, a table by the window.', [say('Candles and everything. You went all out.', 'surprised'), say('I could get used to this. To you.', 'loving')], { outfit: 'dinner' }),
  'a-night-in': scene('A night in: blankets, tea and nowhere to be.', [say('Shove over. You’re hogging the blanket.', 'teasing'), say('This is my favourite kind of night.', 'sleepy')], { outfit: 'pajamas' }),
}

// --- Married life -------------------------------------------------------------------------------------------------------

/** The night's companion's morning greetings, by temperament: one plays the morning after. */
export const DEFAULT_MORNINGS: Readonly<Record<Temperament, readonly string[]>> = {
  breezy: ['{name} bounces on the bed. “Morning! You’re awake. Finally!”', '“I’ve been up for ages. Okay, five minutes.”', '{name} yawns and grins. “Race you to breakfast.”'],
  steady: ['{name} smiles from the pillow. “Good morning. Sleep well?”', '“Stay a moment. The day can wait.”', '“I’ll put the kettle on. Don’t move.”'],
  bold: ['{name} throws open the curtains. “Up! Big day. Every day’s a big day.”', '“You stole the blanket. I stole it back.”', '{name} kisses your forehead. “Morning, husband. Get moving.”'],
  gritty: ['{name} is already dressed. “Morning. I let you sleep. You earned it.”', '“Cold out. Wear the thick socks.”', '{name} squeezes your hand. “Good night. Better morning.”'],
  clever: ['{name} peers over her book. “Good morning. You talked in your sleep. Nothing alarming.”', '“I worked out the perfect time to wake you. It’s now.”', '“Breakfast in four minutes. I timed it.”'],
}

/** Lines for the household's meals: one plays as you sit down. */
export const DEFAULT_MEALS: Readonly<Record<'breakfast' | 'dinner', readonly string[]>> = {
  breakfast: ['“Eggs, toast and you. Best breakfast.”', '{name} pours the tea. “Eat up. Big day.”', '“Mm. You cook better every week.”'],
  dinner: ['“Supper together. My favourite part of the day.”', '{name} raises her cup. “To a good day of {work}.”', '“Seconds? I’m having seconds.”'],
}

// --- Her words: her favourite good and her line's work ------------------------------------------------------------------

/** Her favourite good while her story names none, by her line: what `{good}` says, and the gift she loves. */
export const DEFAULT_GOODS: Readonly<Record<Activity, string>> = {
  farming: 'peach', ranch: 'honey', mining: 'amethyst', fishing: 'seashell', foraging: 'chestnut', cooking: 'cinnamon', serving: 'chocolate', forging: 'garnet',
  expeditions: 'honey',
}
/** Her favourite good with no line at all (someone master data doesn't hold, and no story). */
export const DEFAULT_GOOD = 'honey'
/** What `{work}` says, by her line. */
export const WORK_WORDS: Readonly<Record<Activity, string>> = {
  farming: 'farming', ranch: 'tending the animals', mining: 'mining', fishing: 'fishing', foraging: 'foraging', cooking: 'cooking', serving: 'serving', forging: 'forging',
  expeditions: 'exploring',
}
/** `{work}` with no line at all. */
export const DEFAULT_WORK = 'farm work'
