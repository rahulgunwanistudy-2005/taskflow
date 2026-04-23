"""
Conftest: sets up the test database URL BEFORE any app module imports
so that the SQLAlchemy engine is created with the correct URL.
"""
import os
import sys

# Ensure app is importable from anywhere
sys.path.insert(0, os.path.dirname(__file__))

# Override DATABASE_URL to in-memory SQLite BEFORE app modules are imported.
# This must happen here in conftest.py (which pytest loads first) — not inside
# the test file, where the engine is already created by the time the override runs.
os.environ["DATABASE_URL"] = "sqlite+aiosqlite://"
