import { GAME_LOCATIONS, STORY_PLACES, sceneSteps, type Step } from '@farm/domain'
import { describe, expect, it } from 'vitest'
import { environmentAt, resolveEnvironment, type SceneEnvironment } from './scene-context'
import { sceneAssets } from './scene-assets'

const start: SceneEnvironment = { place: 'gate', phase: 'morning', season: 'spring' }

describe('conversation environments', () => {
  it('has an asset at both sizes for each built-in place and phase', () => {
    for (const place of new Set([...STORY_PLACES, ...GAME_LOCATIONS])) {
      for (const phase of ['morning','afternoon','night'] as const) {
        const selected = resolveEnvironment({ ...start, place, phase })
        expect(sceneAssets[selected.key]?.length, place).toBe(2)
        expect(sceneAssets[selected.fallback]?.length, place).toBe(2)
      }
    }
    expect(resolveEnvironment({ ...start, place: 'pond-night' }).phase).toBe('night')
    expect(resolveEnvironment({ ...start, place: 'fields', season: 'winter' }).key).toBe('fields-winter')
    expect(resolveEnvironment({ ...start, place: 'cafe' }).key).toBe('cafe-morning')
    expect(resolveEnvironment({ ...start, place: 'bedroom' }).key).toBe('bedroom-morning')
  })

  it('keeps narration in place and follows the selected choice branch only', () => {
    const steps: Step[] = [
      { narrate: 'At the gate.' },
      { choice: [{ text: 'Go to the pond', then: [{ place: 'pond-night' }, { narrate: 'By the water.' }] },
        { text: 'Go to town', then: [{ place: 'town' }, { narrate: 'In town.' }] }] },
      { narrate: 'You stay a while.' },
    ]
    expect(environmentAt(steps, 0, start)).toEqual(expect.objectContaining({ place: 'gate', nextPlace: undefined }))
    const played = sceneSteps(steps, [1])
    expect(environmentAt(played, played.length - 1, start).place).toBe('town')
    expect(environmentAt(played, played.length - 1, start).place).not.toBe('pond-night')
  })
})
