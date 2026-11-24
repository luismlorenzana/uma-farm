export type Furnishing =
  'counter' | 'shelf' | 'bookcase' | 'display' | 'chest' | 'crate' | 'bench' | 'desk' | 'table' | 'stool' |
  'sofa' | 'bed' | 'rug' | 'scale' | 'register' | 'lamp' | 'plant' | 'portrait' | 'notice' | 'stove' |
  'sink' | 'oven' | 'mill' | 'saw' | 'smoker' | 'anvil' | 'furnace' | 'cutter' | 'toolwall' |
  'nest' | 'fence' | 'trough' | 'hay' | 'mirror' | 'chair' | 'barrel' | 'easel' | 'map' | 'winch' | 'ore'

/** Local floor coordinates, with the front at positive Z. */
type Item = readonly [kind: Furnishing, x: number, z: number, turn?: number]
type RoomSpec = { theme: Theme; furniture: readonly Item[] }
type Theme = 'home' | 'trade' | 'hearth' | 'stone' | 'ranch' | 'coast'
const QUARTER = Math.PI / 2
export const ROOMS = {
  'home-table': { theme:'home', furniture:[
    ['rug',0,1],['sofa',-3.3,-1.8],['lamp',-5,-2.3],['bookcase',2.1,-3.05],['chest',4.5,-2.8],['table',2.4,.2],['stool',1.1,.75],
    ['stool',3.7,.75],['plant',5,2.4],['portrait',-3.2,-3.93],['bed',-4.25,1.85,QUARTER],
  ]},
  library: { theme:'home', furniture:[
    ['bookcase',-4,-3.1],['bookcase',-1.35,-3.1],['bookcase',1.3,-3.1],['bookcase',3.95,-3.1],
    ['bookcase',-5.35,.05,QUARTER],['rug',-.5,.3],['table',-1.45,-.5],['stool',-2.7,.05],['stool',-.3,.05],
    ['desk',3.8,-.65],['lamp',5.1,1.45],['plant',-5.15,2.8],
  ]},
  cafe: { theme:'hearth', furniture:[
    ['counter',.8,-1.95],['display',-2,-2.2],['shelf',1.6,-3.25],['stove',3.6,-2.75],['barrel',-4.75,-2.5],
    ['table',-3,1],['stool',-4.2,1.1],['stool',-2.9,2.2],['table',2.9,1.7],['stool',4.05,1.8],['plant',-5.2,2.75],
  ]},
  'laurel-bakery': { theme:'hearth', furniture:[
    ['oven',3.7,-2.45],['shelf',-.25,-3.1],['display',-3,-2],['counter',0,-1.25],['register',.7,-1.23],
    ['barrel',4.8,.15],['crate',-4.75,1.5],['table',-2.9,1.5],['stool',-3.9,2.6],['rug',1.5,1.1],
  ]},
  store: { theme:'trade', furniture:[
    ['shelf',-3.95,-3.1],['shelf',-1.3,-3.1],['shelf',1.3,-3.1],['shelf',3.95,-3.1],['counter',2.1,-1.05],
    ['register',2.7,-1.04],['scale',1.2,-1.05],['crate',-3.8,-.6],['barrel',-4.8,1.15],['chest',4.8,2.1],
  ]},
  'harbour-inn': { theme:'coast', furniture:[
    ['counter',2.6,-1.85],['shelf',3.4,-3.2],['notice',3.3,-3.94],['map',-.4,-3.94],['rug',.2,.5],
    ['sofa',-3.8,-1.8],['lamp',-5.1,-2.4],['table',-3.9,1.2],['stool',-4,2.45],['plant',4.8,2.8],
  ]},
  mayor: { theme:'trade', furniture:[
    ['desk',0,-1.45],['stool',.4,-2.5],['bookcase',-3.55,-3.1],['chest',4.4,-2.3],['map',0,-3.92],
    ['portrait',3.8,-3.92],['rug',0,.8],['chair',-1.55,.85],['chair',1.55,.85],['plant',-4.9,2.5],
  ]},
  'estate-office': { theme:'home', furniture:[
    ['desk',-2.95,-1.7],['bookcase',-4.4,-3.1],['bookcase',3.55,-3.1],['map',1.55,-3.9],['notice',-1.3,-3.9],
    ['table',2.15,.1],['stool',3.45,.25],['rug',-.7,1.1],['plant',4.65,2.65],
  ]},
  'little-studio': { theme:'home', furniture:[
    ['easel',-3.8,-1.4],['easel',3.5,-2.2,QUARTER],['desk',-.85,-2.1],['shelf',1.15,-3.1],['portrait',-3.25,-3.9],
    ['chair',.9,.95],['rug',-.5,1.25],['crate',-4.75,1.75],['plant',4.7,2.45],
  ]},
  'mejiro-salon': { theme:'home', furniture:[
    ['mirror',-3.5,-3.82],['mirror',-.75,-3.82],['chair',-3.5,-1.62],['chair',-.75,-1.62],['shelf',3.45,-3.1],
    ['counter',3.05,-.75],['sofa',-3.65,1.65],['rug',0,1],['plant',4.9,2.5],
  ]},
  'espoir-garage': { theme:'stone', furniture:[
    ['toolwall',-3,-3.86],['bench',-3,-2.3],['winch',2.9,-1.5],['crate',4.8,-2.25],['shelf',4.15,-3.1],
    ['barrel',-4.8,1.5],['toolwall',.1,-3.85],['ore',2.25,1.9],
  ]},
  rancher: { theme:'ranch', furniture:[
    ['counter',0,-1.15],['register',.8,-1.15],['shelf',.15,-3.15],['hay',-4.15,-2.3],['fence',-3.25,1.2],
    ['barrel',4.85,-2.15],['trough',3.65,1.3],['crate',-4.9,.2],
  ]},
  smith: { theme:'stone', furniture:[
    ['furnace',3.65,-2.3],['anvil',.25,-.7],['bench',-3.1,-1.8],['toolwall',-3.1,-3.9],['barrel',4.8,.55],
    ['crate',-4.75,1.05],['ore',3.65,1.95],
  ]},
  expeditions: { theme:'coast', furniture:[
    ['map',-2.85,-3.87],['notice',.55,-3.87],['shelf',3.95,-3.1],['counter',1.6,-1.45],['crate',-3.8,-2],
    ['crate',-4.75,.8],['barrel',4.75,1.8],['rug',-.45,.85],
  ]},
  mill: { theme:'trade', furniture:[
    ['mill',1.8,-1.85],['barrel',3.8,-2.3],['bench',-2.55,-1.65],['shelf',-3.4,-3.15],['crate',-4.6,.85],['scale',-2.45,-1.65],
  ]},
  sawmill: { theme:'trade', furniture:[
    ['saw',.1,-1.5],['bench',-3.85,-2.35],['toolwall',-3.55,-3.9],['crate',4.05,-1.95],['chest',4.4,1.6],['barrel',-4.8,1.85],
  ]},
  smokehouse: { theme:'hearth', furniture:[
    ['smoker',.85,-2.3],['smoker',3.75,-2.25],['counter',-2.65,-1.25],['shelf',-3.5,-3.15],['barrel',-4.6,.55],['crate',3.8,1.6],
  ]},
  coop: { theme:'ranch', furniture:[
    ['nest',-3.6,-2.6],['nest',0,-2.6],['nest',3.6,-2.6],['hay',-4.9,.8],['trough',3.7,1.5],['barrel',4.85,2.7],
  ]},
  barn: { theme:'ranch', furniture:[
    ['fence',-3.7,-1.3],['fence',3.7,-1.3],['hay',-3.7,-2.55],['hay',3.65,-2.5],['trough',-3.55,1.7],['trough',3.55,1.7],['barrel',4.9,2.65],
  ]},
  kitchen: { theme:'hearth', furniture:[
    ['sink',-3.9,-2.5],['stove',.2,-2.65],['oven',3.35,-2.3],['shelf',-1.5,-3.2],['table',-2,.3],
    ['barrel',4.7,1.65],['crate',-4.65,2.2],
  ]},
  restaurant: { theme:'hearth', furniture:[
    ['counter',2.65,-1.95],['stove',3.7,-2.95],['shelf',.5,-3.15],['rug',-1,1.2],['table',-3.8,-1.4],
    ['table',-3.55,1.7],['table',2.4,1.5],['stool',-4.95,-1.35],['stool',-4.7,1.67],['stool',3.55,1.5],['plant',4.8,2.7],
  ]},
  smelter: { theme:'stone', furniture:[
    ['furnace',-2.7,-2.45],['furnace',1.7,-2.45],['ore',4.4,-1.95],['anvil',.3,-.3],['toolwall',-4.2,-3.85],['barrel',-4.75,1.1],
  ]},
  cutter: { theme:'stone', furniture:[
    ['cutter',.4,-1.7],['shelf',-3.4,-3.15],['toolwall',1.5,-3.9],['bench',3.7,-1.7],['ore',-3.85,.35],['crate',4.65,1.3],
  ]},
  forge: { theme:'stone', furniture:[
    ['furnace',3.65,-2.15],['anvil',.7,-.8],['desk',-3.55,-1.55],['lamp',-4.9,-2.4],['toolwall',-.85,-3.85],['chest',-4.65,1.35],['ore',4.65,1.85],
  ]},
  warehouse: { theme:'trade', furniture:[
    ['shelf',-3.65,-3.1],['shelf',-.85,-3.1],['shelf',2,-3.1],['crate',-4.2,-.8],['crate',-4.8,1.05],
    ['barrel',4.6,-1.85],['chest',4.05,.55],['scale',2.75,-1.55],['bench',2.75,-1.55],['barrel',4.6,2.2],
  ]},
  mine: { theme:'stone', furniture:[
    ['winch',0,-2.1],['ore',-3.75,-2.45],['ore',4.1,-1.5],['crate',4.6,1.35],['lamp',-4.6,1.8],['toolwall',-3.2,-3.85],
  ]},
  quarry: { theme:'stone', furniture:[
    ['ore',-3.85,-2.05],['ore',-2.5,-2.4],['ore',4.25,.7],['bench',2.6,-1.85],['toolwall',2.65,-3.85],['winch',-.35,-1.8],
  ]},
} as const satisfies Record<string, RoomSpec>

export type RoomId = keyof typeof ROOMS
export function isRoom(id: string): id is RoomId { return Object.hasOwn(ROOMS, id) }
export const roomSpec = (id: RoomId): RoomSpec => ROOMS[id]
