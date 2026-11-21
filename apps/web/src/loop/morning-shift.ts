import { settleCrewShift, type FarmSave } from '@farm/domain'
import { masterReady } from '../master/master'
import { storyReady } from '../story/story'
import { talentsFor } from './talents'
import { libraryChange } from '../library/changes'

export async function finishMorningShift(save: FarmSave): Promise<FarmSave> {
  const [view, pack] = await Promise.all([masterReady(), storyReady()])
  return libraryChange(save, settleCrewShift(save, talentsFor(view), pack), pack)
}
