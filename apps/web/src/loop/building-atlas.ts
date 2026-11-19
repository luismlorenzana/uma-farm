import index from '@luismlorenzana/uma-art/buildings/atlas.json'
import url from '@luismlorenzana/uma-art/buildings/atlas.png?url'
import { useKitArt, type KitArt } from '@luismlorenzana/uma-kit/ui'

const buildings: NonNullable<KitArt['buildings']> = { index, url }
export const useBuildingAtlas = () => useKitArt().buildings ?? buildings
