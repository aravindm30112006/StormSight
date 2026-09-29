from app.processing.data_simulator import IndiaStormSimulator
from app.models.ensemble import EnsembleModel
from app.alerts.geo_fence import GeoFenceEngine
from app.alerts.severity_engine import SeverityEngine

class InferenceEngine:
    def __init__(self):
        self.simulator = IndiaStormSimulator()
        self.ensemble = EnsembleModel()
        self.geofence = GeoFenceEngine()
        self.severity = SeverityEngine()
        
    def step(self):
        self.simulator.step()
        
    def get_full_state(self):
        state = self.simulator.get_current_state()
        storm_cells = state.get("storm_cells", [])
        alerts = self.geofence.check_storm_alerts(storm_cells, radius_km=150)
        state["alerts"] = alerts
        return state

engine = InferenceEngine()
