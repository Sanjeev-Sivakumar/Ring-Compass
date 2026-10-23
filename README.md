# Ring Compass 🧭
### Autonomous Spatial Safety & Biometric Triage for Dementia Sundowning

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python 3.10+](https://img.shields.io/badge/python-3.10+-blue.svg)](https://www.python.org/downloads/)
[![React 18](https://img.shields.io/badge/react-18.3-61dafb.svg)](https://reactjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110-009688.svg)](https://fastapi.tiangolo.com/)
[![OpenCV](https://img.shields.io/badge/OpenCV-4.10-5C3EE8.svg)](https://opencv.org/)
[![Ring MCP](https://img.shields.io/badge/Protocol-Ring%20MCP-FF9900.svg)](https://appstore.ring.com)

---

## 🌟 Overview & Elevator Pitch

When a vulnerable senior faces a late-night crisis—such as dementia sundowning, disoriented wandering, or an abrupt mechanical fall—traditional smart home sensors leave families terrified in the dark with false alarms or delayed alerts.

**Ring Compass** transforms existing smart camera feeds into an autonomous, touchless spatial safety mesh. By pairing computer vision kinetics with **Eulerian Video Magnification (EVM)**, Ring Compass extracts non-contact hemodynamics (heart rate and respiration) through the camera lens, detects erratic pacing loops in volatile RAM, and executes local physical de-escalation via **Alexa Connected devices** (amber pathway lighting and acoustic grounding tones) without requiring wearables or cloud video streaming.

---

## ❓ The Four Questions Answered (In Order)

During an ambient night event, a household needs four questions answered:

```
┌─────────────────────────────────┬────────────────────────────────────────────────────────┐
│ Question                        │ Ring Compass Autonomous Response                       │
├─────────────────────────────────┼────────────────────────────────────────────────────────┤
│ 01: Is it real?                 │ VERIFIED REAL — Touchless EVM vitals (104.2 BPM) and   │
│                                 │ fall impact physics confirmed                          │
├─────────────────────────────────┼────────────────────────────────────────────────────────┤
│ 02: What changed?               │ SPATIAL SHIFT — Disorientation Cadence Index (DCI)     │
│                                 │ spiked past 3.0x; erratic pacing loop identified       │
├─────────────────────────────────┼────────────────────────────────────────────────────────┤
│ 03: What do I do?               │ DE-ESCALATION — Amber pathway LED illuminated; 432 Hz  │
│                                 │ acoustic chime sounded; caregiver email dispatched     │
├─────────────────────────────────┼────────────────────────────────────────────────────────┤
│ 04: Can I go back to sleep?     │ YES — Crisis safely de-escalated in place without      │
│                                 │ waking the entire household                            │
├─────────────────────────────────┼────────────────────────────────────────────────────────┤
│ 05: Privacy Guarantee           │ 100% LOCAL — Zero raw audio/video leaves the home;     │
│                                 │ all biometric analysis executes in volatile edge RAM   │
└─────────────────────────────────┴────────────────────────────────────────────────────────┘
```

---

## 🏗️ System Architecture

```
                       ┌────────────────────────────────────────┐
                       │   Dual Optical Camera Feeds            │
                       │   CAM 1: Hallway Corridor              │
                       │   CAM 2: Front Porch Doorbell          │
                       └───────────────────┬────────────────────┘
                                           │ (RTSP / Video Stream)
                                           ▼
                       ┌────────────────────────────────────────┐
                       │   Local Edge Perception Pipeline       │
                       │   (OpenCV 4.10 + FastAPI Server)       │
                       └─────┬────────────────────────────┬─────┘
                             │                            │
             ┌───────────────▼──────────┐      ┌──────────▼───────────────┐
             │ Eulerian Video           │      │ 2D Spatial Centroid      │
             │ Magnification (EVM)      │      │ Kinetic Tracking         │
             │ • Forehead Skin ROI      │      │ • Coordinate Matrices    │
             │ • Green Channel (530nm)  │      │ • Path Length (L)        │
             │ • 0.75 - 2.5 Hz Bandpass │      │ • Net Displacement (ΔD) │
             │ • HR (BPM) & RR (RPM)    │      │ • DCI = L / ΔD Ratio     │
             └───────────────┬──────────┘      └──────────┬───────────────┘
                             │                            │
                             └─────────────┬──────────────┘
                                           │
                                           ▼
                       ┌────────────────────────────────────────┐
                       │   Deterministic Safety Engine          │
                       │   • 6-Stage Gate Decision Matrix       │
                       │   • Profile A: Cognitive Wandering     │
                       │   • Profile B: Mechanical Collapse     │
                       │   • SLA: < 42 ms Triage Latency        │
                       └───────────────────┬────────────────────┘
                                           │
                                           ▼
                       ┌────────────────────────────────────────┐
                       │   Self-Hosted Ring MCP Spatial Server  │
                       │   (Model Context Protocol · JSON-RPC)  │
                       └─────┬────────────────────────────┬─────┘
                             │                            │
             ┌───────────────▼──────────┐      ┌──────────▼───────────────┐
             │ Alexa Connected Hardware │      │ Autonomous Emergency     │
             │ Node (ESP32)             │      │ Caregiver Dispatch       │
             │ • Amber Pathway LED      │      │ • Instant SMTP Alert     │
             │ • 432 Hz Grounding Beep  │      │ • Biometric Telemetry    │
             │ • Native Physical Audio  │      │ • Forensic Evidence Log  │
             └──────────────────────────┘      └──────────────────────────┘
```

---

## 🔬 Core Innovations

### 1. Through-Lens Optical Heartbeat & Respiration Extraction (EVM)
- Isolates forehead region-of-interest (ROI) pixels from standard camera frames.
- Analyzes sub-visual optical skin luminosity shifts in the green channel ($\lambda = 530\text{ nm}$).
- Applies a temporal Butterworth bandpass filter ($0.75 - 2.5\text{ Hz}$, corresponding to $45 - 150\text{ BPM}$).
- Eliminates sensor friction: **Zero wearables, zero contact, zero battery maintenance**.

### 2. Disorientation Cadence Index (DCI) Pacing Analysis
- Maps 2D spatial centroids $(X, Y)$ across a sliding 30-frame temporal window.
- Computes trajectory metrics:
  $$\text{DCI} = \frac{L}{\Delta D} = \frac{\sum_{i=1}^{N} \sqrt{(x_i - x_{i-1})^2 + (y_i - y_{i-1})^2}}{\sqrt{(x_N - x_0)^2 + (y_N - y_0)^2}}$$
- Linear movement maintains $\text{DCI} \approx 1.0\text{x}$. Disoriented agitation / pacing loops trigger $\text{DCI} \ge 3.0\text{x}$, initiating de-escalation before a crisis escalates.

### 3. Self-Hosted Model Context Protocol (MCP) Server
- Implements standard MCP tools (`mcp.json`):
  - `ring_camera_ingest`: Ingests and buffers optical spatial streams.
  - `evm_extract_vitals`: Performs non-contact hemodynamic extraction.
  - `alexa_trigger_chime`: Dispatches grounding acoustic guidance.
  - `alexa_toggle_pathway_light`: Illuminates ambient orientation lighting.
- Compatible with production Alexa Plus when developer SDK access becomes public, operating at zero AWS infrastructure cost today.

### 4. Physical Hardware Verification (ESP32 Edge Node)
- Physical ESP32 micro-controller (IP: `192.168.1.113`) connected to:
  - **GPIO 4 (D4)**: High-luminosity Amber LED simulating smart pathway lighting.
  - **GPIO 15 (D15)**: Voice-coil speaker emitting a grounding tone and voice guidance.
- Complete hardware demonstration recorded and provided in [`led.mp4`](./led.mp4).

---

## 📂 Repository Structure

```
Ring-Compass/
├── server.py                   # FastAPI backend & Ring MCP Spatial Server
├── app.py                      # Multi-stream optical perception engine
├── video_session.py            # Real-time CV2 pipeline & EVM hemodynamic extraction
├── start_app.py                # Unified one-command startup orchestrator
├── build_demo_video.py         # End-to-end synchronized video production pipeline
├── master_subtitles.srt        # Frame-accurate SRT subtitles
├── mcp.json                    # Model Context Protocol schema definitions
├── requirements.txt            # Python dependencies
├── .env.example                # Configuration template
├── LICENSE                     # MIT Open Source License
├── slides/                     # High-definition presentation slides (HTML5 & CSS)
│   ├── title_slide.html        # Slide 1: Problem Hook & Title Reveal
│   ├── four_questions_slide.html# Slide 2: Four Questions In Order (Incoming text reveals)
│   ├── architecture_slide.html # Slide 3: 3D Isometric Architecture Flowchart
│   ├── friction_log_slide.html # Slide 4: Zero-Cost MCP Friction Log
│   ├── evm_vitals_mechanism.html# Slide 5: EVM Non-Contact Biometric Extraction
│   ├── email_evidence_slide.html# Slide 6: Verified Caregiver Emergency Dispatch
│   └── conclusion_slide.html   # Slide 7: Conclusion & Privacy Architecture
├── frontend/                   # React 18 + Vite + TypeScript web application
│   ├── src/
│   │   ├── pages/
│   │   │   ├── OverviewPage.tsx        # Live console, continuous ingestion, 2D plot
│   │   │   ├── MotionAnalysisPage.tsx  # Dual CAM 1 & 2 feeds, centroid pacing, AreaChart
│   │   │   ├── SafetyEnginePage.tsx    # 6-stage deterministic pipeline & triage
│   │   │   ├── SystemEventsPage.tsx    # Immutable audit trail & MCP tools
│   │   │   └── HomeVoicePage.tsx       # Alexa Connected LED & Speaker controls
│   │   ├── components/                 # CentroidPlot, Navbar, VoiceOrb, etc.
│   │   └── App.tsx                     # 5-tab SPA navigation router
│   ├── package.json
│   └── vite.config.ts
└── esp32_firmware/             # Physical edge node firmware
    ├── esp32_firmware.ino      # Arduino / ESP32 sketch for LED and 432Hz speaker
    └── esp32_voice_data.h      # Embedded audio payload
```

---

## 🚀 Quickstart & Setup Guide

### Prerequisites
- **Python 3.10+**
- **Node.js 18+** and **npm**

### 1. Clone the Repository
```bash
git clone https://github.com/Sanjeev-Sivakumar/Ring-Compass.git
cd Ring-Compass
```

### 2. Environment Configuration
Copy the template and configure credentials (or run with defaults):
```bash
cp .env.example .env
```

### 3. Install Python Backend Dependencies
```bash
python -m pip install -r requirements.txt
```

### 4. Install Frontend Dependencies
```bash
cd frontend
npm install
cd ..
```

### 5. Launch the Full Application Stack
Run the unified startup script:
```bash
python start_app.py
```
This automatically launches:
- **Backend API & MCP Server**: [http://127.0.0.1:8000](http://127.0.0.1:8000) (Interactive Swagger Docs: `/docs`)
- **Frontend Web Console**: [http://127.0.0.1:5173](http://127.0.0.1:5173)

---

## 📺 Demonstration Video & Subtitles

- **Master Subtitles File**: [`master_subtitles.srt`](./master_subtitles.srt)
- **Demo Video Duration**: **3 minutes 08 seconds** (188.4 seconds), strictly compliant with submission length constraints.
- **Production Script**: [`build_demo_video.py`](./build_demo_video.py) (Automated pipeline that synthesizes speech, records 1080p browser footage, and renders the demo video).

---

## 🔒 Privacy & Local Processing Guarantee

Ring Compass is built on a zero-trust, local-first philosophy:
1. **Volatile RAM Ingestion**: Video frames are processed in-memory and discarded. No raw footage is written to disk or transmitted to cloud surveillance servers.
2. **Deterministic Triage**: All kinetic and hemodynamic calculations run on local CPUs with sub-42ms latency.
3. **Selective Dispatch**: Only cryptographic telemetry and event metadata are dispatched via the caregiver alert gateway upon a verified safety trigger.

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](./LICENSE) file for details.
