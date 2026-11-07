"""
CampusCore AI — Smart Campus Management System
Main Entrypoint Script
Run with: python run.py
"""

import os
import sys
import webbrowser
import threading
import time

def open_browser_delayed(url, delay=1.5):
    time.sleep(delay)
    try:
        webbrowser.open(url)
    except Exception:
        pass

if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    url = f"http://127.0.0.1:{port}"

    print("=" * 65)
    print("  CAMPUSCORE AI — SMART CAMPUS MANAGEMENT SYSTEM")
    print("  BCA Semester 1: Introduction to AI Project-Based Learning (PBL)")
    print("=" * 65)
    print(f"  > Dashboard URL:      {url}")
    print(f"  > Backend Framework:  Python Flask")
    print(f"  > Frontend Engine:    React.js (Single Page Application)")
    print(f"  > Database Engine:    MySQL 8.0 Compatible (SQLite Fallback)")
    print(f"  > AI Tool Ecosystem:  Dual-Engine (Gemini Cloud + Local NLP)")
    print(f"  > User Roles:         Administrator, Faculty, Student")
    print("=" * 65)
    print("  Default Demo Credentials:")
    print("    - Admin:    Username: admin       | Password: admin123")
    print("    - Faculty:  Username: dr_vikram   | Password: faculty123")
    print("    - Student:  Username: aarav       | Password: student123")
    print("=" * 65)
    print("  Starting server... Press Ctrl+C to terminate.\n")

    # Optionally launch browser in background
    if "--no-browser" not in sys.argv:
        threading.Thread(target=open_browser_delayed, args=(url,), daemon=True).start()

    from app import app
    app.run(host="0.0.0.0", port=port, debug=False)

