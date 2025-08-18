import type { PhaseOption } from "@/types"

export const LIGHT_STATES = {
  RED: 'red',
  GREEN: 'green',
  YELLOW: 'yellow'
} as const

export const SEGMENT_STATUS = {
  EMPTY: 'empty',
  NORMAL: 'normal',
  WARNING: 'warning',
  CONFLICT: 'conflict'
} as const

export const ZONE_STATUS = {
  EMPTY: 'empty',
  OCCUPIED: 'occupied',
  FULL: 'full'
} as const

export const LOG_TYPES = {
  VEHICLE: 'vehicle',
  SEGMENT: 'segment',
  CONFLICT: 'conflict',
  ERROR: 'error',
  SENSOR: 'sensor',
  SYSTEM: 'system'
} as const

export const LOG_LEVELS = {
  DEBUG: 'debug',
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'error'
} as const

export const DETECTOR_ERRORS = {
  ORPHAN_REGISTRATION: 'orphan_registration',
  REVERSE_STATE: 'reverse_state',
  INVALID_TRANSITION: 'invalid_transition',
  DUPLICATE_EXISTENCE: 'duplicate_existence',
  ZOMBIE_VEHICLE: 'zombie_vehicle'
} as const

export const WEBSOCKET_EVENTS = {
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  VEHICLE_EVENT: 'vehicle_event',
  SEGMENT_UPDATE: 'segment_update',
  SENSOR_HEARTBEAT: 'sensor_heartbeat',
  SYSTEM_ALERT: 'system_alert'
} as const

export const CONTROL_PHASE_MAP: {[key: string]: string} = {
  7: '东全放',
  8: '西全放',
  9: '南全放',
  10: '北全放',
  52: '全红',
  51: '黄闪',
} as const

export const CONTROL_PHASES_OPTIONS: PhaseOption[] = [
  { value: 7, label: '东全放' },
  { value: 8, label: '西全放' },
  { value: 9, label: '南全放' },
  { value: 10, label: '北全放' },
  { value: 52, label: '全红' },
  { value: 51, label: '黄闪' },
] as const
