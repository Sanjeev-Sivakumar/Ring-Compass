// Ring Compass - TypeScript Domain Models & Interfaces

export type ProfileType = 'PROFILE_A' | 'PROFILE_B' | 'NORMAL';

export type NavTab = 'overview' | 'motion' | 'home_voice' | 'safety' | 'system';

export interface CentroidCoord {
  x: number;
  y: number;
  frameIndex?: number;
}

export interface Verdict {
  verdict_type: ProfileType;
  title: string;
  badge_text: string;
  color: string;
  details: string;
  is_critical?: boolean;
  vertical_drop?: number;
}

export interface ChimeData {
  dispatch_latency_ms: number;
  chime_frequency_hz: number;
  buffer_duration_sec: number;
  status: string;
  log_message?: string;
  esp32_dispatched?: boolean;
}

export interface TriageRoute {
  state: string;
  is_critical: boolean;
  chime_data?: ChimeData;
  verdict_type?: string;
  summary?: string;
}

export interface CognitiveDialogue {
  dialogue: string;
  tone?: string;
  grounding_zone?: string;
}

export interface DciFormulaData {
  name: string;
  formula: string;
  path_length_L: number;
  net_displacement: number;
  window_size: number;
  threshold_tau: number;
  ratio: number;
  breached: boolean;
}

export interface LatenciesData {
  decode_ms: number;
  tracking_ms: number;
  dci_ms: number;
  decision_ms: number;
  total_ms: number;
}

export interface BiometricsData {
  heart_rate: number | null;
  respiration_rate: number | null;
  signal_quality: string;
  is_medical_grade: boolean;
  bpm_trigger: number;
  disclaimer: string;
}

export interface StreamInfo {
  stream_id: string;
  stream_name: string;
  location_label: string;
  total_frames: number;
  duration_sec: number;
  fps: number;
  annotated_url: string;
  raw_url: string;
  is_active: boolean;
}

export interface SessionState {
  stream_id?: string;
  stream_name: string;
  location_label?: string;
  annotated_url?: string;
  raw_url?: string;
  source: string;
  source_label: string;
  is_playing: boolean;
  current_frame: number;
  total_frames: number;
  timestamp_sec: number;
  duration_sec: number;
  fps: number;
  centroid: [number, number] | null;
  bbox: [number, number, number, number] | null;
  centroids: [number, number][];
  dci: number;
  dci_formula: DciFormulaData;
  biometrics: BiometricsData;
  vertical_drop: number;
  verdict: Verdict;
  dialogue?: string;
  latencies: LatenciesData;
  chart_history: Array<{ frame: string; timestamp: number; dci: number; threshold: number }>;
  is_live: boolean;
  source_type: string;
  timestamp: string;
}

export interface TelemetryData {
  stream_id?: string;
  stream_name: string;
  source_label?: string;
  location_label?: string;
  annotated_url?: string;
  raw_url?: string;
  is_live: boolean;
  source_type: string;
  current_frame?: number;
  total_frames?: number;
  timestamp_sec?: number;
  duration_sec?: number;
  is_playing?: boolean;
  centroid?: [number, number] | null;
  bbox?: [number, number, number, number] | null;
  centroids: [number, number][];
  dci: number;
  dci_formula?: DciFormulaData;
  heart_rate: number | null;
  respiration_rate: number | null;
  signal_quality?: string;
  vertical_drop: number;
  frames_counted: number;
  verdict: Verdict;
  dialogue?: string;
  triage: TriageRoute;
  ha_payload: Array<Record<string, any>>;
  cognitive_dialogue: CognitiveDialogue;
  latencies?: LatenciesData;
  chart_history?: Array<{ frame: string; timestamp: number; dci: number; threshold: number }>;
  timestamp: string;
}

export interface SmartDevice {
  id: string;
  name: string;
  room: string;
  type: 'light' | 'speaker' | 'lock' | 'switch' | 'media_player' | 'camera';
  state: 'on' | 'off' | 'locked' | 'unlocked' | 'active' | 'muted' | 'playing' | 'idle' | 'blinking' | 'speaking';
  is_blinking?: boolean;
  is_locked_on?: boolean;
  is_speaking?: boolean;
  brightness?: number;
  color?: string;
  description: string;
  is_available: boolean;
  hardware_confirmed?: boolean;
  response_latency_ms?: number;
  last_updated: string;
  ip?: string;
}

export interface AuditEvent {
  id: string;
  timestamp: string;
  type: string;
  subsystem: string;
  severity: 'critical' | 'warning' | 'info' | 'success';
  title: string;
  details: string;
  evidence?: Record<string, any>;
}

export interface SubsystemStatus {
  passed: boolean;
  latency_ms?: number;
  message?: string;
  endpoint?: string;
  status_code?: number | string;
}

export interface DiagnosticsResponse {
  timestamp: string;
  readiness_percent: number;
  all_passed: boolean;
  simulate_mode: boolean;
  environment: {
    passed: boolean;
    valid_keys: string[];
    missing_keys: string[];
    total_keys: number;
  };
  ollama: SubsystemStatus;
  home_assistant: SubsystemStatus;
  esp32: SubsystemStatus;
  openweather: {
    passed: boolean;
    zip: string;
    location: string;
  };
  ring: {
    passed: boolean;
    client_id_masked: string;
    mcp_url: string;
  };
}

export interface McpTool {
  name: string;
  description: string;
  status: string;
}

export interface McpStatusResponse {
  server_name: string;
  url: string;
  type: string;
  status: string;
  latency_ms: number;
  protocol_version: string;
  tools: McpTool[];
}

export interface CameraAlert {
  has_alert: boolean;
  camera: string;
  camera_id: string;
  severity: string;
  event_type: string;
  title: string;
  detected_event: string;
  details: string;
  action_triggered?: string;
  timestamp: string;
  dci: number;
  heart_rate: number | null;
}

export interface DualCameraTelemetry {
  cam1: TelemetryData;
  cam2: TelemetryData;
  active_alerts: CameraAlert[];
  esp32: {
    online: boolean;
    latency_ms: number;
    target: string;
    last_trigger: {
      camera: string;
      event: string;
      hardware_response: string;
      latency_ms: number;
      timestamp: string;
    };
  };
  timestamp: string;
}

