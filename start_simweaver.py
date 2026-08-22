"""
SimWeaver All-in-One Launcher

Starts both the FastAPI backend server and Vite frontend server concurrently.
"""
import subprocess
import sys
import time
import os

def main():
    print("=" * 60)
    print("Starting SimWeaver: Agentic Robotics Simulation Engineer")
    print("=" * 60)

    # 1. Start FastAPI Backend Server
    print("Launching FastAPI Backend Server on http://127.0.0.1:8000...")
    backend_proc = subprocess.Popen(
        [sys.executable, "-m", "uvicorn", "simweaver.server.app:app", "--host", "127.0.0.1", "--port", "8000"],
        cwd=os.path.dirname(os.path.abspath(__file__))
    )

    time.sleep(2)

    # 2. Start Vite Frontend Development Server
    frontend_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "frontend")
    print("Launching Vite Frontend Control Room on http://localhost:5173...")
    
    frontend_cmd = "npm run dev" if sys.platform != "win32" else "npm.cmd run dev"
    frontend_proc = subprocess.Popen(
        frontend_cmd,
        shell=True,
        cwd=frontend_dir
    )

    print("\nSimWeaver Control Room is live at: http://localhost:5173")
    print("Backend API documentation at: http://127.0.0.1:8000/docs")
    print("Press Ctrl+C to stop all servers.\n")

    try:
        backend_proc.wait()
        frontend_proc.wait()
    except KeyboardInterrupt:
        print("\nShutting down SimWeaver servers...")
        backend_proc.terminate()
        frontend_proc.terminate()

if __name__ == "__main__":
    main()
