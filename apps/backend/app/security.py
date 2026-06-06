import os

from fastapi import Header, HTTPException, status


ADMIN_TOKEN_ENV = "DAJEONG_ADMIN_TOKEN"
ADMIN_TOKEN_HEADER = "X-Dajeong-Admin-Token"


def require_admin_access(
    admin_token_header: str | None = Header(
        default=None,
        alias=ADMIN_TOKEN_HEADER,
    ),
) -> None:
    configured_token = os.getenv(ADMIN_TOKEN_ENV)

    if not configured_token:
        return

    if admin_token_header != configured_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Admin token is required",
        )
