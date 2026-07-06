export enum ZoneStatus {
  CLEAR = 'clear',
  MODERATE = 'moderate',
  BUSY = 'busy',
  CONGESTED = 'congested',
}

export enum IntentType {
  NAVIGATION = 'navigation',
  CROWD_STATUS = 'crowd_status',
  RECOMMENDATION = 'recommendation',
  GENERAL = 'general',
}

export interface CrowdSnapshot {
  zone_id: string;
  density: number;
  status: ZoneStatus;
  queue_time: number;
}

export interface Zone {
  id: string;
  label: string;
  type: string;
  location: [number, number];
  status: ZoneStatus;
}

export interface Route {
  id: string;
  path: string[];
  estimated_time: number;
  crowd_level: number;
  rationale: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: string;
  intent: IntentType;
  context_snapshot: CrowdSnapshot[];
  is_fallback: boolean;
  language: string;
  route_id?: string;
  response_time?: number;
  confidence?: number;
}

export interface Alert {
  id: string;
  level: 'warning' | 'critical';
  message: string;
  zone_id: string;
}

export interface Recommendation {
  id: string;
  type: 'food' | 'restroom' | 'exit' | 'safety';
  message: string;
  zone_id: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export interface UserProfile {
  name: string;
  role: 'fan' | 'staff';
  language: string;
  seat_number?: string;
}

export interface AppState {
  user: UserProfile;
  current_zone_id: string | null;
  crowd_data: CrowdSnapshot[];
  alerts: Alert[];
  recommendations: Recommendation[];
  chat_history: ChatMessage[];
  simulation_time: number;
  dev_mode: boolean;
}