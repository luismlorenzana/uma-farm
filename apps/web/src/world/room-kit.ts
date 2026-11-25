import {
  BoxGeometry, ConeGeometry, CylinderGeometry, Group, IcosahedronGeometry, InstancedMesh, MeshStandardMaterial, Object3D,
  type Matrix4,
} from 'three'
import { bandLight } from '../hd2d/field-pond-scene'
import type { GroundPoint, RegionScene } from './farm-region-stage'
import type { FloorPoint } from './room-walk'
import { roomSpec, type Furnishing, type RoomId } from './room-specs'
import { ROOM_FOV, TRAVEL_AZIMUTH, TRAVEL_ELEVATION } from './travel-camera'

const palettes = {
  home: ['#ae8262','#ddd0b2','#854b55','#854e3b'],
  trade: ['#a98156','#d2b58b','#507465','#6c4536'],
  hearth: ['#af7855','#e3ba89','#b15e4c','#6c4032'],
  stone: ['#797c7a','#aaa69a','#6b7d83','#665045'],
  ranch: ['#99815b','#d6b47d','#965a4a','#714834'],
  coast: ['#aa9671','#c9d1be','#3d777b','#645147'],
} as const

const width = 12, depth = 8
const cloth = '#d8b983', cream = '#f0d9ab', copper = '#bd7852', iron = '#48525d', glass = '#85b5be'
const feet = [[-.25,1.62],[2.45,.65],[-2.65,.66],[-1.66,2.8],[1.56,2.9],[.15,-1.18],
  [-3.4,.45],[3.62,-.12],[-4.13,2.8],[4.24,2.78],[-4.3,1.1],[-3,2.8],[-.1,2.85],[3.1,2.78],
  [4.6,.75],[-1.35,-.9],[1.3,-.45]] as const

const footprint = {
  counter: [2.66, .9], display: [2.12, .9], shelf: [2.25, .72], bookcase: [2.25, .72], chest: [1.33, .98],
  crate: [1.33, .91], hay: [1.33, .91], desk: [1.64, 1.04], table: [1.64, 1.04], bench: [1.64, 1.04],
  chair: [.65, .65], stool: [.65, .63], sofa: [2.4, 1.16], bed: [1.43, 2.24], lamp: [.52, .52],
  plant: [.56, .56], barrel: [.9, .9], sink: [1.48, 1.15], stove: [1.48, 1.15], oven: [1.48, 1.15],
  furnace: [1.48, 1.15], smoker: [1.48, 1.15], mill: [1.43, 1], saw: [1.43, 1], cutter: [1.43, 1],
  anvil: [1.43, 1], winch: [1.43, 1], nest: [1.65, .84], trough: [1.65, .84], fence: [2.37, .22],
  easel: [1.03, .46], ore: [1.4, 1.06],
} as Partial<Record<Furnishing, readonly [number, number]>>

export function buildRoom(place: RoomId, night: boolean, roomNumber: number, expanded: boolean): RegionScene & { clear(point: FloorPoint): boolean } {
  const spec = roomSpec(place)
  const [floor,wall,accent,wood] = palettes[spec.theme]
  const root = new Group()
  const anchors = new Map<string,GroundPoint>()
  const objects = { box:new BoxGeometry(), cyl:new CylinderGeometry(.5,.5,1,12), cone:new ConeGeometry(.5,1,9), rock:new IcosahedronGeometry(.52,0) }
  const batches = new Map<string, { shape: keyof typeof objects; color: string; matrices: Matrix4[] }>()
  const temp = new Object3D()
  function mark(shape:keyof typeof objects, color:string, x:number,y:number,z:number,w:number,h:number,d:number,turn=0,tilt=0) {
    temp.position.set(x,y,z)
    temp.rotation.set(0,turn,tilt)
    temp.scale.set(w,h,d)
    temp.updateMatrix()
    const key = shape + color
    const batch = batches.get(key) ?? {shape,color,matrices:[]}
    batch.matrices.push(temp.matrix.clone())
    batches.set(key,batch)
  }
  const box = (c:string,x:number,y:number,z:number,w:number,h:number,d:number,t=0) => mark('box',c,x,y,z,w,h,d,t)
  box('#624d41',0,-.22,0,width,.35,depth)
  // Planks and limestone run under furniture, and the near walls are cut away.
  for (let z=-3.75;z<4;z+=.5) {
    const seam = (Math.round(z*2) % 2 ? -.8 : .6)
    box(floor,(seam-6)/2,-.036,z,seam+5.97,.072,.48)
    box(floor,(seam+6)/2,-.035,z,5.97-seam,.072,.48)
    if (Math.round(z*2)%3===0) box(wood,3.8,.003,z+.12,1,.004,.024)
  }
  box(wall,0,1.47,-4.06,12.18,2.95,.23)
  box(wall,-6.07,.88,-2.06,.21,1.77,3.86)
  box(wood,0,2.95,-4.05,12.35,.15,.33)
  box(wood,-6.07,1.79,-2.06,.3,.12,4.04)
  box(wood,0,.19,-3.9,12,.18,.08)
  box(wood,0,1.08,-3.9,12,.07,.08)
  for (const x of [-5.78,5.77]) box(wood,x,1.5,-3.89,.19,2.85,.19)
  for (const x of [-4.4,-1.55,1.5,4.5]) {
    if (spec.furniture.some(([,fx,fz])=>fz < -2.65 && Math.abs(fx - x)<1.1)) continue
    box(wood,x,2.02,-3.89,1.55,1.29,.14)
    box(night ? '#516c89' : glass,x,2.02,-3.807,1.34,1.1,.03)
    box(cream,x,2.025,-3.775,.055,1.08,.034)
    box(cream,x,2.02,-3.765,1.34,.048,.034)
    box(wood,x,1.39,-3.78,1.64,.12,.3)
  }
  box(wood,-.05,.024,3.92,2,.05,.42)
  box(cream,0,.033,3.6,1.38,.025,.36)

  const furniture: { x: number; z: number; width: number; depth: number; turn: number }[] = []
  function furnish(kind:Furnishing,x:number,z:number,turn=0) {
    const size = footprint[kind]
    if (size) furniture.push({ x, z, width: size[0], depth: size[1], turn })
    function part(color:string,dx:number,y:number,dz:number,w:number,h:number,d:number,s:keyof typeof objects='box',tilt=0) {
      mark(s,color,x+dx*Math.cos(turn)+dz*Math.sin(turn),y,z+dz*Math.cos(turn)-dx*Math.sin(turn),w,h,d,turn,tilt)
    }
    const top = (y:number,w:number,d:number,c:string=wood) => part(c,0,y,0,w,.13,d)
    const legs = (w:number,d:number,h:number) => {
      for (const dx of [-w,w]) for (const dz of [-d,d]) part(wood,dx,h/2,dz,.14,h,.14)
    }
    const cabinet = (w:number,h:number,d:number,c:string=wood) => {
      part(c,0,h/2,0,w,h,d)
      part(cream,0,h,0,w+.13,.10,d+.09)
      for (const dx of [-w*.26,w*.26]) part(wood,dx,h*.51,d/2+.035,.12,.1,.075)
    }
    const vessel = (dx:number,y:number,dz:number,c:string,s=.2) => {
      part(c,dx,y+s*.56,dz,s,s*1.12,s,'cyl')
      part(cream,dx,y+s*1.13,dz,s*.81,.042,s*.81,'cyl')
    }
    switch(kind) {
      case 'counter': case 'display': {
        cabinet(kind==='counter'?2.66:2.12,.99,.81,accent)
        for(const dx of [-.84,0,.84]) part(wood,dx,.44,.427,.58,.46,.04)
        if(kind==='display') for(const dx of [-.68,-.32,.04,.42,.72]) {
          part(copper,dx,1.09,.08,.29,.19,.31,'rock')
          part(cream,dx,1.15,.09,.13,.047,.11)
        }
        break
      }
      case 'shelf': case 'bookcase': {
        part(wood,0,1.34,-.27,2.2,2.68,.11)
        for(const dx of [-1.08,1.08]) part(wood,dx,1.36,0,.13,2.72,.66)
        for(const h of [.12,.77,1.41,2.05,2.69]) {
          part(wood,0,h,0,2.25,.11,.7)
          if(h>2.1) continue
          for(let n=0;n<7;n++){
            const dx=-.84+n*.276, c=[accent,cream,copper,'#698574'][n%4]!
            if(kind==='bookcase') {
              const rise=.29+(n%3)*.07
              part(c,dx,h+rise/2+.057,.18,.17,rise,.29)
              part(cream,dx,h+.16,.334,.15,.034,.013)
            } else if(n%2===0) vessel(dx,h+.06,.11,c,.23)
            else part(c,dx,h+.19,.15,.24,.25,.36)
          }
        }
        break
      }
      case 'chest': case 'crate': case 'hay': {
        const hay=kind==='hay'
        part(hay?'#b99a54':wood,0,.34,0,1.27,.66,.83)
        top(.67,1.33,.91,hay?cloth:floor)
        for(const dx of [-.42,.42]) part(hay?cloth:cream,dx,.33,.425,.08,.64,.03)
        if(kind==='chest') part(copper,0,.49,.446,.17,.19,.06)
        break
      }
      case 'desk': case 'table': case 'bench': {
        legs(.62,.32,.81)
        top(.87,1.64,1.04)
        if(kind==='desk') {
          part(cream,-.31,.96,.05,.49,.045,.35); part(cloth,.1,.955,.19,.24,.04,.27)
          vessel(.55,.94,-.18,accent,.15)
        }
        if(kind==='table') { vessel(-.3,.95,.08,accent,.19); part(cream,.3,.95,.07,.36,.053,.38,'cyl') }
        break
      }
      case 'chair': case 'stool':
        legs(.22,.19,.48)
        top(.5,.65,.63,accent)
        if(kind==='chair') part(wood,0,.93,-.26,.62,.75,.13)
        break
      case 'sofa':
        legs(.9,.37,.22);part(wood,0,.28,0,2.23,.28,1.06);part(accent,0,.72,-.44,2.27,1,.27)
        for(const dx of [-1.04,1.04]) part(cloth,dx,.57,0,.27,.56,.97)
        for(const dx of [-.48,.48]) part(accent,dx,.53,.095,.87,.31,.77)
        break
      case 'bed':
        legs(.51,.94,.26)
        part(wood,0,.29,0,1.37,.25,2.24);part(cream,0,.51,0,1.33,.31,2.16)
        part(wood,0,.83,-1.05,1.43,1.18,.13)
        part(cream,0,.72,-.62,1,.15,.44);part(accent,0,.69,.38,1.37,.13,1.24)
        break
      case 'rug':
        part(accent,0,.018,0,3.33,.022,2.16)
        part(cloth,0,.032,0,3.09,.016,1.91)
        part(accent,0,.041,0,2.88,.011,1.69)
        for(const dx of [-.69,0,.69]) part(cream,dx,.05,0,.43,.007,.43,'box',Math.PI*.25)
        break
      case 'register':
        part(iron,0,1.08,0,.38,.17,.31);part(copper,0,1.22,-.07,.3,.11,.13);break
      case 'scale':
        part(iron,0,.98,0,.41,.11,.34);part(copper,0,1.15,0,.08,.27,.08);part(iron,0,1.27,0,.47,.05,.36,'cyl');break
      case 'lamp':
        part(iron,0,.08,0,.45,.12,.45,'cyl');part(copper,0,.73,0,.08,1.35,.08,'cyl')
        part(night?'#f8c277':cream,0,1.47,0,.63,.42,.62,'cone');break
      case 'plant':
        vessel(0,.03,0,copper,.56)
        for(const dx of [-.19,0,.2]) part('#5e875b',dx,.79+((dx===0)? .19:0),dx,.37,.62,.34,'cone',dx)
        break
      case 'portrait': case 'notice': case 'mirror': case 'map': {
        const c=kind==='mirror'?glass:kind==='portrait'?accent:cream
        const y=kind==='mirror'?1.78:2.13,w=kind==='map'?1.72:1.24
        part(wood,0,y,0,w+.15,1.0,.12);part(c,0,y,.088,w,.84,.04)
        if(kind==='map'||kind==='notice') for(const dx of [-.3,.11,.38]) part(kind==='map'?'#ac8861':cloth,dx,y,.12,.16,.49,.022)
        if(kind==='portrait') part(cloth,0,y,.119,.44,.61,.034,'rock')
        break
      }
      case 'barrel':
        part(wood,0,.51,0,.86,1,.86,'cyl')
        for(const h of [.19,.85,1.02]) part(h>1?floor:iron,0,h,0,.9,.065,.9,'cyl')
        break
      case 'sink': case 'stove': case 'oven': case 'furnace': case 'smoker': {
        const tall=kind==='oven'||kind==='smoker'||kind==='furnace'
        const h=tall?1.82:.9
        cabinet(1.48,h,1,kind==='sink'?wood:iron)
        if(kind==='sink') {
          part(iron,0,.96,.04,.65,.08,.51);part(copper,0,1.12,-.29,.073,.31,.072)
        } else {
          part('#332b29',0,.55,.53,.92,.63,.06)
          for(const dx of [-.27,.27]) part(kind==='smoker'?cream:'#e38949',dx,.39,.565,.29,.24,.019)
          if(tall)part(iron,.34,h+.43,-.24,.27,.94,.28,'cyl')
          else for(const dx of [-.39,.39]) part(iron,dx,h+.083,0,.38,.075,.38,'cyl')
        }
        break
      }
      case 'mill': case 'saw': case 'cutter': case 'anvil': case 'winch':
        legs(.54,.35,.75)
        top(.79,1.43,1)
        if(kind==='anvil') {
          part(iron,0,1,0,1.05,.39,.61);part(iron,-.49,1.18,0,.54,.19,.36)
        } else {
          part(wood,0,1.17,0,1.19,.69,.81)
          for(const dz of [-.46,.46]) part(iron,.09,1.37,dz,.87,.14,.86,'cyl',Math.PI/2)
          part(copper,.51,1.33,.54,.14,.46,.11)
          if(kind==='winch') for(const dx of [-.62,.62]) part(wood,dx,1.13,0,.19,2.25,.23)
        }
        break
      case 'toolwall':
        part(wood,0,1.78,0,1.89,.21,.15)
        for(const dx of [-.61,-.23,.22,.62]) { part(copper,dx,1.63,.12,.085,.51,.08);part(iron,dx,1.87,.14,.24,.1,.11) }
        break
      case 'nest': case 'trough':
        part(wood,0,.24,0,1.59,.46,.75)
        for(const dz of [-.37,.37])part(wood,0,.52,dz,1.65,.25,.09)
        part(kind==='nest'?cloth:glass,0,.46,0,1.45,.037,.61)
        if(kind==='nest')for(const dx of [-.44,.04,.52])part(cream,dx,.53,0,.16,.14,.19,'rock')
        break
      case 'fence':
        for(const dx of [-1.03,-.32,.46,1.1])part(wood,dx,.65,0,.16,1.3,.17)
        for(const y of [.42,.98])part(floor,0,y,0,2.35,.13,.16)
        break
      case 'easel':
        for(const dx of [-.44,.44]) part(wood,dx,.76,0,.1,1.54,.13,'box',dx*.12)
        part(cream,0,1.14,.14,.82,.91,.11);part(accent,0,1.13,.205,.41,.45,.035)
        break
      case 'ore':
        for(const [dx,dz,s] of [[-.39,-.1,.73],[.25,.13,.48],[.03,.39,.37]] as const) part(s>.6?iron:glass,dx,s*.32,dz,s,s*.72,s,'rock')
        break
    }
  }
  for (const item of spec.furniture) furnish(...item)
  if(place==='home-table'&&expanded) furnish('chair',4.17,1.55)
  if(place==='home-table'&&roomNumber>0) furnish(roomNumber%2?'map':'portrait',1.35,-3.92)
  const clear = ({ x, z }: FloorPoint) => Math.abs(x) <= width / 2 - .3 && z >= -depth / 2 + .5 && z <= depth / 2 - .4
    && !furniture.some(prop => {
      const dx = x - prop.x, dz = z - prop.z
      return Math.abs(dx * Math.cos(prop.turn) - dz * Math.sin(prop.turn)) < prop.width / 2 + .16
        && Math.abs(dx * Math.sin(prop.turn) + dz * Math.cos(prop.turn)) < prop.depth / 2 + .16
    })
  const clearFeet = feet.filter(([x,z]) => clear({ x, z }))
  for (const [i,[x,z]] of clearFeet.entries()) anchors.set(String(i),[x,.035,z])

  const materials = new Map<string,MeshStandardMaterial>()
  for (const {shape,color,matrices} of batches.values()){
    const mat = materials.get(color) ?? new MeshStandardMaterial({color,roughness:.86})
    materials.set(color,mat)
    const mesh = new InstancedMesh(objects[shape],mat,matrices.length)
    matrices.forEach((m,i)=>mesh.setMatrixAt(i,m))
    mesh.receiveShadow = true
    mesh.castShadow = true
    root.add(mesh)
  }
  const frame = {label:place,target:[0,.59,0] as GroundPoint,elevation:TRAVEL_ELEVATION, azimuth:TRAVEL_AZIMUTH, distance:22, fov:ROOM_FOV}
  const light = bandLight(night)
  return {
    width:width+1.2,depth:depth+2.1,targetY:.68,anchors,clear,
    scene:{id:place,title:place,root,figures:[],layers:{},cameras:{front:frame,tactics:frame,high:frame},
      light: {
        ...light,
        sky: night ? ['#28324a', '#31394b'] : ['#b6a392', '#cbb498'],
        key: { ...light.key, box: 20, to: [0,0,0], ...(night ? { colour: '#ffcf96', intensity: 2.1, from: [-7, 14, 11] as GroundPoint } : {}) },
        hemi: night ? { sky: '#b7c9ef', ground: '#b78e6e', intensity: 1.45 } : light.hemi,
        exposure: night ? 1.22 : 1.06,
      },
      update() {},
      dispose() {
        for(const mesh of root.children) (mesh as InstancedMesh).dispose()
        for(const geometry of Object.values(objects)) geometry.dispose()
        for(const material of materials.values()) material.dispose()
        root.clear()
      },
    },
  }
}
