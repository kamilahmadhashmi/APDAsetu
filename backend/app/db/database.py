"""
==========================================================================
AEGIS-MESH / AAPDASETU - PRODUCTION DATABASE ENGINE & SESSION FACTORY
==========================================================================
Configures SQLAlchemy with persistent SQLite storage (or PostgreSQL/PostGIS
via DATABASE_URL environment variable).
"""

import os
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker, declarative_base

# Path to persistent local database
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
DATA_MODE = os.environ.get("DATA_MODE", "simulated").strip().lower()

def get_database_url(mode: str = None) -> str:
    """Returns absolute database URL isolated by mode."""
    target_mode = (mode or os.environ.get("DATA_MODE", "simulated")).strip().lower()
    custom_url = os.environ.get("DATABASE_URL")
    if custom_url and not mode:
        if custom_url.startswith("sqlite:///"):
            rel_path = custom_url.replace("sqlite:///", "")
            if not os.path.isabs(rel_path):
                if rel_path.startswith("backend/") or rel_path.startswith("backend\\"):
                    project_root = os.path.abspath(os.path.join(BASE_DIR, ".."))
                    abs_path = os.path.abspath(os.path.join(project_root, rel_path))
                else:
                    abs_path = os.path.abspath(os.path.join(BASE_DIR, rel_path))
                abs_path = abs_path.replace("\\", "/")
                return f"sqlite:///{abs_path}"
        return custom_url
    filename = "aegis_real.db" if target_mode == "real" else "aegis_simulated.db"
    abs_path = os.path.abspath(os.path.join(BASE_DIR, filename)).replace("\\", "/")
    return f"sqlite:///{abs_path}"

DATABASE_URL = get_database_url()

# For SQLite, ensure check_same_thread=False for async/FastAPI compatibility
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(
    DATABASE_URL,
    connect_args=connect_args,
    echo=False
)

# Enable WAL mode and concurrency optimization for SQLite
if DATABASE_URL.startswith("sqlite"):
    @event.listens_for(engine, "connect")
    def set_sqlite_pragma(dbapi_connection, connection_record):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA journal_mode=WAL;")
        cursor.execute("PRAGMA synchronous=NORMAL;")
        cursor.execute("PRAGMA busy_timeout=5000;")
        cursor.close()

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    """Dependency for obtaining database session per request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
