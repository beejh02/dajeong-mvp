from __future__ import annotations

from contextlib import asynccontextmanager
from collections.abc import AsyncIterator

from fastapi import FastAPI

from database import configure_database, get_session_factory, init_db
from routers import admin, auth, mcp, menu, orders, payments, points
from seed import seed_database


def create_app(database_url: str | None = None) -> FastAPI:
    configure_database(database_url)

    @asynccontextmanager
    async def lifespan(_: FastAPI) -> AsyncIterator[None]:
        init_db()
        session_factory = get_session_factory()
        with session_factory() as db:
            seed_database(db)
        yield

    app = FastAPI(title="Dajeong Backend API", version="0.1.0", lifespan=lifespan)

    app.include_router(auth.router)
    app.include_router(menu.router)
    app.include_router(orders.router)
    app.include_router(payments.router)
    app.include_router(points.router)
    app.include_router(mcp.router)
    app.include_router(admin.router)

    @app.get("/health")
    def health_check() -> dict[str, str]:
        return {"status": "ok", "service": "backend"}

    return app


app = create_app()
