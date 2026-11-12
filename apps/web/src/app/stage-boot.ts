// At boot, before the router reads the address (F11 decision 1): `?stage=1` or `?stage=0` sets the HD-2D farm's preview
// on this device and leaves the address. Imported for its effect, first, by main.tsx.
import { readStageParam } from './stage-switch'

readStageParam()
