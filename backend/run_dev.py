"""
SpaceMind OS — Dev launcher
Run: python backend/run_dev.py  (from project root)
  or: python run_dev.py         (from backend/)

Place your .env file in the backend/ directory.
"""
import os
import subprocess
import sys
from pathlib import Path

if __name__ == "__main__":
    backend_dir = Path(__file__).parent
    env = {**os.environ, "PYTHONPATH": str(backend_dir / "src")}
    subprocess.run(
        [
            sys.executable, "-m", "uvicorn",
            "spacemind.main:app",
            "--reload",
            "--host", "0.0.0.0",
            "--port", "8000",
        ],
        cwd=str(backend_dir),
        env=env,
    )
