"""
Ring Compass - Professional End-to-End 1080p Video Production Pipeline
Builds clean master demo video (master_demo_video.mp4) without burned subtitles,
and generates separate master_subtitles.srt file.
Total duration is strictly under 3.25 minutes (195.0s).
"""

import asyncio
import os
import subprocess
import json
import time
from pathlib import Path
import edge_tts
from playwright.async_api import async_playwright

ROOT_DIR = Path(__file__).resolve().parent
SCRATCH_DIR = ROOT_DIR / "scratch" / "video_production"
SCRATCH_DIR.mkdir(parents=True, exist_ok=True)

VOICE_NAME = "en-US-ChristopherNeural"
VOICE_RATE = "+16%"

# ------------------------------------------------------------------------------
# 1. NARRATION SCRIPT & SEGMENT CONFIGURATION
# ------------------------------------------------------------------------------
SCRIPT_SEGMENTS = [
    {
        "id": "part1_title",
        "title": "Problem Hook & Title Reveal",
        "type": "slide",
        "url": str((ROOT_DIR / "slides" / "title_slide.html").as_uri()),
        "text": (
            "When a vulnerable senior faces a night crisis like wandering or a sudden fall, "
            "traditional smart home devices leave families in the dark. We built Ring Compass to solve this with touchless spatial safety."
        ),
    },
    {
        "id": "part1_questions",
        "title": "The Four Questions In Order",
        "type": "slide_questions",
        "url": str((ROOT_DIR / "slides" / "four_questions_slide.html").as_uri()),
        "text": (
            "The household needs four answers: "
            "01: is it real? "
            "02: what changed? "
            "03: what do I do? "
            "And 04: can I go back to sleep? "
            "Current tools answer only the first. Ring Compass answers all four."
        ),
    },
    {
        "id": "part2_architecture",
        "title": "3D Isometric Architecture Flowchart",
        "type": "slide",
        "url": str((ROOT_DIR / "slides" / "architecture_slide.html").as_uri()),
        "text": (
            "Our architecture transforms raw camera feeds into a touchless biometric mesh. "
            "OpenCV frames feed our local MCP Spatial Server, where EVM extracts vitals while kinetic tracking detects distress, "
            "routing directly to local AI triage and Alexa connected devices."
        ),
    },
    {
        "id": "part2_friction",
        "title": "Friction Log: Zero-Cost Sandboxed Architecture",
        "type": "slide",
        "url": str((ROOT_DIR / "slides" / "friction_log_slide.html").as_uri()),
        "text": (
            "As documented in our Friction Log, the cloud-side Alexa Plus console restricts developer SDK access. "
            "To build with zero AWS cost, we engineered a local Model Context Protocol server running sandboxed JSON-RPC, "
            "fully ready for production Alexa Plus."
        ),
    },
    {
        "id": "part3_overview",
        "title": "Live System Overview (Front Page Walkthrough)",
        "type": "app_overview",
        "url": "http://127.0.0.1:5173/#/overview",
        "text": (
            "On our live System Overview console, Ring Compass continuously ingests the hallway camera stream in real time. "
            "Scrolling down displays live dispersion cadence, through-lens heart rate, the active Alexa node, "
            "and the 2D spatial trajectory plot."
        ),
    },
    {
        "id": "part4_motion_2d",
        "title": "Motion Analysis & 2D Centroid Trajectory",
        "type": "app_motion_2d",
        "url": "http://127.0.0.1:5173/#/motion",
        "text": (
            "In Motion Analysis, dual cameras monitor corridor and porch feeds simultaneously. "
            "Scrolling down to the 2D spatial centroid analysis, coordinate matrices expose the erratic pacing loop. "
            "Below it, the chart displays the Disorientation Cadence Index spiking past 3.0, triaging cognitive distress instantly."
        ),
    },
    {
        "id": "part5_evm_mechanism",
        "title": "EVM Through-Lens Vitals Mechanism",
        "type": "slide",
        "url": str((ROOT_DIR / "slides" / "evm_vitals_mechanism.html").as_uri()),
        "text": (
            "How is heartbeat determined through the air? In this EVM breakdown on the abnormal subject in camera two, "
            "we isolate forehead pixels to detect sub-visual luminosity shifts. A temporal bandpass filter extracts "
            "Heart Rate at 104 BPM and Respiration at 22 RPM—completely touchless."
        ),
    },
    {
        "id": "part6_safety_system",
        "title": "Safety Engine & System Events Pages",
        "type": "app_safety_system",
        "url": "http://127.0.0.1:5173/#/safety",
        "text": (
            "Our Safety Engine executes a six-stage deterministic gate, triaging between wandering and fall collapse in under 42 milliseconds. "
            "In System and Events, an immutable audit trail logs all biometric verdicts and dispatch events with zero cloud data leakage."
        ),
    },
    {
        "id": "part7_collapse_email",
        "title": "Profile B Collapse & Verified Email Evidence",
        "type": "slide",
        "url": str((ROOT_DIR / "slides" / "email_evidence_slide.html").as_uri()),
        "text": (
            "When camera two detects a subject collapsing, our engine identifies a vertical drop exceeding 42 pixels, "
            "triggering Profile B. The system immediately dispatches an automated emergency email to the caregiver, "
            "as verified in this email sent to sanjeevkumaredu8@gmail.com."
        ),
    },
    {
        "id": "part8_alexa_intro",
        "title": "Home & Voice Console: Simulated Smart Bulb",
        "type": "app_home_voice_intro",
        "url": "http://127.0.0.1:5173/#/home_voice",
        "text": (
            "Inside Home and Voice, physical de-escalation activates upon crisis detection. "
            "Because a commercial smart bulb was unavailable, ambient pathway lighting is simulated via the edge node LED alongside the physical speaker."
        ),
    },
    {
        "id": "part8_hardware_led",
        "title": "Physical Hardware Verification (led.mp4)",
        "type": "hardware_clip",
        "video_src": str(ROOT_DIR / "led.mp4"),
        "text": "",  # NARRATOR IS 100% SILENT DURING HARDWARE BEEP
        "subtitle_label": "[Alexa Connected Hardware Node: Amber LED Glowing · Physical Speaker Beep]",
    },
    {
        "id": "part8_alexa_resume",
        "title": "Home & Voice De-escalation Complete",
        "type": "app_home_voice_resume",
        "url": "http://127.0.0.1:5173/#/home_voice",
        "text": (
            "With the grounding alert tone completed and the amber pathway light illuminated, the individual is safely guided back to bed."
        ),
    },
    {
        "id": "part9_conclusion",
        "title": "Conclusion: Four Questions Answered & Privacy",
        "type": "slide_conclusion",
        "url": str((ROOT_DIR / "slides" / "conclusion_slide.html").as_uri()),
        "text": (
            "To conclude, Ring Compass answers all four questions: "
            "Yes, it is real. The spatial cadence changed. Alexa and email autonomously intervened. "
            "And yes, you can go back to sleep. All with on-device local privacy and zero cloud costs. Thank you."
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


async def synthesize_all_audio():
    print(f"\n--- [STEP 1] Synthesizing US English Audio Narration Clips ({VOICE_RATE}) ---", flush=True)
    total_dur = 0.0

    for idx, seg in enumerate(SCRIPT_SEGMENTS):
        seg_id = seg["id"]
        seg_type = seg["type"]

        if seg_type == "hardware_clip":
            # For the hardware clip, we use the actual duration of led.mp4 with native audio
            vid_path = Path(seg["video_src"])
            dur = get_audio_duration(vid_path)
            seg["duration"] = dur
            total_dur += dur
            print(f"[{idx+1}/{len(SCRIPT_SEGMENTS)}] {seg_id}: {dur:.2f}s (Physical Hardware Clip with native buzzer audio, narrator silent)", flush=True)

        else:
            out_mp3 = SCRATCH_DIR / f"{seg_id}.mp3"
            print(f"[{idx+1}/{len(SCRIPT_SEGMENTS)}] Generating {seg_id} ({VOICE_NAME} @ {VOICE_RATE})...", flush=True)
            communicate = edge_tts.Communicate(seg["text"], VOICE_NAME, rate=VOICE_RATE)
            await communicate.save(str(out_mp3))
            dur = get_audio_duration(out_mp3)
            seg["audio_path"] = out_mp3
            seg["duration"] = dur
            total_dur += dur
            print(f"  -> Duration: {dur:.2f} seconds", flush=True)

    print(f"\nTotal Narration Duration: {total_dur:.2f}s ({total_dur/60:.2f} minutes)", flush=True)
    if total_dur < 195.0:
        print(f"SUCCESS: Total Duration {total_dur:.2f}s is strictly under 3.25 minutes (195s)! Margin: {195.0 - total_dur:.2f}s", flush=True)
    else:
        print(f"WARNING: Duration {total_dur:.2f}s exceeds 195s limit!", flush=True)


async def record_segment_video(p, seg, idx, total):
    seg_id = seg["id"]
    duration = seg["duration"]
    seg_type = seg["type"]
    url = seg.get("url", "")
    out_webm_dir = SCRATCH_DIR / f"rec_{seg_id}"
    out_webm_dir.mkdir(parents=True, exist_ok=True)

    print(f"\n--- [STEP 2.{idx+1}/{total}] Recording {seg_id} ({seg_type}) for {duration:.2f}s ---", flush=True)

    if seg_type == "hardware_clip":
        # Standardize led.mp4 directly to 1080p 30fps
        src_path = Path(seg["video_src"])
        out_mp4 = SCRATCH_DIR / f"muxed_{seg_id}.mp4"
        cmd = [
            "ffmpeg", "-y",
            "-i", str(src_path),
            "-vf", "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2:color=#0E1214",
            "-c:v", "libx264", "-pix_fmt", "yuv420p", "-r", "30",
            "-c:a", "aac", "-b:a", "192k", "-ar", "44100",
            str(out_mp4)
        ]
        subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        seg["muxed_path"] = out_mp4
        print(f"  -> Standardized Hardware Clip: {out_mp4}", flush=True)
        return

    browser = await p.chromium.launch(channel="msedge", headless=True)
    context = await browser.new_context(
        record_video_dir=str(out_webm_dir),
        record_video_size={"width": 1920, "height": 1080},
        viewport={"width": 1920, "height": 1080}
    )
    page = await context.new_page()

    if seg_type == "slide":
        await page.goto(url)
        await asyncio.sleep(duration + 0.5)

    elif seg_type == "slide_questions":
        await page.goto(url)
        t0 = time.time()
        while time.time() - t0 < (duration + 0.5):
            elapsed = time.time() - t0
            if elapsed >= 3.0:
                await page.evaluate("window.showQuestion && window.showQuestion(1)")
            if elapsed >= 5.0:
                await page.evaluate("window.showQuestion && window.showQuestion(2)")
            if elapsed >= 7.0:
                await page.evaluate("window.showQuestion && window.showQuestion(3)")
            if elapsed >= 9.0:
                await page.evaluate("window.showQuestion && window.showQuestion(4)")
            if elapsed >= 11.5:
                await page.evaluate("window.showQuestion && window.showQuestion(5)")
            await asyncio.sleep(0.15)

    elif seg_type == "slide_conclusion":
        await page.goto(url)
        t0 = time.time()
        while time.time() - t0 < (duration + 0.5):
            elapsed = time.time() - t0
            if elapsed >= 2.5:
                await page.evaluate("window.showAnswer && window.showAnswer(1)")
            if elapsed >= 5.2:
                await page.evaluate("window.showAnswer && window.showAnswer(2)")
            if elapsed >= 8.0:
                await page.evaluate("window.showAnswer && window.showAnswer(3)")
            if elapsed >= 11.0:
                await page.evaluate("window.showAnswer && window.showAnswer(4)")
            if elapsed >= 13.5:
                await page.evaluate("window.showAnswer && window.showAnswer(5)")
            if elapsed >= 16.0:
                await page.evaluate("window.showAnswer && window.showAnswer(6)")
            await asyncio.sleep(0.15)

    elif seg_type == "app_overview":
        await page.goto("http://127.0.0.1:5173/#/overview")
        await page.evaluate("window.__setActiveTab && window.__setActiveTab('overview')")
        await asyncio.sleep(2.0)
        # Smooth scroll top-to-bottom over (duration - 4.0s)
        scroll_time = max(2.5, duration - 4.5)
        t_start = time.time()
        while time.time() - t_start < scroll_time:
            progress = (time.time() - t_start) / scroll_time
            await page.evaluate(f"window.scrollTo({{ top: document.body.scrollHeight * {progress ** 1.3}, behavior: 'smooth' }})")
            await asyncio.sleep(0.2)
        # Hold at the bottom showing 2D Centroid Plot & Companion Speech
        await asyncio.sleep(2.5)

    elif seg_type == "app_motion_2d":
        await page.goto("http://127.0.0.1:5173/#/motion")
        await page.evaluate("window.__setActiveTab && window.__setActiveTab('motion')")
        btn = await page.query_selector("nav button:has-text('Motion Analysis')")
        if btn:
            await btn.click()
        await page.wait_for_selector("text=Optical Corridor Feed", timeout=10000)
        await asyncio.sleep(2.5)
        # Smooth scroll down to highlight CAM 1 and CAM 2 2D Centroid Plots and DCI area chart
        scroll_time = max(2.5, duration - 5.5)
        t_start = time.time()
        while time.time() - t_start < scroll_time:
            progress = (time.time() - t_start) / scroll_time
            await page.evaluate(f"window.scrollTo({{ top: 560 * {progress ** 1.2}, behavior: 'smooth' }})")
            await asyncio.sleep(0.2)
        # Hold to display 2D centroid loop and DCI area chart
        await asyncio.sleep(3.0)

    elif seg_type == "app_safety_system":
        # Part A: Safety Engine
        await page.goto("http://127.0.0.1:5173/#/safety")
        await page.evaluate("window.__setActiveTab && window.__setActiveTab('safety')")
        btn_safety = await page.query_selector("nav button:has-text('Safety Engine')")
        if btn_safety:
            await btn_safety.click()
        await page.wait_for_selector("text=Safety Engine", timeout=10000)
        await asyncio.sleep(2.0)
        await page.evaluate("window.scrollTo({ top: 220, behavior: 'smooth' })")
        await asyncio.sleep(4.5)

        # Part B: System & Events
        await page.evaluate("window.__setActiveTab && window.__setActiveTab('system')")
        btn_sys = await page.query_selector("nav button:has-text('System & Events')")
        if btn_sys:
            await btn_sys.click()
        await page.wait_for_selector("text=System & Events", timeout=10000)
        await page.evaluate("window.scrollTo({ top: 0, behavior: 'instant' })")
        await asyncio.sleep(1.5)
        await page.evaluate("window.scrollTo({ top: 380, behavior: 'smooth' })")
        await asyncio.sleep(max(2.0, duration - 10.0))

    elif seg_type == "app_home_voice_intro":
        await page.goto("http://127.0.0.1:5173/#/home_voice")
        await page.evaluate("window.__setActiveTab && window.__setActiveTab('home_voice')")
        btn_hv = await page.query_selector("nav button:has-text('Home & Voice')")
        if btn_hv:
            await btn_hv.click()
        await page.wait_for_selector("text=Alexa Connected", timeout=10000)
        await page.evaluate("window.scrollTo({ top: 130, behavior: 'smooth' })")
        await asyncio.sleep(1.5)
        try:
            led_btn = await page.query_selector("button[title*='amber LED'], button:has-text('Toggle Amber LED')")
            if led_btn:
                await led_btn.click()
        except Exception:
            pass
        await asyncio.sleep(max(2.0, duration - 2.5))

    elif seg_type == "app_home_voice_resume":
        await page.goto("http://127.0.0.1:5173/#/home_voice")
        await page.evaluate("window.__setActiveTab && window.__setActiveTab('home_voice')")
        btn_hv = await page.query_selector("nav button:has-text('Home & Voice')")
        if btn_hv:
            await btn_hv.click()
        await page.wait_for_selector("text=Alexa Connected", timeout=10000)
        await page.evaluate("window.scrollTo({ top: 130, behavior: 'instant' })")
        await asyncio.sleep(duration + 0.5)

    await context.close()
    await browser.close()

    # Find the recorded webm file
    webm_files = list(out_webm_dir.glob("*.webm"))
    if not webm_files:
        raise RuntimeError(f"No webm recorded for {seg_id}")
    seg["raw_video_path"] = webm_files[0]
    print(f"  -> Recorded: {seg['raw_video_path']}", flush=True)


def mux_segment(seg, idx):
    seg_id = seg["id"]
    if seg.get("type") == "hardware_clip":
        return  # Already standardized to muxed_path

    video_path = seg["raw_video_path"]
    audio_path = seg["audio_path"]
    duration = seg["duration"]
    out_mp4 = SCRATCH_DIR / f"muxed_{seg_id}.mp4"

    print(f"\n--- [STEP 3.{idx+1}] Muxing {seg_id} with exact audio duration ({duration:.2f}s) ---", flush=True)
    cmd = [
        "ffmpeg", "-y",
        "-i", str(video_path),
        "-i", str(audio_path),
        "-t", f"{duration:.3f}",
        "-vf", "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2",
        "-c:v", "libx264", "-pix_fmt", "yuv420p", "-r", "30",
        "-c:a", "aac", "-b:a", "192k", "-ar", "44100",
        str(out_mp4)
    ]
    subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    seg["muxed_path"] = out_mp4
    print(f"  -> Muxed: {out_mp4}", flush=True)


def format_srt_time(seconds: float) -> str:
    hrs = int(seconds // 3600)
    mins = int((seconds % 3600) // 60)
    secs = int(seconds % 60)
    millis = int((seconds - int(seconds)) * 1000)
    return f"{hrs:02d}:{mins:02d}:{secs:02d},{millis:03d}"


def split_into_phrases(text: str):
    cleaned = text.replace("—", ". ").replace(";", ". ")
    phrases = [p.strip() for p in cleaned.split(". ") if p.strip()]
    return phrases if phrases else [text]


def generate_subtitles_and_master():
    print("\n--- [STEP 4] Concatenating Master Video (Clean, No Burned Subtitles) ---", flush=True)
    concat_list_path = SCRATCH_DIR / "concat_list.txt"
    srt_path = ROOT_DIR / "master_subtitles.srt"

    with open(concat_list_path, "w", encoding="utf-8") as f:
        for seg in SCRIPT_SEGMENTS:
            f.write(f"file '{seg['muxed_path'].resolve().as_posix()}'\n")

    # Clean Master Video WITHOUT burned subtitles
    master_raw = ROOT_DIR / "master_demo_video.mp4"
    concat_cmd = [
        "ffmpeg", "-y",
        "-f", "concat",
        "-safe", "0",
        "-i", str(concat_list_path),
        "-c:v", "libx264", "-pix_fmt", "yuv420p", "-r", "30",
        "-c:a", "aac", "-b:a", "192k", "-ar", "44100",
        str(master_raw)
    ]
    subprocess.run(concat_cmd, check=True)
    print(f"\nClean master demo video generated: {master_raw}", flush=True)

    # Frame-accurate SRT subtitle generation
    print("\n--- [STEP 5] Generating Separate SRT Subtitles File ---", flush=True)
    current_time = 0.0
    srt_entries = []
    entry_idx = 1

    for seg in SCRIPT_SEGMENTS:
        seg_id = seg["id"]
        seg_type = seg["type"]

        if seg_type == "hardware_clip":
            start_t = current_time
            end_t = current_time + seg["duration"]
            srt_entries.append(f"{entry_idx}\n{format_srt_time(start_t)} --> {format_srt_time(end_t)}\n{seg['subtitle_label']}\n")
            current_time = end_t
            entry_idx += 1

        else:
            seg_dur = seg["duration"]
            phrases = split_into_phrases(seg["text"])
            chunk_dur = seg_dur / len(phrases)
            for p in phrases:
                start_t = current_time
                end_t = current_time + chunk_dur
                srt_entries.append(f"{entry_idx}\n{format_srt_time(start_t)} --> {format_srt_time(end_t)}\n{p}\n")
                current_time = end_t
                entry_idx += 1

    with open(srt_path, "w", encoding="utf-8") as f:
        f.write("\n".join(srt_entries))
    print(f"Separate subtitles generated: {srt_path}", flush=True)

    # Step 6: Also generate an optional subtitled copy for convenience
    master_subtitled = ROOT_DIR / "master_demo_video_subtitled.mp4"
    srt_escaped = str(srt_path.resolve()).replace("\\", "/").replace(":", "\\:")
    subtitle_cmd = [
        "ffmpeg", "-y",
        "-i", str(master_raw),
        "-vf", f"subtitles='{srt_escaped}':force_style='FontName=Roboto,FontSize=20,PrimaryColour=&H00FFFFFF,OutlineColour=&H00000000,BorderStyle=3,Outline=2,Shadow=0,MarginV=35'",
        "-c:v", "libx264", "-pix_fmt", "yuv420p",
        "-c:a", "copy",
        str(master_subtitled)
    ]
    print(f"\n--- [STEP 6] Generating Optional Subtitled Copy ({master_subtitled.name}) ---", flush=True)
    subprocess.run(subtitle_cmd, check=True)

    # Verify final duration
    final_dur = get_audio_duration(master_raw)
    print(f"\n=======================================================", flush=True)
    print(f"FINAL MASTER VIDEO VERIFICATION:", flush=True)
    print(f"Clean Video: {master_raw.resolve()}", flush=True)
    print(f"Separate SRT: {srt_path.resolve()}", flush=True)
    print(f"Optional Subtitled: {master_subtitled.resolve()}", flush=True)
    print(f"Duration: {final_dur:.2f} seconds ({final_dur/60:.2f} minutes)", flush=True)
    print(f"Under 3.25 mins (195.0s) requirement: {'YES' if final_dur < 195.0 else 'NO'}", flush=True)
    print(f"Clean Video Size: {master_raw.stat().st_size / (1024*1024):.2f} MB", flush=True)
    print(f"=======================================================\n", flush=True)


async def main():
    await synthesize_all_audio()

    print("\n--- [STEP 2] Launching Playwright for 1080p Screen Recording ---", flush=True)
    async with async_playwright() as p:
        for idx, seg in enumerate(SCRIPT_SEGMENTS):
            await record_segment_video(p, seg, idx, len(SCRIPT_SEGMENTS))

    for idx, seg in enumerate(SCRIPT_SEGMENTS):
        mux_segment(seg, idx)

    generate_subtitles_and_master()


if __name__ == "__main__":
    asyncio.run(main())
