"""FastAPI application entrypoint.

Wires up CORS, the routers, a health check, and clean (credential-free,
stack-trace-free) error handling for the unofficial tricount-api client.
"""
import logging

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import get_settings
from app.routers import balances, dashboard, expenses, tricount
from app.services.tricount_service import TricountServiceError

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("tricount_dashboard")

# Fails fast with a clear message at startup if TRICOUNT_TOKEN is missing,
# rather than surfacing confusing 502s on the first request.
settings = get_settings()

app = FastAPI(
    title="Tricount Expense Dashboard API",
    description="Read-only API that surfaces real Tricount data for a personal expense dashboard.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["GET"],
    allow_headers=["*"],
)


@app.exception_handler(TricountServiceError)
async def tricount_service_error_handler(request: Request, exc: TricountServiceError) -> JSONResponse:
    # Never leak stack traces or the token — just a clean, actionable message.
    logger.warning("Tricount service error on %s: %s", request.url.path, exc)
    return JSONResponse(status_code=502, content={"detail": str(exc)})


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


app.include_router(tricount.router)
app.include_router(expenses.router)
app.include_router(dashboard.router)
app.include_router(balances.router)
