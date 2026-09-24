#!/usr/bin/env python3
"""
================================================================================
AAPDASETU / AEGIS-MESH - DUAL-MODE PYTHON RUNNER
================================================================================
Usage:
  python run.py --mode real
  python run.py --mode simulated
  python run.py --mode both
================================================================================
"""

import sys
import os
import subprocess
import argparse
import signal
import time

ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.join(ROOT_DIR, "backend")

# Detect python executable
PYTHON_EXE = sys.executable
processes = []

def cleanup(sig=None, frame=None):
    print("\n[Orchestrator] Stopping all AapdaSetu processes...")
    for p in processes:
        try:
            p.terminate()
            p.wait(timeout=2)
        except Exception:
            try:
                p.kill()
            except Exception:
                pass
    sys.exit(0)

signal.signal(signal.SIGINT, cleanup)
signal.signal(signal.SIGTERM, cleanup)

def launch_instance(mode: str):
    is_real = mode == "real"
    port = 3000 if is_real else 3001
    backend_port = 5000 if is_real else 5001
    db_name = "aegis_real.db" if is_real else "aegis_simulated.db"
    db_url = f"sqlite:///backend/{db_name}"

    env = os.environ.copy()
    env["DATA_MODE"] = "real" if is_real else "simulated"
    env["PORT"] = str(port)
    env["BACKEND_PORT"] = str(backend_port)
    env["DATABASE_URL"] = db_url
    env["PYTHONPATH"] = BACKEND_DIR

    label = "[REAL]" if is_real else "[SIM]"
    print(f"{label} Spawning FastAPI Backend on http://127.0.0.1:{backend_port}...")
    p_backend = subprocess.Popen(
        [PYTHON_EXE, "-m", "uvicorn", "main:app", "--host", "127.0.0.1", "--port", str(backend_port)],
        cwd=BACKEND_DIR,
        env=env
    )
    processes.append(p_backend)

    print(f"{label} Spawning Frontend Proxy on http://localhost:{port}...")
    p_frontend = subprocess.Popen(
        ["node", "serve.js"],
        cwd=ROOT_DIR,
        env=env
    )
    processes.append(p_frontend)

def main():
    parser = argparse.ArgumentParser(description="AapdaSetu Dual-Mode Launcher")
    parser.add_argument(
        "--mode",
        choices=["real", "simulated", "both"],
        default="both",
        help="Instance to launch: real, simulated, or both (default: both)"
    )
    args = parser.parse_args()

    print("=" * 80)
    print(" AAPDASETU / AEGIS-MESH DUAL-MODE DISPATCH ORCHESTRATOR (Python Launcher)")
    print("=" * 80)

    if args.mode in ("real", "both"):
        launch_instance("real")
    if args.mode in ("simulated", "both"):
        launch_instance("simulated")

    print("=" * 80)
    if args.mode == "both":
        print(" [1] REAL DATA:      http://localhost:3000  (Backend API: http://127.0.0.1:5000)")
        print(" [2] SIMULATED DATA: http://localhost:3001  (Backend API: http://127.0.0.1:5001)")
    elif args.mode == "real":
        print(" [1] REAL DATA:      http://localhost:3000  (Backend API: http://127.0.0.1:5000)")
    else:
        print(" [2] SIMULATED DATA: http://localhost:3001  (Backend API: http://127.0.0.1:5001)")
    print("=" * 80)
    print("Press Ctrl+C to terminate.")

    while True:
        time.sleep(1)

if __name__ == "__main__":
    main()
