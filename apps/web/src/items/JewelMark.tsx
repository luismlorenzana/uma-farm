import type { HeirloomId } from '@farm/domain'

const GEM: Record<HeirloomId, string> = {
  earrings: 'border-violet-200 bg-indigo-200', necklace: 'border-sky-200 bg-blue-400',
  bracelet: 'border-emerald-200 bg-teal-300', brooch: 'border-rose-200 bg-rose-400',
}

export function JewelMark({ piece }: { piece: HeirloomId }) {
  const gems = piece === 'earrings' ? ['left-[7px] top-3', 'right-[7px] top-3'] : ['left-[13px] top-[17px]']
  return <span className="relative inline-block size-9 shrink-0 rounded-md border border-hairline bg-sunken" aria-hidden>
    <span className={`absolute inset-x-[6px] top-[6px] h-[18px] border-2 border-[#b58a3c] ${piece === 'brooch' ? 'rotate-45 rounded-sm' : piece === 'earrings' ? 'inset-x-[10px] rounded-full border-b-0' : 'rounded-[50%]'}`} />
    {gems.map(position => <span key={position} className={`absolute size-2.5 rotate-45 border ${position} ${GEM[piece]}`} />)}
  </span>
}
