// The farm's side of uma-kit/work (from uma-rpg apps/web/src/places/work/FacilityPage.tsx's provider at 30a322a, F5): the
// kit owns the slot rows, the job sheet, queues, Recall and Repeat; the farm supplies its save, env, actions, names and
// words. No Speed Tickets (FM4): with no speed-up or finish action, the kit hides the control. No upgrades: places have
// none.
import { checkRestartStopped, farmWorkEnv, placeById, refusalText, stockName, type FarmQueueInput, type FarmWorkRequest, type Save } from '@farm/domain'
import { WorkProvider, type WorkActions } from '@luismlorenzana/uma-kit/work'
import { useMemo, type ReactNode } from 'react'
import type { MasterView } from '../../master/master'
import { collectWork, dismissWork, editWorkQueue, recallWork, repeatWork, restartWork, startWork, workContext } from '../../save/game'

const ACTIONS: WorkActions = {
  collect: async ({ outfitId }) => {
    const got = await collectWork(outfitId)
    return got.levelsUp > 0 ? { kind: 'done', message: `Craft Lv +${got.levelsUp}` } : undefined
  },
  repeat: ({ outfitId }) => repeatWork(outfitId),
  recall: ({ outfitId }) => recallWork(outfitId),
  queue: (input) => editWorkQueue(input as FarmQueueInput),
  unqueue: ({ outfitId, index }) => editWorkQueue({ outfitId, remove: index }),
  start: ({ outfitId, slot, request }) => {
    const job = request as FarmWorkRequest
    return startWork(slot.building, slot.slot, outfitId, job.item, job.count)
  },
  restart: ({ outfitId }) => restartWork(outfitId),
  dismiss: ({ outfitId }) => dismissWork(outfitId),
}

export function FarmWorkProvider({ view, save, now, children }: { view: MasterView; save: Save; now: number; children: ReactNode }) {
  const context = workContext(view.roster)
  const env = useMemo(() => farmWorkEnv(context), [context])
  return (
    <WorkProvider
      state={save}
      now={now}
      env={env}
      actions={ACTIONS}
      names={{
        uma: (id) => view.album.get(id)?.name ?? id,
        item: stockName,
        place: (id) => placeById(id)?.name ?? id,
      }}
      words={{ workLevel: 'Craft Level', workLevelLabel: 'Craft Lv {level}' }}
      describeRequest={(request) => ({ name: stockName((request as FarmWorkRequest).item), item: (request as FarmWorkRequest).item, count: (request as FarmWorkRequest).count })}
      formatRefusal={(refusal) => refusalText(refusal, now)}
      checkRestart={(state, outfitId) => checkRestartStopped(state, outfitId, now, context)}
    >
      {children}
    </WorkProvider>
  )
}
