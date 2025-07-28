export interface Segment {
  id: number
  name: string
  upstreamLight: LightState
  downstreamLight: LightState
  upstreamVehicles: boolean
  downstreamVehicles: boolean
  conflict: boolean
  capacity: number
  currentCount: number
  status: SegmentStatus
}

export interface MeetingZoneType {
  id: number
  name: string
  upstream: ZoneStatus
  downstream: ZoneStatus
  full: boolean
  capacity: number
  upstreamCount: number
  downstreamCount: number
}

export interface TrafficStatistics {
  totalVehicles: number
  conflictCount: number
  passedVehicles: number
  averageWaitTime: number
}

export type LightState = 'red' | 'green' | 'yellow'
export type SegmentStatus = 'empty' | 'normal' | 'warning' | 'conflict'
export type ZoneStatus = 'empty' | 'occupied' | 'full'

export interface VehicleEvent {
  vehicleId: string
  segmentId: string
  direction: 'upstream' | 'downstream'
  eventType: 'enter' | 'exit'
  timestamp: Date
}
