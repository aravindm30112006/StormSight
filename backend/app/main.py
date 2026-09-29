from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.api import nowcast, alerts
from app.api.websocket import websocket_endpoint
import asyncio
from app.models.inference import engine

# ── Lifespan: start background simulation loop on startup ──
@asynccontextmanager
async def lifespan(app: FastAPI):
    task = asyncio.create_task(simulation_loop())
    yield
    task.cancel()

app = FastAPI(
    title="StormSight API",
    description="AI Thunderstorm & Lightning Nowcasting System",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(nowcast.router, prefix="/api/nowcast", tags=["nowcast"])
app.include_router(alerts.router, prefix="/api/alerts", tags=["alerts"])

# ── Top-level health + convenience routes ──────────────────
@app.get("/api/health", tags=["health"])
def health_check():
    return {"status": "ok", "version": "1.0.0", "model": "ConvLSTM+Earthformer Ensemble", "system": "StormSight"}

@app.get("/api/metrics", tags=["metrics"])
def get_metrics():
    return engine.get_full_state().get("metrics", {})

@app.get("/api/data/status", tags=["data"])
def get_data_status():
    return engine.get_full_state().get("data_sources", {})

@app.websocket("/ws/nowcast")
async def websocket_route(websocket: WebSocket):
    await websocket_endpoint(websocket)

async def simulation_loop():
    """Advance storm simulation every 10 seconds (represents 5-min meteorological timestep)."""
    while True:
        engine.step()
        await asyncio.sleep(10)

