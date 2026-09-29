import math
from datetime import datetime, timedelta, timezone
from app.alerts.severity_engine import SeverityEngine

INDIA_DISTRICTS = [
    # East India
    {"name": "Bhubaneswar", "state": "Odisha", "lat": 20.27, "lon": 85.84},
    {"name": "Cuttack", "state": "Odisha", "lat": 20.46, "lon": 85.88},
    {"name": "Puri", "state": "Odisha", "lat": 19.81, "lon": 85.83},
    {"name": "Rourkela", "state": "Odisha", "lat": 22.25, "lon": 84.86},
    {"name": "Kolkata", "state": "West Bengal", "lat": 22.57, "lon": 88.36},
    {"name": "Howrah", "state": "West Bengal", "lat": 22.59, "lon": 88.26},
    {"name": "Siliguri", "state": "West Bengal", "lat": 26.72, "lon": 88.42},
    {"name": "Durgapur", "state": "West Bengal", "lat": 23.52, "lon": 87.31},
    {"name": "Patna", "state": "Bihar", "lat": 25.59, "lon": 85.13},
    {"name": "Gaya", "state": "Bihar", "lat": 24.79, "lon": 85.00},
    {"name": "Bhagalpur", "state": "Bihar", "lat": 25.24, "lon": 87.01},
    {"name": "Muzaffarpur", "state": "Bihar", "lat": 26.12, "lon": 85.39},
    {"name": "Ranchi", "state": "Jharkhand", "lat": 23.34, "lon": 85.31},
    {"name": "Jamshedpur", "state": "Jharkhand", "lat": 22.80, "lon": 86.20},
    {"name": "Dhanbad", "state": "Jharkhand", "lat": 23.80, "lon": 86.43},

    # North India
    {"name": "Delhi", "state": "Delhi", "lat": 28.70, "lon": 77.10},
    {"name": "Noida", "state": "Uttar Pradesh", "lat": 28.53, "lon": 77.39},
    {"name": "Gurugram", "state": "Haryana", "lat": 28.46, "lon": 77.03},
    {"name": "Faridabad", "state": "Haryana", "lat": 28.41, "lon": 77.32},
    {"name": "Lucknow", "state": "Uttar Pradesh", "lat": 26.85, "lon": 80.95},
    {"name": "Kanpur", "state": "Uttar Pradesh", "lat": 26.45, "lon": 80.33},
    {"name": "Varanasi", "state": "Uttar Pradesh", "lat": 25.32, "lon": 82.97},
    {"name": "Prayagraj", "state": "Uttar Pradesh", "lat": 25.43, "lon": 81.85},
    {"name": "Agra", "state": "Uttar Pradesh", "lat": 27.18, "lon": 78.01},
    {"name": "Bareilly", "state": "Uttar Pradesh", "lat": 28.37, "lon": 79.43},
    {"name": "Meerut", "state": "Uttar Pradesh", "lat": 28.98, "lon": 77.71},
    {"name": "Gorakhpur", "state": "Uttar Pradesh", "lat": 26.76, "lon": 83.37},
    {"name": "Chandigarh", "state": "Chandigarh", "lat": 30.73, "lon": 76.78},
    {"name": "Ludhiana", "state": "Punjab", "lat": 30.90, "lon": 75.85},
    {"name": "Amritsar", "state": "Punjab", "lat": 31.63, "lon": 74.87},
    {"name": "Jalandhar", "state": "Punjab", "lat": 31.33, "lon": 75.58},
    {"name": "Dehradun", "state": "Uttarakhand", "lat": 30.31, "lon": 78.03},
    {"name": "Haridwar", "state": "Uttarakhand", "lat": 29.95, "lon": 78.16},
    {"name": "Shimla", "state": "Himachal Pradesh", "lat": 31.10, "lon": 77.17},
    {"name": "Dharamshala", "state": "Himachal Pradesh", "lat": 32.22, "lon": 76.32},
    {"name": "Srinagar", "state": "Jammu & Kashmir", "lat": 34.08, "lon": 74.79},
    {"name": "Jammu", "state": "Jammu & Kashmir", "lat": 32.73, "lon": 74.86},
    {"name": "Leh", "state": "Ladakh", "lat": 34.15, "lon": 77.58},

    # West India
    {"name": "Mumbai", "state": "Maharashtra", "lat": 19.07, "lon": 72.87},
    {"name": "Pune", "state": "Maharashtra", "lat": 18.52, "lon": 73.85},
    {"name": "Nagpur", "state": "Maharashtra", "lat": 21.14, "lon": 79.08},
    {"name": "Nashik", "state": "Maharashtra", "lat": 20.00, "lon": 73.79},
    {"name": "Thane", "state": "Maharashtra", "lat": 19.22, "lon": 72.98},
    {"name": "Aurangabad", "state": "Maharashtra", "lat": 19.88, "lon": 75.34},
    {"name": "Solapur", "state": "Maharashtra", "lat": 17.66, "lon": 75.91},
    {"name": "Amravati", "state": "Maharashtra", "lat": 20.93, "lon": 77.75},
    {"name": "Ahmedabad", "state": "Gujarat", "lat": 23.02, "lon": 72.57},
    {"name": "Surat", "state": "Gujarat", "lat": 21.17, "lon": 72.83},
    {"name": "Vadodara", "state": "Gujarat", "lat": 22.31, "lon": 73.18},
    {"name": "Rajkot", "state": "Gujarat", "lat": 22.30, "lon": 70.80},
    {"name": "Jaipur", "state": "Rajasthan", "lat": 26.91, "lon": 75.78},
    {"name": "Jodhpur", "state": "Rajasthan", "lat": 26.24, "lon": 73.02},
    {"name": "Udaipur", "state": "Rajasthan", "lat": 24.58, "lon": 73.68},
    {"name": "Kota", "state": "Rajasthan", "lat": 25.18, "lon": 75.83},
    {"name": "Panaji", "state": "Goa", "lat": 15.49, "lon": 73.83},

    # Central India
    {"name": "Bhopal", "state": "Madhya Pradesh", "lat": 23.26, "lon": 77.41},
    {"name": "Indore", "state": "Madhya Pradesh", "lat": 22.72, "lon": 75.86},
    {"name": "Jabalpur", "state": "Madhya Pradesh", "lat": 23.18, "lon": 79.99},
    {"name": "Gwalior", "state": "Madhya Pradesh", "lat": 26.22, "lon": 78.18},
    {"name": "Ujjain", "state": "Madhya Pradesh", "lat": 23.18, "lon": 75.78},
    {"name": "Raipur", "state": "Chhattisgarh", "lat": 21.25, "lon": 81.63},
    {"name": "Bilaspur", "state": "Chhattisgarh", "lat": 22.08, "lon": 82.14},
    {"name": "Jagdalpur", "state": "Chhattisgarh", "lat": 19.07, "lon": 82.03},

    # South India
    {"name": "Bengaluru", "state": "Karnataka", "lat": 12.97, "lon": 77.59},
    {"name": "Mysuru", "state": "Karnataka", "lat": 12.30, "lon": 76.64},
    {"name": "Mangaluru", "state": "Karnataka", "lat": 12.91, "lon": 74.86},
    {"name": "Hubballi", "state": "Karnataka", "lat": 15.36, "lon": 75.12},
    {"name": "Belagavi", "state": "Karnataka", "lat": 15.85, "lon": 74.50},
    {"name": "Hyderabad", "state": "Telangana", "lat": 17.38, "lon": 78.47},
    {"name": "Warangal", "state": "Telangana", "lat": 17.97, "lon": 79.60},
    {"name": "Nizamabad", "state": "Telangana", "lat": 18.67, "lon": 78.10},
    {"name": "Visakhapatnam", "state": "Andhra Pradesh", "lat": 17.68, "lon": 83.21},
    {"name": "Vijayawada", "state": "Andhra Pradesh", "lat": 16.51, "lon": 80.65},
    {"name": "Tirupati", "state": "Andhra Pradesh", "lat": 13.63, "lon": 79.42},
    {"name": "Guntur", "state": "Andhra Pradesh", "lat": 16.31, "lon": 80.44},
    {"name": "Chennai", "state": "Tamil Nadu", "lat": 13.08, "lon": 80.27},
    {"name": "Coimbatore", "state": "Tamil Nadu", "lat": 11.01, "lon": 76.96},
    {"name": "Madurai", "state": "Tamil Nadu", "lat": 9.93, "lon": 78.12},
    {"name": "Tiruchirappalli", "state": "Tamil Nadu", "lat": 10.79, "lon": 78.70},
    {"name": "Salem", "state": "Tamil Nadu", "lat": 11.66, "lon": 78.15},
    {"name": "Kochi", "state": "Kerala", "lat": 9.93, "lon": 76.27},
    {"name": "Thiruvananthapuram", "state": "Kerala", "lat": 8.52, "lon": 76.93},
    {"name": "Kozhikode", "state": "Kerala", "lat": 11.25, "lon": 75.78},

    # Northeast & Islands
    {"name": "Guwahati", "state": "Assam", "lat": 26.14, "lon": 91.74},
    {"name": "Dibrugarh", "state": "Assam", "lat": 27.47, "lon": 94.91},
    {"name": "Silchar", "state": "Assam", "lat": 24.83, "lon": 92.78},
    {"name": "Shillong", "state": "Meghalaya", "lat": 25.57, "lon": 91.88},
    {"name": "Imphal", "state": "Manipur", "lat": 24.81, "lon": 93.94},
    {"name": "Agartala", "state": "Tripura", "lat": 23.83, "lon": 91.28},
    {"name": "Aizawl", "state": "Mizoram", "lat": 23.73, "lon": 92.72},
    {"name": "Kohima", "state": "Nagaland", "lat": 25.67, "lon": 94.11},
    {"name": "Dimapur", "state": "Nagaland", "lat": 25.91, "lon": 93.73},
    {"name": "Gangtok", "state": "Sikkim", "lat": 27.33, "lon": 88.61},
    {"name": "Itanagar", "state": "Arunachal Pradesh", "lat": 27.08, "lon": 93.61},
    {"name": "Port Blair", "state": "Andaman & Nicobar", "lat": 11.62, "lon": 92.73}
]

class GeoFenceEngine:
    def check_storm_alerts(self, storm_cells, radius_km=150):
        alerts_by_district = {}
        now = datetime.now(timezone.utc)
        severity_rank = {"Extreme": 4, "Severe": 3, "Moderate": 2, "Low": 1}

        for cell in storm_cells:
            for dist in INDIA_DISTRICTS:
                dlat = (dist["lat"] - cell["lat"]) * 111
                dlon = (dist["lon"] - cell["lon"]) * 111 * math.cos(math.radians(cell["lat"]))
                distance = math.sqrt(dlat**2 + dlon**2)
                if distance < radius_km:
                    eta = SeverityEngine.estimate_eta(cell, dist["lat"], dist["lon"])
                    severity, _ = SeverityEngine.classify_severity(cell["intensity_dbz"], 2000, 5)
                    alert_candidate = {
                        "id": f"ALT_{dist['name']}_{cell['id']}",
                        "severity": severity,
                        "district": dist["name"],
                        "state": dist["state"],
                        "lat": dist["lat"],
                        "lon": dist["lon"],
                        "message": f"{severity} thunderstorm expected in {max(5, int(eta))} minutes. Lightning risk: {'Severe' if severity in ['Extreme', 'Severe'] else 'Moderate'}.",
                        "valid_until": (now + timedelta(hours=3)).isoformat(),
                        "issued_at": now.isoformat(),
                        "_rank": severity_rank.get(severity, 1),
                        "_eta": eta
                    }
                    d_name = dist["name"]
                    if d_name not in alerts_by_district or (alert_candidate["_rank"] > alerts_by_district[d_name]["_rank"]):
                        alerts_by_district[d_name] = alert_candidate

        # Sort by severity descending, then ETA ascending
        sorted_alerts = sorted(alerts_by_district.values(), key=lambda a: (-a["_rank"], a["_eta"]))
        for a in sorted_alerts:
            a.pop("_rank", None)
            a.pop("_eta", None)
        return sorted_alerts

