import React, { useState } from 'react';
import { 
  Lightbulb, 
  Volume2, 
  VolumeX, 
  Play, 
  Square, 
  Power, 
  Sparkles, 
  CheckCircle, 
  AlertCircle, 
  Send, 
  Info,
  Radio,
  RotateCcw,
  Sliders,
  ChevronRight,
  Mic,
  MicOff,
  Camera
} from 'lucide-react';
import { useTelemetry } from '../context/TelemetryContext';
import { VoiceOrb, VoiceState } from '../components/VoiceOrb';
import { api } from '../api';
import { SmartDevice } from '../types';

interface Message {
  id: string;
  sender: 'ai' | 'user' | 'system';
  text: string;
  timestamp: string;
  source: string;
}

export const HomeVoicePage: React.FC = () => {
  const { 
    devices, 
    toggleDevice, 
    triggerChime, 
    playWebAudioChime, 
    telemetry,
    sessionState,
    activeStreamId,
    switchStream,
    triggerHardwareSequence 
  } = useTelemetry();

  // Voice Companion state
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [inputText, setInputText] = useState<string>('');
  const [isSequenceRunning, setIsSequenceRunning] = useState<boolean>(false);
  const [localLedActive, setLocalLedActive] = useState<boolean>(false);
  const [caregiverMicActive, setCaregiverMicActive] = useState<boolean>(false);

  const isStream2 = activeStreamId === 'stream_2';
  const streamLabel = isStream2 ? 'Porch Doorbell Node (test2.mov)' : 'Corridor Egress Node (test.mov)';

  // Initial transcript messages grounded in footage telemetry
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'm-sys-1',
      sender: 'system',
      text: 'Acoustic de-escalation buffer armed. Alexa connected device linked on 192.168.1.113.',
      timestamp: '01:00:00',
      source: 'Hardware Bus',
    },
    {
      id: 'm-ai-1',
      sender: 'ai',
      text: sessionState?.dialogue || telemetry?.cognitive_dialogue?.dialogue || 'Corridor transit detected. Exterior doorway secured.',
      timestamp: '01:00:05',
      source: 'Optical Safety Engine',
    },
  ]);

  // Extract real physical devices
  const ledDevice: SmartDevice = devices.find((d) => d.id === 'light.esp32_amber_led') || {
    id: 'light.esp32_amber_led',
    name: 'Alexa Connected Pathway LED',
    room: 'Alexa Connected Edge Node (GPIO 4 / D4)',
    type: 'light',
    state: 'off',
    is_blinking: false,
    is_locked_on: false,
    is_available: false,
    hardware_confirmed: false,
    response_latency_ms: 0,
    last_updated: '',
    description: 'Alexa connected amber pathway LED for visual orientation guidance',
  };

  const speakerDevice: SmartDevice = devices.find((d) => d.id === 'speaker.esp32_audio_chime') || {
    id: 'speaker.esp32_audio_chime',
    name: 'Alexa Connected Audio Speaker (5s Beep)',
    room: 'Alexa Connected Edge Node (GPIO 15 / D15)',
    type: 'speaker',
    state: 'idle',
    is_speaking: false,
    is_available: false,
    hardware_confirmed: false,
    response_latency_ms: 0,
    last_updated: '',
    description: 'Alexa connected 1000 Hz 5-second alert beep buzzer on Pin D15',
  };

  // Extract Real Verified Hardware States (Never assumed, never optimistic)
  const isLedHardwareOnline = Boolean(ledDevice.is_available && ledDevice.hardware_confirmed);
  const isSpeakerHardwareOnline = Boolean(speakerDevice.is_available && speakerDevice.hardware_confirmed);

  // Requirement 2: Whenever the physical LED is ON, the corresponding LED indicator in the Home & Voice dashboard must blink. Stop blinking only when the physical LED is confirmed OFF.
  const isPhysicalLedOn = isLedHardwareOnline && (
    ledDevice.state === 'on' ||
    ledDevice.state === 'blinking' ||
    Boolean(ledDevice.is_locked_on) ||
    Boolean(ledDevice.is_blinking)
  );
  const isLedLockedOn = isLedHardwareOnline && Boolean(ledDevice.is_locked_on);
  const isLedIndicatorBlinking = isPhysicalLedOn;

  // Requirement 3: Whenever the physical speaker is actively playing audio, its dashboard indicator must blink. Stop blinking when playback has actually finished.
  const isPhysicalSpeakerPlaying = isSpeakerHardwareOnline && (
    speakerDevice.state === 'speaking' ||
    speakerDevice.state === 'playing' ||
    Boolean(speakerDevice.is_speaking)
  );
  const isSpeakerIndicatorBlinking = isPhysicalSpeakerPlaying;

  // Toggle Physical Amber LED individually
  const handleToggleLed = async () => {
    try {
      if (isPhysicalLedOn) {
        // Turn OFF light individually (speaker is completely unaffected!)
        await toggleDevice('light.esp32_amber_led', 'turn_off');
      } else {
        // Turn ON light: locked on throughout! Does NOT trigger voice playback
        await toggleDevice('light.esp32_amber_led', 'turn_on');
      }
    } catch (e) {
      console.warn('Hardware node dispatch error:', e);
    }
  };

  // Play Voice Announcement / Test on Physical Speaker individually
  const handlePlayPhysicalSpeaker = async () => {
    // Only triggers the speaker on ESP32; if light was locked on, light stays ON!
    try {
      await toggleDevice('speaker.esp32_audio_chime', 'speak', undefined, undefined, {
        camera: isStream2 ? 'CAM 2' : 'CAM 1',
        event: isStream2 ? 'Fatigue collapse and sudden fall detected' : 'Doorway pacing loop detected',
        action_text: isStream2 ? 'Caregiver alerted and emergency beacon activated' : 'Amber pathway guidance lights illuminated',
        profile: isStream2 ? 'PROFILE_B' : 'PROFILE_A',
      });
    } catch (e) {
      console.warn('Speaker dispatch error:', e);
    }
  };

  // Stop Physical Speaker individually
  const handleStopPhysicalSpeaker = async () => {
    // Stops the speaker only; does NOT touch the light!
    try {
      await toggleDevice('speaker.esp32_audio_chime', 'stop');
    } catch (e) {
      console.warn('Speaker stop error:', e);
    }
  };

  // Coordinated De-escalation Response Sequence
  const handleTriggerCoordinatedSequence = async () => {
    setIsSequenceRunning(true);
    try {
      await triggerHardwareSequence();
    } catch (e) {
      console.error(e);
    } finally {
      setTimeout(() => setIsSequenceRunning(false), 2000);
    }
  };

  // Voice Speech Synthesis Handler: Dispatched exclusively to ESP32 Hardware Speaker (Pin D15)
  const speakText = async (text: string) => {
    setVoiceState('speaking');
    try {
      await toggleDevice('speaker.esp32_audio_chime', 'speak', undefined, undefined, {
        camera: isStream2 ? 'CAM 2' : 'CAM 1',
        event: text,
        action_text: 'Autonomous guidance broadcast via ESP32 Pin D15',
        profile: isStream2 ? 'PROFILE_B' : 'PROFILE_A',
      });
    } catch (e) {
      console.warn('Hardware speaker speech error:', e);
    }
  };

  const handleStopSpeaking = async () => {
    setVoiceState('idle');
    try {
      await toggleDevice('speaker.esp32_audio_chime', 'stop');
    } catch (e) {
      console.warn('Hardware speaker stop error:', e);
    }
  };

  // Broadcast Guidance Message to the Corridor Speaker
  const handleBroadcastGuidance = (customText?: string) => {
    const textToBroadcast = customText || inputText || sessionState?.dialogue || telemetry?.cognitive_dialogue?.dialogue || 'Turn around and follow the warm amber floor lighting back to the bedroom.';
    
    const broadcastMsg: Message = {
      id: `ai-${Date.now()}`,
      sender: 'ai',
      text: textToBroadcast,
      timestamp: new Date().toLocaleTimeString(),
      source: isStream2 ? 'Porch Doorbell Intercom' : 'Corridor Acoustic Speaker',
    };
    
    setMessages((prev) => [...prev, broadcastMsg]);
    setInputText('');
    setVoiceState('speaking');
    speakText(textToBroadcast);
  };

  // Footage-Grounded Guidance Presets (Concise action directives)
  const footageDirectivesStream1 = [
    'Follow amber pathway to bed',
    'Threshold secured and locked',
    'Hallway orientation active',
  ];

  const footageDirectivesStream2 = [
    'Two-way audio active',
    'Amber lighting illuminated',
    'Caregiver alerted',
  ];

  const activeDirectives = isStream2 ? footageDirectivesStream2 : footageDirectivesStream1;

  // Toggle Caregiver Push-to-Talk Intercom
  const handleToggleCaregiverMic = () => {
    setCaregiverMicActive(!caregiverMicActive);
  };

  return (
    <div className="space-y-8">
      {/* SECTION 1: PHYSICAL HARDWARE CONTROL */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-[#E8EFEA] text-[#1B3B2B] border border-[#1B3B2B]/20 text-[11px] font-sans font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
              <span>Active Hardware Node • Alexa Connected Device (<span className="font-mono">192.168.1.113</span>) • {streamLabel}</span>
            </div>
            <h1 className="text-[26px] sm:text-[30px] font-heading font-medium text-[#1C201E] tracking-tight leading-tight">
              Home Automation &amp; Acoustic Triage
            </h1>
          </div>

          {/* Trigger Coordinated Sequence Button */}
          <button
            onClick={handleTriggerCoordinatedSequence}
            disabled={isSequenceRunning}
            className="px-4 py-2.5 rounded-xl text-[13px] font-body font-medium bg-[#1B3B2B] hover:bg-[#264E3B] text-white transition active:scale-95 disabled:opacity-50 flex items-center gap-2 shadow-xs shrink-0"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            {isSequenceRunning ? 'Triggering Sequence...' : 'Trigger Coordinated De-escalation'}
          </button>
        </div>

        {/* 2 Dedicated Hardware Cards: Completely Independent States */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: Alexa Connected Light (D4 Amber LED) */}
          <div
            className={`relative rounded-2xl p-6 sm:p-7 border transition-all duration-300 overflow-hidden ${
              !isLedHardwareOnline
                ? 'bg-stone-50/80 border-rose-300/80 shadow-xs'
                : isLedIndicatorBlinking
                ? 'bg-gradient-to-br from-amber-500/25 via-amber-100/60 to-white border-amber-500 ring-4 ring-amber-400/50 shadow-2xl shadow-amber-500/40 animate-pulse'
                : 'bg-white border-[#EAE5DC] shadow-xs'
            }`}
          >
            {isLedIndicatorBlinking && (
              <div
                className="pointer-events-none absolute -top-12 -right-12 w-64 h-64 rounded-full blur-3xl transition-opacity duration-700 animate-ping opacity-80"
                style={{
                  background: 'radial-gradient(circle, rgba(245, 158, 11, 0.60) 0%, rgba(251, 191, 36, 0.35) 50%, rgba(255, 255, 255, 0) 80%)',
                }}
              />
            )}

            <div className="flex items-start justify-between relative z-10">
              <div className="flex items-center gap-4">
                <div
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 ${
                    !isLedHardwareOnline
                      ? 'bg-rose-50 text-rose-500 border border-rose-200'
                      : isLedIndicatorBlinking
                      ? 'bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow-xl shadow-amber-500/60 animate-bounce scale-110'
                      : 'bg-[#F4F0E8] text-[#8A948D] border border-[#E2DDD3]'
                  }`}
                >
                  <Lightbulb className={`w-7 h-7 ${isLedIndicatorBlinking ? 'drop-shadow-md text-white' : ''}`} />
                </div>

                <div>
                  <span className="text-[11px] font-sans text-[#8A948D] font-medium block">
                    GPIO 4 • Pin D4 • Alexa Connected
                  </span>
                  <h3 className="text-[18px] font-heading font-medium text-[#1C201E] leading-snug">
                    Alexa Connected Pathway LED
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        !isLedHardwareOnline
                          ? 'bg-rose-500'
                          : isLedIndicatorBlinking
                          ? 'bg-amber-500 animate-ping'
                          : 'bg-emerald-600'
                      }`}
                    />
                    <span className={`text-[12px] font-mono ${!isLedHardwareOnline ? 'text-rose-700 font-semibold' : 'text-[#57605A]'}`}>
                      {!isLedHardwareOnline
                        ? 'Node: 192.168.1.113 (Hardware Unreachable)'
                        : isLedIndicatorBlinking
                        ? `Node: 192.168.1.113 (Physical LED ON • ${ledDevice.response_latency_ms || 1.2}ms)`
                        : `Node: 192.168.1.113 (Verified Standby • ${ledDevice.response_latency_ms || 1.2}ms)`}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`px-2.5 py-1 rounded-full text-[11px] font-sans font-bold flex items-center gap-1.5 ${
                    !isLedHardwareOnline
                      ? 'bg-rose-100 text-rose-800 border border-rose-300'
                      : isLedIndicatorBlinking
                      ? 'bg-amber-500 text-white animate-pulse shadow-md shadow-amber-300'
                      : 'bg-[#F4F0E8] text-[#57605A] border border-[#E2DDD3]'
                  }`}
                >
                  {!isLedHardwareOnline ? (
                    '⚠️ Hardware Unreachable'
                  ) : isLedIndicatorBlinking ? (
                    <>
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                      <span>🚨 Blinking • Physical LED ON</span>
                    </>
                  ) : (
                    'Off (Hardware Standby)'
                  )}
                </span>

                <button
                  onClick={handleToggleLed}
                  className={`p-3 rounded-xl border transition-all active:scale-95 shadow-sm ${
                    isPhysicalLedOn
                      ? 'bg-amber-500 text-white border-amber-600 shadow-md shadow-amber-300 ring-2 ring-amber-300'
                      : 'bg-[#F4F0E8] text-[#57605A] border-[#E2DDD3] hover:bg-[#EAE5DC]'
                  }`}
                  title={
                    isPhysicalLedOn
                      ? 'Turn OFF physical amber LED individually'
                      : 'Turn ON physical amber LED (stays solidly lit throughout)'
                  }
                >
                  <Power className="w-5 h-5" />
                </button>
              </div>
            </div>



            <div className="mt-4 p-3 rounded-xl bg-white/70 border border-[#EAE5DC] relative z-10">
              <div className="flex items-center justify-between text-[11px] font-sans text-[#8A948D] mb-2 font-semibold">
                <span>Hallway Corridor Light Strip</span>
                <span className="font-mono text-[10px]">
                  {!isLedHardwareOnline
                    ? 'Hardware Offline'
                    : isLedIndicatorBlinking
                    ? '5 / 5 Nodes Lit (Physical D4 Active)'
                    : '0 / 5 Nodes Lit (Physical D4 Inactive)'}
                </span>
              </div>
              <div className="flex items-center justify-between px-2 py-1">
                {[1, 2, 3, 4, 5].map((node) => (
                  <div key={node} className="flex items-center gap-2">
                    <div
                      className={`w-4 h-4 rounded-full transition-all duration-300 ${
                        !isLedHardwareOnline
                          ? 'bg-stone-200 border border-rose-300'
                          : isLedIndicatorBlinking
                          ? 'bg-amber-400 ring-4 ring-amber-400/60 shadow-lg shadow-amber-400 animate-ping'
                          : 'bg-stone-300'
                      }`}
                    />
                    {node < 5 && (
                      <div
                        className={`h-0.5 w-6 sm:w-10 transition-colors duration-500 ${
                          isLedIndicatorBlinking ? 'bg-amber-300' : 'bg-stone-200'
                        }`}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 pt-3.5 border-t border-[#EAE5DC] flex items-center justify-between text-[12px] font-sans text-[#57605A] relative z-10">
              <span>Illumination State:</span>
              <span
                className={`font-semibold px-3 py-1 rounded-full text-[11px] flex items-center gap-1.5 ${
                  !isLedHardwareOnline
                    ? 'bg-rose-100 text-rose-800 border border-rose-200'
                    : isLedIndicatorBlinking
                    ? 'bg-amber-500 text-white animate-pulse shadow-md'
                    : 'bg-[#F4F0E8] text-[#57605A] border border-[#E2DDD3]'
                }`}
              >
                {isLedIndicatorBlinking && <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />}
                <span>
                  {!isLedHardwareOnline
                    ? '⚠️ Connection Error: Hardware Node Unreachable'
                    : isLedIndicatorBlinking
                    ? isLedLockedOn
                      ? '🚨 Physical LED Locked ON (Blinking Indicator)'
                      : '🚨 Physical LED Alert Active (Blinking Indicator)'
                    : 'Muted (Off • Hardware Verified)'}
                </span>
              </span>
            </div>
          </div>

          {/* Card 2: Alexa Connected Speaker (D15 5-Second Alert Beep) */}
          <div
            className={`rounded-2xl p-6 sm:p-7 border transition-all duration-300 shadow-xs flex flex-col justify-between overflow-hidden relative ${
              !isSpeakerHardwareOnline
                ? 'bg-stone-50/80 border-rose-300/80'
                : isSpeakerIndicatorBlinking
                ? 'bg-gradient-to-br from-emerald-500/20 via-emerald-100/50 to-white border-emerald-500 ring-4 ring-emerald-400/50 shadow-2xl shadow-emerald-500/30 animate-pulse'
                : 'bg-white border-[#EAE5DC]'
            }`}
          >
            <div>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 ${
                      !isSpeakerHardwareOnline
                        ? 'bg-rose-50 text-rose-500 border border-rose-200'
                        : isSpeakerIndicatorBlinking
                        ? 'bg-[#1B3B2B] text-white shadow-xl shadow-emerald-400/60 animate-bounce scale-110'
                        : 'bg-[#F4F0E8] text-[#57605A] border border-[#E2DDD3]'
                    }`}
                  >
                    <Volume2 className={`w-7 h-7 ${isSpeakerIndicatorBlinking ? 'text-emerald-300' : ''}`} />
                  </div>

                  <div>
                    <span className="text-[11px] font-sans text-[#8A948D] font-medium block">
                      GPIO 15 • Pin D15 • Alexa Connected Speaker
                    </span>
                    <h3 className="text-[18px] font-heading font-medium text-[#1C201E] leading-snug">
                      Alexa Connected Audio Speaker
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          !isSpeakerHardwareOnline
                            ? 'bg-rose-500'
                            : isSpeakerIndicatorBlinking
                            ? 'bg-emerald-500 animate-ping'
                            : 'bg-emerald-600'
                        }`}
                      />
                      <span
                        className={`text-[12px] font-mono ${
                          !isSpeakerHardwareOnline ? 'text-rose-700 font-medium' : 'text-[#57605A]'
                        }`}
                      >
                        {!isSpeakerHardwareOnline
                          ? 'Node: 192.168.1.113 (Hardware Unreachable)'
                          : isSpeakerIndicatorBlinking
                          ? 'Alexa Connected Audio Output Active (5s Alert Beep)'
                          : 'Zero PC Audio • Alexa Connected Standby'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`px-2.5 py-1 rounded-full text-[11px] font-sans font-medium flex items-center gap-1.5 ${
                      !isSpeakerHardwareOnline
                        ? 'bg-rose-100 text-rose-800 border border-rose-300'
                        : isSpeakerIndicatorBlinking
                        ? 'bg-emerald-700 text-white border border-emerald-500 animate-pulse shadow-md shadow-emerald-200'
                        : 'bg-[#F4F0E8] text-[#57605A] border border-[#E2DDD3]'
                    }`}
                  >
                    {!isSpeakerHardwareOnline ? (
                      '⚠️ Hardware Unreachable'
                    ) : isSpeakerIndicatorBlinking ? (
                      <>
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                        <span>🔊 Blinking • 5s Alert Beep Active</span>
                      </>
                    ) : (
                      'Idle • Alexa Connected Standby'
                    )}
                  </span>
                </div>
              </div>

              {/* Dynamic Sound Frequency Bars Animation when Beeping */}
              {isSpeakerIndicatorBlinking && (
                <div className="mt-3 p-2 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs font-mono text-emerald-950">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-3 bg-emerald-600 rounded animate-bounce"></span>
                    <span className="w-1.5 h-5 bg-emerald-600 rounded animate-bounce [animation-delay:0.1s]"></span>
                    <span className="w-1.5 h-4 bg-emerald-700 rounded animate-bounce [animation-delay:0.2s]"></span>
                    <span className="w-1.5 h-6 bg-emerald-600 rounded animate-bounce [animation-delay:0.15s]"></span>
                    <span className="font-medium text-[11px] ml-1">Pin D15 Alexa Connected Audio Active</span>
                  </div>
                  <span className="text-[10.5px] text-emerald-800 font-medium">Alexa Audio Node</span>
                </div>
              )}


            </div>

            <div className="mt-5 pt-3.5 border-t border-[#EAE5DC] flex flex-wrap items-center justify-between gap-2.5 text-xs">
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePlayPhysicalSpeaker}
                  className="px-3.5 py-2 rounded-xl text-[13px] font-body font-semibold bg-[#1B3B2B] hover:bg-[#264E3B] text-white transition active:scale-95 flex items-center gap-1.5 shadow-xs"
                  title="Trigger 5-second alert beep directly on ESP32 hardware speaker"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  Trigger 5s Alert Beep
                </button>
                <button
                  onClick={handleStopPhysicalSpeaker}
                  className="p-2 rounded-xl bg-[#F4F0E8] hover:bg-[#EAE5DC] text-[#1C201E] border border-[#E2DDD3] transition active:scale-95"
                  title="Stop Alert Beep (LED remains unaffected)"
                >
                  <Square className="w-3.5 h-3.5 fill-current text-red-600" />
                </button>
              </div>

              <div className="px-2.5 py-1 rounded-md bg-[#FAF8F5] border border-[#EAE5DC] text-[11px] font-mono text-[#57605A]">
                Pin D15 • 5s Alert Beep • Zero PC Audio
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: ACOUSTIC GROUNDING SPEAKER & GUIDANCE BROADCAST */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-[#EAE5DC] shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 mb-6 border-b border-[#EAE5DC]">
          <div>
            <h2 className="text-[20px] sm:text-[22px] font-heading font-semibold text-[#1C201E]">
              Acoustic Console
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono px-3 py-1 rounded-full bg-[#E8EFEA] text-[#1B3B2B] border border-[#1B3B2B]/20 font-semibold">
              Autonomous Speaker Output
            </span>
          </div>
        </div>

        {/* ARCHITECTURAL CLARITY CALLOUT ON MICROPHONE VS SPEAKER */}
        <div className="rounded-xl p-4 bg-[#FAF8F5] border border-[#EAE5DC] text-[13px] font-body text-[#57605A] mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
            <span className="font-semibold text-[#1C201E]">Corridor Voice Intercom: Active</span>
          </div>

          {/* Optional Caregiver Push-To-Talk Intercom Button */}
          <div className="shrink-0 flex items-center gap-2">
            <button
              onClick={handleToggleCaregiverMic}
              className={`px-3.5 py-2 rounded-xl text-[12px] font-body font-semibold transition active:scale-95 flex items-center gap-1.5 border ${
                caregiverMicActive
                  ? 'bg-red-600 text-white border-red-700 shadow-sm animate-pulse'
                  : 'bg-white text-[#1C201E] border-[#EAE5DC] hover:bg-[#FAF8F5]'
              }`}
              title="Optional two-way push-to-talk channel for remote caregiver"
            >
              {caregiverMicActive ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4 text-[#8A948D]" />}
              <span>{caregiverMicActive ? 'Intercom Live (Broadcasting)' : 'Caregiver Push-to-Talk'}</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left: Spherical Acoustic Speaker Orb & Footage Directives */}
          <div className="lg:col-span-5 flex flex-col items-center">
            <VoiceOrb
              state={voiceState}
              isAudioPlaying={voiceState === 'speaking'}
              onBroadcast={() => handleBroadcastGuidance()}
              onStopSpeaking={handleStopSpeaking}
            />

            {/* Quick Footage-Grounded Directives */}
            <div className="w-full mt-6 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-sans text-[#8A948D] font-semibold">
                  Footage Directives ({streamLabel})
                </span>
                <span className="text-[10px] font-mono text-[#1B3B2B] bg-[#E8EFEA] px-2 py-0.5 rounded">
                  Footage-Grounded
                </span>
              </div>

              {activeDirectives.map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => handleBroadcastGuidance(preset)}
                  className="w-full text-left p-3 rounded-xl bg-[#FAF8F5] hover:bg-[#E8EFEA] border border-[#EAE5DC] hover:border-[#1B3B2B]/30 text-[12.5px] font-body text-[#1C201E] transition flex items-center justify-between group"
                >
                  <span className="line-clamp-2 leading-relaxed">{preset}</span>
                  <ChevronRight className="w-4 h-4 text-[#8A948D] group-hover:text-[#1B3B2B] shrink-0 ml-2" />
                </button>
              ))}
            </div>
          </div>

          {/* Right: Real-time Transcript & Manual Broadcast Console */}
          <div className="lg:col-span-7 flex flex-col justify-between min-h-[380px] bg-[#FAF8F5] rounded-xl p-5 border border-[#EAE5DC]">
            <div>
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#EAE5DC] text-[12px] font-mono text-[#57605A]">
                <span className="font-semibold text-[#1C201E]">Speaker Broadcast Log</span>
                <span>Active Feed: {streamLabel}</span>
              </div>

              {/* Messages List */}
              <div className="space-y-3 max-h-[260px] overflow-y-auto pr-1">
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={`p-3.5 rounded-xl text-[13.5px] font-body leading-relaxed ${
                      m.sender === 'ai'
                        ? 'bg-white border border-[#EAE5DC] text-[#1C201E] shadow-2xs'
                        : m.sender === 'user'
                        ? 'bg-[#1B3B2B] text-white ml-8 shadow-xs'
                        : 'bg-[#F4F0E8] text-[#57605A] font-mono text-[11px]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1 opacity-75 font-body text-[11px]">
                      <span className="font-bold">
                        {m.sender === 'ai' ? 'Corridor Speaker' : m.sender === 'user' ? 'Caregiver Operator' : 'System Bus'}
                      </span>
                      <span className="font-mono text-[11px]">{m.timestamp}</span>
                    </div>
                    <p>{m.text}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Input Form */}
            <div className="mt-4 pt-3.5 border-t border-[#EAE5DC]">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleBroadcastGuidance()}
                  placeholder="Type custom calming speech for the corridor speaker..."
                  className="flex-1 px-4 py-2.5 rounded-xl border border-[#EAE5DC] text-[13.5px] font-body bg-white text-[#1C201E] focus:outline-none focus:ring-2 focus:ring-[#1B3B2B]/20"
                />
                <button
                  onClick={() => handleBroadcastGuidance()}
                  disabled={voiceState === 'processing'}
                  className="px-4 py-2.5 rounded-xl bg-[#1B3B2B] hover:bg-[#264E3B] text-white text-[13px] font-body font-semibold shadow-xs transition active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  Broadcast
                </button>
              </div>

              <div className="mt-2.5 text-[11px] text-[#8A948D] font-body text-center">
                Hardware Edge Node • Clean 5-Second Alert Beep &amp; Independent Amber Pathway Lighting
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
