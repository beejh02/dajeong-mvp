from __future__ import annotations

import os
from collections.abc import Generator
from pathlib import Path

from sqlalchemy import Engine, create_engine
from sqlalchemy.orm import Session, sessionmaker

from models import Base


_engine: Engine | None = None
_session_local: sessionmaker[Session] | None = None
_database_url: str | None = None


def default_database_url() -> str:
    db_path = Path(__file__).resolve().with_name("dajeong.sqlite3")
    return f"sqlite:///{db_path}"


def configure_database(database_url: str | None = None) -> None:
    global _database_url, _engine, _session_local

    selected_url = database_url or os.getenv("DAJEONG_DATABASE_URL") or default_database_url()
    if _engine is not None and _database_url == selected_url:
        return

    connect_args = {"check_same_thread": False} if selected_url.startswith("sqlite") else {}
    _database_url = selected_url
    _engine = create_engine(selected_url, connect_args=connect_args, future=True)
    _session_local = sessionmaker(bind=_engine, autoflush=False, expire_on_commit=False)


def get_engine() -> Engine:
    if _engine is None:
        configure_database()
    assert _engine is not None
    return _engine


def get_session_factory() -> sessionmaker[Session]:
    if _session_local is None:
        configure_database()
    assert _session_local is not None
    return _session_local


def init_db() -> None:
    Base.metadata.create_all(bind=get_engine())


def get_db() -> Generator[Session, None, None]:
    session_factory = get_session_factory()
    with session_factory() as db:
        yield db
