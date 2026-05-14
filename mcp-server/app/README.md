# MCP Server App

FastAPI 기반 Dajeong MCP adapter scaffold입니다. 현재 Phase 1에서는 서버 실행 확인용 `GET /health`만 제공합니다.

## Run

```powershell
cd mcp-server/app
python -m pip install -r requirements.txt
python -m uvicorn main:app --reload --host 127.0.0.1 --port 8100
```

Health check:

```powershell
Invoke-RestMethod http://127.0.0.1:8100/health
```
