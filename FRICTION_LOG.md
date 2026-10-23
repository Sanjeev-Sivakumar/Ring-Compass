# Developer Friction Log: Ring Compass 🧭
### Amazon Developer Hackathon — Build Ship Shape Submission

> **Project**: Ring Compass: Autonomous Spatial Safety & Biometric Triage for Dementia Sundowning  
> **Repository**: [https://github.com/Sanjeev-Sivakumar/Ring-Compass](https://github.com/Sanjeev-Sivakumar/Ring-Compass)  
> **Author**: Sanjeev Sivakumar  
> **Date**: October 2026  

---

## Executive Summary

During the architectural design, local perception engineering, and smart home hardware integration of **Ring Compass**, our team systematically recorded developer friction across Amazon's developer tooling, cloud sandbox surfaces, and edge camera interfaces. 

This document details three specific friction log entries complete with the **task attempted**, **steps taken**, **expected vs. actual results**, **severity rating**, **workaround deployed**, and **actionable recommendations** for the Amazon Developer Platform team.

---

## Friction Log Entry #1: Cloud Alexa+ Add-on Developer Console & SDK Access

| Field | Detail |
| :--- | :--- |
| **Specific Task Attempted** | Deploying an autonomous AI spatial triage agent to an Alexa+ Add-on skill endpoint for real-time de-escalation routines across Echo Show devices and Alexa-connected smart lighting. |
| **Severity Rating** | **High (Severity 2)** — Blocked native cloud deployment to the live Alexa+ skill store during the hackathon window. |

### Steps Taken
1. Registered an Amazon Developer account and navigated to the Alexa Developer Console and Alexa+ Add-on preview portal.
2. Attempted to initialize an Alexa+ skill package configured with real-time biometric and spatial telemetry streaming triggers.
3. Attempted to bind local camera perception webhooks to the Echo Show visual rendering canvas and smart lighting routines.

### Expected vs. Actual Result
* **Expected Result**: Access to an active Alexa+ developer sandbox or SDK to register custom generative triggers, define JSON-RPC action schemas, and test responses on an interactive Echo Show simulator.
* **Actual Result**: The developer portal displayed "Coming Soon" placeholders for third-party developer deployment during the hackathon window; native cloud-side Alexa+ Add-on publishing and live Echo Show simulator binding were restricted to private preview.

### Workaround Used
Architected a self-hosted, open-source **Model Context Protocol (MCP)** server ([`mcp.json`](./mcp.json) and [`server.py`](./server.py) using FastAPI/JSON-RPC). Emulated the Alexa Connected mesh using a physical ESP32 edge microcontroller (IP: `192.168.1.113`) driving amber pathway lighting (GPIO 4) and a 432 Hz grounding tone (GPIO 15). 
* **Outcome**: A completely sandboxed, zero-cost (zero AWS bill) local architecture with identical tool call semantics (`alexa_toggle_pathway_light`, `alexa_trigger_chime`) that can immediately point to production Alexa+ endpoints as soon as public developer access opens.

### Actionable Suggestion
Provide a downloadable local developer CLI or mock runner (similar to AWS SAM Local or LocalStack) for Alexa+ Add-ons with a stubbed JSON-RPC client so hackathon participants can test end-to-end skill interactions locally without waiting for cloud console approvals.

---

## Friction Log Entry #2: Cloud Video Relaying vs. Real-Time Eulerian Video Magnification (EVM)

| Field | Detail |
| :--- | :--- |
| **Specific Task Attempted** | Ingesting high-framerate optical feeds directly from Ring camera cloud APIs to extract micro-pulsatile skin hemodynamics (photoplethysmography / EVM) with sub-100ms latency. |
| **Severity Rating** | **Medium (Severity 3)** — Degradation of remote hemodynamic signal extraction over cloud streaming. |

### Steps Taken
1. Connected to Ring device endpoints via OAuth2 and Ring API webhooks.
2. Requested continuous video streaming frames for green-channel forehead ROI pulse analysis.
3. Measured round-trip ingestion latency across cloud WebRTC relays.

### Expected vs. Actual Result
* **Expected Result**: Low-latency (<150ms), uncompressed or lightly compressed video stream suitable for subtle pixel luminosity analysis (530nm wavelength micro-shifts).
* **Actual Result**: Cloud-relayed WebRTC / SIP streams introduced variable network jitter (800ms–2500ms latency) and aggressive macroblocking/lossy H.264 temporal compression, which distorted the delicate micro-variations required for Eulerian Video Magnification ($0.75 - 2.5\text{ Hz}$).

### Workaround Used
Engineered a localized edge perception architecture where camera processing is executed directly at the local gateway in volatile edge RAM. Implemented local video streaming ingestion with OpenCV 4.10, buffering frames in-memory, and extracting vitals locally before publishing telemetry metadata (heart rate, respiration, DCI) rather than transmitting raw video.
* **Outcome**: Maintained sub-42ms triage latency and 100% senior privacy (zero raw video leaves the premises).

### Actionable Suggestion
Introduce an official **"Ring Local Edge Stream SDK"** (or Matter/WebRTC Local Direct Connect) that allows developers to stream uncompressed or low-compression RTSP/MJPEG directly over local LAN for edge AI/CV workloads without cloud transcoding roundtrips.

---

## Friction Log Entry #3: Collaborator Invitation Workflow for `@AmazonAppDev` on GitHub

| Field | Detail |
| :--- | :--- |
| **Specific Task Attempted** | Sharing a private GitHub repository with the designated hackathon judging handle `@AmazonAppDev` as instructed in the Devpost submission guidelines. |
| **Severity Rating** | **Low / Administrative (Severity 4)** — Potential confusion or submission rejection risk for participants following instructions literally. |

### Steps Taken
1. Navigated to GitHub repository settings -> Collaborators -> "Add people".
2. Searched for `@AmazonAppDev` and attempted to invite it via GitHub CLI and Web UI.

### Expected vs. Actual Result
* **Expected Result**: Successfully dispatching an outside collaborator invitation to `AmazonAppDev`.
* **Actual Result**: GitHub API returned `404: AmazonAppDev is not a user` because `AmazonAppDev` is registered on GitHub as an **Organization**, not an individual user account. GitHub does not allow adding an organization directly as an outside collaborator to an individual repository.

### Workaround Used
Made the repository completely **Public** with an automatically detected MIT License visible in GitHub's About section, while simultaneously inviting individual Amazon DevRel judging team members (`knmeiss`, `giolaq`, `anishamalde`, `mosesroth`, `emersonsklar`) and `testing@devpost.com`.
* **Outcome**: Full compliance with public open-source verification, eliminating any access barrier for evaluators.

### Actionable Suggestion
Update the hackathon instructions to clarify that `@AmazonAppDev` is an organization handle, and specify the exact individual reviewer GitHub usernames for private repos, or explicitly recommend making the repository public with a detectable open-source license.

---

## Conclusion
Documenting and resolving these architectural hurdles enabled Ring Compass to achieve an ultra-fast, privacy-first edge design. We look forward to seeing local edge streaming and open MCP bindings become native capabilities in upcoming Amazon Developer releases.
