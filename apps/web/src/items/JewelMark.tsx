import type { HeirloomId } from '@farm/domain'
import { ItemIcon } from './ItemIcon'

export function JewelMark({ piece }: { piece: HeirloomId }) {
  return <ItemIcon id={`heirloom/${piece}`} size={36} className="rounded-md border border-hairline bg-sunken" />
}
