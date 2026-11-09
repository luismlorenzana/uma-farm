// Gold's mark (F19 decision 10): uma-art's `currency/gold` once F25 ships it; until then a plain "g" on a coin.
import { UiMark } from '@luismlorenzana/uma-kit/ui'

/** The coin drawn while the pinned uma-art has no `currency/gold`. */
export function GoldCoin() {
  return (
    <span aria-hidden className="font-display inline-flex size-4 shrink-0 items-center justify-center rounded-full bg-[#e8b931] text-[10px] leading-none font-bold text-[#4a3500] ring-1 ring-[#b8860b]">
      g
    </span>
  )
}

/** Gold's mark: the uma-art coin, or the plain one. */
export const GoldMark = () => <UiMark mark="currency/gold" fallback={<GoldCoin />} />
