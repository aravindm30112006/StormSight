from fastapi import APIRouter, Response
from app.models.inference import engine
from app.alerts.cap_generator import CAPGenerator

router = APIRouter()

@router.get("/")
def get_alerts():
    state = engine.get_full_state()
    return {"alerts": state.get("alerts", [])}

@router.get("/cap")
def get_cap_xml():
    state = engine.get_full_state()
    alerts = state.get("alerts", [])
    xml_content = CAPGenerator.generate_cap_xml(alerts)
    return Response(content=xml_content, media_type="application/xml")

@router.get("/health")
def health_check():
    return {"status": "ok", "version": "1.0.0", "model": "ConvLSTM+Earthformer Ensemble"}
