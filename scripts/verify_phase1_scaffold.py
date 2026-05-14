from __future__ import annotations

import json
import py_compile
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


REQUIRED_FILES = [
    "package.json",
    "pnpm-lock.yaml",
    "pnpm-workspace.yaml",
    "frontend/kiosk/package.json",
    "frontend/kiosk/index.html",
    "frontend/kiosk/tsconfig.json",
    "frontend/kiosk/vite.config.ts",
    "frontend/kiosk/src/main.tsx",
    "frontend/kiosk/src/App.tsx",
    "frontend/kiosk/src/styles.css",
    "frontend/kiosk/src/vite-env.d.ts",
    "frontend/admin/package.json",
    "frontend/admin/index.html",
    "frontend/admin/tsconfig.json",
    "frontend/admin/vite.config.ts",
    "frontend/admin/src/main.tsx",
    "frontend/admin/src/App.tsx",
    "frontend/admin/src/styles.css",
    "frontend/admin/src/vite-env.d.ts",
    "backend/app/main.py",
    "backend/app/requirements.txt",
    "backend/app/README.md",
    "mcp-server/app/main.py",
    "mcp-server/app/requirements.txt",
    "mcp-server/app/README.md",
    "ai-agent/app/app.py",
    "ai-agent/app/requirements.txt",
    "ai-agent/app/README.md",
]


def read_text(relative_path: str) -> str:
    return (ROOT / relative_path).read_text(encoding="utf-8")


def require(condition: bool, message: str) -> None:
    if not condition:
        raise AssertionError(message)


def check_required_files() -> None:
    missing = [path for path in REQUIRED_FILES if not (ROOT / path).is_file()]
    require(not missing, "Missing scaffold files: " + ", ".join(missing))


def check_frontend_package(relative_path: str, expected_name: str) -> None:
    package = json.loads(read_text(relative_path))
    require(package["name"] == expected_name, f"{relative_path} has wrong package name")

    scripts = package.get("scripts", {})
    for script_name in ["dev", "build", "preview", "typecheck"]:
        require(script_name in scripts, f"{relative_path} missing script {script_name}")

    dependencies = package.get("dependencies", {})
    dev_dependencies = package.get("devDependencies", {})
    for dependency in ["@vitejs/plugin-react", "typescript", "vite"]:
        require(dependency in dev_dependencies, f"{relative_path} missing {dependency}")
    for dependency in ["react", "react-dom"]:
        require(dependency in dependencies, f"{relative_path} missing {dependency}")


def check_python_contracts() -> None:
    backend = read_text("backend/app/main.py")
    require("@app.get(\"/health\")" in backend, "backend health route missing")
    require('"service": "backend"' in backend, "backend health service marker missing")

    mcp = read_text("mcp-server/app/main.py")
    require("@app.get(\"/health\")" in mcp, "mcp-server health route missing")
    require('"service": "mcp-server"' in mcp, "mcp-server health service marker missing")

    agent = read_text("ai-agent/app/app.py")
    require("Dajeong AI Agent" in agent, "agent scaffold title missing")

    for relative_path in [
        "backend/app/main.py",
        "mcp-server/app/main.py",
        "ai-agent/app/app.py",
    ]:
        py_compile.compile(str(ROOT / relative_path), doraise=True)


def check_readme_and_todo() -> None:
    readme = read_text("README.md")
    for expected in [
        "pnpm.cmd --dir frontend/kiosk dev",
        "pnpm.cmd --dir frontend/admin dev",
        "python -m uvicorn main:app --reload",
        "streamlit run app.py",
    ]:
        require(expected in readme, f"README missing run command: {expected}")

    todo = read_text("todo.md")
    for completed in [
        "- [x] `frontend/kiosk` Vite React 앱 생성",
        "- [x] `frontend/admin` Vite React 앱 생성",
        "- [x] `backend/app` FastAPI 앱 생성",
        "- [x] `mcp-server/app` FastAPI 또는 local adapter 앱 생성",
        "- [x] `ai-agent/app` Streamlit placeholder 생성",
        "- [x] 최소 실행/health check 검증",
    ]:
        require(completed in todo, f"todo.md missing completed item: {completed}")
    require(
        "- [ ] `shared/dummy-data` seed JSON 작성" in todo,
        "shared dummy-data must remain unchecked for the next process",
    )


def main() -> None:
    check_required_files()
    check_frontend_package("frontend/kiosk/package.json", "@dajeong/kiosk")
    check_frontend_package("frontend/admin/package.json", "@dajeong/admin")
    check_python_contracts()
    check_readme_and_todo()
    print("Phase 1 scaffold verification passed.")


if __name__ == "__main__":
    main()
