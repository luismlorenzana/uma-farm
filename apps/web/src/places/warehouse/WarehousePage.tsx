// The Warehouse (copied from uma-rpg apps/web/src/places/warehouse/WarehousePage.tsx at 30a322a, F5): uma-kit's compact
// icon grid of every held line item and made item, by line and grade. Nothing sells (FM4): there's no price and no Sell.
import { PlaceHeader, useLeave } from '@luismlorenzana/uma-kit/shell'
import { ShelfView } from '@luismlorenzana/uma-kit/places'
import { ItemIcon } from '../../items/ItemIcon'
import { materialPair } from '../../items/words'
import { useWildsSave } from '../../save/game'
import { warehouseView, type Stock } from './warehouse-shelves'

export default function WarehousePage() {
  const save = useWildsSave()
  const leave = useLeave()
  if (!save) return null
  const { shelves, items, header } = warehouseView(save)
  return (
    <div className="absolute inset-0 flex flex-col" data-page="warehouse">
      <PlaceHeader title="Warehouse" onBack={() => leave('/')}
        about={<><p>Everything the Wilds made, by line and grade.</p><p>Jobs take their inputs from here, and Collect brings what’s made. Made items wait for the Forge.</p></>}
        words={{ back: 'Back to the Wilds', about: 'About the Warehouse' }} />
      <main className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <ShelfView<Stock>
          shelves={shelves}
          items={items}
          layout="grid"
          grades
          words={{ empty: 'Nothing here yet.' }}
          renderItem={(i, size) => <ItemIcon id={i.id} size={size} />}
          header={<p className="text-[12px] text-ink-faint">{header}</p>}
          details={(i) => <StockDetails item={i} />}
        />
      </main>
    </div>
  )
}

/** The sheet's line: "Metal · G3 · raw · Refines into Iron Ingot", "Stone · G2 · made". */
function StockDetails({ item }: { item: Stock }) {
  const pair = materialPair(item.id)
  return <p className="text-[14px]">{item.line}{pair ? ` · ${pair}` : ''}</p>
}
