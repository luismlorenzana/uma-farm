// The Gate's quick look: nobody comes to the Gate on her own. Every Uma is in town from day one, and you meet her by
// introducing yourself there: "Everyone lives in town." with the Town (by its name, when the world gives one). Loaded
// with the farm map.
import { worldNamesOf, type FarmSave } from '@farm/domain'
import { Link } from 'react-router'
import { useStory } from '../story/story'

/** Where everyone is: the town, a tap away. */
export function GatePeek({ save }: { save: FarmSave }) {
  const story = useStory()
  const met = Object.keys(save.roster).length
  return (
    <div className="space-y-2 p-4" data-peek="gate">
      <p className="text-[14px] text-ink-soft" data-everyone>
        {met === 0 ? 'Everyone lives in ' : 'Meet everyone else in '}
        <Link to="/town" className="font-semibold text-accent-strong underline">{worldNamesOf(story).town ?? 'town'}</Link>.
      </p>
    </div>
  )
}
