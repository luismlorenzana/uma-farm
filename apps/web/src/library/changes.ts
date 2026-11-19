import { festivalsOf, finishLibraryChanges, NO_BIRTHDAYS, type FarmSave, type SpecialDays, type StoryPack } from '@farm/domain'
import { specialDays, storyPack } from '../story/story'

export function libraryChange(before: FarmSave, after: FarmSave, pack: StoryPack | null = storyPack(), days?: SpecialDays): FarmSave {
  if (!pack || (before.library === after.library && before.roster === after.roster && before.love === after.love
    && before.memories === after.memories && before.arrivals === after.arrivals)) return after
  return finishLibraryChanges(before, after, pack, days ?? specialDays() ?? { festivals: festivalsOf(pack), birthdays: NO_BIRTHDAYS })
}
