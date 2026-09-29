import math

class SeverityEngine:
    @staticmethod
    def classify_severity(intensity_dbz, cape, lightning_density):
        if intensity_dbz > 55 or lightning_density > 10:
            return "Extreme", "#dc3545"
        elif intensity_dbz > 45 or cape > 2500:
            return "Severe", "#fd7e14"
        elif intensity_dbz > 35 or cape > 1500:
            return "Moderate", "#ffc107"
        else:
            return "Low", "#28a745"

    @staticmethod
    def estimate_eta(storm_cell, target_lat, target_lon):
        dlat = (target_lat - storm_cell["lat"]) * 111
        dlon = (target_lon - storm_cell["lon"]) * 111 * math.cos(math.radians(storm_cell["lat"]))
        dist = math.sqrt(dlat**2 + dlon**2)
        if storm_cell["motion_speed_kmh"] > 0:
            return (dist / storm_cell["motion_speed_kmh"]) * 60
        return 999
