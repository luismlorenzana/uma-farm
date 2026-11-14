// What she thinks of a gift, by name. Her talks and her gift reactions are the default story's
// (`story/default-story.ts`) wherever her own story is silent. Light: the story pack's tastes and the acts read these.

/** What she thinks of a good as a gift (`tasteOf`: her bible's, else her favourite good loved). */
export const TASTES = ['loved', 'liked', 'neutral', 'disliked'] as const
export type Taste = typeof TASTES[number]
