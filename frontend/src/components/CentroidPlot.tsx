import React, { useState } from 'react';
import { Compass, Move, ArrowRight, Info, AlertTriangle } from 'lucide-react';

interface CentroidPlotProps {
  centroids: [number, number][];
  dci: number;
  isLive?: boolean;
  sourceType?: string;
  streamName?: string;
  streamId?: string;
}

export const CentroidPlot: React.FC<CentroidPlotProps> = ({
  centroids,
  dci,
  isLive = true,
  sourceType = 'continuous_optical_stream',
  streamName = 'Optical Corridor Feed (Node 01)',
  streamId = 'stream_1',
}) => {
  const [hoveredPoint, setHoveredPoint] = useState<{ x: number; y: number; index: number } | null>(null);

  // Proportions: Native 16:9 OpenCV camera resolution (640 x 360) perfectly matching video feed
  const viewWidth = 640;
  const viewHeight = 360;

  if (!centroids || centroids.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-stone-200/90 p-8 text-center flex flex-col items-center justify-center min-h-[340px]">
        <Compass className="w-10 h-10 text-stone-300 mb-3 animate-spin" />
        <h3 className="font-heading font-bold text-stone-700 text-base">No Spatial Trajectory Recorded</h3>
        <p className="text-xs text-stone-500 mt-1 max-w-sm">
          Awaiting OpenCV frame buffer ingestion. Points will map automatically once video frames are processed.
        </p>
      </div>
    );
  }

  // Calculate actual trail length
  let trailLength = 0;
  for (let i = 1; i < centroids.length; i++) {
    const dx = centroids[i][0] - centroids[i - 1][0];
    const dy = centroids[i][1] - centroids[i - 1][1];
    trailLength += Math.sqrt(dx * dx + dy * dy);
  }

  // Most recent point and previous point for direction vector
  const current = centroids[centroids.length - 1];
  const previous = centroids.length > 1 ? centroids[centroids.length - 2] : null;

  // Direction angle in radians
  let dirAngle = 0;
  if (previous && current) {
    dirAngle = Math.atan2(current[1] - previous[1], current[0] - previous[0]);
  }

  // Construct SVG path string
  const pathD = centroids.reduce((acc, [x, y], idx) => {
    return idx === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
  }, '');

  // Determine current active zone based on stream type
  const isStream2 = streamId === 'stream_2';
  const isDynamic = streamId?.startsWith('stream_upload');
  let currentZoneName = 'Interior Corridor (Approach)';
  if (current) {
    if (isStream2) {
      if (current[0] < 190) currentZoneName = 'Outer Doorframe & Intercom Node';
      else if (current[0] <= 440) currentZoneName = 'Porch Landing (Standing Area)';
      else currentZoneName = 'Perimeter Yard / Walkway';
    } else if (isDynamic) {
      if (current[0] < 210) currentZoneName = 'Optical Ingestion Zone (West)';
      else if (current[0] <= 430) currentZoneName = 'Forehead Centroid Focus Zone';
      else currentZoneName = 'Optical Ingestion Zone (East)';
    } else {
      if (current[0] < 260) currentZoneName = 'Interior Corridor (Approach)';
      else if (current[0] <= 450) currentZoneName = 'Entrance Threshold (Egress Alert Zone)';
      else currentZoneName = 'Secured Exterior Door Perimeter';
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-stone-200/90 p-5 shadow-xs transition-all space-y-3">
      {/* Compact Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#EAE5DC]">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-[17px] font-heading font-semibold text-[#1C201E] tracking-tight flex items-center gap-2">
              <Compass className="w-4 h-4 text-[#1B3B2B]" />
              2D Spatial Centroid Trajectory
            </h2>
            <span className="text-[10px] font-sans px-2.5 py-0.5 rounded-full font-semibold border bg-emerald-50 text-emerald-900 border-emerald-200 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
              <span>16:9 Spatial Sync</span>
            </span>
          </div>
          <span className="text-[12px] text-[#57605A] font-sans mt-0.5 block">
            Stream: <span className="font-mono">{streamName}</span> • Native 16:9 Coordinates (<span className="font-mono">640 &times; 360</span>)
          </span>
        </div>

        {/* Compact Metrics Bar */}
        <div className="flex items-center gap-2 text-xs">
          <div className="px-2.5 py-1.5 rounded-lg bg-[#FAF8F5] border border-[#EAE5DC]">
            <span className="text-[#8A948D] text-[10px] font-sans font-semibold block">Window</span>
            <span className="font-mono font-bold text-[#1C201E] text-[12px]">{centroids.length} F</span>
          </div>
          <div className="px-2.5 py-1.5 rounded-lg bg-[#FAF8F5] border border-[#EAE5DC]">
            <span className="text-[#8A948D] text-[10px] font-sans font-semibold block">Trail</span>
            <span className="font-mono font-bold text-[#1C201E] text-[12px]">{trailLength.toFixed(0)} px</span>
          </div>
          <div className="px-2.5 py-1.5 rounded-lg bg-[#FAF8F5] border border-[#EAE5DC]">
            <span className="text-[#8A948D] text-[10px] font-sans font-semibold block">DCI Ratio</span>
            <span
              className={`font-mono font-bold text-[12px] ${
                dci >= 3.0 ? 'text-amber-700' : 'text-[#1B3B2B]'
              }`}
            >
              {dci.toFixed(2)}x
            </span>
          </div>
        </div>
      </div>

      {/* SVG Trajectory Canvas matching 16:9 native aspect ratio */}
      <div className="relative w-full aspect-video bg-[#FAF8F5] rounded-xl overflow-hidden border border-stone-200">
        <svg
          viewBox={`0 0 ${viewWidth} ${viewHeight}`}
          className="w-full h-full"
          preserveAspectRatio="none"
        >
          {/* Grid pattern */}
          <defs>
            <pattern id="coordGrid169" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#EAE5DC" strokeWidth="1" strokeDasharray="2 2" />
            </pattern>
            <linearGradient id="trailGradient169" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#A8C3B3" stopOpacity="0.3" />
              <stop offset="60%" stopColor="#2D5A43" stopOpacity="0.75" />
              <stop offset="100%" stopColor={dci >= 3.0 ? '#D97706' : '#1B3B2B'} stopOpacity="1" />
            </linearGradient>
            <marker
              id="dirArrow169"
              viewBox="0 0 10 10"
              refX="6"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 8 5 L 0 9 z" fill={dci >= 3.0 ? '#D97706' : '#1B3B2B'} />
            </marker>
          </defs>

          {/* Coordinate Grid */}
          <rect width={viewWidth} height={viewHeight} fill="url(#coordGrid169)" />

          {/* DYNAMIC FOOTAGE-SPECIFIC ZONES */}
          {isStream2 ? (
            /* Stream 2 (test2.mov): Front Porch & Ring Doorbell Node */
            <>
              {/* Zone 1: Outer Doorframe & Intercom Node (X: 15 to 190) */}
              <rect
                x="15"
                y="15"
                width="175"
                height="330"
                fill="#FFFFFF"
                fillOpacity="0.65"
                stroke="#D5CEBE"
                strokeWidth="1.2"
                strokeDasharray="4 4"
                rx="8"
              />
              <text x="25" y="34" fill="#6B7280" fontSize="11" fontWeight="600" fontFamily="Inter, sans-serif">
                Doorframe &amp; Intercom
              </text>

              {/* Zone 2: Porch Landing (X: 200 to 440) */}
              <rect
                x="200"
                y="15"
                width="240"
                height="330"
                fill="#E8EFEA"
                fillOpacity="0.45"
                stroke="#1B3B2B"
                strokeOpacity="0.3"
                strokeWidth="1.2"
                strokeDasharray="4 4"
                rx="8"
              />
              <text x="210" y="34" fill="#1B3B2B" fontSize="11" fontWeight="600" fontFamily="Inter, sans-serif">
                Porch Landing (Standing Area)
              </text>

              {/* Zone 3: Yard / Walkway (X: 450 to 625) */}
              <rect
                x="450"
                y="15"
                width="175"
                height="330"
                fill="#FFFFFF"
                fillOpacity="0.65"
                stroke="#D5CEBE"
                strokeWidth="1.2"
                strokeDasharray="4 4"
                rx="8"
              />
              <text x="460" y="34" fill="#6B7280" fontSize="11" fontWeight="600" fontFamily="Inter, sans-serif">
                Perimeter Walkway
              </text>
            </>
          ) : isDynamic ? (
            /* Uploaded Dynamic Footage */
            <>
              {/* Dynamic Sector 1 (X: 15 to 205) */}
              <rect
                x="15"
                y="15"
                width="190"
                height="330"
                fill="#FFFFFF"
                fillOpacity="0.65"
                stroke="#D5CEBE"
                strokeWidth="1.2"
                strokeDasharray="4 4"
                rx="8"
              />
              <text x="25" y="34" fill="#6B7280" fontSize="11" fontWeight="600" fontFamily="Inter, sans-serif">
                Optical Sector Alpha
              </text>

              {/* Dynamic Sector 2 (X: 215 to 425 - Center Forehead Zone) */}
              <rect
                x="215"
                y="15"
                width="210"
                height="330"
                fill={dci >= 3.0 ? '#FEF3C7' : '#FFFFFF'}
                fillOpacity={dci >= 3.0 ? 0.6 : 0.45}
                stroke={dci >= 3.0 ? '#F59E0B' : '#D5CEBE'}
                strokeWidth="1.2"
                strokeDasharray="4 4"
                rx="8"
              />
              <text
                x="225"
                y="34"
                fill={dci >= 3.0 ? '#92400E' : '#6B7280'}
                fontSize="11"
                fontWeight="600"
                fontFamily="Inter, sans-serif"
              >
                Forehead Centroid Focus Zone
              </text>

              {/* Dynamic Sector 3 (X: 435 to 625) */}
              <rect
                x="435"
                y="15"
                width="190"
                height="330"
                fill="#FFFFFF"
                fillOpacity="0.65"
                stroke="#D5CEBE"
                strokeWidth="1.2"
                strokeDasharray="4 4"
                rx="8"
              />
              <text x="445" y="34" fill="#6B7280" fontSize="11" fontWeight="600" fontFamily="Inter, sans-serif">
                Optical Sector Beta
              </text>
            </>
          ) : (
            /* Stream 1 (test.mov): Corridor & Entrance Threshold */
            <>
              {/* Zone 1: Approach Corridor (X: 15 to 260) */}
              <rect
                x="15"
                y="15"
                width="245"
                height="330"
                fill="#FFFFFF"
                fillOpacity="0.65"
                stroke="#D5CEBE"
                strokeWidth="1.2"
                strokeDasharray="4 4"
                rx="8"
              />
              <text x="25" y="34" fill="#6B7280" fontSize="11" fontWeight="600" fontFamily="Inter, sans-serif">
                Interior Corridor (Approach)
              </text>

              {/* Zone 2: Entrance Doorway Threshold (X: 270 to 450) */}
              <rect
                x="270"
                y="15"
                width="180"
                height="330"
                fill={dci >= 3.0 ? '#FEF3C7' : '#FFFFFF'}
                fillOpacity={dci >= 3.0 ? 0.6 : 0.45}
                stroke={dci >= 3.0 ? '#F59E0B' : '#D5CEBE'}
                strokeWidth="1.2"
                strokeDasharray="4 4"
                rx="8"
              />
              <text
                x="280"
                y="34"
                fill={dci >= 3.0 ? '#92400E' : '#6B7280'}
                fontSize="11"
                fontWeight="600"
                fontFamily="Inter, sans-serif"
              >
                Entrance Threshold (Egress Alert)
              </text>

              {/* Zone 3: Door Perimeter (X: 460 to 625) */}
              <rect
                x="460"
                y="15"
                width="165"
                height="330"
                fill="#FFFFFF"
                fillOpacity="0.65"
                stroke="#D5CEBE"
                strokeWidth="1.2"
                strokeDasharray="4 4"
                rx="8"
              />
              <text x="470" y="34" fill="#6B7280" fontSize="11" fontWeight="600" fontFamily="Inter, sans-serif">
                Secured Exterior Door
              </text>
            </>
          )}

          {/* Axis Labels */}
          <text x="6" y="180" fill="#A89F91" fontSize="9" fontFamily="monospace">Y: 180</text>
          <text x="320" y="355" fill="#A89F91" fontSize="9" fontFamily="monospace" textAnchor="middle">X: 320 (Frame Center)</text>

          {/* Trajectory Polyline Trail */}
          <path
            d={pathD}
            fill="none"
            stroke="url(#trailGradient169)"
            strokeWidth="3.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Historical points with interactive hover */}
          {centroids.map(([x, y], idx) => {
            const isLatest = idx === centroids.length - 1;
            const isOldest = idx === 0;
            const opacity = 0.3 + (idx / centroids.length) * 0.7;

            return (
              <g key={idx}>
                <circle
                  cx={x}
                  cy={y}
                  r={isLatest ? 7 : 3.5}
                  fill={
                    isLatest
                      ? dci >= 3.0
                        ? '#D97706'
                        : '#1B3B2B'
                      : isOldest
                      ? '#8A948D'
                      : '#386B52'
                  }
                  opacity={opacity}
                  className="cursor-pointer transition-transform hover:scale-150"
                  onMouseEnter={() => setHoveredPoint({ x, y, index: idx })}
                  onMouseLeave={() => setHoveredPoint(null)}
                />
              </g>
            );
          })}

          {/* Current Position Crosshair Target */}
          {current && (
            <g transform={`translate(${current[0]}, ${current[1]})`}>
              <circle
                r="14"
                fill="none"
                stroke={dci >= 3.0 ? '#D97706' : '#1B3B2B'}
                strokeWidth="2"
                opacity="0.85"
              >
                <animate attributeName="r" values="10;18;10" dur="2.4s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.9;0.3;0.9" dur="2.4s" repeatCount="indefinite" />
              </circle>
              <circle r="4" fill="#EF4444" stroke="#FFFFFF" strokeWidth="1.5" />
              {/* Direction Indicator Arrow */}
              {previous && (
                <line
                  x1="0"
                  y1="0"
                  x2={Math.cos(dirAngle) * 22}
                  y2={Math.sin(dirAngle) * 22}
                  stroke={dci >= 3.0 ? '#D97706' : '#1B3B2B'}
                  strokeWidth="2.5"
                  markerEnd="url(#dirArrow169)"
                />
              )}
            </g>
          )}

          {/* Hover Tooltip Overlay */}
          {hoveredPoint && (
            <g transform={`translate(${hoveredPoint.x + 10}, ${hoveredPoint.y - 12})`}>
              <rect x="0" y="0" width="105" height="34" rx="6" fill="#1C201E" opacity="0.92" />
              <text x="8" y="15" fill="#FAF8F5" fontSize="10" fontFamily="monospace">
                Frame: T-{centroids.length - 1 - hoveredPoint.index}
              </text>
              <text x="8" y="27" fill="#A8C3B3" fontSize="10" fontFamily="monospace">
                ({hoveredPoint.x.toFixed(0)}, {hoveredPoint.y.toFixed(0)}) px
              </text>
            </g>
          )}
        </svg>

        {/* Real-time coordinates & classification footer */}
        <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between px-3.5 py-1.5 rounded-xl bg-white/95 backdrop-blur-xs border border-stone-200/90 text-xs text-stone-700 shadow-xs">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 font-sans font-semibold text-stone-900">
              <span className="w-2 h-2 rounded-full bg-[#1B3B2B] animate-pulse" />
              <span>Centroid: <span className="font-mono">[{current ? `${current[0].toFixed(0)}, ${current[1].toFixed(0)}` : '0, 0'}]</span></span>
            </span>
            <span className="text-stone-300">|</span>
            <span className="text-stone-500 font-sans truncate max-w-[220px]">
              {currentZoneName}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`font-sans font-semibold ${
                dci >= 3.0 ? 'text-amber-700' : 'text-[#1B3B2B]'
              }`}
            >
              {dci >= 3.0 ? 'Pacing / Looping Dispersion' : 'Nominal Directional Transit'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
