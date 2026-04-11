"""
SpaceMind OS — Dev launcher
Run: python backend/run_dev.py  (from project root)
  or: python run_dev.py         (from backend/)
"""
import subprocess
import sys
from pathlib import Path

if __name__ == "__main__":
    src_dir = Path(__file__).parent / "src"
    subprocess.run(
        [
            sys.executable, "-m", "uvicorn",
            "spacemind.main:app",
            "--reload",
            "--host", "0.0.0.0",
            "--port", "8000",
        ],
        cwd=str(src_dir),
    )
