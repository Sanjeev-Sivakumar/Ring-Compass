import React, { useEffect, useState } from 'react';
import { Volume2, VolumeX, Sparkles, Square, Radio, AlertCircle } from 'lucide-react';

export type VoiceState = 'idle' | 'processing' | 'speaking' | 'error';

interface VoiceOrbProps {
  state: VoiceState;
  isAudioPlaying: boolean;
  onBroadcast: () => void;
  onStopSpeaking: () => void;
}

export const VoiceOrb: React.FC<VoiceOrbProps> = ({
  state,
  isAudioPlaying,
  onBroadcast,
  onStopSpeaking,
}) => {
  const [pulsePhase, setPulsePhase] = useState(0);

  // Smooth micro-animation loop for orb breathing
  useEffect(() => {
    const interval = setInterval(() => {
      setPulsePhase((p) => (p + 1) % 100);
    }, 40);
    return () => clearInterval(interval);
  }, []);

  // Compute state-based gradients and styles for acoustic speaker
  const getOrbStyles = () => {
    switch (state) {
      case 'processing':
        return {
          gradient: 'radial-gradient(circle at 40% 30%, #F59E0B 0%, #3D7A5C 50%, #1B3B2B 90%)',
          shadow: '0 0 65px rgba(245, 158, 11, 0.45), 0 0 100px rgba(27, 59, 43, 0.30)',
          scale: 1.03 + Math.sin(pulsePhase * 0.18) * 0.02,
          label: 'Synthesizing De-escalation Voice',
          statusColor: 'text-amber-700',
        };
      case 'speaking':
        return {
          gradient: 'radial-gradient(circle at 35% 35%, #FBBF24 0%, #D97706 45%, #1B3B2B 90%)',
          shadow: '0 0 80px rgba(245, 158, 11, 0.60), 0 0 130px rgba(217, 119, 6, 0.35)',
          scale: 1.07 + Math.sin(pulsePhase * 0.25) * 0.04,
          label: 'Broadcasting Grounding Voice & 432 Hz Tone',
          statusColor: 'text-amber-800',
        };
      case 'error':
        return {
          gradient: 'radial-gradient(circle at 35% 35%, #F87171 0%, #B91C1C 60%, #7F1D1D 90%)',
          shadow: '0 0 45px rgba(220, 38, 38, 0.35)',
          scale: 1.0,
          label: 'Speaker Output Offline',
          statusColor: 'text-red-700',
        };
      case 'idle':
      default:
        return {
          gradient: 'radial-gradient(circle at 32% 30%, #A8C3B3 0%, #386B52 50%, #1B3B2B 88%)',
          shadow: '0 0 45px rgba(56, 107, 82, 0.28), 0 0 80px rgba(27, 59, 43, 0.14)',
          scale: 1.0 + Math.sin(pulsePhase * 0.06) * 0.015,
          label: 'Acoustic Triage Speaker • Armed & Ready',
          statusColor: 'text-[#57605A]',
        };
    }
  };

  const orb = getOrbStyles();

  return (
    <div className="flex flex-col items-center justify-center py-6">
      {/* Outer Acoustic Radiation Rings */}
      <div className="relative w-64 h-64 flex items-center justify-center">
        {/* Outer Reactive Halo Ring 1 */}
        <div
          className="absolute inset-0 rounded-full transition-all duration-700 border border-[#1B3B2B]/20 pointer-events-none"
          style={{
            transform: `scale(${orb.scale * 1.24})`,
            opacity: state === 'speaking' ? 0.75 : 0.25,
            borderColor: state === 'speaking' ? '#F59E0B' : '#1B3B2B',
          }}
        />

        {/* Outer Reactive Halo Ring 2 */}
        <div
          className="absolute inset-3 rounded-full transition-all duration-500 border border-[#1B3B2B]/30 pointer-events-none"
          style={{
            transform: `scale(${orb.scale * 1.14})`,
            opacity: state === 'speaking' ? 0.85 : 0.35,
            borderColor: state === 'speaking' ? '#FBBF24' : '#1B3B2B',
          }}
        />

        {/* The Spherical Acoustic Speaker Orb itself */}
        <div
          className="w-44 h-44 rounded-full relative cursor-pointer select-none transition-transform duration-300 shadow-2xl flex items-center justify-center overflow-hidden"
          style={{
            background: orb.gradient,
            boxShadow: orb.shadow,
            transform: `scale(${orb.scale})`,
          }}
          onClick={state === 'speaking' ? onStopSpeaking : onBroadcast}
          title={state === 'speaking' ? 'Click to silence speaker' : 'Click to broadcast de-escalation guidance'}
        >
          {/* Internal Specular Glass Highlight */}
          <div
            className="absolute top-2 left-4 w-24 h-16 rounded-full pointer-events-none"
            style={{
              background: 'radial-gradient(ellipse at 50% 20%, rgba(255, 255, 255, 0.6) 0%, rgba(255, 255, 255, 0) 75%)',
              transform: 'rotate(-25deg)',
            }}
          />

          {/* Deep ambient inner shade */}
          <div
            className="absolute bottom-1 right-2 w-28 h-20 rounded-full pointer-events-none"
            style={{
              background: 'radial-gradient(ellipse at center, rgba(0, 0, 0, 0.35) 0%, rgba(0, 0, 0, 0) 70%)',
            }}
          />

          {/* Center Dynamic Speaker Icon */}
          <div className="relative z-10 text-white flex flex-col items-center justify-center drop-shadow-md">
            {state === 'speaking' ? (
              <Volume2 className="w-10 h-10 animate-pulse text-amber-100" />
            ) : state === 'processing' ? (
              <Sparkles className="w-9 h-9 animate-spin text-amber-200" />
            ) : state === 'error' ? (
              <AlertCircle className="w-9 h-9 text-red-200" />
            ) : (
              <Volume2 className="w-9 h-9 opacity-90 hover:opacity-100 transition" />
            )}
          </div>
        </div>
      </div>

      {/* Orb State Badge */}
      <div className="mt-4 flex flex-col items-center text-center">
        <span className={`text-[13px] font-sans font-semibold tracking-normal ${orb.statusColor}`}>
          {orb.label}
        </span>
        <span className="text-[12px] text-[#57605A] font-body mt-1">
          {state === 'speaking'
            ? 'Delivering warm vocal grounding through local speaker channel'
            : 'Click the speaker orb to broadcast calming guidance to the corridor'}
        </span>
      </div>

      {/* Manual Quick Action Controls */}
      <div className="flex items-center gap-2.5 mt-4">
        {state === 'speaking' ? (
          <button
            onClick={onStopSpeaking}
            className="px-4 py-2.5 rounded-xl text-[13px] font-body font-semibold bg-red-700 hover:bg-red-800 text-white transition active:scale-95 shadow-xs flex items-center gap-2"
          >
            <Square className="w-3.5 h-3.5 fill-current" />
            <span>Silence Speaker</span>
          </button>
        ) : (
          <button
            onClick={onBroadcast}
            className="px-4 py-2.5 rounded-xl text-[13px] font-body font-semibold bg-[#1B3B2B] hover:bg-[#264E3B] text-white transition active:scale-95 shadow-xs flex items-center gap-2"
          >
            <Volume2 className="w-4 h-4 text-emerald-300" />
            <span>Broadcast Guidance Message</span>
          </button>
        )}
      </div>
    </div>
  );
};
