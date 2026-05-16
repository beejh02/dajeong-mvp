from __future__ import annotations

from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


def read_text(relative_path: str) -> str:
    path = ROOT / relative_path
    if not path.exists():
        raise AssertionError(f"Missing required file: {relative_path}")
    return path.read_text(encoding="utf-8")


def require_contains(relative_path: str, needles: list[str]) -> None:
    content = read_text(relative_path)
    missing = [needle for needle in needles if needle not in content]
    if missing:
        raise AssertionError(f"{relative_path} missing markers: {', '.join(missing)}")


def main() -> None:
    require_contains(
        "frontend/kiosk/vite.config.ts",
        ['"/api"', "http://127.0.0.1:8000"],
    )
    require_contains(
        "frontend/admin/vite.config.ts",
        ['"/api"', "http://127.0.0.1:8000"],
    )
    require_contains(
        "frontend/kiosk/src/App.tsx",
        [
            "/api/auth/login",
            "/api/menu",
            "/api/orders",
            "/api/payments/dummy/approve",
            "/api/dajeong/chat",
            "/api/dajeong/final-approval",
            "B기업",
            "C기업",
        ],
    )
    require_contains(
        "frontend/admin/src/App.tsx",
        [
            "/api/auth/login",
            "/api/admin/orders",
            "/api/admin/mcp-logs",
            "PATCH",
            "관리자 주문",
            "MCP 호출 로그",
        ],
    )
    require_contains(
        "todo.md",
        [
            "- [x] A기업 실제 주문 키오스크",
            "- [x] B기업 vertical mock kiosk",
            "- [x] C기업 popup 또는 horizontal mock kiosk",
            "- [x] Dajeong Chat 화면",
            "- [x] 관리자 주문 목록/상세 화면",
            "- [x] 관리자 MCP 로그 화면",
        ],
    )
    print("Phase 6 frontend verification passed.")


if __name__ == "__main__":
    main()
