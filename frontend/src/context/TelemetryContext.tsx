import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api } from '../api';
import { AuditEvent, DiagnosticsResponse, SmartDevice, TelemetryData, SessionState, DualCameraTelemetry, CameraAlert } from '../types';

interface TelemetryContextType {
  telemetry: TelemetryData | null;
  liveTelemetry: TelemetryData | null;
  dualTelemetry: DualCameraTelemetry | null;
  activeAlerts: CameraAlert[];
  activeIncident: any | null;
  sessionState: SessionState | null;
  devices: SmartDevice[];
  events: AuditEvent[];
  diagnostics: DiagnosticsResponse | null;
  isLoading: boolean;
  isAnalyzing: boolean;
  simulateMode: boolean;
  setSimulateMode: (val: boolean) => void;
  activeStreamId: string;
  availableStreams: any[];
  refreshStreams: () => Promise<any[]>;
  switchStream: (streamId: string) => Promise<void>;
  controlSession: (
    action: string,
    opts?: { timeSec?: number; frameIdx?: number; delta?: number; dciThreshold?: number; bpmTrigger?: number; streamId?: string }
  ) => Promise<any>;
  runSimulation: (preset: string, dciSens?: number, bpmTrigger?: number) => Promise<void>;
  uploadVideoFile: (file: File, dciSens?: number, bpmTrigger?: number) => Promise<any>;
  toggleDevice: (
    id: string,
    action?: string,
    brightness?: number,
    color?: string,
    extra?: { camera?: string; event?: string; action_text?: string; profile?: string }
  ) => Promise<any>;
  triggerChime: (profile?: string) => Promise<any>;
  clearActiveIncident: () => Promise<void>;
  refreshDiagnostics: () => Promise<void>;
  playWebAudioChime: (freq?: number, durationSec?: number) => void;
  playWebAudioAlertBeep: (durationSec?: number) => void;
  speakVoiceDirective: (text: string, force?: boolean) => void;
  announceCameraAlert: (
    alert: {
      camera: string;
      detected_event?: string;
      event_type?: string;
      action_triggered?: string;
      details?: string;
    },
    force?: boolean
  ) => void;
  triggerHardwareSequence: () => Promise<any>;
}

const TelemetryContext = createContext<TelemetryContextType | undefined>(undefined);

export const TelemetryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [telemetry, setTelemetry] = useState<TelemetryData | null>(null);
  const [liveTelemetry, setLiveTelemetry] = useState<TelemetryData | null>(null);
  const [dualTelemetry, setDualTelemetry] = useState<DualCameraTelemetry | null>(null);
  const [activeAlerts, setActiveAlerts] = useState<CameraAlert[]>([]);
  const [activeIncident, setActiveIncident] = useState<any | null>(null);
  const [sessionState, setSessionState] = useState<SessionState | null>(null);
  const [devices, setDevices] = useState<SmartDevice[]>([]);
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [diagnostics, setDiagnostics] = useState<DiagnosticsResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [simulateMode, setSimulateMode] = useState<boolean>(false);
  const lastSpokenRef = React.useRef<{ text: string; time: number }>({ text: '', time: 0 });
  const lastAlertAnnouncedRef = React.useRef<{ key: string; time: number }>({ key: '', time: 0 });



  // Hardware-Exclusive Routing: Audio output on host PC is completely silenced
  // per user directive ("everything must be spoken in the esp32 hardware only and not in the system")
  const playWebAudioChime = useCallback((freq = 432, durationSec = 1.5) => {
    // Silenced on host PC; dispatched directly to ESP32 hardware
  }, []);

  const playWebAudioAlertBeep = useCallback((durationSec = 0.35) => {
    // Silenced on host PC; emitted via Pin D15 on ESP32 hardware
  }, []);

  const speakVoiceDirective = useCallback((text: string, force = false) => {
    // Silenced on host PC browser; dispatched directly to ESP32 hardware
    api.controlDevice('speaker.esp32_audio_chime', 'speak').catch(() => {});
  }, []);

  // Announce Camera Alert: Dispatches directly to ESP32 Hardware Node
  const announceCameraAlert = useCallback(
    (
      alert: {
        camera: string;
        detected_event?: string;
        event_type?: string;
        action_triggered?: string;
        details?: string;
      },
      force = false
    ) => {
      const now = Date.now();
      const alertKey = `${alert.camera}_${alert.event_type || ''}_${alert.detected_event || ''}`;
      
      // Deduplication cooldown prevents stuttering while camera frame is active
      if (!force && alertKey === lastAlertAnnouncedRef.current.key && (now - lastAlertAnnouncedRef.current.time < 10000)) {
        return;
      }
      lastAlertAnnouncedRef.current = { key: alertKey, time: now };

      // Dispatch alert speech exclusively to ESP32 Hardware Speaker (Pin D15)
      api.controlDevice('speaker.esp32_audio_chime', 'speak', undefined, undefined, {
        camera: alert.camera,
        event: alert.detected_event || alert.details,
        action_text: alert.action_triggered,
        profile: alert.event_type || 'PROFILE_B',
      }).then(() => {
        api.getDevices().then((devs) => setDevices(devs)).catch(() => {});
      }).catch(() => {});
    },
    []
  );

  const [activeStreamId, setActiveStreamId] = useState<string>('stream_1');
  const [availableStreams, setAvailableStreams] = useState<any[]>([]);

  const refreshStreams = useCallback(async () => {
    try {
      const s = await api.getStreams();
      setAvailableStreams(s);
      return s;
    } catch (e) {
      console.warn('Failed to fetch streams:', e);
      return [];
    }
  }, []);

  // Fetch all initial data
  const refreshAll = useCallback(async () => {
    try {
      const [tData, dData, eData, diagData, sData] = await Promise.allSettled([
        api.getLatestTelemetry(),
        api.getDevices(),
        api.getEvents(25),
        api.getDiagnostics(simulateMode),
        api.getStreams(),
      ]);

      if (tData.status === 'fulfilled') setTelemetry(tData.value);
      if (dData.status === 'fulfilled') setDevices(dData.value);
      if (eData.status === 'fulfilled') setEvents(eData.value);
      if (diagData.status === 'fulfilled') setDiagnostics(diagData.value);
      if (sData.status === 'fulfilled') setAvailableStreams(sData.value);
    } catch (err) {
      console.error('Error fetching dashboard state:', err);
    } finally {
      setIsLoading(false);
    }
  }, [simulateMode]);

  const switchStream = useCallback(async (streamId: string) => {
    setActiveStreamId(streamId);
    try {
      const updated = await api.switchStream(streamId);
      setSessionState(updated);
      const t = await api.getLatestTelemetry(undefined);
      setTelemetry(t);
    } catch (err) {
      console.error('Failed to switch stream:', err);
    }
  }, []);

  const controlSession = useCallback(
    async (
      action: string,
      opts?: { timeSec?: number; frameIdx?: number; delta?: number; dciThreshold?: number; bpmTrigger?: number; streamId?: string }
    ) => {
      try {
        const payloadOpts = { ...opts, streamId: opts?.streamId || activeStreamId };
        const updated = await api.controlSession(action, payloadOpts);
        setSessionState(updated);
        const t = await api.getLatestTelemetry();
        setTelemetry(t);
        if (action === 'restart') {
          const evts = await api.getEvents(25);
          setEvents(evts);
        }
        return updated;
      } catch (err) {
        console.error('Session control failed:', err);
      }
    },
    [activeStreamId]
  );

  // Fast synchronized session state, live stream, and dual camera polling
  useEffect(() => {
    let isMounted = true;
    const fetchSession = async () => {
      try {
        const [s, t, l, d, devs] = await Promise.allSettled([
          api.getSessionState(),
          api.getLatestTelemetry(),
          api.getLiveTelemetry(),
          api.getDualTelemetry(),
          api.getDevices(),
        ]);
        if (isMounted) {
          if (devs.status === 'fulfilled') setDevices(devs.value);
          if (s.status === 'fulfilled') setSessionState(s.value);
          if (t.status === 'fulfilled') {
            setTelemetry(t.value);
            if (t.value.verdict?.is_critical) {
              setActiveIncident(t.value.verdict);
            }
          }
          if (l.status === 'fulfilled') {
            setLiveTelemetry(l.value);
          }
          if (d.status === 'fulfilled') {
            setDualTelemetry(d.value);
            const alerts = d.value.active_alerts || [];
            setActiveAlerts(alerts);
            if (alerts.length > 0) {
              const crit = alerts.find((a: CameraAlert) => a.severity === 'critical');
              if (crit) {
                setActiveIncident({
                  title: crit.title,
                  details: `${crit.detected_event} — ${crit.details}`,
                  is_critical: true,
                  verdict_type: crit.event_type,
                  camera: crit.camera,
                  timestamp: crit.timestamp,
                });

                // Automated Voice & Chime Triggering: Starts with beep, then announces camera, event, and action triggered
                announceCameraAlert(crit);
              }
            }
          }
        }
      } catch (e) {
        // silent background poll
      }
    };

    fetchSession();
    const interval = setInterval(fetchSession, 750);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const refreshDiagnostics = useCallback(async () => {
    try {
      const data = await api.getDiagnostics(simulateMode);
      setDiagnostics(data);
    } catch (err) {
      console.error('Diagnostics refresh failed:', err);
    }
  }, [simulateMode]);

  const runSimulation = useCallback(
    async (preset: string, dciSens = 3.0, bpmTrigger = 95.0) => {
      setIsAnalyzing(true);
      try {
        const updated = await api.simulatePreset(preset, dciSens, bpmTrigger);
        setTelemetry(updated);
        // Play local tone if critical
        if (updated.verdict?.is_critical) {
          playWebAudioChime(432, 1.5);
        }
        // Refresh devices and events
        const [devs, evts] = await Promise.all([api.getDevices(), api.getEvents(25)]);
        setDevices(devs);
        setEvents(evts);
      } catch (err) {
        console.error('Simulation failed:', err);
      } finally {
        setIsAnalyzing(false);
      }
    },
    [playWebAudioChime]
  );

  const uploadVideoFile = useCallback(
    async (file: File, dciSens = 3.0, bpmTrigger = 95.0) => {
      setIsAnalyzing(true);
      try {
        const updated = await api.uploadVideo(file, dciSens, bpmTrigger);
        setTelemetry(updated);
        const newStreamId = (updated as any)?.stream_id;
        if (newStreamId) {
          setActiveStreamId(newStreamId);
          try {
            const [sState, streams] = await Promise.all([
              api.getSessionState(newStreamId),
              api.getStreams(),
            ]);
            setSessionState(sState);
            setAvailableStreams(streams);
          } catch (e) {
            console.warn('Post-upload stream sync error:', e);
          }
        }
        if (updated.verdict?.is_critical) {
          playWebAudioChime(432, 1.5);
        }
        const [devs, evts] = await Promise.all([api.getDevices(), api.getEvents(25)]);
        setDevices(devs);
        setEvents(evts);
        return updated;
      } catch (err) {
        console.error('Video upload failed:', err);
        throw err;
      } finally {
        setIsAnalyzing(false);
      }
    },
    [playWebAudioChime]
  );

  const toggleDevice = useCallback(
    async (
      id: string,
      action = 'toggle',
      brightness?: number,
      color?: string,
      extra?: { camera?: string; event?: string; action_text?: string; profile?: string }
    ) => {
      try {
        const updated = await api.controlDevice(id, action, brightness, color, extra);
        setDevices((prev) => prev.map((d) => (d.id === id ? updated : d)));
        const evts = await api.getEvents(25);
        setEvents(evts);
        return updated;
      } catch (err) {
        console.error('Device toggle failed:', err);
        throw err;
      }
    },
    []
  );

  const triggerChime = useCallback(
    async (profile = 'MANUAL_TEST') => {
      playWebAudioChime(432, 1.5);
      try {
        const res = await api.triggerChime(profile);
        const evts = await api.getEvents(25);
        setEvents(evts);
        return res;
      } catch (err) {
        console.error('Chime dispatch failed:', err);
      }
    },
    [playWebAudioChime]
  );

  const clearActiveIncident = useCallback(async () => {
    setActiveIncident(null);
    try {
      await api.clearIncident();
      const [tData, evts] = await Promise.all([api.getLatestTelemetry(), api.getEvents(25)]);
      setTelemetry(tData);
      setEvents(evts);
    } catch (err) {
      console.error('Clear incident failed:', err);
    }
  }, []);

  const triggerHardwareSequence = useCallback(async () => {
    playWebAudioChime(432, 1.8);
    try {
      const res = await api.triggerHardwareSequence();
      const [devs, evts] = await Promise.all([api.getDevices(), api.getEvents(25)]);
      setDevices(devs);
      setEvents(evts);
      return res;
    } catch (err) {
      console.error('Hardware sequence dispatch failed:', err);
    }
  }, [playWebAudioChime]);

  return (
    <TelemetryContext.Provider
      value={{
        telemetry,
        liveTelemetry,
        dualTelemetry,
        activeAlerts,
        activeIncident,
        sessionState,
        controlSession,
        devices,
        events,
        diagnostics,
        isLoading,
        isAnalyzing,
        simulateMode,
        setSimulateMode,
        runSimulation,
        uploadVideoFile,
        toggleDevice,
        triggerChime,
        clearActiveIncident,
        activeStreamId,
        availableStreams,
        refreshStreams,
        switchStream,
        refreshDiagnostics,
        playWebAudioChime,
        playWebAudioAlertBeep,
        speakVoiceDirective,
        announceCameraAlert,
        triggerHardwareSequence,
      }}
    >
      {children}
    </TelemetryContext.Provider>
  );
};

export const useTelemetry = () => {
  const context = useContext(TelemetryContext);
  if (!context) throw new Error('useTelemetry must be used within a TelemetryProvider');
  return context;
};
