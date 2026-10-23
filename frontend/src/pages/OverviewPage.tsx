import React from 'react';
import { 
  Compass, 
  Heart, 
  Cpu, 
  ChevronRight,
  ShieldCheck,
  Video,
  ExternalLink,
  Play
} from 'lucide-react';
import { useTelemetry } from '../context/TelemetryContext';
import { ActiveIncidentBanner } from '../components/ActiveIncidentBanner';
import { CentroidPlot } from '../components/CentroidPlot';
import { NavTab } from '../types';

interface OverviewPageProps {
  onNavigate: (tab: NavTab) => void;
}

export const OverviewPage: React.FC<OverviewPageProps> = ({ onNavigate }) => {
  const { 
    liveTelemetry,
    telemetry,
    devices 
  } = useTelemetry();

  // Front page uses live.mov only for continuous spatial analysis
  const streamData = liveTelemetry ?? telemetry;
  const dci = streamData?.dci ?? 1.0;
  const hr = streamData?.heart_rate ?? telemetry?.heart_rate;
  const verdict = streamData?.verdict ?? telemetry?.verdict;
  const isCritical = verdict?.is_critical;

  // Genuine physical hardware status
  const esp32Device = devices.find((d) => d.id === 'light.esp32_amber_led');
  const isHwOnline = esp32Device?.is_available && esp32Device?.hardware_confirmed;
  const hwLatency = esp32Device?.response_latency_ms;

  return (
    <div className="space-y-6">
      {/* Active Incident Crisis Banner (Appears only during critical state) */}
      <ActiveIncidentBanner />

      {/* Main Header */}
      <div className="bg-white rounded-2xl p-6 sm:p-7 border border-[#EAE5DC] shadow-xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-[#E8EFEA] text-[#1B3B2B] border border-[#1B3B2B]/20 text-[11px] font-sans font-semibold">
            <span className="w-2 h-2 rounded-full bg-[#1B3B2B]" />
            <span>Ring Compass Spatial Safety Hub</span>
          </div>
          <h1 className="text-[28px] sm:text-[32px] font-heading font-bold text-[#1C201E] tracking-tight leading-tight">
            System Overview
          </h1>
        </div>

        {/* Link to Motion Analysis session */}
        <div className="flex items-center gap-3 w-full lg:w-auto">
          <button
            onClick={() => onNavigate('motion')}
            className="w-full lg:w-auto px-4 py-2.5 rounded-xl text-[13px] font-body font-semibold bg-[#1B3B2B] hover:bg-[#264E3B] text-white transition active:scale-95 flex items-center justify-center gap-2 shadow-xs"
          >
            <Play className="w-4 h-4 text-emerald-300 fill-current" />
            <span>Open Dual-Camera Motion Analysis</span>
          </button>
        </div>
      </div>

      {/* Primary Video Feed: live.mov Only */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-[#EAE5DC] shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#E8EFEA] border border-[#1B3B2B]/20 flex items-center justify-center text-[#1B3B2B]">
              <Video className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-[18px] sm:text-[20px] font-heading font-bold text-[#1C201E]">
                  Live Hallway Camera Feed
                </h2>
                <span className="px-2 py-0.5 rounded text-[11px] font-sans font-semibold bg-[#E8EFEA] text-[#1B3B2B] border border-[#1B3B2B]/20 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                  <span>Optical Stream 01</span>
                </span>
              </div>
              <p className="text-[13px] font-body text-[#57605A]">
                Continuous hallway corridor surveillance stream. Real-time capture • 1080p 24fps.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[12px] font-mono text-[#57605A] bg-[#FAF8F5] px-3 py-1.5 rounded-lg border border-[#EAE5DC]">
            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
            <span>Autoplay Active (Muted Looping)</span>
          </div>
        </div>

        {/* Video Player Container */}
        <div className="relative rounded-xl overflow-hidden border border-[#EAE5DC] bg-[#121614] aspect-video w-full max-h-[480px]">
          <video
            src="/videos/live.mov"
            autoPlay
            muted
            loop
            playsInline
            className="w-full h-full object-cover"
          />
          {/* Watermark HUD */}
          <div className="absolute top-3 left-3 px-2.5 py-1 rounded bg-black/60 backdrop-blur-md border border-white/10 text-white font-sans text-[11px] flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Hallway Camera Stream • Optical Node 01</span>
          </div>
        </div>
      </div>

      {/* 4 Essential Dynamic Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: DCI */}
        <div 
          onClick={() => onNavigate('motion')}
          className="bg-white rounded-2xl p-5 sm:p-6 border border-[#EAE5DC] hover:border-[#1B3B2B]/30 hover:shadow-xs cursor-pointer transition-all group"
        >
          <div className="flex items-center justify-between text-[#57605A] mb-2.5">
            <span className="text-[12px] font-sans font-semibold text-[#8A948D]">Dispersion (DCI)</span>
            <Compass className={`w-4 h-4 ${dci >= 3.0 ? 'text-amber-600' : 'text-[#1B3B2B]'}`} />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-[32px] sm:text-[36px] font-mono font-bold text-[#1C201E] tracking-tight">{dci.toFixed(2)}x</span>
            <span className="text-xs text-[#8A948D] font-mono">ratio</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-[13px] font-body">
            <span className={`font-semibold ${dci >= 3.0 ? 'text-amber-700' : 'text-[#1B3B2B]'}`}>
              {dci >= 3.0 ? 'Chaotic Ambulation' : 'Directed Linear Motion'}
            </span>
            <ChevronRight className="w-4 h-4 text-[#8A948D] group-hover:text-[#1C201E] transition" />
          </div>
        </div>

        {/* Metric 2: Estimated Heart Rate */}
        <div 
          onClick={() => onNavigate('motion')}
          className="bg-white rounded-2xl p-5 sm:p-6 border border-[#EAE5DC] hover:border-[#1B3B2B]/30 hover:shadow-xs cursor-pointer transition-all group"
        >
          <div className="flex items-center justify-between text-[#57605A] mb-2.5">
            <span className="text-[12px] font-sans font-semibold text-[#8A948D]">Heart Rate (EVM)</span>
            <Heart className={`w-4 h-4 text-red-500 ${(hr ?? 0) > 90 ? 'animate-pulse' : ''}`} />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-[32px] sm:text-[36px] font-mono font-bold text-[#1C201E] tracking-tight">
              {hr !== null && hr !== undefined ? hr.toFixed(0) : '—'}
            </span>
            <span className="text-xs text-[#8A948D] font-mono">
              {hr !== null && hr !== undefined ? 'BPM' : 'Collecting'}
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between text-[13px] font-body">
            <span className="text-[#57605A] truncate">
              {telemetry?.signal_quality || 'Non-clinical surrogate'}
            </span>
            <ChevronRight className="w-4 h-4 text-[#8A948D] group-hover:text-[#1C201E] transition shrink-0" />
          </div>
        </div>

        {/* Metric 3: Alexa Connected Hardware Status */}
        <div 
          onClick={() => onNavigate('home_voice')}
          className="bg-white rounded-2xl p-5 sm:p-6 border border-[#EAE5DC] hover:border-[#1B3B2B]/30 hover:shadow-xs cursor-pointer transition-all group"
        >
          <div className="flex items-center justify-between text-[#57605A] mb-2.5">
            <span className="text-[12px] font-sans font-medium text-[#8A948D]">Alexa Connected Node</span>
            <Cpu className={`w-4 h-4 ${isHwOnline ? 'text-[#1B3B2B]' : 'text-stone-400'}`} />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-[20px] sm:text-[22px] font-heading font-medium text-[#1C201E]">Alexa Device</span>
            <span className={`text-xs font-medium font-mono px-2 py-0.5 rounded border ${
              isHwOnline 
                ? 'text-emerald-800 bg-emerald-50 border-emerald-200' 
                : 'text-stone-600 bg-stone-100 border-stone-200'
            }`}>
              {isHwOnline ? `${hwLatency ? hwLatency.toFixed(1) + 'ms' : 'Active'}` : 'Offline'}
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between text-[13px] font-body">
            <span className="text-[#57605A] font-mono text-[12px]">Pathway LED • Audio Beep</span>
            <ChevronRight className="w-4 h-4 text-[#8A948D] group-hover:text-[#1C201E] transition" />
          </div>
        </div>

        {/* Metric 4: Safety State */}
        <div 
          onClick={() => onNavigate('safety')}
          className="bg-white rounded-2xl p-5 sm:p-6 border border-[#EAE5DC] hover:border-[#1B3B2B]/30 hover:shadow-xs cursor-pointer transition-all group"
        >
          <div className="flex items-center justify-between text-[#57605A] mb-2.5">
            <span className="text-[12px] font-sans font-semibold text-[#8A948D]">Decision Envelope</span>
            <ShieldCheck className="w-4 h-4 text-[#1B3B2B]" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-[22px] sm:text-[24px] font-heading font-bold text-[#1C201E]">
              {verdict?.verdict_type === 'PROFILE_A'
                ? 'Profile A'
                : verdict?.verdict_type === 'PROFILE_B'
                ? 'Profile B'
                : 'Nominal'}
            </span>
            <span className="text-xs text-[#8A948D] font-mono">mode</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-[13px] font-body">
            <span className={`font-semibold ${isCritical ? 'text-amber-700' : 'text-[#1B3B2B]'}`}>
              {isCritical ? 'Active Anomaly Action' : 'Homeostatic Envelope'}
            </span>
            <ChevronRight className="w-4 h-4 text-[#8A948D] group-hover:text-[#1C201E] transition" />
          </div>
        </div>
      </div>

      {/* Trajectory Analysis of live.mov & Cognitive Dialogue */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8">
          <CentroidPlot
            centroids={streamData?.centroids || []}
            dci={dci}
            isLive={true}
            sourceType="continuous_optical_stream"
            streamName="Hallway Camera Feed (live.mov)"
            streamId="stream_live"
          />
        </div>

        <div className="lg:col-span-4 bg-white rounded-2xl p-5 sm:p-6 border border-[#EAE5DC] shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3.5">
              <h2 className="text-[17px] font-heading font-semibold text-[#1C201E]">
                Companion Speech Stream
              </h2>
              <button
                onClick={() => onNavigate('home_voice')}
                className="text-[13px] font-body text-[#1B3B2B] hover:underline font-semibold flex items-center gap-1"
              >
                <span>Open Voice</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#EAE5DC] text-[14px] italic font-body leading-relaxed text-[#1C201E]">
              "{streamData?.dialogue || telemetry?.cognitive_dialogue?.dialogue || 'Nominal trajectory observed. Environment peaceful and secure.'}"
            </div>
            <span className="text-[12px] font-sans text-[#8A948D] block mt-2.5">
              Zone: <span className="font-mono text-[#57605A]">{telemetry?.cognitive_dialogue?.grounding_zone || 'Corridor (Coimbatore, Tamil Nadu)'}</span>
            </span>
          </div>

          <div className="mt-5 pt-3.5 border-t border-[#EAE5DC] flex items-center justify-between text-[13px] font-body text-[#57605A]">
            <span>Egress Invariant:</span>
            <span className="font-semibold text-emerald-900 bg-[#E8EFEA] border border-[#1B3B2B]/20 px-2.5 py-0.5 rounded text-[12px] font-sans">
              Door Locks Unlocked
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
