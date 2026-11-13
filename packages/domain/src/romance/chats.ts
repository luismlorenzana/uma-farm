// What she thinks of a gift, by name, and the chats' fallback lines: five a temperament, said before her authored chats
// start (Friendship 1) or when her bible has none. `{name}` is filled in by the app. Light: the story pack's tastes and
// the acts read these.
import type { Temperament } from '../farm/talents'

/** What she thinks of a good as a gift (`tasteOf`, from her bible). */
export const TASTES = ['loved', 'liked', 'neutral', 'disliked'] as const
export type Taste = typeof TASTES[number]

/** A short line by her temperament, original text; her authored chats replace them. */
export const CHAT_LINES: Readonly<Record<Temperament, readonly string[]>> = {
  breezy: [
    '{name} jogs over. “Morning! I lapped the fence twice already.”',
    '“The wind’s good today,” says {name}. “Running weather.”',
    '{name} grins. “Don’t blink. I’ll be done before you know it.”',
    '“Can I take the long way to the Pond? It’s the fun way.”',
    '{name} bounces on her heels. “What’s next? Something quick?”',
  ],
  steady: [
    '{name} nods. “The rows don’t rush, so neither do I.”',
    '“Slept well. Ready for a full day,” says {name}.',
    '“Steady hands, steady harvest,” {name} says.',
    '{name} wipes her brow. “Hard work feels good out here.”',
    '“One more row, then tea?”',
  ],
  bold: [
    '{name} cracks her knuckles. “Give me the heaviest job you’ve got.”',
    '“Logs, rocks, crates. I’ll carry the lot,” says {name}.',
    '{name} laughs. “Is that all? I barely broke a sweat.”',
    '“If something’s stuck, point me at it.”',
    '{name} rolls her shoulders. “Strong legs, strong arms. Let’s go.”',
  ],
  gritty: [
    '{name} sets her jaw. “Rain or shine, I’ll finish it.”',
    '“Tired? Me? Not yet,” says {name}.',
    '{name} brushes off the dirt. “Fell once. Got up twice.”',
    '“Hard days make the good ones taste better.”',
    '{name} tightens her gloves. “I don’t stop halfway.”',
  ],
  clever: [
    '{name} taps her notebook. “I counted the carrots. Twice.”',
    '“Fish bite best just after the clouds pass,” says {name}.',
    '{name} squints at the sky. “Rain by evening, I’d guess.”',
    '“I’ve a plan for the Fields. It has three parts.”',
    '{name} smiles. “Ask me anything about the farm.”',
  ],
}
