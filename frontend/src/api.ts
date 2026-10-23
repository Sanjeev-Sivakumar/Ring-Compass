import { DiagnosticsResponse, McpStatusResponse, SmartDevice, TelemetryData, AuditEvent, SessionState, DualCameraTelemetry } from './types';

const BASE_URL = '/api';

export const api = {
  async getHealth() {
    const res = await fetch(`${BASE_URL}/health`);
    return res.json();
  },

  async getDualTelemetry(): Promise<DualCameraTelemetry> {
    const res = await fetch(`${BASE_URL}/telemetry/dual`);
    if (!res.ok) throw new Error('Failed to fetch dual camera telemetry');
    return res.json();
  },


  async getSessionState(streamId?: string): Promise<SessionState> {
    const url = streamId ? `${BASE_URL}/session/state?stream_id=${streamId}` : `${BASE_URL}/session/state`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch session state');
    return res.json();
  },

  async getStreams(): Promise<any[]> {
    const res = await fetch(`${BASE_URL}/session/streams`);
    if (!res.ok) throw new Error('Failed to fetch streams');
    return res.json();
  },

  async switchStream(streamId: string): Promise<SessionState> {
    const res = await fetch(`${BASE_URL}/session/switch_stream?stream_id=${streamId}`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Failed to switch stream');
    return res.json();
  },

  async controlSession(
    action: string,
    opts?: { timeSec?: number; frameIdx?: number; delta?: number; dciThreshold?: number; bpmTrigger?: number; streamId?: string }
  ): Promise<SessionState> {
    const res = await fetch(`${BASE_URL}/session/control`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action,
        stream_id: opts?.streamId,
        time_sec: opts?.timeSec,
        frame_idx: opts?.frameIdx,
        delta: opts?.delta,
        dci_threshold: opts?.dciThreshold,
        bpm_trigger: opts?.bpmTrigger,
      }),
    });
    if (!res.ok) throw new Error('Session control failed');
    return res.json();
  },

  async getDiagnostics(simulate = true): Promise<DiagnosticsResponse> {
    const res = await fetch(`${BASE_URL}/diagnostics?simulate=${simulate}`);
    if (!res.ok) throw new Error('Failed to fetch diagnostics');
    return res.json();
  },

  async getLatestTelemetry(source?: string): Promise<TelemetryData> {
    const url = source ? `${BASE_URL}/telemetry/latest?source=${source}` : `${BASE_URL}/telemetry/latest`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch latest telemetry');
    return res.json();
  },

  async getLiveTelemetry(): Promise<TelemetryData> {
    const res = await fetch(`${BASE_URL}/telemetry/live`);
    if (!res.ok) throw new Error('Failed to fetch live telemetry');
    return res.json();
  },

  async simulatePreset(presetName: string, dciSensitivity = 3.0, bpmTrigger = 95.0): Promise<TelemetryData> {
    const res = await fetch(`${BASE_URL}/telemetry/simulate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        preset_name: presetName,
        dci_sensitivity: dciSensitivity,
        bpm_trigger: bpmTrigger,
      }),
    });
    if (!res.ok) throw new Error('Simulation failed');
    return res.json();
  },

  async uploadVideo(file: File, dciSensitivity = 3.0, bpmTrigger = 95.0): Promise<TelemetryData> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('dci_sensitivity', dciSensitivity.toString());
    formData.append('bpm_trigger', bpmTrigger.toString());

    const res = await fetch(`${BASE_URL}/telemetry/upload`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) throw new Error('Video upload failed');
    return res.json();
  },

  async getDevices(): Promise<SmartDevice[]> {
    const res = await fetch(`${BASE_URL}/devices`);
    if (!res.ok) throw new Error('Failed to fetch devices');
    return res.json();
  },

  async controlDevice(
    deviceId: string,
    action: string,
    brightness?: number,
    color?: string,
    extra?: { camera?: string; event?: string; action_text?: string; profile?: string }
  ): Promise<SmartDevice> {
    const res = await fetch(`${BASE_URL}/devices/${deviceId}/action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, brightness, color, ...(extra || {}) }),
    });
    if (!res.ok) throw new Error('Device control failed');
    return res.json();
  },

  async triggerChime(profile = 'MANUAL_TEST') {
    const res = await fetch(`${BASE_URL}/triage/trigger-chime?profile=${profile}`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Chime trigger failed');
    return res.json();
  },

  async generateVoice(profile = 'PROFILE_A') {
    const res = await fetch(`${BASE_URL}/voice/generate?profile=${profile}`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Voice generation failed');
    return res.json();
  },

  async generateVoiceDialogue(profile = 'PROFILE_A', context = '', heartRate = 80) {
    return this.generateVoice(profile);
  },

  async getMcpStatus(): Promise<McpStatusResponse> {
    const res = await fetch(`${BASE_URL}/mcp/status`);
    if (!res.ok) throw new Error('Failed to fetch MCP status');
    return res.json();
  },

  async getEvents(limit = 50): Promise<AuditEvent[]> {
    const res = await fetch(`${BASE_URL}/events?limit=${limit}`);
    if (!res.ok) throw new Error('Failed to fetch events');
    return res.json();
  },

  async clearIncident() {
    const res = await fetch(`${BASE_URL}/events/clear`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Failed to clear incident');
    return res.json();
  },

  async getSettings() {
    const res = await fetch(`${BASE_URL}/settings`);
    if (!res.ok) throw new Error('Failed to fetch settings');
    return res.json();
  },

  async triggerHardwareSequence() {
    const res = await fetch(`${BASE_URL}/hardware/sequence`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Hardware sequence failed');
    return res.json();
  },
};
