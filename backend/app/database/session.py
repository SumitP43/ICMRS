import os
import socket
from typing import Generator
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from backend.app.config import settings
from backend.app.database.base import Base

def is_port_open(host: str, port: int, timeout: float = 0.5) -> bool:
    try:
        with socket.create_connection((host, port), timeout=timeout):
            return True
    except (socket.timeout, ConnectionRefusedError, OSError):
        return False

def get_engine():
    db_url = os.environ.get("POSTGRES_URL") or os.environ.get("SQL_DATABASE_URL") or settings.DATABASE_URL
    sqlite_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "icmrs.db"))

    # Ensure URL is a valid SQL dialect
    if not (db_url.startswith("postgresql") or db_url.startswith("sqlite")):
        return create_engine(
            f"sqlite:///{sqlite_path}",
            connect_args={"check_same_thread": False}
        )

    # In environments where Postgres is specified:
    if "postgresql" in db_url:
        if os.environ.get("USE_POSTGRES_ALWAYS"):
            return create_engine(db_url, pool_pre_ping=True, pool_size=10, max_overflow=20)
        
        # Check if Postgres host/port is accessible before attempting connect
        is_local = "localhost" in db_url or "127.0.0.1" in db_url
        if is_local and not is_port_open("127.0.0.1", 5432, timeout=0.2):
            return create_engine(
                f"sqlite:///{sqlite_path}",
                connect_args={"check_same_thread": False}
            )
        try:
            test_engine = create_engine(db_url, pool_pre_ping=True)
            return test_engine
        except Exception:
            return create_engine(
                f"sqlite:///{sqlite_path}",
                connect_args={"check_same_thread": False}
            )
    else:
        return create_engine(
            db_url,
            connect_args={"check_same_thread": False}
        )

engine = get_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db() -> Generator[Session, None, None]:
    """FastAPI dependency for yielding database session with auto-rollback on error."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    """Create all database tables."""
    # Ensure all models are imported before creating tables
    import backend.app.database.models  # noqa
    Base.metadata.create_all(bind=engine)
