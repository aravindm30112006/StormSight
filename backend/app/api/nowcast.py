from fastapi import APIRouter
from app.models.inference import engine

router = APIRouter()

@router.get("/current")
def get_current_nowcast():
    return engine.get_full_state()

@router.get("/frames")
def get_forecast_frames():
    return {"frames": engine.simulator.get_forecast_frames([30, 60, 90, 120, 180])}

@router.get("/metrics")
def get_metrics():
    state = engine.get_full_state()
    return state.get("metrics", {})

@router.get("/data/status")
def get_data_status():
    state = engine.get_full_state()
    return state.get("data_sources", {})
