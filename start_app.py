"""
Ring Compass - Unified Startup Service Orchestrator
Launches both the FastAPI Python processing engine bridge (port 8000)
and the React + Vite + TypeScript frontend application (port 5173).
"""

import os
import subprocess
import sys
import time
import signal

def main():
    root_dir = os.path.dirname(os.path.abspath(__file__))
    frontend_dir = os.path.join(root_dir, "frontend")

    print("=" * 65)
    print("  RING COMPASS — BEACON NIGHT BOARD & SURAKSHA")
    print("  Unified Full-Stack Startup Orchestrator")
    print("=" * 65)

    # 1. Start Python FastAPI Server (port 8000)
    print("\n[1/2] Starting Python FastAPI Backend Engine on http://127.0.0.1:8000 ...")
    backend_cmd = [sys.executable, "-m", "uvicorn", "server:app", "--host", "127.0.0.1", "--port", "8000"]
    backend_proc = subprocess.Popen(backend_cmd, cwd=root_dir)

    # Allow backend 1.5 seconds to bind socket
    time.sleep(1.5)

    # 2. Start Vite React Frontend (port 5173)
    print("[2/2] Starting React + Vite Frontend on http://127.0.0.1:5173 ...")
    npm_cmd = "npm.cmd" if sys.platform == "win32" else "npm"
    frontend_proc = subprocess.Popen([npm_cmd, "run", "dev", "--", "--host", "127.0.0.1", "--port", "5173"], cwd=frontend_dir)

    print("\n" + "*" * 65)
    print("  SUCCESS: Ring Compass application stack is online!")
    print("  Frontend UI : http://127.0.0.1:5173")
    print("  Backend API : http://127.0.0.1:8000/docs")
    print("  Press Ctrl+C to stop both services simultaneously.")
    print("*" * 65 + "\n")

    try:
        backend_proc.wait()
    except KeyboardInterrupt:
        print("\n[STOPPING] Shutting down backend and frontend services gracefully...")
        backend_proc.terminate()
        frontend_proc.terminate()
        backend_proc.wait()
        frontend_proc.wait()
        print("[EXIT] Services terminated.")

if __name__ == "__main__":
    main()
