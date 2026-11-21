import { morningOfMemory, type FarmSave, type Visit } from '@farm/domain'
import { withParam } from '@luismlorenzana/uma-kit/shell'
import { Link, useLocation } from 'react-router'

export function NightReplayLinks({ save, visit, owner, index, className }: {
  save: FarmSave; visit: Visit; owner: string; index: number; className?: string
}) {
  const location = useLocation()
  const ref = `${owner}:${index}`
  return <div className="flex flex-wrap gap-2">
    <Link className={className} to={withParam(location, 'visitReplay', ref)} state={{ back: true }}>Replay</Link>
    {morningOfMemory(save, visit) && <Link className={className} to={withParam(location, 'visitReplay', `${ref}:morning`)}
      state={{ back: true }}>Replay morning</Link>}
  </div>
}
