"""
SpaceMind OS — Dev launcher
Run: python run_dev.py
"""
import subprocess
import sys

if __name__ == "__main__":
    subprocess.run(
        [
            sys.executable, "-m", "uvicorn",
            "spacemind.main:app",
            "--reload",
            "--host", "0.0.0.0",
            "--port", "8000",
        ],
        cwd="src",
    )
