import asyncio
import subprocess
from pathlib import Path
import edge_tts

VOICE_NAME = "en-US-ChristopherNeural"
ROOT_DIR = Path(__file__).resolve().parent
SCRATCH_DIR = ROOT_DIR / "scratch" / "video_production"
SCRATCH_DIR.mkdir(parents=True, exist_ok=True)

SCRIPT_SEGMENTS = [
    {
        "id": "part1_title",
        "title": "Problem Hook & Title Reveal",
        "type": "slide",
        "url": str((ROOT_DIR / "slides" / "title_slide.html").as_uri()),
        "text": (
            "When a vulnerable senior faces an ambient, internal home crisis at night—like a dementia sundowning episode or a sudden fall—"
            "today's smart home tools leave families terrified in the dark. We built Ring Compass to solve this completely."
        ),
    },
    {
        "id": "part1_questions",
        "title": "The Four Questions In Order",
        "type": "slide_questions",
        "url": str((ROOT_DIR / "slides" / "four_questions_slide.html").as_uri()),
        "text": (
            "The household needs to answer four critical questions in absolute order: "
            "Zero one: is it real? "
            "Zero two: what changed? "
            "Zero three: what do I do? "
            "And zero four: can I go back to sleep? "
            "Today's tools answer, at most, the first one. Ring Compass answers all four."
        ),
    },
    {
        "id": "part2_architecture",
        "title": "3D Isometric Architecture Flowchart",
        "type": "slide",
        "url": str((ROOT_DIR / "slides" / "architecture_slide.html").as_uri()),
        "text": (
            "Our system architecture transforms raw Ring camera feeds into a touchless biometric telemetry mesh. "
            "Raw video frames pass into our self-hosted MCP Spatial Server, where Eulerian Video Magnification extracts vitals "
            "while our kinetic engine computes spatial disorientation, routing directly to local AI triage and the Alexa Connected Device mesh."
        ),
    },
    {
        "id": "part2_friction",
        "title": "Friction Log: Zero-Cost Sandboxed Architecture",
        "type": "slide",
        "url": str((ROOT_DIR / "slides" / "friction_log_slide.html").as_uri()),
        "text": (
            "As documented in our Friction Log, the cloud-side Alexa Plus developer console currently restricts public SDK deployment. "
            "To build without incurring AWS infrastructure costs—spending zero rupees—we engineered a self-hosted Model Context Protocol server. "
            "It runs entirely sandboxed with localized JSON-RPC transports, fully ready for production Alexa Plus endpoints."
        ),
    },
    {
        "id": "part3_overview",
        "title": "Live System Overview (Front Page)",
        "type": "app_overview",
        "url": "http://127.0.0.1:5173/#/overview",
        "text": (
            "Here on our live System Overview console, Ring Compass continuously ingests the live hallway camera feed in real time. "
            "As we scroll down through the interface, you observe the ambient telemetry running live—monitoring real-time dispersion cadence, "
            "through-lens heart rate, the active Alexa Connected node, and the live 2D spatial trajectory plot, ensuring continuous home safety without intrusive monitoring."
        ),
    },
    {
        "id": "part4_motion_2d",
        "title": "Motion Analysis & 2D Centroid Plot",
        "type": "app_motion_2d",
        "url": "http://127.0.0.1:5173/#/motion",
        "text": (
            "In our live Motion Analysis console, note our dual-camera feeds. On CAM 1, rather than binary tripwires, our engine measures harmonic path oscillation. "
            "Look at the 2D spatial centroid analysis below the camera: it maps coordinate matrices in real time, exposing the subject's pacing loop. "
            "The graph below displays the progression trend where the Disorientation Cadence Index spikes to 3.85x, crossing the 3.0 threshold and triaging cognitive crises instantly."
        ),
    },
    {
        "id": "part5_evm_mechanism",
        "title": "EVM Through-Lens Vitals Mechanism",
        "type": "slide",
        "url": str((ROOT_DIR / "slides" / "evm_vitals_mechanism.html").as_uri()),
        "text": (
            "Next, how is heartbeat determined through the air? As shown in this Eulerian Video Magnification breakdown, our camera isolates forehead skin pixels "
            "to detect microscopic luminosity shifts. Passing the raw green-channel signal through an asymmetric bandpass filter between 0.75 and 2.5 Hertz eliminates movement noise. "
            "This extracts real-time Heart Rate at 104 BPM and Respiration Rate at 22 RPM—completely through the air, with zero wearables."
        ),
    },
    {
        "id": "part6_collapse_email",
        "title": "Profile B Collapse & Verified Email Evidence",
        "type": "slide",
        "url": str((ROOT_DIR / "slides" / "email_evidence_slide.html").as_uri()),
        "text": (
            "On CAM 2 at the porch, when a subject collapses, our kinetic engine registers a vertical displacement exceeding 42 pixels, triaging Profile B: Mechanical Collapse. "
            "The system immediately bypasses voice loops and dispatches an automated high-priority emergency email directly to the caregiver. "
            "Here is the verified email screenshot, received at sanjeevkumaredu8@gmail.com with instant biometric telemetry."
        ),
    },
    {
        "id": "part7_alexa_grounding",
        "title": "Alexa Connected Device (LED, Alert Beep & Conclusion)",
        "type": "app_alexa_grounding",
        "url": "http://127.0.0.1:5173/#/home_voice",
        "intro_text": (
            "Inside Home and Voice, our Alexa Connected Device executes physical de-escalation upon abnormal crisis detection."
        ),
        "beep_duration": 5.0,
        "conclusion_text": (
            "With the grounding alert tone completed and the amber pathway light illuminated, the disoriented individual is gently guided away from danger—"
            "with zero wearables and zero cloud costs. Ring Compass: pure ambient spatial intelligence protecting families through the night. Thank you."
        ),
    },
]

def get_audio_duration(file_path: Path) -> float:
    cmd = [
        "ffprobe", "-v", "error",
        "-show_entries", "format=duration",
        "-of", "default=noprint_wrappers=1:nokey=1",
        str(file_path)
    ]
    res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, check=True)
    return float(res.stdout.strip())

async def synthesize_all():
    total_duration = 0.0
    for idx, seg in enumerate(SCRIPT_SEGMENTS):
        seg_id = seg["id"]
        if seg_id == "part7_alexa_grounding":
            intro_mp3 = SCRATCH_DIR / f"{seg_id}_intro.mp3"
            beep_mp3 = SCRATCH_DIR / f"{seg_id}_beep.mp3"
            conc_mp3 = SCRATCH_DIR / f"{seg_id}_conc.mp3"
            final_mp3 = SCRATCH_DIR / f"{seg_id}.mp3"

            # 1. Intro
            comm_intro = edge_tts.Communicate(seg["intro_text"], VOICE_NAME)
            await comm_intro.save(str(intro_mp3))
            intro_dur = get_audio_duration(intro_mp3)

            # 2. Beep (1000Hz alert tone for 5s)
            subprocess.run([
                "ffmpeg", "-y", "-f", "lavfi",
                "-i", "sine=frequency=1000:duration=5.0",
                "-af", "volume=0.8",
                str(beep_mp3)
            ], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            beep_dur = 5.0

            # 3. Conclusion
            comm_conc = edge_tts.Communicate(seg["conclusion_text"], VOICE_NAME)
            await comm_conc.save(str(conc_mp3))
            conc_dur = get_audio_duration(conc_mp3)

            # 4. Concatenate
            concat_txt = SCRATCH_DIR / f"{seg_id}_concat.txt"
            with open(concat_txt, "w", encoding="utf-8") as f:
                f.write(f"file '{intro_mp3.resolve().as_posix()}'\n")
                f.write(f"file '{beep_mp3.resolve().as_posix()}'\n")
                f.write(f"file '{conc_mp3.resolve().as_posix()}'\n")

            # Re-encode to mp3 so sampling rates and frames match seamlessly
            subprocess.run([
                "ffmpeg", "-y", "-f", "concat", "-safe", "0",
                "-i", str(concat_txt),
                "-c:a", "libmp3lame", "-b:a", "192k",
                str(final_mp3)
            ], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

            dur = get_audio_duration(final_mp3)
            seg["audio_path"] = final_mp3
            seg["duration"] = dur
            seg["intro_dur"] = intro_dur
            seg["beep_dur"] = beep_dur
            seg["conc_dur"] = conc_dur
            total_duration += dur
            print(f"[{idx+1}/{len(SCRIPT_SEGMENTS)}] {seg_id}: {dur:.2f}s (Intro: {intro_dur:.2f}s, Beep: {beep_dur:.2f}s, Conc: {conc_dur:.2f}s)")
        else:
            out_mp3 = SCRATCH_DIR / f"{seg_id}.mp3"
            comm = edge_tts.Communicate(seg["text"], VOICE_NAME)
            await comm.save(str(out_mp3))
            dur = get_audio_duration(out_mp3)
            seg["audio_path"] = out_mp3
            seg["duration"] = dur
            total_duration += dur
            print(f"[{idx+1}/{len(SCRIPT_SEGMENTS)}] {seg_id}: {dur:.2f}s")

    print(f"\nTOTAL SYNTHESIZED DURATION: {total_duration:.2f}s ({total_duration/60:.2f} mins)")
    if total_duration < 195.0:
        print(f"SUCCESS: Duration is STRICTLY UNDER 3.25 mins (195s)! Margin: {195.0 - total_duration:.2f}s")
    else:
        print(f"WARNING: Duration exceeds 195s limit by {total_duration - 195.0:.2f}s!")

if __name__ == "__main__":
    asyncio.run(synthesize_all())
