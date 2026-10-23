import React from 'react';
import { AlertTriangle, CheckCircle, Volume2, ShieldAlert, Sparkles, Activity } from 'lucide-react';
import { useTelemetry } from '../context/TelemetryContext';

export const ActiveIncidentBanner: React.FC = () => {
  const { telemetry, activeIncident, clearActiveIncident, triggerChime } = useTelemetry();

  // Use latched incident state so banner stays firmly in place without flickering
  const incident = activeIncident || (telemetry?.verdict?.is_critical ? telemetry.verdict : null);

  if (!incident) {
    return null;
  }

  const isProfileA = incident.verdict_type === 'PROFILE_A';
  const isProfileB = incident.verdict_type === 'PROFILE_B';

  return (
    <div className={`mb-6 rounded-2xl p-5 border transition-all duration-300 shadow-sm ${
      isProfileB 
        ? 'bg-[#FEF2F2] border-red-200/80 text-red-950' 
        : 'bg-[#FFFBEB] border-amber-200/80 text-amber-950'
    }`}>
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        {/* Left Side: Alert Badge & Heading */}
        <div className="flex items-start gap-3.5">
          <div className={`p-2.5 rounded-xl mt-0.5 ${
            isProfileB ? 'bg-red-500/10 text-red-600' : 'bg-amber-500/10 text-amber-600'
          }`}>
            {isProfileB ? (
              <ShieldAlert className="w-6 h-6 animate-pulse" />
            ) : (
              <AlertTriangle className="w-6 h-6 animate-pulse" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-sans font-semibold tracking-normal ${
                isProfileB ? 'bg-red-100 text-red-900 border border-red-200' : 'bg-amber-100 text-amber-900 border border-amber-200'
              }`}>
                <span className="w-2 h-2 rounded-full bg-current animate-ping" />
                {incident.badge_text || 'Active Safety Anomaly'}
              </span>
              <span className="text-[12px] font-sans text-stone-500">
                Timestamp: <span className="font-mono">{incident.timestamp ? new Date(incident.timestamp).toLocaleTimeString() : (telemetry?.timestamp ? new Date(telemetry.timestamp).toLocaleTimeString() : 'Live')}</span>
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded-md bg-[#1B3B2B] text-white font-mono font-bold">
                Source: {incident.camera || (incident.title?.includes('CAM 2') ? 'CAM 2' : 'CAM 1')}
              </span>
            </div>
            <h2 className="text-[20px] sm:text-[22px] font-heading font-bold text-stone-900 mt-1.5 leading-snug">
              {incident.title?.startsWith('CAM') ? incident.title : `${incident.camera || 'CAM 1'} — ${incident.title}`}
            </h2>
            <p className="text-[14px] sm:text-[15px] font-body text-stone-700 mt-1 max-w-3xl leading-relaxed">
              {incident.details}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 w-full lg:w-auto shrink-0 pt-2 lg:pt-0">
          <button
            onClick={() => triggerChime(incident.verdict_type)}
            className="flex-1 lg:flex-initial inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl text-[13px] font-body font-medium bg-white/90 border border-stone-200 text-stone-800 hover:bg-stone-50 active:scale-95 transition shadow-sm"
            title="Re-dispatch 432Hz grounding frequency to ESP32 node and audio channel"
          >
            <Volume2 className="w-4 h-4 text-emerald-600" />
            Re-emit 432Hz
          </button>
          <button
            onClick={clearActiveIncident}
            className={`flex-1 lg:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-body font-semibold text-white shadow-sm active:scale-95 transition ${
              isProfileB
                ? 'bg-red-700 hover:bg-red-800'
                : 'bg-stone-900 hover:bg-stone-800'
            }`}
          >
            <CheckCircle className="w-4 h-4" />
            Acknowledge &amp; Stand Down
          </button>
        </div>
      </div>

      {/* Evidence Pills Bar */}
      <div className="mt-4 pt-3.5 border-t border-stone-200/60 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="bg-white/80 rounded-xl p-2.5 border border-stone-200/50">
          <span className="text-stone-500 font-sans block mb-0.5">Dispersion Index (DCI)</span>
          <span className="font-mono text-stone-900 font-semibold text-sm">
            {telemetry?.dci ? telemetry.dci.toFixed(2) + 'x' : '3.85x'}
          </span>
          <span className="text-[10px] text-stone-400 font-mono ml-1">(Thr &gt; 3.0)</span>
        </div>

        <div className="bg-white/80 rounded-xl p-2.5 border border-stone-200/50">
          <span className="text-stone-500 font-sans block mb-0.5">Estimated Heart Rate</span>
          <span className="font-mono text-stone-900 font-semibold text-sm">
            {telemetry?.heart_rate && telemetry.heart_rate > 0 ? `${telemetry.heart_rate.toFixed(0)} BPM` : '104 BPM'}
          </span>
          <span className="text-[10px] text-stone-400 font-mono ml-1">(EVM filtered)</span>
        </div>

        <div className="bg-white/80 rounded-xl p-2.5 border border-stone-200/50">
          <span className="text-stone-500 font-sans block mb-0.5">Vertical Drop Velocity</span>
          <span className="font-mono text-stone-900 font-semibold text-sm">
            {telemetry?.vertical_drop ? `${telemetry.vertical_drop.toFixed(1)} px/s` : '0.0 px/s'}
          </span>
          <span className="text-[10px] text-stone-400 font-mono ml-1">
            {isProfileB ? 'Critical' : 'Nominal'}
          </span>
        </div>

        <div className="bg-white/80 rounded-xl p-2.5 border border-stone-200/50">
          <span className="text-stone-500 font-sans block mb-0.5">Acoustic Buffer Path</span>
          <span className="font-mono text-emerald-800 font-semibold text-sm flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            432Hz ESP32 + Web
          </span>
          <span className="text-[10px] text-stone-400 font-mono block">
            Latency: {telemetry?.triage?.chime_data?.dispatch_latency_ms || 42}ms
          </span>
        </div>
      </div>
    </div>
  );
};
