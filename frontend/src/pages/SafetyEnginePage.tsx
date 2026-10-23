import React, { useState } from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  RotateCcw,
  Sliders,
  Info,
  Play,
  Pause,
  Clock,
  Video
} from 'lucide-react';
import { useTelemetry } from '../context/TelemetryContext';

export const SafetyEnginePage: React.FC = () => {
  const { 
    sessionState,
    telemetry, 
    clearActiveIncident, 
    controlSession 
  } = useTelemetry();

  const [activeTab, setActiveTab] = useState<'pipeline' | 'profile_a' | 'profile_b'>('pipeline');

  const verdict = sessionState?.verdict ?? telemetry?.verdict;
  const isProfileA = verdict?.verdict_type === 'PROFILE_A';
  const isProfileB = verdict?.verdict_type === 'PROFILE_B';
  const isCritical = verdict?.is_critical;

  const currentDci = sessionState?.dci ?? telemetry?.dci ?? 1.0;
  const currentFrame = sessionState?.current_frame ?? 0;
  const totalFrames = sessionState?.total_frames ?? 390;
  const timestampSec = sessionState?.timestamp_sec ?? 0.0;
  const dciThreshold = sessionState?.dci_formula?.threshold_tau ?? 3.0;
  const latencies = sessionState?.latencies;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 sm:p-7 border border-[#EAE5DC] shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
        <div className="space-y-1.5 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-[#E8EFEA] text-[#1B3B2B] border border-[#1B3B2B]/20 text-[11px] font-sans font-semibold">
            <ShieldCheck className="w-3.5 h-3.5 text-[#1B3B2B]" />
            <span>Deterministic Stage-Gate Matrix • <span className="font-mono">Spatial Corridor Feed</span></span>
          </div>
          <h1 className="text-[28px] sm:text-[32px] font-heading font-extrabold text-[#1C201E] tracking-tight leading-tight">
            Safety Engine
          </h1>
        </div>

        {/* Action Controls Synchronized with Motion Analysis */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            onClick={() => controlSession('seek', { timeSec: 8.0 })}
            className="px-3.5 py-2 rounded-xl text-[13px] font-body font-semibold bg-amber-50 text-amber-900 border border-amber-300 hover:bg-amber-100 transition active:scale-95 flex items-center gap-1.5 shadow-xs"
            title="Jump to erratic wandering sequence in optical stream (t=8.0s)"
          >
            <Clock className="w-4 h-4 text-amber-700" />
            <span>Jump to Wandering Phase (8.0s)</span>
          </button>
          
          <button
            onClick={() => controlSession('restart')}
            className="px-3.5 py-2 rounded-xl text-[13px] font-body font-semibold bg-[#FAF8F5] text-[#1C201E] border border-[#EAE5DC] hover:bg-[#EAE5DC] transition active:scale-95 flex items-center gap-1.5 shadow-xs"
            title="Restart session from frame 0"
          >
            <RotateCcw className="w-4 h-4 text-[#57605A]" />
            <span>Reset Session</span>
          </button>

          {isCritical && (
            <button
              onClick={clearActiveIncident}
              className="px-4 py-2 rounded-xl text-[13px] font-body font-semibold bg-[#1C201E] hover:bg-stone-800 text-white shadow-xs transition active:scale-95 flex items-center gap-2"
            >
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span>Acknowledge Incident</span>
            </button>
          )}
        </div>
      </div>

      {/* Safe Egress Invariant Banner */}
      <div className="rounded-xl p-3.5 bg-emerald-50/70 border border-emerald-200/80 text-emerald-950 text-[13px] font-body flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
          <span className="font-semibold text-emerald-900">
            Safety Invariant: Exit doors strictly unlocked to preserve safe egress.
          </span>
        </div>
        <span className="font-sans text-[11px] text-emerald-800 shrink-0 font-semibold bg-emerald-100/60 px-2.5 py-1 rounded border border-emerald-300 hidden sm:inline-block">
          Egress Invariant: Enforced
        </span>
      </div>

      {/* Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-[#EAE5DC] pb-3">
        <button
          onClick={() => setActiveTab('pipeline')}
          className={`px-4 py-2 rounded-xl text-[13px] font-body font-semibold transition ${
            activeTab === 'pipeline'
              ? 'bg-[#1B3B2B] text-white shadow-xs'
              : 'bg-white text-[#57605A] hover:bg-[#F4F0E8] border border-[#EAE5DC]'
          }`}
        >
          6-Stage Decision Pipeline
        </button>
        <button
          onClick={() => setActiveTab('profile_a')}
          className={`px-4 py-2 rounded-xl text-[13px] font-body font-semibold transition ${
            activeTab === 'profile_a'
              ? 'bg-[#1B3B2B] text-white shadow-xs'
              : 'bg-white text-[#57605A] hover:bg-[#F4F0E8] border border-[#EAE5DC]'
          }`}
        >
          Profile A: Nocturnal Wandering
        </button>
        <button
          onClick={() => setActiveTab('profile_b')}
          className={`px-4 py-2 rounded-xl text-[13px] font-body font-semibold transition ${
            activeTab === 'profile_b'
              ? 'bg-[#1B3B2B] text-white shadow-xs'
              : 'bg-white text-[#57605A] hover:bg-[#F4F0E8] border border-[#EAE5DC]'
          }`}
        >
          Profile B: Mechanical Collapse / Fall
        </button>
      </div>

      {/* TAB 1: 6-STAGE DECISION PIPELINE */}
      {activeTab === 'pipeline' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 sm:p-7 border border-[#EAE5DC] shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5">
              <h2 className="text-[22px] sm:text-[24px] font-heading font-semibold text-[#1C201E]">
                Deterministic Stage-Gate Architecture
              </h2>
              <span className="font-mono text-[12px] text-[#57605A] bg-[#FAF8F5] px-3 py-1 rounded-lg border border-[#EAE5DC]">
                Spatial Corridor Stream • F:{currentFrame}/{totalFrames} ({timestampSec.toFixed(2)}s)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3.5">
              {/* Stage 1 */}
              <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#EAE5DC] flex flex-col justify-between">
                <div>
                  <span className="text-[11px] font-sans text-[#8A948D] font-semibold block mb-1">Stage 1</span>
                  <span className="text-[14px] font-heading font-bold text-[#1C201E] block mb-1">Sensor Ingestion</span>
                  <p className="text-[12px] font-body text-[#57605A]">OpenCV MOG2 background subtractor 24 FPS</p>
                </div>
                <div className="mt-3 text-[11px] font-mono font-semibold text-emerald-900 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 w-fit">
                  {latencies?.decode_ms ? `${latencies.decode_ms.toFixed(1)}ms decode` : 'Active'}
                </div>
              </div>

              {/* Stage 2 */}
              <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#EAE5DC] flex flex-col justify-between">
                <div>
                  <span className="text-[11px] font-sans text-[#8A948D] font-semibold block mb-1">Stage 2</span>
                  <span className="text-[14px] font-heading font-bold text-[#1C201E] block mb-1">Kinetic Trajectory</span>
                  <p className="text-[12px] font-body text-[#57605A]">Rolling 30-frame window, convex hull DCI ratio</p>
                </div>
                <div className="mt-3 text-[11px] font-mono font-bold text-[#1C201E] bg-[#F4F0E8] px-2 py-0.5 rounded border border-[#E2DDD3] w-fit">
                  DCI: {currentDci.toFixed(2)}x
                </div>
              </div>

              {/* Stage 3 */}
              <div className={`p-4 rounded-xl border flex flex-col justify-between ${
                isCritical ? 'bg-amber-50 border-amber-300' : 'bg-[#FAF8F5] border-[#EAE5DC]'
              }`}>
                <div>
                  <span className="text-[11px] font-sans text-[#8A948D] font-semibold block mb-1">Stage 3</span>
                  <span className="text-[14px] font-heading font-bold text-[#1C201E] block mb-1">Rule Routing</span>
                  <p className="text-[12px] font-body text-[#57605A]">DCI &ge; {dciThreshold.toFixed(1)} (A) or &Delta;Y &ge; 65px (B)</p>
                </div>
                <div className={`mt-3 text-[11px] font-sans px-2 py-0.5 rounded w-fit font-semibold ${
                  isCritical ? 'bg-amber-200 text-amber-950 border border-amber-300' : 'bg-[#F4F0E8] text-[#1C201E] border border-[#E2DDD3]'
                }`}>
                  {verdict?.verdict_type === 'PROFILE_A' ? 'Profile A' : verdict?.verdict_type === 'PROFILE_B' ? 'Profile B' : 'Nominal'}
                </div>
              </div>

              {/* Stage 4 */}
              <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#EAE5DC] flex flex-col justify-between">
                <div>
                  <span className="text-[11px] font-sans text-[#8A948D] font-medium block mb-1">Stage 4</span>
                  <span className="text-[14px] font-heading font-medium text-[#1C201E] block mb-1">Acoustic Triage</span>
                  <p className="text-[12px] font-body text-[#57605A]">Alexa connected speaker tone dispatch</p>
                </div>
                <div className="mt-3 text-[11px] font-mono font-medium text-emerald-900 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 w-fit">
                  {latencies?.decision_ms ? `${latencies.decision_ms.toFixed(2)}ms decision` : 'Armed'}
                </div>
              </div>

              {/* Stage 5 */}
              <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#EAE5DC] flex flex-col justify-between">
                <div>
                  <span className="text-[11px] font-sans text-[#8A948D] font-medium block mb-1">Stage 5</span>
                  <span className="text-[14px] font-heading font-medium text-[#1C201E] block mb-1">Physical Action</span>
                  <p className="text-[12px] font-body text-[#57605A]">Alexa connected amber LED turns ON</p>
                </div>
                <div className="mt-3 text-[11px] font-sans font-medium text-emerald-900 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 w-fit">
                  {isProfileA ? 'Amber LED ON' : 'Standby'}
                </div>
              </div>

              {/* Stage 6 */}
              <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#EAE5DC] flex flex-col justify-between">
                <div>
                  <span className="text-[11px] font-sans text-[#8A948D] font-semibold block mb-1">Stage 6</span>
                  <span className="text-[14px] font-heading font-bold text-[#1C201E] block mb-1">Audit Trail</span>
                  <p className="text-[12px] font-body text-[#57605A]">Immutable JSON log recorded with evidence</p>
                </div>
                <div className="mt-3 text-[11px] font-sans font-semibold text-[#57605A] bg-[#F4F0E8] px-2 py-0.5 rounded border border-[#E2DDD3] w-fit">
                  Recorded
                </div>
              </div>
            </div>
          </div>

          {/* Traceable Evidence & Invariants Inspector */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl p-6 border border-[#EAE5DC] shadow-xs">
              <h3 className="text-[17px] font-heading font-semibold text-[#1C201E] mb-4 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-700" />
                Evaluated Safety Invariants
              </h3>
              <ul className="space-y-3 text-[13.5px] font-body text-[#57605A]">
                <li className="flex items-start gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-700 mt-2 shrink-0" />
                  <span>
                    <strong className="text-[#1C201E]">Egress Non-Interference:</strong> Under NO circumstance does Ring Compass lock exterior or hallway exit doors during confusion or wandering.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-700 mt-2 shrink-0" />
                  <span>
                    <strong className="text-[#1C201E]">Solfeggio 432 Hz Grounding:</strong> Sub-second audio chime buffers avoid strident alarm sirens that provoke agitation.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-700 mt-2 shrink-0" />
                  <span>
                    <strong className="text-[#1C201E]">Physical Confirmation Gate:</strong> Hardware feedback is verified before logging successful actuation.
                  </span>
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-[#EAE5DC] shadow-xs">
              <h3 className="text-[17px] font-heading font-semibold text-[#1C201E] mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                Active Session Evidence Log
              </h3>
              <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#EAE5DC] font-mono text-[12px] space-y-2 text-[#1C201E]">
                <div className="flex justify-between">
                  <span className="text-[#57605A]">Optical Stream:</span>
                  <span className="font-bold">Spatial Corridor Node 01</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#57605A]">Playback Time:</span>
                  <span>{timestampSec.toFixed(2)}s / 16.25s</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#57605A]">Dispersion (DCI):</span>
                  <span className="font-bold text-[#1B3B2B]">{currentDci.toFixed(2)}x</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#57605A]">DCI Threshold:</span>
                  <span>{dciThreshold.toFixed(1)}x</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#57605A]">Rule Evaluation:</span>
                  <span className="font-bold">{verdict?.verdict_type || 'NORMAL'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#57605A]">Details:</span>
                  <span className="truncate max-w-[200px]">{verdict?.details}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PROFILE A */}
      {activeTab === 'profile_a' && (
        <div className="bg-white rounded-2xl p-6 sm:p-7 border border-[#EAE5DC] shadow-xs space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-[22px] font-heading font-semibold text-[#1C201E]">
              Profile A: Sundowning &amp; Nocturnal Wandering De-escalation
            </h2>
            <span className="px-3 py-1 rounded-full text-xs font-sans font-semibold bg-amber-100 text-amber-900 border border-amber-300">
              DCI &ge; <span className="font-mono">{dciThreshold.toFixed(1)}x</span> Trigger
            </span>
          </div>

          <p className="text-[14.5px] font-body text-[#57605A] leading-relaxed">
            Triggered when kinetic trajectory tracking identifies repetitive, circular, or non-linear pacing paths characteristic of sundowning disorientation.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#EAE5DC] space-y-1.5">
              <span className="text-[12px] font-sans text-[#8A948D] font-medium">1. Acoustic Tone</span>
              <p className="text-[13px] font-body text-[#1C201E]">Dispatches grounding alert tone to Alexa connected speaker.</p>
            </div>
            <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#EAE5DC] space-y-1.5">
              <span className="text-[12px] font-sans text-[#8A948D] font-medium">2. Amber Lighting</span>
              <p className="text-[13px] font-body text-[#1C201E]">Illuminates Alexa connected amber LED for low-glare guidance.</p>
            </div>
            <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#EAE5DC] space-y-1.5">
              <span className="text-[12px] font-sans text-[#8A948D] font-medium">3. Egress Guarantee</span>
              <p className="text-[13px] font-body text-[#1C201E]">Doors remain strictly unlocked to prevent panic confinement.</p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: PROFILE B */}
      {activeTab === 'profile_b' && (
        <div className="bg-white rounded-2xl p-6 sm:p-7 border border-[#EAE5DC] shadow-xs space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-[20px] font-heading font-medium text-[#1C201E]">
              Profile B: Mechanical Collapse &amp; Vertical Fall Impact
            </h2>
            <span className="px-3 py-1 rounded-full text-xs font-sans font-medium bg-red-100 text-red-900 border border-red-300">
              &Delta;Y &ge; <span className="font-mono">65px</span> Trigger
            </span>
          </div>

          <p className="text-[14px] font-body text-[#57605A] leading-relaxed">
            Triggered when spatial centroid velocity detects sudden downward vertical displacement consistent with a physical collapse.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#EAE5DC] space-y-1.5">
              <span className="text-[12px] font-sans text-[#8A948D] font-medium">1. Emergency Alert</span>
              <p className="text-[13px] font-body text-[#1C201E]">5s alert beep on Alexa speaker &amp; emergency email sent.</p>
            </div>
            <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#EAE5DC] space-y-1.5">
              <span className="text-[12px] font-sans text-[#8A948D] font-medium">2. Full Illumination</span>
              <p className="text-[13px] font-body text-[#1C201E]">Floods Alexa connected pathway lights at 100% brightness.</p>
            </div>
            <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#EAE5DC] space-y-1.5">
              <span className="text-[12px] font-sans text-[#8A948D] font-medium">3. Caregiver Triage</span>
              <p className="text-[13px] font-body text-[#1C201E]">Requires manual caregiver console acknowledgement before reset.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
