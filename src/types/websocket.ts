// src/types/websocket.ts

// 基础消息结构
export interface BaseWebSocketMessage {
  messageType: string
  timestamp: string
  data: unknown
}

// 路段消息数据
export interface SegmentMessageData {
  segmentId: number
  status: 'VEHICLE_ENTER' | 'VEHICLE_LEAVE' | 'CLEAR'
  vehicleId?: string
  direction?: 'UPSTREAM' | 'DOWNSTREAM' | null
  vehicleCount: number
}

// 红绿灯消息数据
export interface TrafficLightMessageData {
  sigid: string
  status: 'UPSTREAM' | 'DOWNSTREAM' | 'ALL_RED' | 'YELLOW_FLASH'
  statusDescription: string
  phase: number
}

// 等待区消息数据
export interface WaitingAreaMessageData {
  segmentId: number
  upstreamHasVehicle: boolean
  upstreamRequest: boolean
  downstreamHasVehicle: boolean
  downstreamRequest: boolean
  upstreamVehicleCount: number
  downstreamVehicleCount: number
}

// 车辆信息
export interface VehicleInfo {
  vehicleId: string
  direction: 'UPSTREAM' | 'DOWNSTREAM'
  enterTime: string
  exitTime?: string
}

// 车道状态消息数据
export interface LaneStatusMessageData {
  segmentId: number
  upstreamInCount: number
  upstreamOutCount: number
  downstreamInCount: number
  downstreamOutCount: number
  throughputRate: number
  congestionLevel: number
  upstreamVehicles: VehicleInfo[]
  downstreamVehicles: VehicleInfo[]
}

// 具体的消息类型
export interface SegmentMessage extends BaseWebSocketMessage {
  messageType: 'SEGMENT'
  data: SegmentMessageData
}

export interface TrafficLightMessage extends BaseWebSocketMessage {
  messageType: 'TRAFFIC_LIGHT'
  data: TrafficLightMessageData
}

export interface WaitingAreaMessage extends BaseWebSocketMessage {
  messageType: 'WAITING_AREA'
  data: WaitingAreaMessageData
}

export interface LaneStatusMessage extends BaseWebSocketMessage {
  messageType: 'LANE_STATUS'
  data: LaneStatusMessageData
}

export interface WelcomeMessage extends BaseWebSocketMessage {
  messageType: 'WELCOME'
  data: string
}

export interface Segment {
  vehicleCount: number;
  direction: 'UPSTREAM' | 'DOWNSTREAM' | null;
  congestionLevel: number | null;
  lastAction: LastVehicleAction | null;
}

export interface LastVehicleAction {
  status: 'VEHICLE_ENTER' | 'VEHICLE_LEAVE';
  vehicleId: string;
  direction: 'UPSTREAM' | 'DOWNSTREAM' | null;
  timestamp: number;
}
export interface Signal {
  status: 'ALL_RED' | 'YELLOW_FLASH' | 'UPSTREAM' | 'DOWNSTREAM' | 'UPDOWN';
  description: string;
  phase: number | null;
}
export interface WaitingArea {
  upstreamCount: number;
  downstreamCount: number;
  upstreamHasVehicle: boolean;
  downstreamHasVehicle: boolean;
  upstreamRequest: boolean;
  downstreamRequest: boolean;
}

// 联合类型
export type WebSocketMessage =
  | SegmentMessage
  | TrafficLightMessage
  | WaitingAreaMessage
  | LaneStatusMessage
  | WelcomeMessage

// 消息类型枚举
export enum MessageType {
  SEGMENT = 'SEGMENT',
  TRAFFIC_LIGHT = 'TRAFFIC_LIGHT',
  WAITING_AREA = 'WAITING_AREA',
  LANE_STATUS = 'LANE_STATUS',
  WELCOME = 'WELCOME'
}

// 信号灯状态枚举
export enum SignalStatus {
  UPSTREAM = 'UPSTREAM',
  DOWNSTREAM = 'DOWNSTREAM',
  ALL_RED = 'ALL_RED',
  YELLOW_FLASH = 'YELLOW_FLASH'
}

// 路段状态枚举
export enum SegmentStatus {
  VEHICLE_ENTER = 'VEHICLE_ENTER',
  VEHICLE_LEAVE = 'VEHICLE_LEAVE',
  CLEAR = 'CLEAR'
}

// 车辆方向枚举
export enum VehicleDirection {
  UPSTREAM = 'UPSTREAM',
  DOWNSTREAM = 'DOWNSTREAM'
}

// 状态映射
export const SIGNAL_STATUS_MAP = {
  [SignalStatus.UPSTREAM]: '上行',
  [SignalStatus.DOWNSTREAM]: '下行',
  [SignalStatus.ALL_RED]: '全红',
  [SignalStatus.YELLOW_FLASH]: '黄闪'
}

export const DIRECTION_MAP = {
  [VehicleDirection.UPSTREAM]: '上行',
  [VehicleDirection.DOWNSTREAM]: '下行'
}

export const SEGMENT_STATUS_MAP = {
  [SegmentStatus.VEHICLE_ENTER]: '车辆进入',
  [SegmentStatus.VEHICLE_LEAVE]: '车辆离开',
  [SegmentStatus.CLEAR]: '路段清空'
}

// 信号机ID映射
export const SIGNAL_ID_MAP = {
  '37': '起点信号机',
  '38': '信号机2',
  '41': '信号机3',
  '42': '信号机4',
  '43': '终点信号机'
}

// 工具函数
export const formatTimestamp = (timestamp: string): string => {
  return new Date(timestamp).toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

export const getSignalStatusText = (status: SignalStatus): string => {
  return SIGNAL_STATUS_MAP[status] || status
}

export const getDirectionText = (direction: VehicleDirection): string => {
  return DIRECTION_MAP[direction] || direction
}

export const getSegmentStatusText = (status: SegmentStatus): string => {
  return SEGMENT_STATUS_MAP[status] || status
}

export const getSignalName = (sigId: string): string => {
  return SIGNAL_ID_MAP[sigId as keyof typeof SIGNAL_ID_MAP] || sigId
}
