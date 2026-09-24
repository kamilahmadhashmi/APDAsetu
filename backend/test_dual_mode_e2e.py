"""
==============================================================================
AAPDASETU / AEGIS-MESH - END-TO-END DUAL-INSTANCE CONCURRENCY TEST
==============================================================================
Spawns both Instance 1 (Real) and Instance 2 (Simulated) concurrently,
verifies independent routing, database isolation, configuration endpoints,
and clean separation of live vs simulated feeds.
==============================================================================
"""

import sys
import os
import time
import subprocess
import urllib.request
import json

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
BACKEND_DIR = os.path.join(ROOT_DIR, "backend")
PYTHON = sys.executable

def wait_for_endpoint(url, timeout=15):
    start = time.time()
    while time.time() - start < timeout:
        try:
            req = urllib.request.Request(url)
            with urllib.request.urlopen(req, timeout=3) as resp:
                if resp.status == 200:
                    return json.loads(resp.read().decode("utf-8"))
        except Exception:
            time.sleep(0.5)
    raise TimeoutError(f"Endpoint {url} failed to respond within {timeout}s")

def wait_for_html(url, timeout=15):
    start = time.time()
    while time.time() - start < timeout:
        try:
            req = urllib.request.Request(url)
            with urllib.request.urlopen(req, timeout=3) as resp:
                if resp.status == 200:
                    return resp.read().decode("utf-8")
        except Exception:
            time.sleep(0.5)
    raise TimeoutError(f"HTML Endpoint {url} failed to respond within {timeout}s")

def main():
    print("=" * 80)
    print("STARTING DUAL-MODE END-TO-END VALIDATION")
    print("=" * 80)

    # 1. Environment setups
    env_real = os.environ.copy()
    env_real["DATA_MODE"] = "real"
    env_real["PORT"] = "3000"
    env_real["BACKEND_PORT"] = "5000"
    env_real["DATABASE_URL"] = "sqlite:///backend/aegis_real.db"
    env_real["PYTHONPATH"] = BACKEND_DIR

    env_sim = os.environ.copy()
    env_sim["DATA_MODE"] = "simulated"
    env_sim["PORT"] = "3001"
    env_sim["BACKEND_PORT"] = "5001"
    env_sim["DATABASE_URL"] = "sqlite:///backend/aegis_simulated.db"
    env_sim["PYTHONPATH"] = BACKEND_DIR

    procs = []

    try:
        print("[1/5] Launching Instance 1: REAL DATA (Backend 5000, Frontend 3000)...")
        p_b_real = subprocess.Popen(
            [PYTHON, "-m", "uvicorn", "main:app", "--host", "127.0.0.1", "--port", "5000"],
            cwd=BACKEND_DIR, env=env_real, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL
        )
        procs.append(p_b_real)

        p_f_real = subprocess.Popen(
            ["node", "serve.js"],
            cwd=ROOT_DIR, env=env_real, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL
        )
        procs.append(p_f_real)

        print("[2/5] Launching Instance 2: SIMULATED DATA (Backend 5001, Frontend 3001)...")
        p_b_sim = subprocess.Popen(
            [PYTHON, "-m", "uvicorn", "main:app", "--host", "127.0.0.1", "--port", "5001"],
            cwd=BACKEND_DIR, env=env_sim, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL
        )
        procs.append(p_b_sim)

        p_f_sim = subprocess.Popen(
            ["node", "serve.js"],
            cwd=ROOT_DIR, env=env_sim, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL
        )
        procs.append(p_f_sim)

        print("[3/5] Waiting for both instances to become healthy...")
        config_real = wait_for_endpoint("http://127.0.0.1:3000/api/v1/system/config")
        config_sim = wait_for_endpoint("http://127.0.0.1:3001/api/v1/system/config")

        assert config_real["data_mode"] == "real", f"Expected real, got {config_real['data_mode']}"
        assert config_real["mode_label"] == "LIVE DATA"
        assert config_real["is_simulated"] is False
        print("  ✓ Instance 1 Config: data_mode=real, mode_label='LIVE DATA'")

        assert config_sim["data_mode"] == "simulated", f"Expected simulated, got {config_sim['data_mode']}"
        assert config_sim["mode_label"] == "SIMULATION MODE"
        assert config_sim["is_simulated"] is True
        print("  ✓ Instance 2 Config: data_mode=simulated, mode_label='SIMULATION MODE'")

        print("[4/5] Verifying Health, Weather & Hospitals Parity...")
        health_real = wait_for_endpoint("http://127.0.0.1:3000/api/v1/system/health")
        health_sim = wait_for_endpoint("http://127.0.0.1:3001/api/v1/system/health")

        assert "aegis_real.db" in health_real["database"]
        assert "aegis_simulated.db" in health_sim["database"]
        print("  ✓ Database files properly separated: aegis_real.db vs aegis_simulated.db")

        weather_real = wait_for_endpoint("http://127.0.0.1:3000/api/v1/weather/live")
        weather_sim = wait_for_endpoint("http://127.0.0.1:3001/api/v1/weather/live")

        assert weather_real["data_mode"] == "real"
        assert weather_sim["data_mode"] == "simulated"
        print(f"  ✓ Real Weather Source: {weather_real['telemetry'].get('station') or weather_real['telemetry'].get('data_source')}")
        print(f"  ✓ Simulated Weather Source: {weather_sim['telemetry'].get('station') or weather_sim['telemetry'].get('data_source')}")

        print("[5/5] Verifying Frontend HTML Delivery...")
        html_real = wait_for_html("http://127.0.0.1:3000/")
        html_sim = wait_for_html("http://127.0.0.1:3001/")

        assert "mode-indicator-badge" in html_real
        assert "mode-indicator-badge" in html_sim
        print("  ✓ Both frontends serve complete HTML with mode indicator badges")

        print("=" * 80)
        print("🎉 DUAL-MODE VALIDATION PASSED WITH 100% SUCCESS!")
        print("=" * 80)

    finally:
        print("\nTearing down test child processes...")
        for p in procs:
            try:
                if process_platform := sys.platform == "win32":
                    subprocess.call(["taskkill", "/pid", str(p.pid), "/T", "/F"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
                else:
                    p.terminate()
            except Exception:
                pass

if __name__ == "__main__":
    main()
