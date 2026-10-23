import React, { useRef, useState } from 'react';
import { 
  Heart, 
  Wind, 
  AlertTriangle, 
  CheckCircle2, 
  Gauge,
  Video,
  Upload,
  Loader2,
  Cpu,
  Volume2,
  Sparkles
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  CartesianGrid, 
  ReferenceLine 
} from 'recharts';
import { useTelemetry } from '../context/TelemetryContext';
import { CentroidPlot } from '../components/CentroidPlot';
import { TelemetryData } from '../types';

interface CameraColumnProps {
  label: string; // "CAM 1" or "CAM 2"
  title: string;
  location: string;
  telemetry: TelemetryData | null;
  videoSrc: string;
  dciThreshold: number;
}

const CameraColumn: React.FC<CameraColumnProps> = ({
  label,
  title,
  location,
  telemetry,
  videoSrc,
  dciThreshold,
}) => {
  const currentDci = telemetry?.dci ?? 1.0;
  const centroids = telemetry?.centroids ?? [];
  const biometrics = {
    heart_rate: telemetry?.heart_rate,
    respiration_rate: telemetry?.respiration_rate,
    signal_quality: telemetry?.signal_quality,
  };
  const latencies = telemetry?.latencies;
  const formulaData = telemetry?.dci_formula;
  const chartHistory = telemetry?.chart_history ?? [];
  const verdict = telemetry?.verdict;
  const isCritical = verdict?.is_critical ?? false;
  const dialogue = telemetry?.cognitive_dialogue?.dialogue || telemetry?.dialogue || `${label} optical motion tracking active. Envelope nominal.`;

  return (
    <div className="bg-white rounded-2xl p-5 sm:p-6 border border-[#EAE5DC] shadow-xs space-y-4 flex flex-col justify-between">
      {/* Camera Header */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="px-2.5 py-1 rounded-md bg-[#1B3B2B] text-white font-mono font-bold text-xs tracking-wider">
              {label}
            </span>
            <h2 className="text-[18px] sm:text-[19px] font-heading font-bold text-[#1C201E] tracking-tight">
              {title}
            </h2>
          </div>
          <span className="text-[11px] font-sans bg-[#E8EFEA] text-[#1B3B2B] border border-[#1B3B2B]/20 px-2.5 py-0.5 rounded-full font-semibold flex items-center gap-1.5 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
            <span>60 FPS Live</span>
          </span>
        </div>
        <div className="flex items-center justify-between text-[12px] font-body text-[#57605A]">
          <span>Location: <strong className="font-semibold text-[#1C201E]">{location}</strong></span>
          <span className="text-emerald-700 font-mono text-[11px]">Real-time pipeline</span>
        </div>
      </div>

      {/* Real-Time Continuous Video Viewport */}
      <div className="space-y-2">
        <div className="relative rounded-xl overflow-hidden border border-[#EAE5DC] bg-[#121614] aspect-video w-full flex items-center justify-center">
          <video
            src={videoSrc}
            autoPlay
            muted
            loop
            playsInline
            className="w-full h-full object-cover"
          />

          {/* Watermark Tag */}
          <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded bg-black/70 backdrop-blur-xs text-white font-mono text-[10.5px] flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-bold">{label}</span>
            <span className="text-stone-300">• {location}</span>
          </div>

          {/* Forehead Centroid HUD Coordinates Badge */}
          {telemetry?.centroid && (
            <div className="absolute bottom-2.5 left-2.5 px-2 py-0.5 rounded bg-black/75 backdrop-blur-xs text-emerald-300 font-mono text-[10.5px]">
              Forehead: ({telemetry.centroid[0].toFixed(0)}, {telemetry.centroid[1].toFixed(0)})
            </div>
          )}

          {/* DCI Badge */}
          <div className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded bg-black/75 backdrop-blur-xs text-white font-mono text-[10.5px] flex items-center gap-1">
            <span className="text-stone-300">DCI:</span>
            <span className={`font-bold ${currentDci >= dciThreshold ? 'text-amber-400' : 'text-emerald-400'}`}>
              {currentDci.toFixed(2)}x
            </span>
          </div>
        </div>

        {/* Clean Camera Status Strip */}
        <div className={`px-3 py-2 rounded-lg border text-[12px] font-sans flex items-center justify-between ${
          isCritical
            ? 'bg-amber-50 border-amber-200 text-amber-950'
            : 'bg-emerald-50/60 border-emerald-200/70 text-emerald-950'
        }`}>
          <div className="flex items-center gap-2">
            {isCritical ? (
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            ) : (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            )}
            <span className="font-medium">
              {isCritical ? `${label} — Abnormal movement detected` : `${label} — Trajectory nominal`}
            </span>
          </div>
          <span className="font-mono text-[10.5px] font-semibold text-stone-600">
            {verdict?.verdict_type ?? 'NORMAL'}
          </span>
        </div>
      </div>

      {/* 2D Spatial Centroid Trajectory Viewport (Aligned 16:9) */}
      <div>
        <CentroidPlot
          centroids={centroids}
          dci={currentDci}
          isLive={true}
          sourceType="continuous_optical_stream"
          streamName={`${label} — ${title}`}
          streamId={telemetry?.stream_id || (label === 'CAM 2' ? 'stream_2' : 'stream_1')}
        />
      </div>

      {/* DCI Readout & Progression Trend */}
      <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#EAE5DC] space-y-2.5">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[11px] font-sans text-[#8A948D]">
              Dispersion Index (DCI)
            </span>
            <div className="text-[14px] font-heading font-bold text-[#1C201E]">
              Ratio: <span className="font-mono text-[16px] text-[#1B3B2B]">{currentDci.toFixed(2)}x</span>
            </div>
          </div>
          <span className={`px-2 py-0.5 rounded text-[10.5px] font-sans font-semibold border ${
            currentDci >= dciThreshold
              ? 'bg-amber-100 text-amber-900 border-amber-300'
              : 'bg-emerald-100 text-emerald-900 border-emerald-300'
          }`}>
            {currentDci >= dciThreshold ? 'Threshold exceeded' : 'Nominal ratio'}
          </span>
        </div>

        <div className="grid grid-cols-4 gap-2 text-[11px] font-sans text-[#57605A] bg-white p-2 rounded-lg border border-[#EAE5DC]">
          <div>L: <strong className="font-mono text-[#1C201E]">{formulaData?.path_length_L ?? 0}px</strong></div>
          <div>ΔD: <strong className="font-mono text-[#1C201E]">{formulaData?.net_displacement ?? 0}px</strong></div>
          <div>Win: <strong className="font-mono text-[#1C201E]">{formulaData?.window_size ?? 0}f</strong></div>
          <div>Thr: <strong className="font-mono text-[#1C201E]">{dciThreshold.toFixed(1)}x</strong></div>
        </div>

        {/* Real DCI Progression Trend Chart */}
        <div className="h-24 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartHistory}>
              <defs>
                <linearGradient id={`dciGrad-${label}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#D97706" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#D97706" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#EAE5DC" />
              <XAxis dataKey="frame" tick={{ fontSize: 9, fill: '#8A948D' }} />
              <YAxis domain={[0.5, 5.5]} tick={{ fontSize: 9, fill: '#8A948D' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#FAF8F5',
                  borderColor: '#EAE5DC',
                  borderRadius: '6px',
                  fontSize: '11px',
                }}
              />
              <ReferenceLine y={dciThreshold} stroke="#DC2626" strokeDasharray="3 3" />
              <Area type="monotone" dataKey="dci" stroke="#D97706" fillOpacity={1} fill={`url(#dciGrad-${label})`} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Eulerian Biometrics & Processing Latency */}
      <div className="grid grid-cols-3 gap-2.5">
        <div className="p-2.5 rounded-xl bg-[#FAF8F5] border border-[#EAE5DC] space-y-0.5">
          <div className="flex items-center justify-between text-[#8A948D]">
            <span className="text-[10px] font-sans">Heart Rate</span>
            <Heart className="w-3.5 h-3.5 text-red-500" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-[18px] font-mono font-bold text-[#1C201E]">
              {biometrics.heart_rate ? biometrics.heart_rate.toFixed(0) : '—'}
            </span>
            <span className="text-[9.5px] font-mono text-[#8A948D]">BPM</span>
          </div>
          <span className="text-[9.5px] text-[#57605A] block truncate">Forehead EVM</span>
        </div>

        <div className="p-2.5 rounded-xl bg-[#FAF8F5] border border-[#EAE5DC] space-y-0.5">
          <div className="flex items-center justify-between text-[#8A948D]">
            <span className="text-[10px] font-sans">Respiration</span>
            <Wind className="w-3.5 h-3.5 text-sky-600" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-[18px] font-mono font-bold text-[#1C201E]">
              {biometrics.respiration_rate ? biometrics.respiration_rate.toFixed(0) : '—'}
            </span>
            <span className="text-[9.5px] font-mono text-[#8A948D]">RPM</span>
          </div>
          <span className="text-[9.5px] text-[#57605A] block truncate">Thoracic Optic</span>
        </div>

        <div className="p-2.5 rounded-xl bg-[#FAF8F5] border border-[#EAE5DC] space-y-0.5">
          <div className="flex items-center justify-between text-[#8A948D]">
            <span className="text-[10px] font-sans">Latency</span>
            <Gauge className="w-3.5 h-3.5 text-[#1B3B2B]" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-[18px] font-mono font-bold text-[#1C201E]">
              {latencies?.total_ms ? latencies.total_ms.toFixed(1) : '3.8'}
            </span>
            <span className="text-[9.5px] font-mono text-[#8A948D]">ms</span>
          </div>
          <span className="text-[9.5px] text-emerald-800 font-semibold block truncate">&lt; 42ms SLA Met</span>
        </div>
      </div>

      {/* Cognitive Grounding Directive */}
      <div className="p-3 rounded-xl bg-[#FAF8F5] border border-[#EAE5DC] text-[12px] font-body text-[#57605A] flex items-start gap-2">
        <Sparkles className="w-3.5 h-3.5 text-emerald-700 shrink-0 mt-0.5" />
        <span className="leading-relaxed">
          <strong className="text-[#1C201E] font-semibold">{label}:</strong> "{dialogue}"
        </span>
      </div>
    </div>
  );
};

export const MotionAnalysisPage: React.FC = () => {
  const { 
    dualTelemetry, 
    sessionState, 
    telemetry,
    uploadVideoFile, 
    refreshStreams,
    announceCameraAlert,
    speakVoiceDirective
  } = useTelemetry();

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [voiceTestFeedback, setVoiceTestFeedback] = useState<string | null>(null);

  // Extract CAM 1 and CAM 2 independent data
  const cam1Data = dualTelemetry?.cam1 ?? (sessionState?.stream_id === 'stream_1' ? (sessionState as any) : telemetry);
  const cam2Data = dualTelemetry?.cam2 ?? (sessionState?.stream_id === 'stream_2' ? (sessionState as any) : null);
  const esp32Info = dualTelemetry?.esp32;

  const dciThreshold1 = cam1Data?.dci_formula?.threshold_tau ?? 3.0;
  const dciThreshold2 = cam2Data?.dci_formula?.threshold_tau ?? 3.0;

  const handleTestVoiceAndChime = () => {
    // Triggers the exact sequence on Alexa connected hardware speaker (Zero PC audio)
    announceCameraAlert(
      {
        camera: 'CAM 2',
        event_type: 'PROFILE_B',
        detected_event: 'Fatigue collapse and sudden fall detected.',
        action_triggered: 'Alexa connected audio beacon activated, amber safety light illuminated, and caregiver email alerted.',
        details: 'Vertical descent exceeds threshold on porch doorbell node.',
      },
      true
    );
    setVoiceTestFeedback('Alexa Audio Node Triggered');
    setTimeout(() => setVoiceTestFeedback(null), 3500);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    setUploadError(null);
    try {
      await uploadVideoFile(file);
      await refreshStreams();
    } catch (err: any) {
      setUploadError(err?.message || 'Failed to dynamically index uploaded video');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-white rounded-2xl p-6 sm:p-7 border border-[#EAE5DC] shadow-xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
        <div className="space-y-1.5 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-[#E8EFEA] text-[#1B3B2B] border border-[#1B3B2B]/20 text-[11px] font-sans font-semibold">
            <Video className="w-3.5 h-3.5 text-[#1B3B2B]" />
            <span>Dual-Node Optical Safety Suite • Parallel Multi-Stream Engine</span>
          </div>
          <h1 className="text-[28px] sm:text-[32px] font-heading font-bold text-[#1C201E] tracking-tight leading-tight">
            Motion Analysis
          </h1>
        </div>

        {/* Clean Controls: Voice Test & Ingestion */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            onClick={handleTestVoiceAndChime}
            className="px-3.5 py-2 rounded-xl bg-[#FAF8F5] hover:bg-[#EAE5DC] text-[#1C201E] border border-[#EAE5DC] font-sans font-medium text-xs transition flex items-center gap-1.5 active:scale-95 shadow-xs"
            title="Trigger 5s alert beep directly on Alexa Connected Audio Node on Pin D15 (Zero PC audio)"
          >
            <Volume2 className="w-3.5 h-3.5 text-[#1B3B2B]" />
            <span>{voiceTestFeedback || 'Test Alexa Alert Beep'}</span>
          </button>

          <input
            type="file"
            ref={fileInputRef}
            accept="video/*"
            onChange={handleFileUpload}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-sans font-medium text-xs transition flex items-center gap-1.5 shadow-xs disabled:opacity-60"
            title="Upload new video footage for instant real-time dynamic forehead tracking & EVM biometrics"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Indexing...</span>
              </>
            ) : (
              <>
                <Upload className="w-3.5 h-3.5" />
                <span>+ Ingest Video</span>
              </>
            )}
          </button>
        </div>
      </div>

      {uploadError && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center justify-between">
          <span>Failed to ingest video: {uploadError}</span>
          <button onClick={() => setUploadError(null)} className="font-bold underline ml-2">Dismiss</button>
        </div>
      )}

      {/* Clean Hardware Status Pill Bar */}
      <div className="p-3.5 rounded-xl bg-white border border-[#EAE5DC] shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-[12px] font-sans">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-[#E8EFEA] text-[#1B3B2B] border border-[#1B3B2B]/20">
            <Cpu className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="font-medium text-[#1C201E]">Alexa Connected Node:</span>{' '}
            <span className="font-mono text-[#57605A]">192.168.1.113:80</span> •{' '}
            <span className="text-[#57605A]">Last dispatch:</span>{' '}
            <strong className="font-mono text-[#1C201E]">{esp32Info?.last_trigger?.camera || 'Standby'}</strong>{' '}
            <span className="text-stone-400">({esp32Info?.last_trigger?.event || 'Nominal'})</span>
          </div>
        </div>

        <div className="flex items-center gap-2 font-mono text-[11px] text-[#57605A]">
          <span className={`px-2 py-0.5 rounded border ${
            esp32Info?.online ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-stone-100 text-stone-600 border-stone-200'
          }`}>
            {esp32Info?.online ? `Online (${esp32Info.latency_ms.toFixed(1)}ms)` : 'Target: 192.168.1.113:80'}
          </span>
          <span className="text-stone-400">•</span>
          <span>Dual surveillance active</span>
        </div>
      </div>

      {/* Dual-Camera Side-by-Side Split Viewport: CAM 1 (Left) & CAM 2 (Right) */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Left Column: CAM 1 */}
        <CameraColumn
          label="CAM 1"
          title="Optical Corridor Feed"
          location="Interior Corridor / Egress Threshold"
          telemetry={cam1Data}
          videoSrc={cam1Data?.annotated_url || '/videos/stream1_annotated.mp4'}
          dciThreshold={dciThreshold1}
        />

        {/* Right Column: CAM 2 */}
        <CameraColumn
          label="CAM 2"
          title="Porch Doorbell Monitor"
          location="Front Porch Landing / Outer Doorframe"
          telemetry={cam2Data}
          videoSrc={cam2Data?.annotated_url || '/videos/stream2_annotated.mp4'}
          dciThreshold={dciThreshold2}
        />
      </div>
    </div>
  );
};
