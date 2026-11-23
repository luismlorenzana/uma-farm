import { describe, expect, it } from 'vitest'
import { routePose } from './actor-route'
import { paintedRoutes } from './painted-routes'

describe('walking routes', () => {
  it('uses drawn facings and holds the foot at the end of an approach', () => {
    const route = { id: '100001', start: [.3, .75], stop: [.7, .75] } as const
    expect(routePose(route, 0)).toMatchObject({ x: .3, facing: 'right', moving: true })
    expect(routePose(route, 2600)).toMatchObject({ x: .7, facing: 'front', moving: false })
    expect(routePose(route, 4500)).toMatchObject({ facing: 'left', moving: true })
    expect(routePose(route, 7000, 0, true)).toMatchObject({ x: .7, facing: 'front', moving: false })
  })

  it('keeps cast in the authored positions and avoids duplicate actors', () => {
    expect(paintedRoutes(['100001', '100001', '100002', '100003'], [[.4, .8], [.6, .8]]).map(actor => actor.id))
      .toEqual(['100001', '100002'])
  })
})
